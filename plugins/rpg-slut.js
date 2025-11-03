let handler = async (m, { conn, usedPrefix, command }) => {
if (!db.data.chats[m.chat].economy && m.isGroup) {
return m.reply(`...`)
}
let user = global.db.data.users[m.sender]
user.lastslut = user.lastslut || 0
const cooldown = 5 * 60 * 1000
if (Date.now() < user.lastslut) {
const restante = user.lastslut - Date.now()
const tiempoRestante = formatTime(restante)
return conn.reply(m.chat, `💛 Espera *${tiempoRestante}* para usar *${usedPrefix + command}* otra vez.`, m, rcanal)
}
user.lastslut = Date.now() + cooldown
const evento = pickRandom(slut)
let cantidad
if (evento.tipo === 'victoria') {
cantidad = Math.floor(Math.random() * 1501) + 4000
user.coin += cantidad
} else {
cantidad = Math.floor(Math.random() * 1001) + 3000
user.coin -= cantidad
if (user.coin < 0) user.coin = 0
}
const mensaje = `🌟 ${evento.mensaje} *¥${cantidad.toLocaleString()} ${currency}*`
await conn.reply(m.chat, mensaje, m, rcanal)
}

handler.help = ['slut']
handler.tags = ['rpg']
handler.command = ['slut', 'protituirse']
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
return list[Math.floor(Math.random() * list.length)]
}
const slut = [
{ tipo: 'victoria', mensaje: "Le chupas el guevo a un administrador y ganas." },
{ tipo: 'derrota', mensaje: "Felix no te quiso dar nada porque no Cumpliste como te lo pidio, perdiste." },
{ tipo: 'derrota', mensaje: "El admin después de que se lo chupes te sacó del grupo, perdiste." }
]