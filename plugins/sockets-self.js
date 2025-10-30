const handler = async (m, { conn, command, usedPrefix, text }) => {
  try {
    const isSubBots = [conn.user.jid, ...global.owner.map(([number]) => `${number}@s.whatsapp.net`)].includes(m.sender)
    if (!isSubBots) return m.reply(`🤨 Esto solo puede ser usado por mi we`)

    const config = global.db.data.settings[conn.user.jid]
    const value = text ? text.trim().toLowerCase() : ''
    const type = 'self'
    const isEnable = config[type] || false
    const enable = value === 'enable' || value === 'on'
    const disable = value === 'disable' || value === 'off'
    if (enable || disable) {
      if (isEnable === enable)
        return m.reply(`🤨 El modo *${type}* ya estaba ${enable ? 'activado' : 'desactivado'}.`)
      config[type] = enable
      return conn.reply(m.chat, `👑 Has *${enable ? 'activado' : 'desactivado'}* el modo *${type}* para esta session.`, m, rcanal)
    }
    conn.reply(m.chat, `👑 Puedes activar o desactivar la función *${command}* utilizando:\n\n💜 *${command}* enable\n💜 *${command}* disable\n\n🛠 Estado actual » *${isEnable ? '✓ Activado' : '✗ Desactivado'}*`, m, rcanal)
  } catch (error) {
    await m.react('✖️')
    conn.reply(m.chat, `Error:.\n\n${error.message || error}`, m, rcanal)
  }
}

handler.command = ['self']
handler.help = ['self']
handler.tags = ['socket']

export default handler