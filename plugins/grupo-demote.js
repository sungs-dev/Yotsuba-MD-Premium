let handler = async (m, { conn,usedPrefix, command, text }) => {
if(isNaN(text) && !text.match(/@/g)){

}else if(isNaN(text)) {
var number = text.split`@`[1]
}else if(!isNaN(text)) {
var number = text
}
if(!text && !m.quoted) return conn.reply(m.chat, `*ᐛ👑* Mensiona a un ciudadano de este mundo mágico para quitarle sus *privilegios altos.*`, m, fake)
if(number.length > 13 || (number.length < 11 && number.length > 0)) return conn.reply(m.chat, `*ᐛ👑* Mensiona a un ciudadano de este mundo mágico para quitarle sus *privilegios altos.*`, m, fake)
try {
if(text) {
var user = number + '@s.whatsapp.net'
} else if(m.quoted.sender) {
var user = m.quoted.sender
} else if(m.mentionedJid) {
var user = number + '@s.whatsapp.net'
} 
} catch (e) {
} finally {
conn.groupParticipantsUpdate(m.chat, [user], 'demote')
await conn.reply(m.chat, `*ᐛ👑* El ciudadano fue mandado a los *terrenos bajos.*`, m, fake)
await m.react('💟')
}

}
handler.help = ['demote *@tag*']
handler.tags = ['grupo']
handler.command = ['demote', 'degradar'] 
handler.group = true
handler.admin = true
handler.botAdmin = true
handler.fail = null

export default handler