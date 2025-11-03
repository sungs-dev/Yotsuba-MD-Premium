let handler = async (m, { conn, usedPrefix, command }) => {
if (!db.data.chats[m.chat].economy && m.isGroup) {
return m.reply(`...`)
}
let user = global.db.data.users[m.sender]
const cooldown = 2 * 60 * 1000
user.lastwork = user.lastwork || 0
if (Date.now() < user.lastwork) {
const tiempoRestante = formatTime(user.lastwork - Date.now())
return conn.reply(m.chat, `💛 *${tiempoRestante}* para usar *${usedPrefix + command}* otra vez.`, m, rcanal)
}
user.lastwork = Date.now() + cooldown
let rsl = Math.floor(Math.random() * 1501) + 2000
await conn.reply(m.chat, `🌟 ${pickRandom(trabajo)} *¥${rsl.toLocaleString()} ${currency}*.`, m, rcanal)
user.coin += rsl
}

handler.help = ['trabajar']
handler.tags = ['economy']
handler.command = ['w', 'work', 'chambear', 'chamba', 'trabajar']
handler.group = true

export default handler

function formatTime(ms) {
const totalSec = Math.ceil(ms / 1000)
const minutes = Math.floor((totalSec % 3600) / 60)
const seconds = totalSec % 60
const parts = []
if (minutes > 0) parts.push(`${minutes} minuto${minutes !== 1 ? 's' : ''}`)
parts.push(`${seconds} segundo${seconds !== 1 ? 's' : ''}`)
return parts.join(' ')
}
function pickRandom(list) {
return list[Math.floor(list.length * Math.random())]
}
const trabajo = [
"Trabajas como esclavo de felix ganando",
"Trabajas como esclavo de los admins ganando",
"Vendiste tu trasero y obtuviste",
"Eliminas a otros bots del grupo para evitar spam y recibes"
]