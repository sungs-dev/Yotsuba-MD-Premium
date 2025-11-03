import fs from 'fs'
import path from 'path'

// Ruta del JSON de personajes
const jsonPath = path.join(process.cwd(), 'jsons', 'waifus.json')

// Cargar personajes
function loadGacha() {
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
}

// Guardar personajes
function saveGacha(data) {
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2))
}

// Obtener coins del usuario
function getUserCoins(userId) {
  const user = global.db.data.users[userId] || {}
  return (user.coin || 0) + (user.bank || 0)
}

// Sumar/restar coins del usuario
function addUserCoins(userId, amt) {
  global.db.data.users[userId] = global.db.data.users[userId] || {}
  global.db.data.users[userId].coin = (global.db.data.users[userId].coin || 0) + amt
}

// Obtener personajes reclamados por usuario
function getUserHarem(userId) {
  return Object.values(global.db.data.characters || {}).filter(c => c.user === userId)
}

// Cooldown por comando y usuario
const COOLDOWN = 10 * 60 * 1000 // 10 minutos en ms
global.db.data.cooldowns] || {}
  const last = global.db.data.cooldowns[userId][cmd] || 0
  const now = Date.now()
  if (now - last < COOLDOWN) {
    const left = COOLDOWN - (now - last)
    return formatTime(left)
  }
  global.db.data.cooldowns[userId][cmd] = now
  return false
}

function formatTime(ms) {
  let s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60)
  s %= 60; m %= 60; h %= 24
  let out = []
  if (h) out.push(`${h}h`)
  if (m) out.push(`${m}m`)
  if (s) out.push(`${s}s`)
  return out.join(' ')
}

