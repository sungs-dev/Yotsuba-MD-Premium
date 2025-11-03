import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'

// Paths
const BASE_DB = './jsons'
const CHAR_PATH = path.join(BASE_DB, 'waifus.json')
const VENTA_PATH = path.join(BASE_DB, 'waifu.json')
const HAREM_PATH = path.join(BASE_DB, 'harem.json')
const CLAIM_MSG_PATH = path.join(BASE_DB, 'userClaimConfig.json')

// Cooldowns (ms)
const claimCooldowns = {}      // 30 min per user for claim command
const rollCooldowns = {}       // 15 min per user for roll command

/* -------------------------
   Helpers: load / save json
   ------------------------- */
async function readJson(file, fallback = null) {
  try {
    const data = await fsp.readFile(file, 'utf8')
    return JSON.parse(data)
  } catch (e) {
    return fallback
  }
}
async function writeJson(file, obj) {
  await fsp.mkdir(path.dirname(file), { recursive: true })
  await fsp.writeFile(file, JSON.stringify(obj, null, 2), 'utf8')
}

/* -------------------------
   Claim message templates
   ------------------------- */
async function loadClaimMessages() {
  return (await readJson(CLAIM_MSG_PATH, {})) || {}
}
async function getCustomClaimMessage(userId, username, characterName) {
  const messages = await loadClaimMessages()
  const template = messages[userId] || '✧ *$user* ha reclamado a *$character* ✦'
  return template.replace(/\$user/g, username).replace(/\$character/g, characterName)
}

/* -------------------------
   Characters / harem helpers
   ------------------------- */
async function loadCharacters() {
  const data = await readJson(CHAR_PATH, [])
  if (!Array.isArray(data)) return []
  return data
}
async function saveCharacters(characters) {
  await writeJson(CHAR_PATH, characters)
}

async function loadHarem() {
  const data = await readJson(HAREM_PATH, [])
  if (!Array.isArray(data)) return []
  return data
}
async function saveHarem(harem) {
  await writeJson(HAREM_PATH, harem)
}

async function loadVentas() {
  const data = await readJson(VENTA_PATH, [])
  if (!Array.isArray(data)) return []
  return data
}

/* -------------------------
   Util
   ------------------------- */
const formatFecha = (ms) => {
  try {
    const d = new Date(ms)
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '-'
  }
}
const isUrl = (text) => {
  return typeof text === 'string' && /https?:\/\/.+\.(jpe?g|png|gif)/i.test(text)
}

/* -------------------------
   Main handler (multi-command)
   ------------------------- */
