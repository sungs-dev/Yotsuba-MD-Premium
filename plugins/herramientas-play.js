import fetch from "node-fetch"
import yts from 'yt-search'

const handler = async (m, { conn, text, usedPrefix, command }) => {
try {
if (!text.trim()) return conn.reply(m.chat, `*ᐛ👑* Dime el nombre de la música encantada que quieres que busque.`, m, rcanal)
await m.react('🕒')
const videoMatch = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : text
const search = await yts(query)
const result = videoMatch ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] : search.all[0]
if (!result) throw 'ꕥ No se encontraron resultados.'
const { title, thumbnail, timestamp, views, ago, url, author, seconds } = result
if (seconds > 1800) throw '*😿 Solo puedo procesar cosas de 10 minutos o menos.*'
const vistas = formatViews(views)
const info = `💜 Estoy Procesando *${title}* del canal *${author.name}*.\n\n- Si quieres verlo más tarde búscalo en *${url}*`
const thumb = (await conn.getFile(thumbnail)).data
await conn.sendMessage(m.chat, { image: thumb, caption: info }, { quoted: m })
if (['play', 'yta', 'ytmp3', 'playaudio'].includes(command)) {
const audio = await getAud(url)
if (!audio?.url) throw '⚠ No se pudo obtener el audio.'
m.reply(`👑 Busque tu petición en el reino de \`Itsuki Nakano\``)
await conn.sendMessage(m.chat, { audio: { url: audio.url }, fileName: `${title}.mp3`, mimetype: 'audio/mpeg' }, { quoted: m })
await m.react('✔️')
} else if (['play2', 'ytv', 'ytmp4', 'mp4'].includes(command)) {
const video = await getVid(url)
if (!video?.url) throw '⚠ No se pudo obtener el video.'
m.reply(`> 👑 Busque tu petición el en Reino de \`Miku Nakano\``)
await conn.sendFile(m.chat, video.url, `Aqui ta XD`, `🌟`, m, rcanal)
await m.react('✔️')
}} catch (e) {
await m.react('✖️')
return conn.reply(m.chat, typeof e === 'string' ? e : 'Error:' + e.message, m)
}}

handler.command = handler.help = ['play', 'yta', 'ytmp3', 'play2', 'ytv', 'ytmp4', 'playaudio', 'mp4']
handler.tags = ['descargas']
handler.group = true

export default handler

async function getAud(url) {
const apis = [
{ api: 'ZenzzXD', endpoint: `${global.APIs.zenzxz.url}/downloader/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res.data?.download_url },
{ api: 'ZenzzXD v2', endpoint: `${global.APIs.zenzxz.url}/downloader/ytmp3v2?url=${encodeURIComponent(url)}`, extractor: res => res.data?.download_url },
{ api: 'Yupra', endpoint: `${global.APIs.yupra.url}/api/downloader/ytmp3?url=${encodeURIComponent(url)}`, extractor: res => res.result?.link },
{ api: 'Vreden', endpoint: `${global.APIs.vreden.url}/api/v1/download/youtube/audio?url=${encodeURIComponent(url)}&quality=128`, extractor: res => res.result?.download?.url },
{ api: 'Vreden v2', endpoint: `${global.APIs.vreden.url}/api/v1/download/play/audio?query=${encodeURIComponent(url)}`, extractor: res => res.result?.download?.url },
{ api: 'Xyro', endpoint: `${global.APIs.xyro.url}/download/youtubemp3?url=${encodeURIComponent(url)}`, extractor: res => res.result?.download }
]
return await fetchFromApis(apis)
}
async function getVid(url) {
const apis = [
{ api: 'ZenzzXD', endpoint: `${global.APIs.zenzxz.url}/downloader/ytmp4?url=${encodeURIComponent(url)}&resolution=360p`, extractor: res => res.data?.download_url },
{ api: 'ZenzzXD v2', endpoint: `${global.APIs.zenzxz.url}/downloader/ytmp4v2?url=${encodeURIComponent(url)}&resolution=360`, extractor: res => res.data?.download_url },
{ api: 'Yupra', endpoint: `${global.APIs.yupra.url}/api/downloader/ytmp4?url=${encodeURIComponent(url)}`, extractor: res => res.result?.formats?.[0]?.url },
{ api: 'Vreden', endpoint: `${global.APIs.vreden.url}/api/v1/download/youtube/video?url=${encodeURIComponent(url)}&quality=360`, extractor: res => res.result?.download?.url },
{ api: 'Vreden v2', endpoint: `${global.APIs.vreden.url}/api/v1/download/play/video?query=${encodeURIComponent(url)}`, extractor: res => res.result?.download?.url },
{ api: 'Xyro', endpoint: `${global.APIs.xyro.url}/download/youtubemp4?url=${encodeURIComponent(url)}&quality=360`, extractor: res => res.result?.download }
]
return await fetchFromApis(apis)
}
async function fetchFromApis(apis) {
for (const { api, endpoint, extractor } of apis) {
try {
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 10000)
const res = await fetch(endpoint, { signal: controller.signal }).then(r => r.json())
clearTimeout(timeout)
const link = extractor(res)
if (link) return { url: link, api }
} catch (e) {}
await new Promise(resolve => setTimeout(resolve, 500))
}
return null
}
function formatViews(views) {
if (views === undefined) return "No disponible"
if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B (${views.toLocaleString()})`
if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M (${views.toLocaleString()})`
if (views >= 1_000) return `${(views / 1_000).toFixed(1)}k (${views.toLocaleString()})`
return views.toString()
}