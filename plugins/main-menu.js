import fs from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'

let handler = async (m, { conn, args }) => {
  // Obtener el usuario mencionado o el que ejecuta el comando
  let mentionedJid = await m.mentionedJid
  let userId = mentionedJid && mentionedJid[0] ? mentionedJid[0] : m.sender
  let totalreg = Object.keys(global.db.data.users).length
  let totalCommands = Object.values(global.plugins).filter((v) => v.help && v.tags).length

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

  let txt = `𝐇𝐨𝐥𝐚 *@${userId.split('@')[0]},* 𝐒𝐨𝐲  *${nombreBot}*

> ꒰⌢ ʚ˚₊‧ ✎ ꒱ INFO:
- ${nombreBot} es un bot privado, el cual el bot principal no se unirá a tus grupos. Si quieres tener el bot en tu grupo tienes que ser Sub-Bot con *(#code)*
> ꒰⌢ ʚ˚₊‧ ✎ ꒱ ❐ ʚ˚₊‧ʚ˚₊‧ʚ˚

*╭━━━〔 BOT - INFO 〕━⬣*
*│Creador:*  Desconocido Xzsy 
*│Usuarios:* ${totalreg.toLocaleString()}
*│Baileys:* Multi device 
*╰━━━━━━━━━━⬣*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 HERRAMIENTAS 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #pinterest*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #play*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #tourl*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #toimg*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #pin*
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

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 GRUPOS 𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #demote*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #promote*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #delete*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #kick*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #del*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #promover*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #degradar
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #delprimary*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #setprimary*
*╰─ׅ─ׅ┈─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈─๋︩︪─╯*

*꒰⌢◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸ ✎ ꒱ 𐔌 OWNER  𐦯*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #autoadmin*
> *𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ ❏ #join*
*╰─ׅ─ׅ┈─๋︩︪─☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸─ׅ─ׅ┈─๋︩︪─╯*

> ✰ 𝐃𝐞𝐬𝐜𝐨𝐧𝐨𝐜𝐢𝐝𝐨 𝐗𝐳𝐬𝐲 (•̀ᴗ•́)و`.trim()

  await conn.sendMessage(m.chat, { 
    text: txt,
    contextInfo: {
      mentionedJid: [userId],
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: channelRD.id,
        serverMessageId: '',
        newsletterName: channelRD.name
      },
      externalAdReply: {
        title: nombreBot,
        body: textbot,
        mediaType: 1,
        mediaUrl: redes,
        sourceUrl: redes,
        thumbnail: await (await fetch(bannerFinal)).buffer(),
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