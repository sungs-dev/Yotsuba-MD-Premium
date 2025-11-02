var handler = async (m, { conn, participants, usedPrefix, command }) => {
let mentionedJid = await m.mentionedJid
let user = mentionedJid && mentionedJid.length ? mentionedJid[0] : m.quoted && await m.quoted.sender ? await m.quoted.sender : null
if (!user) return conn.reply(m.chat, `*👑 Dime a quien quieres que le de piso 🤣*`, m, rcanal)
try {
const groupInfo = await conn.groupMetadata(m.chat)
const ownerGroup = groupInfo.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
const ownerBot = global.owner[0][0] + '@s.whatsapp.net'
if (user === conn.user.jid) return conn.reply(m.chat, `*👑 No puedo autoeliminarme.*`, m, rcanal)
if (user === ownerGroup) return conn.reply(m.chat, `*👑 No puedo eliminar al creador del grupo.*`, m, rcanal)
if (user === ownerBot) return conn.reply(m.chat, `*👑 No puedo eliminar a mi creador.*`, m, rcanal)
await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
} catch (e) {
conn.reply(m.chat, `😿Error: ${e.message}`, m, rcanal)
}}

handler.help = ['kick']
handler.tags = ['grupo']
handler.command = ['kick', 'ban', 'sacar']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler