import ws from 'ws'

const handler = async (m, { conn, usedPrefix }) => {
  const chat = global.db.data.chats[m.chat]

  if (!chat.primaryBot) {
    return conn.reply(m.chat, `*🙁 Todos los magos pueden usar su magia aquí porque no hay ninguno establecido como principal.*`, m, rcanal)
  }

  try {
    const oldPrimary = chat.primaryBot
    chat.primaryBot = null

    conn.reply(
      m.chat, 
      `*🌟 El mago @${oldPrimary.split`@`[0]} se le acabo su poder. Ahora todos los magos pueden usar su magia con facilidad.*`, 
      m, 
      { mentions: [oldPrimary] }
    )
  } catch (e) {
    conn.reply(
      m.chat, 
      `*😿 No pude hacerlo. disculpa.*`, 
      m
    )
  }
}

handler.help = ['delprimary']
handler.tags = ['grupo']
handler.command = ['delprimary']
handler.admin = true  

export default handler