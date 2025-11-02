let WAMessageStubType = (await import('@whiskeysockets/baileys')).default
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const lidCache = new Map()

// Helpers
const ensureChatConfig = (chatId) => {
  if (!global.db) global.db = { data: { chats: {} } }
  if (!global.db.data) global.db.data = { chats: {} }
  if (!global.db.data.chats) global.db.data.chats = {}
  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}
  const cfg = global.db.data.chats[chatId]
  // default detectAdmin true
  if (typeof cfg.detectAdmin === 'undefined') cfg.detectAdmin = true
  return cfg
}

const readSessionConfigByConn = (conn) => {
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

async function resolveLidToRealJid(lid, conn, groupChatId, maxRetries = 3, retryDelay = 60000) {
  const inputJid = lid?.toString?.() || ''
  if (!inputJid) return ''
  if (!inputJid.endsWith("@lid") || !groupChatId?.endsWith("@g.us")) {
    return inputJid.includes("@") ? inputJid : `${inputJid}@s.whatsapp.net`
  }
  if (lidCache.has(inputJid)) return lidCache.get(inputJid)
  const lidToFind = inputJid.split("@")[0]
  let attempts = 0
  while (attempts < maxRetries) {
    try {
      const metadata = await conn?.groupMetadata(groupChatId)
      if (!metadata?.participants) throw new Error("No se obtuvieron participantes")
      for (const participant of metadata.participants) {
        try {
          if (!participant?.jid) continue
          const contactDetails = await conn?.onWhatsApp(participant.jid)
          if (!contactDetails?.[0]?.lid) continue
          const possibleLid = contactDetails[0].lid.split("@")[0]
          if (possibleLid === lidToFind) {
            lidCache.set(inputJid, participant.jid)
            return participant.jid
          }
        } catch (e) { continue }
      }
      lidCache.set(inputJid, inputJid)
      return inputJid
    } catch (e) {
      if (++attempts >= maxRetries) {
        lidCache.set(inputJid, inputJid)
        return inputJid
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay))
    }
  }
  return inputJid
}

// Main handler
const handler = m => m

// Middleware: runs before message processing
handler.before = async function (m, { conn, participants, groupMetadata }) {
  try {
    if (!m?.messageStubType || !m.isGroup) return

    // respect primaryBot config if present
    const chatCfg = ensureChatConfig(m.chat)
    const primaryBot = chatCfg.primaryBot
    if (primaryBot && conn.user?.jid !== primaryBot) return

    // we only care promote (29) and demote (30)
    const stubType = m.messageStubType
    if (stubType !== 29 && stubType !== 30) return

    // only proceed if detection enabled for this chat
    if (!chatCfg.detectAdmin) return

    // resolve actor (who made the change)
    const actor = await resolveLidToRealJid(m?.sender || '', conn, m.chat)

    // get targets from stub parameters
    const rawTargets = m.messageStubParameters?.[0]
    let targetList = []
    if (!rawTargets) return
    if (Array.isArray(rawTargets)) targetList = rawTargets
    else if (typeof rawTargets === 'string' && rawTargets.includes(',')) targetList = rawTargets.split(',').map(s => s.trim()).filter(Boolean)
    else targetList = [rawTargets]

    const resolvedTargets = []
    for (const t of targetList) {
      const real = await resolveLidToRealJid(t, conn, m.chat)
      if (real) resolvedTargets.push(real)
    }

    // group admins to mention
    const adminMentions = Array.isArray(participants) ? participants.filter(p => p?.admin).map(p => p.id) : []

    // read session config to get nombreBot and banner (sub-bot)
    const cfg = readSessionConfigByConn(conn)
    const nombreBot = cfg.name || cfg.currency || cfg?.botname || conn.user?.name || 'Bot'
    const bannerUrl = cfg.banner || null

    // build contextInfo (simulate channel message). Use renderLargerThumbnail true to show large preview
    const newsletterJid = (global.channelRD && global.channelRD.id) ? global.channelRD.id : ''
    const newsletterName = (global.channelRD && global.channelRD.name) ? global.channelRD.name : nombreBot

    let thumbnail = null
    if (bannerUrl) {
      try {
        const res = await fetch(bannerUrl)
        thumbnail = await res.buffer()
      } catch (e) {
        thumbnail = null
      }
    }

    const rcanal = {
      contextInfo: {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: newsletterJid || '',
          serverMessageId: '',
          newsletterName: newsletterName || nombreBot
        },
        externalAdReply: {
          title: nombreBot,
          body: global.textbot || '',
          mediaType: 1,
          mediaUrl: global.redes || '',
          sourceUrl: global.redes || '',
          thumbnail,
          showAdAttribution: false,
          containsAutoReply: true,
          renderLargerThumbnail: true
        },
        mentionedJid: []
      }
    }

    // prepare mention list (actor + targets + group admins)
    const mentionSet = new Set()
    if (actor) mentionSet.add(actor)
    for (const t of resolvedTargets) mentionSet.add(t)
    for (const a of adminMentions) mentionSet.add(a)
    rcanal.contextInfo.mentionedJid = Array.from(mentionSet).filter(Boolean)

    // short names for message
    const actorShort = (actor || m.sender).split('@')[0]
    const targetsShort = resolvedTargets.map(j => j.split('@')[0]).join(', ')

    if (stubType === 29) {
      // promoted
      const text = `💜 Aviso:\n\n> ${targetsShort ? `@${targetsShort}` : 'Usuario'} *ahora es administrador de este grupo* ya que *@${actorShort},* le dio privilegios.`
      await this.sendMessage(m.chat, { text, ...rcanal }, { quoted: null })
      return
    }

    if (stubType === 30) {
      // demoted
      const text = `💜 Aviso:\n\n> ${targetsShort ? `@${targetsShort}` : 'Usuario'} *Ya no es administrador de este grupo* ya que *@${actorShort},* Le quito los privilegios.`
      await this.sendMessage(m.chat, { text, ...rcanal }, { quoted: null })
      return
    }
  } catch (e) {
    // don't break main flow
    console.error('gestion-detect.before error:', e)
    return
  }
}