let handler = async (m, { conn, command, args }) => {
  const cmd = (command || '').toLowerCase()

  // ensure DB folder exists
  try { await fsp.mkdir(BASE_DB, { recursive: true }) } catch {}

  /* -------------------------
     CLAIM / RECLAMAR / C
     ------------------------- */
  if (['claim', 'reclamar', 'c'].includes(cmd)) {
    const userId = m.sender
    const now = Date.now()
    const cd = 30 * 60 * 1000 // 30 minutes

    if (claimCooldowns[userId] && now < claimCooldowns[userId]) {
      const remaining = claimCooldowns[userId] - now
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      return conn.reply(m.chat, `💜 Espera *${minutes} minutos y ${seconds} segundos* para volver a reclamar una waifu.`, m, rcanal)
    }

    if (!m.quoted || !m.quoted.text) {
      return conn.reply(m.chat, '*👑 Cita un personaje válido.*', m, rcanal)
    }

    try {
      const characters = await loadCharacters()
      const match = m.quoted.text.match(/𝙄𝘿:\s*\*([^\*]+)\*/i)
      if (!match) return conn.reply(m.chat, '💜 No encontré el *ID* de ese personaje.', m, rcanal)

      const id = match[1].trim()
      const character = characters.find(c => String(c.id) === String(id))
      if (!character) return conn.reply(m.chat, '👑 el Personaje *no fue encontrado.*', m, rcanal)

      if (character.user && character.user !== userId) {
        return conn.reply(
          m.chat,
          `💜 El personaje *${character.name}* ya fue reclamado por @${character.user.split('@')[0]}.`,
          m, rcanal,
          { mentions: [character.user] }
        )
      }

      // claim
      character.user = userId
      character.status = 'Reclamado'
      await saveCharacters(characters)

      // username and custom message
      let username = m.pushName || userId.split('@')[0]
      try { username = await conn.getName(userId) || username } catch {}
      const mensajeFinal = await getCustomClaimMessage(userId, username, character.name)

      await conn.reply(m.chat, mensajeFinal, m)
      claimCooldowns[userId] = now + cd
    } catch (e) {
      await conn.reply(m.chat, `😿 Error:\n${e?.message || e}`, m, rcanal)
    }
    return
  }

  /* -------------------------
     HAREMSHOP / TIENDA
     ------------------------- */
  if (['haremshop', 'tiendawaifus', 'wshop'].includes(cmd)) {
    // read ventas and characters
    let ventas = []
    let personajes = []
    try {
      ventas = await loadVentas()
      personajes = await loadCharacters()
      if (!Array.isArray(ventas) || !Array.isArray(personajes)) throw new Error('Error en la estructura de los archivos.')
    } catch (e) {
      return conn.reply(m.chat, `😿 Error al leer los datos.\n*Detalles:* ${e.message}`, m, rcanal)
    }

    if (!ventas.length) {
      return conn.reply(m.chat, '💜 Actualmente no hay waifus en venta.', m, rcanal)
    }

    const pageArg = parseInt(args[0]) || 1
    const pageSize = 10
    const totalPages = Math.ceil(ventas.length / pageSize)
    if (pageArg < 1 || pageArg > totalPages) {
      return conn.reply(m.chat, `🤨 Página inválida. Hay *${totalPages}* página(s) disponibles.`, m, rcanal)
    }

    const inicio = (pageArg - 1) * pageSize
    const waifusPagina = ventas.slice(inicio, inicio + pageSize)
    let texto = `◢✿ *Waifus en venta* ✿◤\n\n`
    const mencionados = []

    for (let i = 0; i < waifusPagina.length; i++) {
      try {
        const { name, precio, vendedor, fecha } = waifusPagina[i]
        const p = personajes.find(p => String(p.name).toLowerCase() === String(name).toLowerCase())
        const valorOriginal = (p && p.value) ? p.value : 'Desconocido'
        const idPersonaje = p?.id || 'Desconocido'

        let username
        try {
          username = vendedor ? await conn.getName(vendedor) : `@${(vendedor || '').split('@')[0] || 'desconocido'}`
        } catch {
          username = `@${(vendedor || '').split('@')[0] || 'desconocido'}`
        }

        texto += `✰ ${inicio + i + 1} » *${name}* (*${valorOriginal.toLocaleString()}*)\n`
        // use m.moneda if present else global.currency
        const moneda = (m && m.moneda) ? m.moneda : (global.currency || 'Coins')
        texto += `  🛒 Precio de venta: *¥${(precio || 0).toLocaleString()} ${moneda}*\n`
        texto += `  🆔 ID: *${idPersonaje}*\n`
        texto += `  👤 Vendedor: ${username}\n`
        texto += `  📅 Publicado: ${formatFecha(fecha)}\n\n`

        if (vendedor) mencionados.push(vendedor)
      } catch (err) {
        texto += `✘ Error con una waifu: ${err?.message || err}\n\n`
      }
    }

    texto += `> Página *${pageArg}* de *${totalPages}*\n`
    if (pageArg < totalPages) texto += `> Usa *#haremshop ${pageArg + 1}* para ver la siguiente página.\n`

    try {
      await conn.sendMessage(m.chat, { text: texto, mentions: mencionados }, { quoted: m })
    } catch (err) {
      return conn.reply(m.chat, `😿 Error:\n${err?.message || err}`, m, rcanal)
    }
    return
  }

  /* -------------------------
     RW / ROLLWAIFU
     ------------------------- */
  if (['rw', 'rollwaifu'].includes(cmd)) {
    const userId = m.sender
    const now = Date.now()
    const cd = 15 * 60 * 1000 // 15 minutes

    if (rollCooldowns[userId] && now < rollCooldowns[userId]) {
      const remainingTime = Math.ceil((rollCooldowns[userId] - now) / 1000)
      const minutes = Math.floor(remainingTime / 60)
      const seconds = remainingTime % 60
      return conn.reply(m.chat, `💜 Espera *${minutes} minutos y ${seconds} segundos* para volver a usar el comando *rw*`, m, rcanal)
    }

    try {
      const characters = await loadCharacters()
      if (!characters.length) throw new Error('No hay personajes cargados.')

      const randomCharacter = characters[Math.floor(Math.random() * characters.length)]
      // try to use image array or fallback to randomCharacter.img (string) or placeholder
      let randomImage = null
      if (Array.isArray(randomCharacter.img) && randomCharacter.img.length) {
        randomImage = randomCharacter.img[Math.floor(Math.random() * randomCharacter.img.length)]
      } else if (typeof randomCharacter.img === 'string' && isUrl(randomCharacter.img)) {
        randomImage = randomCharacter.img
      } else {
        randomImage = 'https://files.catbox.moe/9k5x8y.jpg' // fallback image
      }

      // Harem data and status
      const harem = await loadHarem()
      const userEntry = harem.find(entry => String(entry.characterId) === String(randomCharacter.id))
      const statusMessage = randomCharacter.user ? `Reclamado por @${randomCharacter.user.split('@')[0]}` : 'Libre'
      const mentions = randomCharacter.user ? [randomCharacter.user] : []

      // Build message (kept the original rich text style)
      const message = `*꒰⌢◌⃘࣪࣪࣪۬✎ ꒱ 𐔌 RW - GACHA  𐦯*
*| Nombre:*${randomCharacter.name}
*|Generó:*${randomCharacter.gender}
*|Estado:*${statusMessage}
*|Fuente:*${randomCharacter.source || 'Desconocida'}
*╰─ׅ─๋︩︪─☪︎︎︎̸⃘࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─๋︩︪╯*`;

      await conn.sendFile(m.chat, randomImage, `${randomCharacter.name}.jpg`, message, m, { mentions })

      rollCooldowns[userId] = now + cd
    } catch (error) {
      await conn.reply(m.chat, `😿 Error al cargar el personaje: ${error?.message || error}`, m, rcanal)
    }
    return
  }

  // If command not handled here, do nothing (framework may continue)
  return
}

/* -------------------------
   Handler metadata for the framework
   ------------------------- */
handler.help = ['claim', 'reclamar', 'c', 'haremshop', 'tiendawaifus', 'wshop', 'rw', 'rollwaifu']
handler.tags = ['waifus', 'gacha']
handler.command = /^(claim|reclamar|c|haremshop|tiendawaifus|wshop|rw|rollwaifu)$/i
handler.group = true
handler.register = true

export default handler