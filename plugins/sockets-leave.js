const handler = async (m, { conn, command, usedPrefix, text }) => {
  try {
    const isSubBots = [conn.user.jid, ...global.owner.map(([number]) => `${number}@s.whatsapp.net`)].includes(m.sender)
    if (!isSubBots) return m.reply(`🤨 Eso solo puede ser usado por mi we`)

    await m.react('🕒')
    const id = text || m.chat
    const chat = global.db.data.chats[m.chat]
    chat.welcome = false
    await conn.reply(id, `☹ Adiós, La bot más magica se despide de todos`)
    await conn.groupLeave(id)
    chat.welcome = true
    await m.react('✔️')
  } catch (error) {
    await m.react('✖️')
    conn.reply(m.chat, `Error:\n\n${error.message || error}`, m, rcanal)
  }
}

handler.command = ['leave']
handler.help = ['leave']
handler.tags = ['socket']

export default handler