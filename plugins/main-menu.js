import fs from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'

const pad = v => String(v).padStart(2, '0')
const formatClock = ms => {
  if (typeof ms !== 'number' || isNaN(ms)) return '00:00:00'
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}
const formatPing = ms => {
  if (typeof ms !== 'number' || isNaN(ms)) return '0ms'
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`
  return `${(ms / 60000).toFixed(2)} m`
}

const readSessionConfig = (conn) => {
  try {
    const botId = conn.user?.jid?.split('@')[0]?.replace(/\D/g, '')
    if (!botId) return {}
    const configPath = join('./JadiBots', botId, 'config.json')
    if (!fs.existsSync(configPath)) return {}
    return JSON.parse(fs.readFileSync(configPath))
  } catch (e) {
    return {}
  }
}

const ensureDB = () => {
  if (!global.db) global.db = { data: { users: {} } }
  if (!global.db.data) global.db.data = { users: {} }
  if (!global.db.data.users) global.db.data.users = {}
}

let handler = async (m, { conn }) => {
  ensureDB()

  // lectura de config de sesión (JadiBots/<botId>/config.json)
  const cfg = readSessionConfig(conn)
  const nombreBot = cfg.name || cfg.currency || cfg?.botname || 'Yotsuba Nakano' // prefer name, fallback currency or botname
  const currency = cfg.currency || 'Coins'
  const bannerUrl = cfg.banner || 'https://qu.ax/zRNgk.jpg'

  // thumbnail para externalAdReply (intentar descargar)
  let thumbnail = null
  try {
    const res = await fetch(bannerUrl)
    thumbnail = await res.buffer()
  } catch (e) {
    thumbnail = null
  }

  // uptime
  let uptimeMs = 0
  try {
    if (conn?.uptime) uptimeMs = conn.uptime
    else if (typeof process !== 'undefined' && process.uptime) uptimeMs = Math.floor(process.uptime() * 1000)
    else uptimeMs = 0
  } catch (e) { uptimeMs = 0 }
  const uptime = formatClock(uptimeMs)

  // ping aproximado (desde timestamp del mensaje)
  let msgTimestamp = 0
  if (m?.messageTimestamp) msgTimestamp = m.messageTimestamp * 1000
  else if (m?.message?.timestamp) msgTimestamp = m.message.timestamp * 1000
  else if (m?.key?.t) msgTimestamp = m.key.t * 1000
  else msgTimestamp = Date.now()
  const p = formatPing(Date.now() - msgTimestamp)

  // total de usuarios en db
  const totalreg = Object.keys(global.db.data.users).length

  // username del que invoca
  let username = m.pushName || m.name || m.sender.split('@')[0]
  try { username = await conn.getName(m.sender) || username } catch (e) {}

  // obtener stats del usuario desde la DB
  const user = global.db.data.users[m.sender] || { money: 0, exp: 0, level: 1 }
  const userMoney = user.money || 0
  const userExp = user.exp || 0
  const userLevel = user.level || 1

  // rango según si es admin en el grupo (si aplica)
  let rango = 'Súbdito'
  try {
    if (m.isGroup) {
      const meta = await conn.groupMetadata(m.chat)
      const participant = meta.participants.find(p => p.id === m.sender)
      if (participant && (participant.admin || participant.isAdmin)) rango = 'Aprendiz'
    }
  } catch (e) {}

  // calcular posicion en el top del grupo (solo si es grupo)
  let rankText = 'N/A'
  try {
    if (m.isGroup) {
      const meta = await conn.groupMetadata(m.chat)
      const groupJids = meta.participants.map(p => p.id)
      const arr = Object.keys(global.db.data.users)
        .filter(jid => groupJids.includes(jid))
        .map(jid => {
          const u = global.db.data.users[jid] || {}
          return { jid, total: (u.money || 0) + (u.bank || 0) }
        })
        .sort((a, b) => b.total - a.total)
      const idx = arr.findIndex(x => x.jid === m.sender)
      rankText = idx >= 0 ? String(idx + 1) : 'N/A'
    } else {
      const arr = Object.keys(global.db.data.users)
        .map(jid => {
          const u = global.db.data.users[jid] || {}
          return { jid, total: (u.money || 0) + (u.bank || 0) }
        })
        .sort((a, b) => b.total - a.total)
      const idx = arr.findIndex(x => x.jid === m.sender)
      rankText = idx >= 0 ? String(idx + 1) : 'N/A'
    }
  } catch (e) { rankText = 'N/A' }

  // construir texto según el template proporcionado
  let txt = `*Singa su madre to creen bot ustedes mamaguevaso*
`.trim()

  // mentions: mencionar al usuario que abrió el menú (opc.)
  const mentions = [m.sender]

  await conn.sendMessage(m.chat, {
    text: txt,
    contextInfo: {
      mentionedJid: mentions,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: global.channelRD?.id || '',
        serverMessageId: '',
        newsletterName: global.channelRD?.name || ''
      },
      externalAdReply: {
        title: nombreBot,
        body: global.textbot || '',
        mediaType: 1,
        mediaUrl: global.redes || '',
        sourceUrl: global.redes || '',
        thumbnail,
        showAdAttribution: false,
        containsAutoReply: true,
        renderLargerThumbnail: true // thumbnail grande (como enlace)
      }
    }
  }, { quoted: m })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'menú', 'help']

export default handler