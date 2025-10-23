import { webp2png } from '../lib/webp2mp4.js'
let handler = async (m, { conn, usedPrefix, command }) => {
const notStickerMessage = `*ᐛ👑* Responde a un *Sticker encantado* para convertirlo en una hermosa imagen.`
if (!m.quoted) return conn.reply(m.chat, notStickerMessage, m, fake)
const q = m.quoted || m
let mime = q.mediaType || ''
if (!/sticker/.test(mime)) return conn.reply(m.chat, notStickerMessage, m, rcanal)
await m.react('🕓')
try {
let media = await q.download()
let out = await webp2png(media).catch(_ => null) || Buffer.alloc(0)
await conn.sendFile(m.chat, out, 'thumbnail.jpg', listo, m, fake)
await m.react('👑')
} catch {
await m.react('✖️')
}}
handler.help = ['toimg *<sticker>*']
handler.tags = ['sticker', 'tools']
handler.command = ['toimg', 'jpg', 'aimg'] 

export default handler