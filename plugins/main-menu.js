import fs from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'

/**
 * Convierte milisegundos a HH:MM:SS
 */
const formatClock = (ms) => {
  if (typeof ms !== 'number' || isNaN(ms)) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map(v => String(v).padStart(2, '0')).join(':')
}

/**
 * Formatea un delta de tiempo (ms) en una cadena legible (ms / s / m)
 */
const formatPing = (ms) => {
  if (typeof ms !== 'number' || isNaN(ms)) return '0ms'
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`
  return `${(ms / 60000).toFixed(2)} m`
}

let handler = async (m, { conn, args }) => {
  // Cuenta de usuarios tomada desde la database global
  let totalreg = 0
  try {
    totalreg = Object.keys(global.db.data.users).length
  } catch (e) {
    totalreg = 0
  }

  // Obtén el usuario mencionado o el que ejecuta el comando
  let mentionedJid = await m.mentionedJid
  let userId = mentionedJid && mentionedJid[0] ? mentionedJid[0] : m.sender

  // ADAPTACIÓN para obtener nombre y banner del bot por sesión/config.json
  let nombreBot = typeof botname !== 'undefined' ? botname : 'Yotsuba Nakano'
  let bannerFinal = 'https://qu.ax/zRNgk.jpg'

  const botActual = conn.user?.jid?.split('@')[0]?.replace(/\D/g, '')
  const configPath = join('./JadiBots', botActual || '', 'config.json')
  if (botActual && fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath))
      if (config.name) nombreBot = config.name
      if (config.banner) bannerFinal = config.banner
    } catch (e) {}
  }

  // Uptime: tiempo desde el último arranque del proceso (en ms)
  let uptimeMs = 0
  try {
    // Si la conexión (Baileys) expone uptime, úsala; si no, usa process.uptime()
    if (conn?.uptime) uptimeMs = conn.uptime
    else if (typeof process !== 'undefined' && process.uptime) uptimeMs = Math.floor(process.uptime() * 1000)
    else if (global.db?.data?.options?.startTime) uptimeMs = Date.now() - global.db.data.options.startTime
    else uptimeMs = 0
  } catch (e) {
    uptimeMs = 0
  }
  const uptime = formatClock(uptimeMs)

  // Determinar timestamp del mensaje de comando (si está disponible) y calcular ping
  // Distintos handlers tienen distintas propiedades: probamos algunas comunes
  let msgTimestamp = 0
  if (m?.messageTimestamp) msgTimestamp = m.messageTimestamp * 1000
  else if (m?.message?.timestamp) msgTimestamp = m.message.timestamp * 1000
  else if (m?.key?.t) msgTimestamp = m.key.t * 1000
  else if (m?.key?.fromMe && m?.key?.id) msgTimestamp = Date.now()
  else msgTimestamp = Date.now()

  // Ping = tiempo desde que el usuario envió el comando hasta ahora (ms)
  const pingMs = Date.now() - msgTimestamp
  const p = formatPing(pingMs)

  // Construir el texto del menú (aquí se incluyen ${uptime} y ${p} ya resueltos)
  let txt = `𝐇𝐨𝐥𝐚 *@${userId.split('@')[0]},* 𝐒𝐨𝐲  *${nombreBot}*

> ꒰⌢ ʚ˚₊‧ ✎ ꒱ INFO:
- ${nombreBot} es un bot privado, el cual el bot principal no se unirá a tus grupos. Si quieres tener el bot en tu grupo tienes que ser Sub-Bot con *(#code)*
> ꒰⌢ ʚ˚₊‧ ✎ ꒱ ❐ ʚ˚₊‧ʚ˚₊‧ʚ˚

*╭━━━〔 BOT - INFO 〕━⬣*
*│Creador:* 𓆩‌۫᷼ ִֶָღܾ݉͢ғ꯭ᴇ꯭፝ℓɪ꯭ͨא𓆪 
*│Usuarios:* ${totalreg.toLocaleString()}
*│Uptime:* ${uptime}
*│Ping:* ${p}
*│Baileys:* PixelCrew-Bails
*╰━━━━━━━━━━⬣*

➪ 𝗟𝗜𝗦𝗧𝗔 
       ➪  𝗗𝗘 
           ➪ 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦

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