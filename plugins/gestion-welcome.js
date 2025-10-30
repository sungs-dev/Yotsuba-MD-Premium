import fs from 'fs'
import { join } from 'path'

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

// ENVÍO DE BIENVENIDA AUTOMÁTICA (evento de unión)
export async function sendWelcome(conn, m) {
  const chat = global.db.data.chats[m.chat]
  const isWelcomeEnabled = chat && typeof chat.welcome !== 'undefined' ? chat.welcome : true
  if (!isWelcomeEnabled) return

  let taguser = '@' + m.sender.split('@')[0]
  const { nombreBot, bannerFinal } = getBotConfig(conn)
  const devby = `${nombreBot}, ${textbot}`

  const bienvenida =
    `👑 WELCOME 👑\n\n` +
    `🌟 ${taguser}\n\n` +
    `💫 Esperamos disfrutes tu estadía en este mundo mágico.\n\n` +
    `> Usa *#help* para ver mi magia.`

  await conn.sendMessage(m.chat, {
    text: bienvenida,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: devby,
        sourceUrl: 'https://whatsapp.com/',
        mediaType: 1,
        renderLargerThumbnail: true,
        thumbnailUrl: bannerFinal
      }
    }
  })
}

// COMANDO TESTWELCOME
const handler = async (m, { conn, command }) => {
  if (command !== 'testwelcome') return

  let taguser = '@' + m.sender.split('@')[0]
  const { nombreBot, bannerFinal } = getBotConfig(conn)
  const devby = `${nombreBot}, ${textbot}`

  const bienvenida =
    `👑 WELCOME 👑\n\n` +
    `🌟 ${taguser}\n\n` +
    `💫 Esperamos disfrutes tu estadía en este mundo mágico.\n\n` +
    `> Usa *#help* para ver mi magia.`

  await conn.sendMessage(m.chat, {
    text: bienvenida,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: devby,
        sourceUrl: 'https://whatsapp.com/',
        mediaType: 1,
        renderLargerThumbnail: true,
        thumbnailUrl: bannerFinal
      }
    }
  })
}

handler.help = ['testwelcome']
handler.tags = ['group']
handler.command = ['testwelcome']
handler.group = true

export default handler