// COMMAND: #detect on|off
handler.command = /^detect$/i
handler.group = true
handler.rowner = false
handler.admin = false // we check admin inline
handler.help = ['detect <on|off>']
handler.tags = ['group', 'admin']

handler.run = async function (m, { conn, args }) {
  try {
    if (!m.isGroup) return conn.sendMessage(m.chat, { text: 'Este comando solo funciona en grupos.' }, { quoted: m })

    // check if sender is group admin
    let isAdmin = false
    try {
      const meta = await conn.groupMetadata(m.chat)
      const participant = meta.participants.find(p => p.id === m.sender)
      isAdmin = !!(participant?.admin || participant?.isAdmin)
    } catch (e) { isAdmin = false }

    if (!isAdmin) {
      return conn.sendMessage(m.chat, { text: '🤨 Este comando solo es para admins amigo.' }, { quoted: m })
    }

    const chatCfg = ensureChatConfig(m.chat)

    // if no args provided -> send instructions
    if (!args || !args[0]) {
      const helpTxt = `💜 Los admins pueden activar o desactivar la función *detect* usando:\n\n💫 #detect on\n🌟 #detect off`
      return conn.sendMessage(m.chat, { text: helpTxt }, { quoted: m })
    }

    const opt = args[0].toString().toLowerCase()
    const enable = ['on', 'true', 'activar', 'enable'].includes(opt)
    const disable = ['off', 'false', 'desactivar', 'disable'].includes(opt)
    if (!enable && !disable) {
      const helpTxt = `💜 Los admins pueden activar o desactivar la función *detect* usando:\n\n💫 #detect on\n🌟 #detect off`
      return conn.sendMessage(m.chat, { text: helpTxt }, { quoted: m })
    }

    // set the state (even if same, we will reply)
    chatCfg.detectAdmin = enable

    const stateText = enable ? 'activada' : 'desactivada'
    await conn.sendMessage(m.chat, { text: `✅ Detección de cambios de admin ${stateText}.\n> Ejecutado por: @${m.sender.split('@')[0]}`, contextInfo: { mentionedJid: [m.sender] } }, { quoted: m })
    return
  } catch (e) {
    console.error('gestion-detect.run error:', e)
    return conn.sendMessage(m.chat, { text: 'Ocurrió un error procesando el comando.' }, { quoted: m })
  }
}

export default handler