import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'

// Paths
const BASE_DB = './src/database'
const CHAR_PATH = path.join(BASE_DB, 'characters.json')
const VENTA_PATH = path.join(BASE_DB, 'waifusVenta.json')
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
      return conn.reply(m.chat, `⏳ Debes esperar *${minutes}m ${seconds}s* antes de reclamar otra waifu.`, m)
    }

    if (!m.quoted || !m.quoted.text) {
      return conn.reply(m.chat, '《✧》Debes *citar un personaje válido* para reclamarlo.', m)
    }

    try {
      const characters = await loadCharacters()
      const match = m.quoted.text.match(/𝙄𝘿:\s*\*([^\*]+)\*/i)
      if (!match) return conn.reply(m.chat, '《✧》No se pudo detectar el ID del personaje.', m)

      const id = match[1].trim()
      const character = characters.find(c => String(c.id) === String(id))
      if (!character) return conn.reply(m.chat, '《✧》Personaje no encontrado.', m)

      if (character.user && character.user !== userId) {
        return conn.reply(
          m.chat,
          `✧ El personaje *${character.name}* ya fue reclamado por @${character.user.split('@')[0]}.`,
          m,
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
      await conn.reply(m.chat, `✘ Error al reclamar waifu:\n${e?.message || e}`, m)
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
      return conn.reply(m.chat, `✘ Error al leer los datos.\n*Detalles:* ${e.message}`, m)
    }

    if (!ventas.length) {
      return conn.reply(m.chat, '✿ Actualmente no hay waifus en venta.', m)
    }

    const pageArg = parseInt(args[0]) || 1
    const pageSize = 10
    const totalPages = Math.ceil(ventas.length / pageSize)
    if (pageArg < 1 || pageArg > totalPages) {
      return conn.reply(m.chat, `✘ Página inválida. Hay *${totalPages}* página(s) disponibles.`, m)
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
      return conn.reply(m.chat, `✘ Error al enviar la lista:\n${err?.message || err}`, m)
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
      return conn.reply(m.chat, `( ⸝⸝･̆⤚･̆⸝⸝) ¡𝗗𝗲𝗯𝗲𝘀 𝗲𝘀𝗽𝗲𝗿𝗮𝗿 *${minutes} minutos y ${seconds} segundos* 𝗽𝗮𝗿𝗮 𝘃𝗼𝗹𝘃𝗲𝗿  𝘂𝘀𝗮𝗿 *#rw* 𝗱𝗲 𝗻𝘂𝗲𝘃𝗼.`, m)
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
      const message = `╔◡╍┅•.⊹︵ࣾ᷼ ׁ𖥓┅╲۪ ⦙᷼͝🧸᷼͝⦙ ׅ╱ׅ╍𖥓 ︵ࣾ᷼︵ׄׄ᷼⊹┅╍◡╗
┋  ⣿̶ֻ〪ׅ⃕݊⃧🐚⃚̶̸͝ᤢ֠◌ִ̲ 𝑪𝑯𝑨𝑹𝑨𝑪𝑻𝑬𝑹 𝑹𝑨𝑵𝑫𝑶𝑴 🐸ꨪ̸⃙ׅᮬֺ๋֢᳟  ┋
╚◠┅┅˙•⊹.⁀𖥓 ׅ╍╲۪ ⦙᷼͝🎠᷼͝⦙ ׅ╱ׅ╍𖥓 ◠˙⁀۪ׄ⊹˙╍┅◠╝

꥓໋╭࣭۬═ֽ̥࣪━᜔๋݈═𑂺ׄ︵ິּ֙᷼⌒݈᳹᪾̯ ⋮꥓ּ࣭ׄ🌹〪ິ᜔ּ໋࣭ׄ⋮⌒ໍּ֣ׄ═ᮣໍ࣭ׄ━𑂺᜔꥓໋┉꥓ׂ᷼━᜔࣭֙━๋݈═̥࣭۬╮
> ᠙᳞✿̶᮫᮫ְְׅ᳝ׅ᳝᳞᳞࣪᪲࣪֘⣷ׅ᳝࣪ ࣪࣪𖡻ְְׅ᳝ׅׅ࣪࣪֘ᰰ🌵᮫ְׅ᳝࣪᪲⃞̶𝝸𝕝᮫ְ᳝᳝⃨۪۪۪ׅ᳝࣪࣪っְְׅ᳝۪⃨۪۪۪࣪:   𝙉𝘖𝘔𝘉𝘙𝘌: *${randomCharacter.name}*
> ᠙᳞✿̶᮫᮫ְְׅ᳝ׅ᳝᳞᳞࣪᪲࣪֘⣷ׅ᳝࣪ ࣪࣪𖡻ְְׅ᳝ׅׅ࣪࣪֘ᰰ🍭᮫ְׅ᳝࣪᪲⃞̶𝝸𝕝᮫ְ᳝᳝⃨۪۪۪ׅ᳝࣪࣪っְְׅ᳝۪⃨۪۪۪࣪:  𝙂𝘌𝘕𝘌𝘙𝘖: *${randomCharacter.gender}*
> ᠙᳞✿̶᮫᮫ְְׅ᳝ׅ᳝᳞᳞࣪᪲࣪֘⣷ׅ᳝࣪ ࣪࣪𖡻ְְׅ᳝ׅׅ࣪࣪֘ᰰ💰᮫ְׅ᳝࣪᪲⃞̶𝝸𝕝᮫ְ᳝᳝⃨۪۪۪ׅ᳝࣪࣪っְְׅ᳝۪⃨۪۪۪࣪:   𝙑𝘈𝘓𝘖𝘙: *${randomCharacter.value}*
> ᠙᳞✿̶᮫᮫ְְׅ᳝ׅ᳝᳞᳞࣪᪲࣪֘⣷ׅ᳝࣪ ࣪࣪𖡻ְְׅ᳝ׅׅ࣪࣪֘ᰰ🪄᮫ְׅ᳝࣪᪲⃞̶𝝸𝕝᮫ְ᳝᳝⃨۪۪۪ׅ᳝࣪࣪っְְׅ᳝۪⃨۪۪۪࣪:   𝙀𝘚𝘛𝘈𝘋𝘖: ${statusMessage}
> ᠙᳞✿̶᮫᮫ְְׅ᳝ׅ᳝᳞᳞࣪᪲࣪֘⣷ׅ᳝࣪ ࣪࣪𖡻ְְׅ᳝ׅׅ࣪࣪֘ᰰ📚᮫ְׅ᳝࣪᪲⃞̶𝝸𝕝᮫ְ᳝᳝⃨۪۪۪ׅ᳝࣪࣪っְְׅ᳝۪⃨۪۪۪࣪:   𝙁𝘜𝘌𝙉𝙏𝙀: *${randomCharacter.source || 'Desconocida'}*
> ᠙᳞✿̶᮫᮫ְְׅ᳝ׅ᳝᳞᳞࣪᪲࣪֘⣷ׅ᳝࣪ ࣪࣪𖡻ְְׅ᳝ׅׅ࣪࣪֘ᰰ🆔᮫ְׅ᳝࣪᪲⃞̶𝝸𝕝᮫ְ᳝᳝⃨۪۪۪ׅ᳝࣪࣪っְְׅ᳝۪⃨۪۪۪࣪:   𝙄𝘿: *${randomCharacter.id}*
꥓໋╰ׅ۬═ֽ̥࣪━᜔๋݈═𑂺ׄ︵ິּ֙᷼⌒݈᳹᪾̯ ⋮꥓ּ࣭ׄ🐦‍🔥⋮⌒ໍּ֣ׄ═ᮣໍ࣭ׄ━𑂺᜔꥓໋┉꥓ׂ᷼━᜔࣭֙━๋݈═̥࣭۬╯`;

      await conn.sendFile(m.chat, randomImage, `${randomCharacter.name}.jpg`, message, m, { mentions })

      rollCooldowns[userId] = now + cd
    } catch (error) {
      await conn.reply(m.chat, `✘ Error al cargar el personaje: ${error?.message || error}`, m)
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