// Manejador principal
let handler = async (m, { conn, args, command, usedPrefix }) => {
  const userId = m.sender
  global.db.data.characters = global.db.data.characters || {}

  // #rw: Random personaje (cooldown)
  if (/^rw$/i.test(command)) {
    const left = cooldownCheck(userId, 'rw')
    if (left) return m.reply(`*❖ Debes esperar ${left} antes de volver a usar este comando.*`, m, rcanal)
    const gacha = loadGacha()
    const pj = gacha[Math.floor(Math.random() * gacha.length)]
    const estadoMsg = pj.estado === 'Libre' 
      ? 'Estado: Libre' 
      : `Estado: Reclamado por @${pj.estado.split('@')[0]}`
    await conn.sendMessage(m.chat, {
      image: { url: pj.foto },
      caption: `ID: ${pj.id}\nNombre: ${pj.nombre}\n${estadoMsg}`,
      mentions: pj.estado !== 'Libre' ? [pj.estado] : [],
    }, { quoted: m })
    return
  }

  // #claim: Reclama personaje (respondiendo, cooldown)
  if (/^(claim|c)$/i.test(command)) {
    const left = cooldownCheck(userId, 'claim')
    if (left) return m.reply(`*❖ Debes esperar ${left} antes de volver a usar este comando.*`, m, rcanal)
    if (!m.quoted || !m.quoted.imageMessage) 
      return m.reply('*🜸 Responde a la imagen del personaje que quieres reclamar.*', m, rcanal)
    const caption = m.quoted.caption || ''
    const idMatch = caption.match(/ID: (\d+)/)
    if (!idMatch) return m.reply('No se pudo identificar el personaje.', m, rcanal)
    const pjId = Number(idMatch[1])
    const gacha = loadGacha()
    const pj = gacha.find(x => x.id === pjId)
    if (!pj) return m.reply('*🜸 Personaje no existe.*', m, rcanal)
    if (pj.estado !== 'Libre') 
      return m.reply(`*❖ Ya fue reclamado por @${pj.estado.split('@')[0]}*`, m, { mentions: [pj.estado] })

    pj.estado = userId
    saveGacha(gacha)
    global.db.data.characters[pjId] = { ...pj, user: userId }
    return m.reply(`*🜸 Has reclamado a "${pj.nombre}" correctamente!*`, m, rcanal)
  }

  // #harem: muestra los personajes reclamados
  if (/^harem$/i.test(command)) {
    let uid = userId
    if (m.quoted) uid = m.quoted.sender
    if (m.mentionedJid && m.mentionedJid.length) uid = m.mentionedJid[0]
    const harem = getUserHarem(uid)
    if (!harem.length) return m.reply('*🜸 No tienes personajes en tu harem.*', m, rcanal)
    let txt = `*Harem de @${uid.split('@')[0]}*\n`
    harem.forEach(p => txt += `• ${p.nombre} (ID: ${p.id})\n`)
    return m.reply(txt, m, { mentions: [uid] })
  }

  // #haremshop / #wshop: muestra personajes en venta
  if (/^(haremshop|wshop)$/i.test(command)) {
    const gacha = loadGacha()
    const ventas = gacha.filter(p => typeof p.venta === 'number' && p.venta > 0)
    if (!ventas.length) return m.reply('*🜸 No hay personajes en venta.*', m, rcanal)
    let txt = '*🜸 Personajes en venta:*\n'
    ventas.forEach(p => txt += `• ${p.nombre} (ID: ${p.id}) — ${p.venta} coins [Vendedor: @${p.estado.split('@')[0]}]\n`)
    return m.reply(txt, m, { mentions: ventas.map(p => p.estado) })
  }

  // #sell (precio) (personaje)
  if (/^sell$/i.test(command)) {
    if (args.length < 2) return m.reply('Usa: #sell (precio mínimo 1000) (Nombre)', m, rcanal)
    const precio = Number(args[0])
    if (isNaN(precio) || precio < 1000) return m.reply('*🜸 Precio mínimo: 1000 coins.*', m, rcanal)
    const nombre = args.slice(1).join(' ')
    const pj = Object.values(global.db.data.characters).find(p => p.user === userId && p.nombre.toLowerCase() === nombre.toLowerCase())
    if (!pj) return m.reply('*🜸 Ese personaje no te pertenece.*', m, rcanal)
    const gacha = loadGacha()
    const idx = gacha.findIndex(x => x.id === pj.id)
    gacha[idx].venta = precio
    saveGacha(gacha)
    return m.reply(`*🜸 Personaje "${pj.nombre}" puesto en venta por ${precio} coins.*`, m, rcanal)
  }

  // #buypersonaje)
  if (/^buyc$/i.test(command)) {
    if (!args.length) return m.reply('*🜸 Usa: #buyc (Nombre)*', m, rcanal)
    const nombre = args.join(' ')
    const gacha = loadGacha()
    const pj = gacha.find(p => p.venta && p.venta > 0 && p.nombre.toLowerCase() === nombre.toLowerCase())
    if (!pj) return m.reply('*🜸 Ese personaje no está en venta.*', m, rcanal)
    if (pj.estado === userId) return m.reply('Ya eres dueño de ese personaje.', m, rcanal)
    const price = pj.venta
    if (getUserCoins(userId) < price) return m.reply('*🜸 No tienes suficientes coins.*', m, rcanal)
    // Transferir personaje
    const vendedorId = pj.estado
    pj.estado = userId
    delete pj.venta
    saveGacha(gacha)
    global.db.data.characters[pj.id].user = userId
    addUserCoins(userId, -price)
    if (vendedorId) addUserCoins(vendedorId, price)
    return m.reply(`*🜸 ¡Has comprado "${pj.nombre}" exitosamente!*`, m, rcanal)
  }
}

handler.help = ['rw', 'claim', 'c', 'harem', 'haremshop', 'wshop', 'sell', 'buyc']
handler.tags = ['gacha', 'harem']
handler.command = /^(rw|claim|c|harem|haremshop|wshop|sell|buyc)$/i
export default handler