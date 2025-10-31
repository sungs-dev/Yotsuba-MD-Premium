import fs from 'fs'
import path from 'path'

/**
 * primarys-bots.js
 *
 * Comandos:
 *  - #addprimary @bot   -> mueve la sesión de ./JadiBots/<num>  -> ./Session/<num>
 *  - #dprimary @bot     -> mueve la sesión de ./Session/<num>  -> ./JadiBots/<num>
 *  - #primarys          -> lista todas las sesiones en ./Session (menciones)
 *
 * Restricción: SOLO el/los owner(s) puede(n) usar estos comandos.
 *
 * Nota:
 *  - Detecta al bot objetivo mediante m.mentionedJid[0] o respondiendo al mensaje del bot (m.quoted.sender).
 *  - Si no existe la carpeta de sesión en el origen, informa el estado.
 */

const SESSIONS_DIR = './Session'
const SUBS_DIR = './JadiBots'

const ensureDir = (p) => {
  try {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
  } catch (e) {}
}

const readSessionName = (number) => {
  try {
    const configPath = path.join(SESSIONS_DIR, number, 'config.json')
    if (!fs.existsSync(configPath)) return null
    const cfg = JSON.parse(fs.readFileSync(configPath))
    return cfg?.name || null
  } catch (e) {
    return null
  }
}

const readSubName = (number) => {
  try {
    const configPath = path.join(SUBS_DIR, number, 'config.json')
    if (!fs.existsSync(configPath)) return null
    const cfg = JSON.parse(fs.readFileSync(configPath))
    return cfg?.name || null
  } catch (e) {
    return null
  }
}

const moveFolder = async (from, to) => {
  return new Promise((resolve, reject) => {
    try {
      ensureDir(path.dirname(to))
      fs.rename(from, to, (err) => {
        if (err) return reject(err)
        resolve(true)
      })
    } catch (e) {
      reject(e)
    }
  })
}

const getOwnerJids = () => {
  if (!global.owner) return []
  if (Array.isArray(global.owner)) return global.owner.map(v => v.includes('@') ? v : `${v}@s.whatsapp.net`)
  return [(global.owner.includes('@') ? global.owner : `${global.owner}@s.whatsapp.net`)]
}

let handler = async (m, { conn, command }) => {
  // Permiso: sólo owner(s)
  const ownerJids = getOwnerJids()
  if (!ownerJids.includes(m.sender)) {
    return conn.sendMessage(m.chat, { text: '❌ Este comando solo puede ser usado por el creador/owner del bot.' }, { quoted: m })
  }

  ensureDir(SESSIONS_DIR)
  ensureDir(SUBS_DIR)

  const cmd = command.toLowerCase()
  // obtener target jid: mencionado o respondido
  let targetJid = null
  if (m.mentionedJid && m.mentionedJid.length) targetJid = m.mentionedJid[0]
  else if (m.quoted && m.quoted.sender) targetJid = m.quoted.sender
  else {
    // intentar extraer de texto (#addprimary 12345)
    const parts = (m.text || '').trim().split(/\s+/)
    if (parts[1] && /\d+/.test(parts[1])) {
      const num = parts[1].replace(/\D/g, '')
      const domain = conn.user?.jid?.split('@')[1] || 's.whatsapp.net'
      targetJid = `${num}@${ (cmd === 'addprimary') {
      if (!targetJid) return conn.sendMessage(m.chat, { text: 'Menciona o responde al bot que quieres convertir en Principal.' }, { quoted: m })
      const number = targetJid.split('@')[0].replace(/\D/g, '')
      if (!number) return conn.sendMessage(m.chat, { text: 'No pude identificar el número del bot.' }, { quoted: m })

      const src = path.join(SUBS_DIR, number)
      const dest = path.join(SESSIONS_DIR, number)

      if (fs.existsSync(dest)) return conn.sendMessage(m.chat, { text: `Ese bot ya es Principal.` }, { quoted: m })
      if (!fs.existsSync(src)) return conn.sendMessage(m.chat, { text: `No se encontró la sesión en ${SUBS_DIR} para ese bot.` }, { quoted: m })

      await moveFolder(src, dest)
      const name = readSessionName(number) || readSubName(number) || `${number}`
      return conn.sendMessage(m.chat, { text: `✅ @${number} ahora es Principal (${name}).`, mentions: [`${number}@${domain}`] }, { quoted: m })
    }

    if (cmd === 'dprimary') {
      if (!targetJid) return conn.sendMessage(m.chat, { text: 'Menciona o responde al bot Principal que quieres quitar.' }, { quoted: m })
      const number = targetJid.split('@')[0].replace(/\D/g, '')
      if (!number) return conn.sendMessage(m.chat, { text: 'No pude identificar el número del bot.' }, { quoted: m })

      const src = path.join(SESSIONS_DIR, number)
      const dest = path.join(SUBS_DIR, number)

      if (fs.existsSync(dest)) return conn.sendMessage(m.chat, { text: `Ese bot ya es Sub-Bot.` }, { quoted: m })
      if (!fs.existsSync(src)) return conn.sendMessage(m.chat, { text: `No se encontró la sesión en ${SESSIONS_DIR} para ese bot.` }, { quoted: m })

      await moveFolder(src, dest)
      const name = readSubName(number) || readSessionName(number) || `${number}`
      return conn.sendMessage(m.chat, { text: `✅ @${number} fue removido como Principal y ahora es Sub-Bot (${name}).`, mentions: [`${number}@${domain}`] }, { quoted: m })
    }

    if (cmd === 'primarys') {
      // listar todas las carpetas dentro de ./Session
      const items = fs.existsSync(SESSIONS_DIR) ? fs.readdirSync(SESSIONS_DIR, { withFileTypes: true }) : []
      const dirs = items.filter(i => i.isDirectory()).map(d => d.name)
      if (!dirs.length) return conn.sendMessage(m.chat, { text: 'No hay bots principales registrados.' }, { quoted: m })

      let txt = `📜 Lista de Bots Principales (${dirs.length}):\n\n`
      const mentions = []
      for (let num of dirs) {
        const name = readSessionName(num) || `#${num}`
        const jid = `${num}@${domain}`
        txt += `• ${name} » @${num}\n`
        mentions.push(jid)
      }
      return conn.sendMessage(m.chat, { text: txt, mentions }, { quoted: m })
    }
  } catch (e) {
    console.error(e)
    return conn.sendMessage(m.chat, { text: 'Ocurrió un error al ejecutar la operación.' }, { quoted: m })
  }
}

handler.command = /^(addprimary|dprimary|primarys)$/i
handler.group = false
handler.owner = true

export default handler