import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

/**
 * Plugin único que implementa:
 * - setname, setbanner, setcurrency (edita ./JadiBots/<tuNumero>/config.json)
 * - daily, cofre (cooldown 24h)
 * - minar (cooldown 24 minutos)
 * - crime/crimen (sin cooldown)
 * - rob (robar exp, cooldown 1h) y rob2 (robar monedas, cooldown 1h)
 * - d / deposit (depositar all o cantidad)
 * - bal (mostrar saldo de usuario)
 * - baltop (top por grupo, paginado 10/10)
 * - lvl (intenta subir si tiene >=1000 exp)
 *
 * Usa global.db.data.users para almacenar:
 *  { exp, money, bank, level, lastDaily, lastCofre, lastMinar, lastRob, lastRob2 }
 *
 * Todos los mensajes se envían con contextInfo/ externalAdReply para "simular canal" y thumbnail pequeño.
 */

const ms = (s) => s // helper placeholder
const toMs = (h, m = 0, s = 0) => ((h * 3600) + (m * 60) + s) * 1000

const formatClock = (ms) => {
  if (!ms || isNaN(ms)) return '00:00:00'
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

const formatDelta = (msDelta) => {
  if (!msDelta || msDelta <= 0) return '00:00:00'
  const total = Math.floor(msDelta / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const parts = []
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' : ')
}

const ensureUser = (jid) => {
  if (!global.db) global.db = { data: { users: {} } }
  if (!global.db.data) global.db.data = { users: {} }
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
  return { config, configPath, botActual }
}

const getThumbnailBuffer = async (bannerUrl) => {
  try {
    const res = await fetch(bannerUrl)
    return await res.buffer()
  } catch (e) {
    return null
  }
}

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

let handler = async (m, { conn, text = '', usedPrefix = '#', command = '' }) => {
  // Normalizar command a minúsculas sin prefijo
  const cmd = (command || '').toString().replace(usedPrefix || '', '').toLowerCase()

  // Asegurar estructura DB
  if (!global.db) global.db = { data: { users: {} } }
  if (!global.db.data) global.db.data = { users: {} }
  if (!global.db.data.users) global.db.data.users = {}

  // Leer config de sesión para thumbnail / defaults
  const { config, configPath } = readSessionConfig(conn)
  const bannerFinal = config.banner || 'https://qu.ax/zRNgk.jpg'
  const currencyDefault = config.currency || (config.name ? config.name : 'USD') // fallback
  const thumbnail = await getThumbnailBuffer(bannerFinal)

  // newsletter info (simular canal)
  const newsletterJid = (global.channelRD && global.channelRD.id) ? global.channelRD.id : '0@s.whatsapp.net'
  const newsletterName = (global.channelRD && global.channelRD.name) ? global.channelRD.name : (config.name || currencyDefault)

  const sendAsChannel = async (chat, params, extra = {}) => {
    // Agrega contextInfo para que parezca mensaje de canal + externalAdReply thumbnail pequeño
    params.contextInfo = params.contextInfo || {}
    params.contextInfo.isForwarded = true
    params.contextInfo.forwardedNewsletterMessageInfo = {
      newsletterJid,
      serverMessageId: '',
      newsletterName
    }
    params.contextInfo.externalAdReply = params.contextInfo.externalAdReply || {
      title: newsletterName,
      body: global.textbot || '',
      mediaType: 1,
      mediaUrl: global.redes || '',
      sourceUrl: global.redes || '',
      thumbnail,
      showAdAttribution: false,
      containsAutoReply: true,
      renderLargerThumbnail: true
    }
    return await conn.sendMessage(chat, params, extra || {})
  }

  // UTIL: obtener JID objetivo (reply o menciones o texto)
  const getTargetJid = () => {
    if (m.quoted && m.quoted.sender) return m.quoted.sender
    if (m.mentionedJid && m.mentionedJid[0]) return m.mentionedJid[0]
    if (text && /\d+@\w+/.test(text)) return text.trim().split(/\s+/)[0]
    return null
  }

  // COMMANDS
  try {
    switch (cmd) {
      // ------------------ SETTERS DE SESIÓN ------------------
      case 'setname':
      case 'setbanner':
      case 'setcurrency': {
        // Solo dueño de la sesión (quien inició sesión) puede editar su carpeta: verificar que exista ./JadiBots/<senderNumber>
        const senderNumber = m.sender.replace(/[^0-9]/g, '')
        const botPath = path.join('./JadiBots', senderNumber)
        const cfgPath = path.join(botPath, 'config.json')
        if (!fs.existsSync(botPath)) return m.reply('❖ Este comando solo puede ser usado por el dueño del número del bot (sesión).')

        let cfg = {}
        if (fs.existsSync(cfgPath)) {
          try { cfg = JSON.parse(fs.readFileSync(cfgPath)) } catch (e) { return m.reply('😔 Error al leer la configuración.') }
        }

        if (!text) {
          return m.reply(`Formato erróneo. Uso:\n#${cmd} <valor>`)
        }

        if (cmd === 'setname') cfg.name = text.trim()
        else if (cmd === 'setbanner') cfg.banner = text.trim()
        else if (cmd === 'setcurrency') cfg.currency = text.trim()

        try {
          fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2))
          return m.reply(`💜 Configuración actualizada: ${cmd.replace('set', '')} → ${text.trim()}`)
        } catch (err) {
          console.error(err)
          return m.reply('😔 Ocurrió un error al guardar la configuración.')
        }
      }

      // ------------------ DAILY / COFRE ------------------
      case 'daily':
      case 'cofre': {
        const who = m.sender
        const u = ensureUser(who)
        const keyLast = (cmd === 'daily') ? 'lastDaily' : 'lastCofre'
        const cooldown = toMs(24, 0, 0) // 24 horas
        const now = Date.now()
        if (now - (u[keyLast] || 0) < cooldown) {
          const remaining = (u[keyLast] || 0) + cooldown - now
          return sendAsChannel(m.chat, {
            text: `👑 Vuelve en ${formatDelta(remaining)}`
          }, { quoted: m })
        }
        const amount = randInt(1, 999) // menos de 1000
        u.money = (u.money || 0) + amount
        u[keyLast] = now
        // guardar DB si tu framework lo requiere (global.db assumed persisted elsewhere)
        return sendAsChannel(m.chat, {
          text: `👑 Reclamante tu ${cmd === 'daily' ? 'recompensa diaria' : 'cofre de hoy'}. Recursos:\n\n${currencyDefault}: ${amount}\n> Vuelve en ${formatClock(cooldown)}`
        }, { quoted: m })
      }

      // ------------------ MINAR ------------------
      case 'minar': {
        const who = m.sender
        const u = ensureUser(who)
        const cooldown = toMs(0, 24, 0) // 24 minutos -> 24*60s
        const now = Date.now()
        if (now - (u.lastMinar || 0) < cooldown) {
          const remaining = (u.lastMinar || 0) + cooldown - now
          return sendAsChannel(m.chat, { text: `👑 Debes esperar ${formatDelta(remaining)} para minar de nuevo.` }, { quoted: m })
        }
        const addExp = randInt(1, 49)
        const addMoney = randInt(1, 99)
        u.exp = (u.exp || 0) + addExp
        u.money = (u.money || 0) + addMoney
        u.lastMinar = now
        return sendAsChannel(m.chat, {
          text: `👑 Estabas minando. Recursos:\n\n💫 Exp: ${addExp}\n${currencyDefault}: ${addMoney}`
        }, { quoted: m })
      }

      // ------------------ CRIME / CRIMEN ------------------
      case 'crime':
      case 'crimen': {
        const who = m.sender
        const u = ensureUser(who)
        const gained = randInt(1, 99) // menos de 100
        u.money = (u.money || 0) + gained
        return sendAsChannel(m.chat, {
          text: `🌟 Cometiste tu crime de hoy en un banco y obtuviste: ${gained} ${currencyDefault}`
        }, { quoted: m })
      }

      // ------------------ ROB / ROB2 ------------------
      case 'rob':
      case 'rob2': {
        const who = m.sender
        const u = ensureUser(who)
        const now = Date.now()
        const cdKey = (cmd === 'rob') ? 'lastRob' : 'lastRob2'
        const cooldown = toMs(1) // 1 hora -> toMs(hours)
        // fix toMs usage for hours
        const oneHourMs = toMs(1, 0, 0) // 1 hour
        if (now - (u[cdKey] || 0) < oneHourMs) {
          const remaining = (u[cdKey] || 0) + oneHourMs - now
          return sendAsChannel(m.chat, { text: `👑 Debes esperar ${formatDelta(remaining)} para usar ${cmd}` }, { quoted: m })
        }
        const target = getTargetJid()
        if (!target) return sendAsChannel(m.chat, { text: '👑 Dime a quien quieres robar.' }, { quoted: m })
        if (target === who) return sendAsChannel(m.chat, { text: '👑 No puedes robarte a ti mismo.' }, { quoted: m })

        ensureUser(target)
        const victim = global.db.data.users[target]
        if (!victim) return sendAsChannel(m.chat, { text: '👑 Usuario no encontrado.' }, { quoted: m })

        if (cmd === 'rob') {
          // Robar EXP (todo)
          const stolen = (victim.exp || 0)
          if (!stolen) return sendAsChannel(m.chat, { text: '👑 Esta persona no tiene experiencia que robar.' }, { quoted: m })
          victim.exp = 0
          u.exp = (u.exp || 0) + stolen
          u.lastRob = now
          return sendAsChannel(m.chat, { text: `👑 Le robaste ${stolen} Exp a @${target.split('@')[0]}`, mentions: [target] }, { quoted: m })
        } else {
          // rob2 robar monedas (todo)
          const stolen = (victim.money || 0)
          if (!stolen) return sendAsChannel(m.chat, { text: '👑 Esta persona no tiene monedas que robar.' }, { quoted: m })
          victim.money = 0
          u.money = (u.money || 0) + stolen
          u.lastRob2 = now
          return sendAsChannel(m.chat, { text: `👑 Le robaste ${stolen} ${currencyDefault} a @${target.split('@')[0]}`, mentions: [target] }, { quoted: m })
        }
      }

      // ------------------ DEPOSITAR / D ------------------
      case 'd':
      case 'deposit':
      case 'depositar': {
        const who = m.sender
        const u = ensureUser(who)
        if (!text && !m.quoted && !(m.mentionedJid && m.mentionedJid.length)) {
          return sendAsChannel(m.chat, { text: 'Formato: #d all  o  #d <cantidad>' }, { quoted: m })
        }
        const arg = text.trim().split(/\s+/)[0] || ''
        if (arg.toLowerCase() === 'all') {
          const amount = u.money || 0
          if (!amount) return sendAsChannel(m.chat, { text: '👑 No tienes nada.' }, { quoted: m })
          u.money = 0
          u.bank = (u.bank || 0) + amount
          return sendAsChannel(m.chat, { text: `💜 Depositaste ${amount} ${currencyDefault} al banco. Ya no te lo podrán robar.` }, { quoted: m })
        }
        const n = parseInt(arg)
        if (!n || n <= 0) return sendAsChannel(m.chat, { text: '👑 Cantidad inválida.' }, { quoted: m })
        if ((u.money || 0) < n) return sendAsChannel(m.chat, { text: '👑 No tienes suficiente dinero para depositar esa cantidad.' }, { quoted: m })
        u.money -= n
        u.bank = (u.bank || 0) + n
        return sendAsChannel(m.chat, { text: `💜 Depositaste ${n} ${currencyDefault} al banco. Ya no te lo podrán robar.` }, { quoted: m })
      }

      // ------------------ BAL ------------------
      case 'bal': {
        // bal <reply or mention> or no arg -> self
        let target = getTargetJid() || m.sender
        ensureUser(target)
        const utarget = global.db.data.users[target]
        // compute rank among group by total money (bank + cash)
        let rankText = 'N/A'
        try {
          if (m.isGroup) {
            const metadata = await conn.groupMetadata(m.chat)
            const groupParticipants = metadata.participants.map(p => p.id)
            const arr = Object.keys(global.db.data.users)
              .filter(jid => groupParticipants.includes(jid))
              .map(jid => ({ jid, total: (global.db.data.users[jid].money || 0) + (global.db.data.users[jid].bank || 0) }))
              .sort((a, b) => b.total - a.total)
            const idx = arr.findIndex(x => x.jid === target)
            rankText = idx >= 0 ? String(idx + 1) : 'N/A'
          } else {
            // not group -> rank among all users
            const arr = Object.keys(global.db.data.users)
              .map(jid => ({ jid, total: (global.db.data.users[jid].money || 0) + (global.db.data.users[jid].bank || 0) }))
              .sort((a, b) => b.total - a.total)
            const idx = arr.findIndex(x => x.jid === target)
            rankText = idx >= 0 ? String(idx + 1) : 'N/A'
          }
        } catch (e) {
          rankText = 'N/A'
        }

        const textOut =
          `\`\`\`👑 BAL - USER 👑\`\`\`\n\n🌟 ${currencyDefault}: ${utarget.money || 0}\n💫 Exp: ${utarget.exp || 0}\n💜 Bank: ${utarget.bank || 0}\n\n💜 Top: ${rankText}`
        return sendAsChannel(m.chat, { text: textOut, mentions: [target] }, { quoted: m })
      }

      // ------------------ BALTOP ------------------
      case 'baltop': {
        if (!m.isGroup) return m.reply('Este comando solo puede usarse en grupos.')
        // page argument
        const pageArg = parseInt((text || '').trim().split(/\s+/)[0]) || 1
        const metadata = await conn.groupMetadata(m.chat)
        const groupParticipants = metadata.participants.map(p => p.id)
        // collect users in group with totals
        const arr = Object.keys(global.db.data.users)
          .filter(jid => groupParticipants.includes(jid))
          .map(jid => {
            const u = global.db.data.users[jid]
            const total = (u.money || 0) + (u.bank || 0)
            return { jid, total, money: u.money || 0, exp: u.exp || 0 }
          })
          .sort((a, b) => b.total - a.total)

        if (!arr.length) return sendAsChannel(m.chat, { text: '👑 No hay usuarios en el top.' }, { quoted: m })

        const perPage = 10
        const totalPages = Math.ceil(arr.length / perPage)
        const page = Math.max(1, Math.min(pageArg, totalPages))
        const start = (page - 1) * perPage
        const pageItems = arr.slice(start, start + perPage)

        let body = '``👑 TOP USUARIOS 👑``\n\n'
        const mentions = []
        pageItems.forEach((it, i) => {
          body += `💜 @${it.jid.split('@')[0]}:\n💫 ${currencyDefault}: ${it.money}\n🌟 Exp: ${it.exp}\n\n`
          mentions.push(it.jid)
        })
        body += `> Página ${page} de ${totalPages}`

        return sendAsChannel(m.chat, { text: body, mentions }, { quoted: m })
      }

      // ------------------ LVL ------------------
      case 'lvl': {
        const who = m.sender
        const u = ensureUser(who)
        if ((u.exp || 0) < 1000) {
          return sendAsChannel(m.chat, { text: '🌟 No tienes suficientes Experiencia para subir de nivel.' }, { quoted: m })
        }
        // gastar 1000 exp para subir 1 nivel
        u.exp -= 1000
        u.level = (u.level || 1) + 1
        // rango según admin
        const isAdmin = m.isGroup ? (await (async () => {
          try {
            const mem = await conn.groupMetadata(m.chat)
            const participant = mem.participants.find(p => p.id === who)
            return !!participant?.admin || !!participant?.isAdmin
          } catch (e) { return false }
        })()) : false
        const rango = isAdmin ? 'Aprendiz' : 'Súbdito'
        return sendAsChannel(m.chat, {
          text: `🌟 LEVELUP 🌟\n\n💜 Level: ${u.level}\n👑 Rango: ${rango}`
        }, { quoted: m })
      }

      // ------------------ TEST simple (muestra currency read from config) ------------------
      case 'test': {
        const textOut = `*TEST* — Mensaje desde el canal\n\nCurrency de sesión: *${currencyDefault}*`
        return sendAsChannel(m.chat, { text: textOut }, { quoted: m })
      }

      default:
        return // no-op
    }
  } catch (err) {
    console.error(err)
    return m.reply('Ocurrió un error ejecutando el comando.')
  }
}

// Registrar handler para muchos comandos
handler.help = ['daily', 'cofre', 'minar', 'crime', 'rob', 'rob2', 'd', 'bal', 'baltop', 'lvl', 'setname', 'setbanner', 'setcurrency', 'teste']
handler.tags = ['economy', 'sockets']
handler.command = /^(daily|cofre|minar|crime|crimen|rob|rob2|d|deposit|depositar|bal|baltop|lvl|setname|setbanner|setcurrency|teste)$/i
handler.group = false // algunos comandos verifican si están en grupo internamente
handler.rowner = false

export default handler