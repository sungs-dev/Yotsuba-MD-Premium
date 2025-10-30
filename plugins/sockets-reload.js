import { jidDecode } from '@whiskeysockets/baileys'
import path from 'path'
import fs from 'fs'

const handler = async (m, { conn, command, usedPrefix }) => {
  try {
    const isSubBots = [conn.user.jid, ...global.owner.map(([number]) => `${number}@s.whatsapp.net`)].includes(m.sender)
    if (!isSubBots) return m.reply(`*🤨 Este codigo solo puede ser usado por magos.*`)

    const rawId = conn.user?.id || ''
    const cleanId = jidDecode(rawId)?.user || rawId.split('@')[0]
    const sessionPath = path.join(global.jadi, cleanId)
    if (!fs.existsSync(sessionPath)) return conn.reply(m.chat, '*👑 Este Comando solo está disponible en subs.*', m, rcanal)
    await m.react('🕒')
    if (typeof global.reloadHandler !== 'function')
      throw new Error('No se encontró la función global.reloadHandler')
    await global.reloadHandler(true)
    await m.react('✔️')
    conn.reply(m.chat, '🙃 La sesión fue recargada correctamente.', m, rcanal)
  } catch (error) {
    await m.react('✖️')
    conn.reply(m.chat, `Error:\n\n${error.message || error}`, m, rcanal)
  }
}

handler.command = ['reload']
handler.help = ['reload']
handler.tags = ['socket']

export default handler