import fs from 'fs'
import { join } from 'path'
import { WAMessageStubType } from '@whiskeysockets/baileys'

// Función para obtener nombre y banner del bot según la sesión/config
function getBotConfig(conn) {
  let nombreBot = typeof botname !== 'undefined' ? botname : 'Yotsuba Nakano IA'
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

// envío real de bienvenida (usado por el comando testwelcome y por el evento)
async function sendWelcomeTo(conn, chatId, userId) {
  try {
    const chat = global.db.data.chats?.[chatId]
    const isWelcomeEnabled = chat && typeof chat.welcome !== 'undefined' ? chat.welcome : true
    if (!isWelcomeEnabled) return

    const taguser = '@' + (userId || '').split('@')[0]
    const { nombreBot, bannerFinal } = getBotConfig(conn)
    const devby = `${nombreBot}, ${typeof textbot !== 'undefined' ? textbot : ''}`

    const bienvenida =
      `👑 WELCOME 👑\n\n` +
      `🌟 ${taguser}\n\n` +
      `💫 Esperamos disfrutes tu estadía en este mundo mágico.\n\n` +
      `> Usa *#help* para ver mi magia.`

    await conn.sendMessage(chatId, {
      text: bienvenida,
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
    console.error('sendWelcomeTo error:', e)
  }
}

// compatibilidad: exportar sendWelcome como estaba en tu código original
export async function sendWelcome(conn, m) {
  try {
    // m puede venir desde el comando testwelcome (m.sender) o desde un evento (messageStubParameters)
    const chatId = m.chat
    const userId = m.sender || (m.messageStubParameters && m.messageStubParameters[0])
    if (!chatId || !userId) return
    await sendWelcomeTo(conn, chatId, userId)
  } catch (e) {
    console.error('sendWelcome wrapper error:', e)
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

    // solo procesar si welcome está activado (por defecto true)
    const isWelcomeEnabled = typeof chat.welcome !== 'undefined' ? chat.welcome : true
    if (!isWelcomeEnabled) return true

    // evento: usuario agregado
    if (m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD) {
      const userId = m.messageStubParameters?.[0]
      if (!userId) return true

      // obtener groupMetadata si no fue pasado
      const gm = groupMetadata || (await conn.groupMetadata?.(m.chat).catch(() => null)) || {}
      // enviar usando la función que respeta la configuración y el banner del bot
      await sendWelcomeTo(conn, m.chat, userId)
      return false // detener procesamiento adicional si se desea
    }

    return true
  } catch (err) {
    console.error('welcome handler.before error:', err)
    return true
  }
}

// comando de prueba (testwelcome) para enviar la bienvenida manualmente
const cmdHandler = async (m, { conn, command }) => {
  if (command !== 'testwelcome') return
  const userId = m.sender
  await sendWelcomeTo(conn, m.chat, userId)
}

cmdHandler.help = ['testwelcome']
cmdHandler.tags = ['group']
cmdHandler.command = ['testwelcome']
cmdHandler.group = true

// export default handler con before + propiedades del comando de prueba
const exported = handler
exported.help = cmdHandler.help
exported.tags = cmdHandler.tags
exported.command = cmdHandler.command
exported.group = true

export default exported