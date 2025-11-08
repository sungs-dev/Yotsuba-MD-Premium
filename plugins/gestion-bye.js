import fs from 'fs'
import { join } from 'path'
import { WAMessageStubType } from '@whiskeysockets/baileys'

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

// envío real de despedida (usado por el comando testbye y por el evento)
async function sendByeTo(conn, chatId, userId) {
  try {
    const chat = global.db.data.chats?.[chatId]
    // Activado por defecto si nunca se configuró
    const isByeEnabled = chat && chat.bye !== undefined ? chat.bye : true
    if (!isByeEnabled) return

    const taguser = '@' + (userId || '').split('@')[0]
    const { nombreBot, bannerFinal } = getBotConfig(conn)
    const devby = `${nombreBot}, ${typeof textbot !== 'undefined' ? textbot : ''}`

    const despedida =
      `👋 BYE 👋\n\n` +
      `🌟 ${taguser}\n\n` +
      `💫 Esperamos verte de vuelta en este mundo mágico.\n\n` +
      `> Si necesitas ayuda, usa *#help*.`

    await conn.sendMessage(chatId, {
      text: despedida,
      contextInfo: {
        mentionedJid: [userId],
        externalAdReply: {
          title: devby,
          sourceUrl: 'https://whatsapp.com/',
          mediaType: 1,
          renderLargerThumbnail: true,
          thumbnailUrl: bannerFinal
        }
      }
    })
  } catch (e) {
    console.error('sendByeTo error:', e)
  }
}

// compatibilidad: exportar sendBye como estaba en tu código original
export async function sendBye(conn, m) {
  try {
    const chatId = m.chat
    const userId = m.sender || (m.messageStubParameters && m.messageStubParameters[0])
    if (!chatId || !userId) return
    await sendByeTo(conn, chatId, userId)
  } catch (e) {
    console.error('sendBye wrapper error:', e)
  }
}

// handler que escucha eventos de participantes (se ejecuta antes de procesar mensajes normales)
let handler = m => m

handler.before = async function (m, { conn, groupMetadata }) {
  try {
    if (!m.messageStubType || !m.isGroup) return true

    const chat = global.db.data.chats?.[m.chat]
    if (!chat) return true

    // si el grupo tiene primaryBot definido y no es este, no procesar
    const primaryBot = chat.primaryBot
    if (primaryBot && conn.user?.jid !== primaryBot) return false

    // solo procesar si bye está activado (por defecto true)
    const isByeEnabled = typeof chat.bye !== 'undefined' ? chat.bye : true
    if (!isByeEnabled) return true

    // evento: usuario eliminado/abandonó
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_REMOVE || m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_LEAVE) {
      const userId = m.messageStubParameters?.[0]
      if (!userId) return true

      // obtener groupMetadata si no fue pasado
      const gm = groupMetadata || (await conn.groupMetadata?.(m.chat).catch(() => null)) || {}

      await sendByeTo(conn, m.chat, userId)
      return false
    }

    return true
  } catch (err) {
    console.error('bye handler.before error:', err)
    return true
  }
}

// COMANDO #bye (activar/desactivar) y testbye. Mantengo la lógica original y permisos.
const cmdHandler = async (m, { conn, command, args, usedPrefix, isAdmin, isOwner }) => {
  if (command === 'testbye') {
    // Test: siempre envía el mensaje, aunque esté desactivado
    await sendByeTo(conn, m.chat, m.sender)
    return
  }

  if (command !== 'bye') return

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
      `👑 Los admins pueden activar o desactivar la función *${command}* utilizando:\n\n💜 *${command}* enable\n💜 *${command}* disable\n\n🛠 Estado actual » *${isByeEnabled ? '✓ Activado' : '✗ Desactivado'}*`,
      m
    )
  }

  chat.bye = isByeEnabled
  return conn.reply(m.chat, `la función *despedida* fue *${isByeEnabled ? 'activada' : 'desactivada'}* para este grupo.`, m, rcanal)
}

cmdHandler.help = ['bye', 'testbye']
cmdHandler.tags = ['group']
cmdHandler.command = ['bye', 'testbye']
cmdHandler.group = true

const exported = handler
exported.help = cmdHandler.help
exported.tags = cmdHandler.tags
exported.command = cmdHandler.command
exported.group = true

export default exported