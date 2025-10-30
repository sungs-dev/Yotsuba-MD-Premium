import fs from 'fs'
import { join } from 'path'
import fetch from 'node-fetch'

const handler = async (m, { conn }) => {
  // Obtener el ID del bot y la ruta de configuración de la sesión
  const botActual = conn.user?.jid?.split('@')[0]?.replace(/\D/g, '')
  const configPath = join('./JadiBots', botActual || '', 'config.json')

  // Valores por defecto
  let ncurrency = 'Test'
  let bannerFinal = 'https://qu.ax/zRNgk.jpg'

  // Leer nombre/banner desde la config de la sesión si existe
  if (botActual && fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath))
      if (config.currency) ncurrency = config.currency
      if (config.banner) bannerFinal = config.banner
    } catch (e) {
      // ignore
    }
  }

  // Construir texto de prueba (puedes usar ${uptime} o ${p} en otras plantillas si los defines)
  const text = `la moneda es ${ncurrency}`

  // Preparar thumbnail (si falla se deja null)
  let thumbnail = null
  try {
    const res = await fetch(bannerFinal)
    thumbnail = await res.buffer()
  } catch (e) {
    thumbnail = null
  }

  // Usar channelRD global si existe para simular mensaje de canal
  const newsletterJid = (global.channelRD && global.channelRD.id) ? global.channelRD.id : '0@s.whatsapp.net'
  const newsletterName = (global.channelRD && global.channelRD.name) ? global.channelRD.name : nombreBot

  // Enviar mensaje con contexto de canal (forwarded newsletter) y externalAdReply
  await conn.sendMessage(m.chat, {
    text,
    contextInfo: {
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid,
        serverMessageId: '',
        newsletterName
      },
      externalAdReply: {
        title: nombreBot,
        body: (global.textbot) ? global.textbot : '',
        mediaType: 1,
        mediaUrl: (global.redes) ? global.redes : '',
        sourceUrl: (global.redes) ? global.redes : '',
        thumbnail: thumbnail, // puede ser null
        showAdAttribution: false,
        containsAutoReply: true,
        renderLargerThumbnail: true
      }
    }
  })
}

handler.help = ['test']
handler.tags = ['sockets']
handler.command = ['test'] // usar con #test (según tu prefijo)
handler.rowner = false

export default handler