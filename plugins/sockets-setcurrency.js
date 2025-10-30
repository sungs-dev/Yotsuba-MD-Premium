import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`👑 Formato erróneo. Cambia mi nombre asi:\n\n- #setcurrency + <nueva_moneda>`)

  const senderNumber = m.sender.replace(/[^0-9]/g, '')
  const botPath = path.join('./JadiBots', senderNumber)
  const configPath = path.join(botPath, 'config.json')

  if (!fs.existsSync(botPath)) {
    return m.reply('❖ El comando *setname* solo puede ser usado por el dueño del número del *bot.*')
  }

  let config = {}


  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath))
    } catch (e) {
      return m.reply('😔 *Error* al leer la moneda.')
    }
  }


  config.currency = text.trim()

  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
    m.reply(`💜 La moneda de tu session fue actualizada a *${text.trim()}*`)
  } catch (err) {
    console.error(err)
    m.reply('😔 Ocurrió un error al guardar el nombre.')
  }
}

handler.help = ['setcurrency']
handler.tags= ['sockets']
handler.command = /^setcurrency$/i
handler.owner = false // solo el dueño puede usar esto

export default handler