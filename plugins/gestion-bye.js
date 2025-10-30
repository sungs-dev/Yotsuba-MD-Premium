import fs from 'fs'
import { join } from 'path'

// Función para obtener nombre y banner del bot según la sesión/config
function getBotConfig(conn) {
  let nombreBot = typeof botname !== 'undefined' ? botname : 'Yotsuba Nakano'
  let bannerFinal = 'https://qu.ax/zRNgk.jpg'

  const botActual = conn.user?.jid?.split('@')[0]?.replace(/\D/g, '')
  const configPath = join('./JadiBots', botActual || '', 'config.json')
  if (botActual && fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath))
      if (config.name) nombreBot = config.name
      if (config.banner) bannerFinal = config.banner
    } catch {}
  }
  return { nombreBot, bannerFinal }
}

// ENVÍO DE DESPEDIDA AUTOMÁTICA (evento de salida)
export async function sendBye(conn, m) {
  const chat = global.db.data.chats[m.chat]
  // Activado por defecto si nunca se configuró
  if (!chat) return
  const isByeEnabled = chat.bye !== undefined ? chat.bye : true
  if (!isByeEnabled) return

  let taguser = '@' + m.sender.split('@')[0]
  const { nombreBot, bannerFinal } = getBotConfig(conn)
  const devby = `${nombreBot} - TextBot`

  const despedida =
    `👋 BYE 👋\n\n` +
    `🌟 ${taguser}\n\n` +
    `💫 Esperamos verte de vuelta en este mundo mágico.\n\n` +
    `> Si necesitas ayuda, usa *#help*.`

  await conn.sendMessage(m.chat, {
    text: despedida,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: devby,
        sourceUrl: 'makima-bot/',
        mediaType: 1,
        renderLargerThumbnail: true,
        thumbnailUrl: bannerFinal
      }
    }
  })
}

// COMANDO #bye (activar/desactivar)
const handler = async (m, { conn, command, args, usedPrefix, isAdmin, isOwner }) => {
  if (command === 'testbye') {
    // Test: siempre envía el mensaje, aunque esté desactivado
    let taguser = '@' + m.sender.split('@')[0]
    const { nombreBot, bannerFinal } = getBotConfig(conn)
    const devby = `${nombreBot} - TextBot`

    const despedida =
      `👋 BYE 👋\n\n` +
      `🌟 ${taguser}\n\n` +
      `💫 Esperamos verte de vuelta en este mundo mágico.\n\n` +
      `> Si necesitas ayuda, usa *#help*.`

    await conn.sendMessage(m.chat, {
      text: despedida,
      contextInfo: {
        mentionedJid: [m.sender],
        externalAdReply: {
          title: devby,
          sourceUrl: 'makima-bot/',
          mediaType: 1,
          renderLargerThumbnail: true,
          thumbnailUrl: bannerFinal
        }
      }
    })
    return
  }

  // Solo admins/owner pueden activar/desactivar
  if (!(isAdmin || isOwner)) return conn.reply(m.chat, '🤨 Solo los administradores pueden activar o desactivar la despedida.\n\n- Deja de intentar lo que nunca podrás baboso', m, rcanal)

  const chat = global.db.data.chats[m.chat]
  if (!chat) return
  let isByeEnabled = chat.bye !== undefined ? chat.bye : true

  if (args[0] === 'on' || args[0] === 'enable') {
    if (isByeEnabled) return conn.reply(m.chat, `👑 la función *bye* ya estaba *activada*.`, m, rcanal)
    isByeEnabled = true
  } else if (args[0] === 'off' || args[0] === 'disable') {
    if (!isByeEnabled) return conn.reply(m.chat, `👑 la función *bye* ya estaba *desactivada*.`, m, rcanal)
    isByeEnabled = false
  } else {
    return conn.reply(
      m.chat,
      `「✿」Un administrador puede activar o desactivar el *bye* utilizando:\n\n● _Activar_ » *${usedPrefix}${command} enable*\n● _Desactivar_ » *${usedPrefix}${command} disable*\n\n✎ Estado actual » *${isByeEnabled ? '✓ Activado' : '✗ Desactivado'}*`,
      m
    )
  }

  chat.bye = isByeEnabled
  return conn.reply(m.chat, `la función *despedida* fue *${isByeEnabled ? 'activada' : 'desactivada'}* para este grupo.`, m, rcanal)
}

handler.help = ['bye', 'testbye']
handler.tags = ['group']
handler.command = ['bye', 'testbye']
handler.group = true

export default handler