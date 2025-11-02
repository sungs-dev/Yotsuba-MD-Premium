import { sticker } from '../lib/sticker.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'
import { webp2png } from '../lib/webp2mp4.js'
import fs from 'fs'
import path from 'path'

const readSessionConfig = (conn) => {
  try {
    const botId = conn.user?.jid?.split('@')[0]?.replace(/\D/g, '')
    if (!botId) return {}
    const configPath = path.join('./JadiBots', botId, 'config.json')
    if (!fs.existsSync(configPath)) return {}
    return JSON.parse(fs.readFileSync(configPath))
  } catch (e) {
    return {}
  }
}

let handler = async (m, { conn, args }) => {
  let stiker = false
  let userId = m.sender
  let packstickers = global.db.data.users[userId] || {}
  // texto1: pack name (fallback to global)
  let texto1 = packstickers.text1 || global.packsticker || '⊹ 🐬 Deymoon🧠 Club\n↳ Deymoon.club\n\n👹 Info:\n deymoon-club.vercel.app'
  // determine nombreBot from session config or global
  const cfg = readSessionConfig(conn)
  const nombreBot = cfg?.name || global.botname || cfg?.currency || 'Bot'
  // determine username (display name)
  let username = m.pushName || userId.split('@')[0]
  try { username = await conn.getName(userId) || username } catch (e) {}
  // texto2: author/credit string as requested (fallback to user's saved text2)
  let texto2 = packstickers.text2 || `⊹ 👑Bot:\n⊹ ↳ @${nombreBot}\n\n👑 Usuario:\n⊹ ↳ @${username}`

  // ensure rcanal context exists to avoid undefined reference
  const _rc = (typeof rcanal !== 'undefined') ? rcanal : {}

  try {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    let txt = args.join(' ')
    if (/webp|image|video/g.test(mime) && q.download) {
      if (/video/.test(mime) && (q.msg || q).seconds > 16)
        return conn.reply(m.chat, '*🌟 El video supera el límite de 15 segundos amigo.*', m, _rc)
      let buffer = await q.download()
      await m.react('💫')
      let marca = txt ? txt.split(/[\u2022|]/).map(part => part.trim()) : [texto1, texto2]
      stiker = await sticker(buffer, false, marca[0], marca[1])
    } else if (args[0] && isUrl(args[0])) {
      let buffer = await sticker(false, args[0], texto1, texto2)
      stiker = buffer
    } else {
      return conn.reply(m.chat, '*💜 Envía una imagen o video para crear tu sticker encantado.*', m, _rc)
    }
  } catch (e) {
    await conn.reply(m.chat, '😿 Error: ' + (e.message || e), m, _rc)
    try { await m.react('✖️') } catch {}
  } finally {
    if (stiker) {
      // send sticker file (some frameworks accept sendFile)
      try {
        await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
        await m.react('🌟')
      } catch (e) {
        // fallback to sendMessage if sendFile not available
        await conn.sendMessage(m.chat, { sticker: stiker }, { quoted: m }).catch(()=>{})
      }
    }
  }
}

handler.help = ['sticker']
handler.tags = ['sticker']
handler.command = ['s', 'sticker']
handler.group = true

export default handler

const isUrl = (text) => {
  return text?.match?.(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)(jpe?g|gif|png)/, 'gi'))
}