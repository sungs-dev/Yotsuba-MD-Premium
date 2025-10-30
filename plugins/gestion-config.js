const handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin }) => {
  const primaryBot = global.db.data.chats[m.chat].primaryBot
  if (primaryBot && conn.user.jid !== primaryBot) throw !1
  const chat = global.db.data.chats[m.chat]
  let type = command.toLowerCase()
  let isEnable = chat[type] !== undefined ? chat[type] : false

  switch (type) {
    case 'welcome':
    case 'bienvenida': {
      if (m.isGroup && !(isAdmin || isOwner)) {
        global.dfail('admin', m, conn)
        throw false
      }
      chat.welcome = isEnable
      break
    }
    case 'modoadmin':
    case 'onlyadmin': {
      if (m.isGroup && !(isAdmin || isOwner)) {
        global.dfail('admin', m, conn)
        throw false
      }
      chat.modoadmin = isEnable
      break
    }
    case 'antilink':
    case 'antienlace': {
      if (m.isGroup && !(isAdmin || isOwner)) {
        global.dfail('admin', m, conn)
        throw false
      }
      chat.antiLink = isEnable
      break
    }
  }

  if (args[0] === 'on' || args[0] === 'enable') {
    if (isEnable) return conn.reply(m.chat, `🤨 *${type}* ya estaba *activado* we`, m, rcanal)
    isEnable = true
  } else if (args[0] === 'off' || args[0] === 'disable') {
    if (!isEnable) return conn.reply(m.chat, `🤨 *${type}* ya estaba *desactivado* we`, m, rcanal)
    isEnable = false
  } else {
    return conn.reply(
      m.chat,
      `👑 Los admins pueden activar o desactivar la función *${command}* utilizando:\n\n💜 *${command}* enable\n💜 *${command}* disable🛠 Estado actual » *${isEnable ? '✓ Activado' : '✗ Desactivado'}*`,
      m, rcanal
    )
  }
  chat[type] = isEnable
  conn.reply(m.chat, `🙈 Has *${isEnable ? 'activado' : 'desactivado'}* el *${type}* para este grupo.`, m, rcanal)
}

handler.help = ['welcome', 'bienvenida', 'modoadmin', 'onlyadmin', 'antilink', 'antienlace']
handler.tags = ['nable']
handler.command = ['welcome', 'bienvenida', 'modoadmin', 'onlyadmin', 'antilink', 'antienlace']
handler.group = true

export default handler