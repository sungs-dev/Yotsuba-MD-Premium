const handler = async (m, { conn, command, usedPrefix, text }) => {
  try {
    const isSubBots = [conn.user.jid, ...global.owner.map(([number]) => `${number}@s.whatsapp.net`)].includes(m.sender)
    if (!isSubBots) return m.reply(`😐 Solo yo puedo ejecutar esto we`)

    const config = global.db.data.settings[conn.user.jid]
    const value = text ? text.trim().toLowerCase() : ''
    const type = 'gponly'
    const isEnable = config[type] || false
    const enable = value === 'enable' || value === 'on'
    const disable = value === 'disable' || value === 'off'
    if (enable || disable) {
      if (isEnable === enable)
        return m.reply(`😐 El modo *${type}* ya estaba ${enable ? 'activado' : 'desactivado'} we.`)
      config[type] = enable
      return conn.reply(m.chat, `👑 Has *${enable ? 'activado' : 'desactivado'}* el modo *${type}* para esta session.`, m, rcanal)
    }
    conn.reply(m.chat, `「✦」Estado del modo: *${isEnable ? '✓ Activado' : '✗ Desactivado'}* , puedes activar o desactivar usando:\n\n- >${type} + on/off>`, m, rcanal)
  } catch (error) {
    await m.react('✖️')
    conn.reply(m.chat, `Error: \n\n${error.message || error}`, m, rcanal)
  }
}

handler.command = ['sologp']
handler.help = ['sologp']
handler.tags = ['socket']

export default handler