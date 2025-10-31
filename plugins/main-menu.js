import fs from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'

/**
 * Main menu adaptado:
 * - lee nombre/banner/currency por sesión: ./JadiBots/<botid>/config.json
 * - muestra info del usuario tomada de global.db.data.users (money, bank, exp, level)
 * - uptime y ping
 * - mensaje enviado "como si viniera del canal" (forwardedNewsletter + externalAdReply)
 * - thumbnail render pequeño (renderLargerThumbnail: false)
 *
 * Usa: #menu / #menú / #help
 */

// formatea ms a HH:MM:SS
const formatClock = (ms) => {
  if (typeof ms !== 'number' || isNaN(ms)) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map(v => String(v).padStart(2, '0')).join(':')
}

// formatea ms a readable ping
const formatPing = (ms) => {
  if (typeof ms !== 'number' || isNaN(ms)) return '0ms'
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`
  return `${(ms / 60000).toFixed(2)} m`
}

const ensureDB = () => {
  if (!global.db) global.db = { data: { users: {} } }
  if (!global.db.data) global.db.data = { users: {} }
  if (!global.db.data.users) global.db.data.users = {}
}

const ensureUser = (jid) => {
  ensureDB()
  if (!global.db.data.users[jid]) {
    global.db.data.users[jid] = {
      exp: 0,
      money: 0,
      bank: 0,
      level: 1,
      // cooldowns etc si los usas en otros plugins
      lastDaily: 0,
      lastCofre: 0,
      lastMinar: 0,
      lastRob: 0,
      lastRob2: 0
    }
  }
  return global.db.data.users[jid]
}

const readSessionConfig = (conn) => {
  try {
    const botActual = conn.user?.jid?.split('@')[0]?.replace(/\D/g, '')
    const configPath = join('./JadiBots', botActual || '', 'config.json')
    if (botActual && fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath))
      return { cfg, configPath, botActual }
    }
  } catch (e) { /* ignore */ }
  return { cfg: {}, configPath: null, botActual: null }
}

const getThumbnailBuffer = async (url) => {
  try {
    if (!url) return null
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.buffer()
  } catch (e) {
    return null
  }
}

let handler = async (m, { conn, args }) => {
  ensureDB()

  // sesión/config de este bot (la sesión que ejecuta este handler)
  const { cfg } = readSessionConfig(conn)
  const nombreBot = cfg?.name || 'Yotsuba Nakano'
  const bannerFinal = cfg?.banner || 'https://qu.ax/zRNgk.jpg'
  const currency = cfg?.currency || 'Coins'

  // totals
  const totalreg = Object.keys(global.db.data.users || {}).length

  // uptime: prefer conn.uptime si está, si no process.uptime
  let uptimeMs = 0
  try {
    if (conn?.uptime && typeof conn.uptime === 'number') uptimeMs = conn.uptime
    else if (typeof process !== 'undefined' && process.uptime) uptimeMs = Math.floor(process.uptime() * 1000)
    else uptimeMs = 0
  } catch (e) { uptimeMs = 0 }
  const uptime = formatClock(uptimeMs)

  // ping aproximado desde timestamp del mensaje
  let msgTimestamp = 0
  if (m?.messageTimestamp) msgTimestamp = m.messageTimestamp * 1000
  else if (m?.message?.timestamp) msgTimestamp = m.message.timestamp * 1000
  else if (m?.key?.t) msgTimestamp = m.key.t * 1000
  else msgTimestamp = Date.now()
  const pingMs = Date.now() - msgTimestamp
  const p = formatPing(pingMs)

  // Usuario objetivo (mencionado o quien ejecuta)
  const mentionedJid = (m.mentionedJid && m.mentionedJid.length) ? m.mentionedJid[0] : m.sender
  const userId = mentionedJid || m.sender

  // asegúrate que existe registro del user
  const userData = ensureUser(userId)

  // obtener nombre legible del usuario (si la conexión lo soporta)
  let userName = userId.split('@')[0]
  try {
    if (typeof conn.getName === 'function') {
      const n = await conn.getName(userId)
      if (n) userName = n
    } else if (conn.contacts && conn.contacts[userId] && conn.contacts[userId].name) {
      userName = conn.contacts[userId].name
    }
  } catch (e) { /* ignore */ }

  // calcular rango (según si es admin en el grupo)
  let rango = 'Súbdito'
  try {
    if (m.isGroup) {
      const meta = await conn.groupMetadata(m.chat)
      const participant = meta.participants.find(p => p.id === userId)
      if (participant && (participant.admin || participant.isAdmin)) rango = 'Aprendiz'
    }
  } catch (e) { /* ignore */ }

  // calcular posición/top en este grupo (por total monedas: money + bank)
  let rankText = 'N/A'
  try {
    if (m.isGroup) {
      const meta = await conn.groupMetadata(m.chat)
      const groupJids = meta.participants.map(p => p.id)
      const arr = Object.keys(global.db.data.users)
        .filter(jid => groupJids.includes(jid))
        .map(jid => ({ jid, total: (global.db.data.users[jid].money || 0)].bank || 0) }))
        .sort((a, b) => b.total - a.total)
      const idx = arr.findIndex(x => x.jid === userId)
      rankText = idx >= 0 ? String(idx + 1) : 'N/A'
    } else {
      const arr = Object.keys(global.db.data.users)
        .map(jid => ({ jid, total: (global.db.data.users[jid].money || 0) + (global.db.data.users[jid].bank || 0) }))
        .sort((a, b) => b.total - a.total)
      const idx = arr.findIndex(x => x.jid === userId)
      rankText = idx >= 0 ? String(idx + 1) : 'N/A'
    }
  } catch (e) { rankText = 'N/A' }

  // preparar thumbnail pequeño
  const thumbnail = await getThumbnailBuffer(bannerFinal).catch(() => null)

  // construir texto del menú usando la plantilla que diste
  const txt = `
𝐇𝐨𝐥𝐚, Soy *${nombreBot}*

> ꒰⌢ ʚ˚₊‧ ✎ ꒱ INFO:
- *${nombreBot}* es un bot privado, el cual el bot principal no se unirá a tus grupos. Si quieres tener el bot en tu grupo tienes que ser Sub-Bot con *(#code)*
> ꒰⌢ ʚ˚₊‧ ✎ ꒱ ❐ ʚ˚₊‧ʚ˚₊‧ʚ˚

*╭╼𝅄꒰𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ꒱ 𐔌 BOT - INFO 𐦯*
*|✎ Creador:* 𓆩‌۫᷼ ִֶָღܾ݉͢ғ꯭ᴇ꯭፝ℓɪ꯭ͨא𓆪
*|✎ Users:* ${totalreg.toLocaleString()}
*|✎ Uptime:* ${uptime}
*|✎ Ping:* ${p}
*|✎ Baileys:* PixelCrew-Bails
*╰─ׅ─ׅ┈─๋︩︪─╯*


*╭╼𝅄꒰𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ꒱ 𐔌 INFO - USER 𐦯*
*|✎ Nombre:* ${userName}
*|✎ ${currency}:* ${ (userData.money || 0) }
*|✎ Exp:* ${ (userData.exp || 0) }
*|✎ Rango:* ${rango}
*|✎ Nivel:* ${ (userData.level || 1) }
*╰─ׅ─ׅ┈─๋︩︪─☪︎︎︎̸⃘࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈─๋︩︪─╯*


*➪ 𝗟𝗜𝗦𝗧𝗔*
       *➪  𝗗𝗘*
           *➪ 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦*


*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 HERRAMIENTAS 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #pinterest <texto>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #play <musica>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #catbox <imagen>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #toimg <sticker>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #pin <texto>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #yts*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #ytv*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #play2*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #ytm3*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #ytmp4*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #yta*
*╰─ׅ─ׅ┈ ─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈ ─๋︩︪─╯*


*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 SOCKETS  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #qr*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #code*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #self <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #sologp <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #leave*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #setname <nombre>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #setbanner <foto>*
*╰─ׅ─ׅ┈─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈─๋︩︪─╯*


*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 RPG  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #daily
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #cofre
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #minar
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #rob
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #rob2
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #depositar <all>
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #d <all>
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #lvl
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #bal
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #baltop
*╰─ׅ─ׅ┈─๋︩︪─☪︎︎︎̸⃘࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈─๋︩︪─╯*


*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 GESTIÓN 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #testwelcome
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #testbye
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #bye <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #welcome <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #antienlace <on/off>*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #antilink <on/off>*
*╰─ׅ─ׅ┈─๋︩︪─☪︎︎︎̸⃘࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈─๋︩︪─╯*


*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 GRUPOS 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #demote*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #promote*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #delete*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #kick*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #del*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #promover*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #degradar*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #delprimary*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #setprimary*
*╰─ׅ─ׅ┈─๋︩︪─☪︎︎︎̸⃘࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈─๋︩︪─╯*


*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 OWNER  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #autoadmin*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #join*
*╰─ׅ─ׅ┈─๋︩︪─☪︎︎︎̸⃘࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈─๋︩︪─╯*

> ✰ 𝐃𝐞𝐬𝐜𝐨𝐧𝐨𝐜𝐢𝐝𝐨 𝐗𝐳𝐬𝐲 (•̀ᴗ•́)و`.trim()

  await conn.sendMessage(m.chat, { 
    text: txt,
    contextInfo: {
      mentionedJid: [userId],
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: channelRD?.id || '',
        serverMessageId: '',
        newsletterName: channelRD?.name || ''
      },
      externalAdReply: {
        title: nombreBot,
        body: textbot || '',
        mediaType: 1,
        mediaUrl: redes || '',
        sourceUrl: redes || '',
        thumbnail: await (await fetch(bannerFinal)).buffer().catch(()=>null),
        showAdAttribution: false,
        containsAutoReply: true,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'menú', 'help']

export default handler