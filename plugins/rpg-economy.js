import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

/**
 * Economy plugin (sin setname / setcurrency / setbanner / test)
 * Comandos soportados:
 *  - daily, cofre           (cooldown 24h)
 *  - minar                 (cooldown 24 minutos)
 *  - crime / crimen
 *  - rob  (roba EXP)       (cooldown 1h)
 *  - rob2 (roba moneda)    (cooldown 1h)
 *  - d / deposit / depositar  (depositar all o cantidad)
 *  - bal                   (ver saldo de usuario, reply/mention o propio)
 *  - baltop <page?>        (top por grupo, 10 por página, solo en grupos)
 *  - lvl                   (subir de nivel si tiene >= 1000 exp)
 *
 * Todas las respuestas se envían "como si vinieran del canal" usando:
 *  - contextInfo.isForwarded = true
 *  - contextInfo.forwardedNewsletterMessageInfo
 *  - contextInfo.externalAdReply (thumbnail pequeña => renderLargerThumbnail: false)
 *
 * Usa global.db.data.users con campos:
 *  exp, money, bank, level, lastDaily, lastCofre, lastMinar, lastRob, lastRob2
 */

// helpers
const toMs = (h = 0, m = 0, s = 0) => ((h * 3600) + (m * 60) + s) * 1000
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pad = v => String(v).padStart(2, '0')
const formatClock = ms => {
  if (!ms || isNaN(ms)) return '00:00:00'
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}
const formatDelta = ms => {
  if (!ms || ms <= 0) return '00:00:00'
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const parts = []
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' : ')
}

const ensureDB = () => {
  if (!global.db) global.db = { data: { users: {} } }
  if (!global.db.data) global.db.data = { users: {} }
  if (!global.db.data.users) global.db.data.users = {}
}

const ensureUser = (jid) => {
  ensureDB()
  if (!global.db.data.users[jid]) {
    global.db.data.users[jid] = {
      exp: 0,
      money: 0,
      bank: 0,
      level: 1,
      lastDaily: 0,
      lastCofre: 0,
      lastMinar: 0,
      lastRob: 0,
      lastRob2: 0
    }
  }
  return global.db.data.users[jid]
}

const readSessionConfig = (conn) => {
  const botActual = conn.user?.jid?.split('@')[0]?.replace(/\D/g, '')
  const configPath = path.join('./JadiBots', botActual || '', 'config.json')
  let config = {}
  try {
    if (botActual && fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath))
    }
  } catch (e) { config = {} }
  return { config, configPath }
}

const getThumbnailBuffer = async (url) => {
  try {
    const res = await fetch(url)
    return await res.buffer()
  } catch (e) {
    return null
  }
}

