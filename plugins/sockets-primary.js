import ws from 'ws'

const handler = async (m, { conn }) => {
const subBots = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn.user.jid)])]
if (global.conn?.user?.jid && !subBots.includes(global.conn.user.jid)) {
subBots.push(global.conn.user.jid)
}
const chat = global.db.data.chats[m.chat]
const mentionedJid = await m.mentionedJid
const who = mentionedJid[0] ? mentionedJid[0] : m.quoted ? await m.quoted.sender : false
if (!who) return conn.reply(m.chat, `*☹ Mensiona a quien quieres que aga que envie mi magia.*`, m)
if (!subBots.includes(who)) return conn.reply(m.chat, `*🤨 Esta persona no es un mago fusionado conmigo. No tengo la capacidad  para hacer que solo el responda aquí.*`, m, rcanal)
if (chat.primaryBot === who) {
return conn.reply(m.chat, `*🙈 Ya respondo dentro de este cuerpo.*`, m, { mentions: [who] });
}
try {
chat.primaryBot = who
conn.reply(m.chat, `👑 Ahora responderé solo en el cuerpo de @${who.split`@`[0]} Ya que su fusión conmigo fue la elegida como primaria.`, m, { mentions: [who] })
} catch (e) {
conn.reply(m.chat, `😿 Error al conectarme al cuerpo de este mago.`, m, rcanal)
}}

handler.help = ['setprimary']
handler.tags = ['grupo']
handler.command = ['setprimary']
handler.group = true
handler.admin = true

export default handler