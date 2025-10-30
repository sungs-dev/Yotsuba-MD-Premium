const handler = async (m, { conn, command, usedPrefix, text }) => {
  try {
    const isSubBots = [conn.user.jid, ...global.owner.map(([number]) => `${number}@s.whatsapp.net`)].includes(m.sender)
    if (!isSubBots) return m.reply(`❀ El comando *${command}* solo puede ser ejecutado por el Socket.`)

    const config = global.db.data.settings[conn.user.jid]
    const value = text ? text.trim().toLowerCase() : ''
    const type = 'gponly'
    const isEnable = config[type] || false
    const enable = value === 'enable' || value === 'on'
    const disable = value === 'disable' || value === 'off'
    if (enable || disable) {
      if (isEnable === enable)
        return m.reply(`ꕥ El modo *${type}* ya estaba ${enable ? 'activado' : 'desactivado'}.`)
      config[type] = enable
      return conn.reply(m.chat, `❀ Has *${enable ? 'activado' : 'desactivado'}* el modo *${type}* para el Socket.`, m)
    }
    conn.reply(m.chat, `「✦」Puedes activar o desactivar el modo *${type}* utilizando:\n\n● Activar » ${usedPrefix}${command} enable\n● Desactivar » ${usedPrefix}${command} disable\n\n✧ Estado actual » *${isEnable ? '✓ Activado' : '✗ Desactivado'}*`, m)
  } catch (error) {
    await m.react('✖️')
    conn.reply(m.chat, `⚠︎ Se ha producido un problema.\n> Usa *${usedPrefix}report* para informarlo.\n\n${error.message || error}`, m)
  }
}

handler.command = ['sologp']
handler.help = ['sologp']
handler.tags = ['socket']

export default handler