let handler = async (m, { conn, text = '', usedPrefix = '#', command = '' }) => {
  const cmd = (command || '').toLowerCase()
  ensureDB()

  // session config (currency and banner)
  const { config } = readSessionConfig(conn)
  const currency = config?.currency || 'Coins'
  const banner = config?.banner || 'https://qu.ax/zRNgk.jpg'
  const thumbnail = await getThumbnailBuffer(banner).catch(() => null)

  // channel simulation info
  const newsletterJid = global.channelRD?.id || '0@s.whatsapp.net'
  const newsletterName = global.channelRD?.name || (config?.name || currency)

  const sendAsChannel = async (chat, params, extra = {}) => {
    params.contextInfo = params.contextInfo || {}
    params.contextInfo.isForwarded = true
    params.contextInfo.forwardedNewsletterMessageInfo = {
      newsletterJid,
      serverMessageId: '',
      newsletterName
    }
    // externalAdReply: use thumbnail but set renderLargerThumbnail:false to make it appear small/boxed
    params.contextInfo.externalAdReply = {
      title: newsletterName,
      body: global.textbot || '',
      mediaType: 1,
      mediaUrl: global.redes || '',
      sourceUrl: global.redes || '',
      thumbnail,
      showAdAttribution: false,
      containsAutoReply: true,
      renderLargerThumbnail: false
    }
    return conn.sendMessage(chat, params, extra)
  }

  const getTargetJid = () => {
    if (m.quoted && m.quoted.sender) return m.quoted.sender
    if (m.mentionedJid && m.mentionedJid[0]) return m.mentionedJid[0]
    if (text && /\d+@\w+/.test(text)) return text.trim().split(/\s+/)[0]
    return null
  }

  try {
    switch (cmd) {
      /* ---------------- SETTERS (no están aquí según tu petición) ----------------
         sockets-setname.js, sockets-setcurrency.js, sockets-setbanner.js deben manejar esto
      -------------------------------------------------------------------------- */

      /* ---------------- DAILY / COFRE (24h) ---------------- */
      case 'daily':
      case 'cofre': {
        const who = m.sender
        const u = ensureUser(who)
        const key = cmd === 'daily' ? 'lastDaily' : 'lastCofre'
        const cd = toMs(24, 0, 0)
        const now = Date.now()
        if (now - (u[key] || 0) < cd) {
          const rem = (u[key] || 0) + cd - now
          return sendAsChannel(m.chat, { text: `👑 Vuelve en ${formatDelta(rem)}` }, { quoted: m })
        }
        const amount = randInt(1, 999)
        u.money = (u.money || 0) + amount
        u[key] = now
        return sendAsChannel(m.chat, {
          text: `👑 Reclamante tu *${cmd === 'daily' ? 'recompensa diaria' : 'cofre de hoy'}.* Recursos:\n\n💜 *${currency}:* ${amount}`
        }, { quoted: m })
      }

      /* ---------------- MINAR (24 minutos) ---------------- */
      case 'minar': {
        const who = m.sender
        const u = ensureUser(who)
        const cd = toMs(0, 24, 0) // 24 minutos
        const now = Date.now()
        if (now - (u.lastMinar || 0) < cd) {
          const rem = (u.lastMinar || 0) + cd - now
          return sendAsChannel(m.chat, { text: `👑 Debes esperar *${formatDelta(rem)}* para minar de nuevo.` }, { quoted: m })
        }
        const addExp = randInt(1, 49)
        const addMoney = randInt(1, 99)
        u.exp = (u.exp || 0) + addExp
        u.money = (u.money || 0) + addMoney
        u.lastMinar = now
        return sendAsChannel(m.chat, {
          text: `👑 Estabas minando. Recursos:\n\n💫 *Exp:* ${addExp}\n💜 *${currency}:* ${addMoney}`
        }, { quoted: m })
      }

      /* ---------------- CRIME / CRIMEN ---------------- */
      case 'crime':
      case 'crimen': {
        const who = m.sender
        const u = ensureUser(who)
        const gained = randInt(1, 99)
        u.money = (u.money || 0) + gained
        return sendAsChannel(m.chat, { text: `🌟 Cometiste tu crime de hoy en un banco y obtuviste *${gained} ${currency}*` }, { quoted: m })
      }

      /* ---------------- ROB / ROB2 (1 hora): rob -> EXP, rob2 -> monedas ---------------- */
      case 'rob':
      case 'rob2': {
        const who = m.sender
        const u = ensureUser(who)
        const now = Date.now()
        const cdKey = cmd === 'rob' ? 'lastRob' : 'lastRob2'
        const cd = toMs(1, 0, 0) // 1 hora
        if (now - (u[cdKey] || 0) < cd) {
          const rem = (u[cdKey] || 0) + cd - now
          return sendAsChannel(m.chat, { text: `👑 Debes esperar *${formatDelta(rem)}* para usar *${cmd}*` }, { quoted: m })
        }
        const target = getTargetJid()
        if (!target) return sendAsChannel(m.chat, { text: '👑 Dime a quien quieres robar.' }, { quoted: m })
        if (target === who) return sendAsChannel(m.chat, { text: '👑 No puedes robarte a ti mismo.' }, { quoted: m })

        ensureUser(target)
        const victim = global.db.data.users[target]
        if (!victim) return sendAsChannel(m.chat, { text: '👑 Usuario no encontrado.' }, { quoted: m })

        if (cmd === 'rob') {
          const stolen = victim.exp || 0
          if (!stolen) return sendAsChannel(m.chat, { text: '👑 Esta persona no tiene experiencia que robar.' }, { quoted: m })
          victim.exp = 0
          u.exp = (u.exp || 0) + stolen
          u.lastRob = now
          return sendAsChannel(m.chat, { text: `👑 Le robaste ${stolen} Exp a @${target.split('@')[0]}`, mentions: [target] }, { quoted: m })
        } else {
          const stolen = victim.money || 0
          if (!stolen) return sendAsChannel(m.chat, { text: '👑 Esta persona no tiene monedas que robar.' }, { quoted: m })
          victim.money = 0
          u.money = (u.money || 0) + stolen
          u.lastRob2 = now
          return sendAsChannel(m.chat, { text: `👑 Le robaste ${stolen} ${currency} a @${target.split('@')[0]}`, mentions: [target] }, { quoted: m })
        }
      }

      /* ---------------- DEPOSITAR (d / deposit / depositar) ---------------- */
      case 'd':
      case 'deposit':
      case 'depositar': {
        const who = m.sender
        const u = ensureUser(who)
        const arg = (text || '').trim().split(/\s+/)[0] || ''
        if (!arg) return sendAsChannel(m.chat, { text: 'Formato: #d all  o  #d <cantidad>' }, { quoted: m })
        if (arg.toLowerCase() === 'all') {
          const amount = u.money || 0
          if (!amount) return sendAsChannel(m.chat, { text: '👑 No tienes nada.' }, { quoted: m })
          u.money = 0
          u.bank = (u.bank || 0) + amount
          return sendAsChannel(m.chat, { text: `💜 Depositaste ${amount} ${currency} al banco. Ya no te lo podrán robar.` }, { quoted: m })
        }
        const n = parseInt(arg)
        if (!n || n <= 0) return sendAsChannel(m.chat, { text: '👑 Cantidad inválida.' }, { quoted: m })
        if ((u.money || 0) < n) return sendAsChannel(m.chat, { text: '👑 No tienes suficiente dinero para depositar esa cantidad.' }, { quoted: m })
        u.money -= n
        u.bank = (u.bank || 0) + n
        return sendAsChannel(m.chat, { text: `💜 Depositaste ${n} ${currency} al banco. Ya no te lo podrán robar.` }, { quoted: m })
      }

      /* ---------------- BAL ---------------- */
      case 'bal': {
        const target = getTargetJid() || m.sender
        ensureUser(target)
        const u = global.db.data.users[target]
        // calcular posición en top del grupo si está en grupo
        let rankText = 'N/A'
        try {
          if (m.isGroup) {
            const meta = await conn.groupMetadata(m.chat)
            const groupJids = meta.participants.map(p => p.id)
            const arr = Object.keys(global.db.data.users)
              .filter(jid => groupJids.includes(jid))
              .map(jid => ({ jid, total: (global.db.data.users[jid].money || 0) + (global.db.data.users[jid].bank || 0) }))
              .sort((a, b) => b.total - a.total)
            const idx = arr.findIndex(x => x.jid === target)
            rankText = idx >= 0 ? String(idx + 1) : 'N/A'
          } else {
            const arr = Object.keys(global.db.data.users)
              .map(jid => ({ jid, total: (global.db.data.users[jid].money || 0) + (global.db.data.users[jid].bank || 0) }))
              .sort((a, b) => b.total - a.total)
            const idx = arr.findIndex(x => x.jid === target)
            rankText = idx >= 0 ? String(idx + 1) : 'N/A'
          }
        } catch (e) {
          rankText = 'N/A'
        }

        const out =
`👑 BAL - USER 👑

🌟 ${currency}: ${u.money || 0}
💫 Exp: ${u.exp || 0}
💜 Bank: ${u.bank || 0}

> *${nombreBot}*`

        return sendAsChannel(m.chat, { text: out, mentions: [target] }, { quoted: m })
      }

      /* ---------------- BALTOP (group only, paginado 10) ---------------- */
      case 'baltop': {
        if (!m.isGroup) return m.reply('Este comando solo puede usarse en grupos.')
        const pageArg = parseInt((text || '').trim().split(/\s+/)[0]) || 1
        const meta = await conn.groupMetadata(m.chat)
        const groupJids = meta.participants.map(p => p.id)
        const arr = Object.keys(global.db.data.users)
          .filter(jid => groupJids.includes(jid))
          .map(jid => {
            const u = global.db.data.users[jid]
            return {
              jid,
              total: (u.money || 0) + (u.bank || 0),
              money: u.money || 0,
              exp: u.exp || 0
            }
          })
          .sort((a, b) => b.total - a.total)

        if (!arr.length) return sendAsChannel(m.chat, { text: '👑 No hay usuarios en el top.' }, { quoted: m })

        const perPage = 10
        const totalPages = Math.max(1, Math.ceil(arr.length / perPage))
        const page = Math.max(1, Math.min(pageArg, totalPages))
        const start = (page - 1) * perPage
        const pageItems = arr.slice(start, start + perPage)

        let body = '``👑 TOP USUARIOS 👑``\n\n'
        const mentions = []
        pageItems.forEach((it, i) => {
          body += `💜 @${it.jid.split('@')[0]}:\n💫 ${currency}: ${it.money}\n🌟 Exp: ${it.exp}\n\n`
          mentions.push(it.jid)
        })
        body += `> Página ${page} de ${totalPages}`

        return sendAsChannel(m.chat, { text: body, mentions }, { quoted: m })
      }

      /* ---------------- LVL (gasta 1000 exp para subir 1 nivel) ---------------- */
      case 'lvl': {
        const who = m.sender
        const u = ensureUser(who)
        if ((u.exp || 0) < 1000) {
          return sendAsChannel(m.chat, { text: '🌟 No tienes suficientes Experiencia para subir de nivel.' }, { quoted: m })
        }
        u.exp -= 1000
        u.level = (u.level || 1) + 1
        // determinar rango: admin -> Aprendiz ; no admin -> Súbdito
        let rango = 'Súbdito'
        if (m.isGroup) {
          try {
            const meta = await conn.groupMetadata(m.chat)
            const participant = meta.participants.find(p => p.id === who)
            if (participant && (participant.admin || participant.isAdmin)) rango = 'Aprendiz'
          } catch (e) {}
        }
        return sendAsChannel(m.chat, { text: `🌟 LEVELUP 🌟\n\n💜 Level: ${u.level}\n👑 Rango: ${rango}` }, { quoted: m })
      }

      default:
        return
    }
  } catch (err) {
    console.error(err)
    return m.reply('Ocurrió un error ejecutando el comando.')
  }
}

handler.help = ['daily', 'cofre', 'minar', 'crime', 'rob', 'rob2', 'd', 'bal', 'baltop', 'lvl']
handler.tags = ['economy']
handler.command = /^(daily|cofre|minar|crime|crimen|rob|rob2|d|deposit|depositar|bal|baltop|lvl)$/i
handler.rowner = false
handler.group = false

export default handler