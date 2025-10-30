import fs from 'fs'
import { join } from 'path'

// Este handler debe ejecutarse cuando alguien se une al grupo
// Ejemplo: en tu evento group-participants-update cuando action === 'add'

export async function sendWelcome(conn, m) {
  // ACCESO a la config centralizada
  const chat = global.db.data.chats[m.chat]
  // Aquí gestion-config.js controla el estado de bienvenida
  const isWelcomeEnabled = chat && typeof chat.welcome !== 'undefined' ? chat.welcome : true
  if (!isWelcomeEnabled) return // NO envía mensaje si está desactivado

  let taguser = '@' + m.sender.split('@')[0]

  let nombreBot = typeof botname !== 'undefined' ? botname : 'Yotsuba Nakano'
  let bannerFinal = 'https://files.catbox.moe/cx0mbi.jpg'

  // Config personalizada por bot
  const botActual = conn.user?.jid?.split('@')[0]?.replace(/\D/g, '')
  const configPath = join('./JadiBots', botActual || '', 'config.json')
  if (botActual && fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath))
      if (config.name) nombreBot = config.name
      if (config.banner) bannerFinal = config.banner
    } catch {}
  }

  const devby = `${nombreBot} - TextBot`
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
        sourceUrl: 'https://whatsapp.com/channel/0029VbAa5sNCsU9Hlzsn651S',
        mediaType: 1,
        renderLargerThumbnail: true,
        thumbnailUrl: bannerFinal
      }
    }
  }, { quoted: m })
}