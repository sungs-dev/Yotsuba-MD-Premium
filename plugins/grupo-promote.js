var handler = async (m, { conn, usedPrefix, command, text, groupMetadata, isAdmin }) => {
let mentionedJid = await m.mentionedJid
let user = mentionedJid && mentionedJid.length ? mentionedJid[0] : m.quoted && await m.quoted.sender ? await m.quoted.sender : null
if (!user) return conn.reply(m.chat, `*ᐛ👑* Mensiona a un ciudadano de este mundo mágico para darle *privilegios altos.*`, m, rcanal)
try {
const groupInfo = await conn.groupMetadata(m.chat)
const ownerGroup = groupInfo.owner || m.chat.split('-')[0] + '@s.whatsapp.net'
if (user === ownerGroup || groupInfo.participants.some(p => p.id === user && p.admin))
return conn.reply(m.chat, '*ᐛ👑* Está persona ya es admin', m, rcanal)
await conn.groupParticipantsUpdate(m.chat, [user], 'promote')
await conn.reply(m.chat, `*ᐛ👑* El ciudadano fue puesto como ayudante del rey *(creador del grupo)*.`, m, rcanal)
} catch (e) {
conn.reply(m.chat, `Error:\n\n✎ ${e.message}`, m)
}}

handler.help = ['promote']
handler.tags = ['grupo']
handler.command = ['promote', 'promover']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler