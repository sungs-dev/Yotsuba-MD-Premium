import fetch from 'node-fetch'

let handler = async (m, { conn, args }) => {
let mentionedJid = await m.mentionedJid
let userId = mentionedJid && mentionedJid[0] ? mentionedJid[0] : m.sender
let totalreg = Object.keys(global.db.data.users).length
let totalCommands = Object.values(global.plugins).filter((v) => v.help && v.tags).length

let txt = `𝐇𝐨𝐥𝐚 @${userId.split('@')[0]},  𝐒𝐨𝐲 𝐘𝐨𝐭𝐬𝐮𝐛𝐚 𝐍𝐚𝐤𝐚𝐧𝐨 𝐀𝐈 

> ꒰⌢ ʚ˚₊‧ ✎ ꒱ INFO:
- Yotsuba Es un bot privado, el cual el bot principal no se unirá a tus grupos. Si quieres tener el bot en tu grupo tienes que ser Sub-Bot con *(#code)*
> ꒰⌢ ʚ˚₊‧ ✎ ꒱ ❐ ʚ˚₊‧ʚ˚₊‧ʚ˚

*╭━━━〔 BOT - INFO 〕━⬣*
*│Creador:*  Desconocido Xzsy 
*│Usuarios:* ${totalreg.toLocaleString()}
*│Baileys:* Multi device 
*╰━━━━━━━━━━⬣*

*꒰⌢  ✎ ꒱ 𐔌 HERRAMIENTAS 𐦯*
> ੭੭ ﹙ᰔᩚ﹚ ❏ #pinterest 
> ੭੭ ﹙ᰔᩚ﹚ ❏ #play
> ੭੭ ﹙ᰔᩚ﹚ ❏ #tourl
> ੭੭ ﹙ᰔᩚ﹚ ❏ #toimg
> ੭੭ ﹙ᰔᩚ﹚ ❏ #pin
> ੭੭ ﹙ᰔᩚ﹚ ❏ #yts
> ੭੭ ﹙ᰔᩚ﹚ ❏ #ytv
> ੭੭ ﹙ᰔᩚ﹚ ❏ #play2
> ੭੭ ﹙ᰔᩚ﹚ ❏ #ytm3
> ੭੭ ﹙ᰔᩚ﹚ ❏ #ytmp4
> ੭੭ ﹙ᰔᩚ﹚ ❏ #yta
╰━━━━━━━━━⬣

*꒰⌢  ✎ ꒱ 𐔌 SOCKETS  𐦯*
> ੭੭ ﹙ᰔᩚ﹚ ❏ #qr
> ੭੭ ﹙ᰔᩚ﹚ ❏ #code
> ੭੭ ﹙ᰔᩚ﹚ ❏ #setprimary
╰━━━━━━━━━⬣

*꒰⌢  ✎ ꒱ 𐔌 GRUPOS 𐦯*
> ੭੭ ﹙ᰔᩚ﹚ ❏ #demote
> ੭੭ ﹙ᰔᩚ﹚ ❏ #promote
> ੭੭ ﹙ᰔᩚ﹚ ❏ #delete
> ੭੭ ﹙ᰔᩚ﹚ ❏ #kick
> ੭੭ ﹙ᰔᩚ﹚ ❏ #del
> ੭੭ ﹙ᰔᩚ﹚ ❏ #promover
> ੭੭ ﹙ᰔᩚ﹚ ❏ #degradar
> ੭੭ ﹙ᰔᩚ﹚ ❏ #delprimary
╰━━━━━━━━━⬣

*꒰⌢  ✎ ꒱ 𐔌 OWNER  𐦯*
> ੭੭ ﹙ᰔᩚ﹚ ❏ #autoadmin
> ੭੭ ﹙ᰔᩚ﹚ ❏ #join
╰━━━━━━━━━⬣

> ✰ 𝐃𝐞𝐬𝐜𝐨𝐧𝐨𝐬𝐢𝐝𝐨 𝐗𝐳𝐬𝐲 (•̀ᴗ•́)و`.trim()
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
title: botname,
body: textbot,
mediaType: 1,
mediaUrl: redes,
sourceUrl: redes,
thumbnail: await (await fetch(banner)).buffer(),
showAdAttribution: false,
containsAutoReply: true,
renderLargerThumbnail: true
}}}, { quoted: m })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'menú', 'help']

export default handler