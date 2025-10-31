// Código creado por Félix ofc 
// Respeta créditos

import ws from 'ws'
import { join } from 'path'
import fs from 'fs'

const readSessionName = (jid) => {
  try {
    const number = jid.split('@')[0]?.replace(/\D/g, '')
    if (!number) return null
    const configPath = join('./JadiBots', number, 'config.json')
    if (!fs.existsSync(configPath)) return null
    const cfg = JSON.parse(fs.readFileSync(configPath))
    return cfg?.name || null
  } catch (e) {
    return null
  }
}

let handler = async (m, { conn }) => {
  const mainBotConn = global.conn
  if (!global.conns || !Array.isArray(global.conns)) global.conns = []
  global.conns = global.conns.filter(subConn => {
    return subConn.user?.jid && subConn.ws?.socket?.readyState === ws.OPEN
  })

  let totalSubs = global.conns.length
  const totalPrincipales = 1
  const totalBots = totalPrincipales + totalSubs
  const sesiones = totalBots.toLocaleString()

  let botsEnGrupo = 0
  let botsEnGrupoDetalles = []

  // Obtener nombre principal (del bot que envía)
  const mainJid = mainBotConn.user?.jid || conn.user?.jid
  let mainName = readSessionName(mainJid) || mainBotConn.user?.name || 'Principal'

  if (mainBotConn.chats && mainBotConn.chats[m.chat]) {
    botsEnGrupo++
    botsEnGrupoDetalles.push({
      jid: mainBotConn.user.jid,
      tipo: 'Principal'
    })
  }

  for (let subConn of global.conns) {
    if (subConn.chats && subConn.chats[m.chat]) {
      botsEnGrupo++
      botsEnGrupoDetalles.push({
        jid: subConn.user.jid,
        tipo: 'Sub'
      })
    }
  }

  let txt = `𑁍⃪࣭۪ٜ݊݊݊݊݊໑ٜ࣪ Lista de bots activos (*${sesiones}* sesiones)\n\n❖ Principales » *${totalPrincipales}*\n✰ Subs » *${totalSubs}*\n\n`
  txt += `❏ En este grupo: *${botsEnGrupo}*\n\n`

  if (botsEnGrupo > 0) {
    for (let b of botsEnGrupoDetalles) {
      const numero = b.jid.split('@')[0]
      // Obtener nombre de la sesión específica; si no existe, mostrar el nombre principal
      const nombreSesion = readSessionName(b.jid) || mainName
      txt += `\t\t*✎ [${b.tipo} • ${nombreSesion}]* » @${numero}\n`
    }
  } else {
    txt += '\t\t🜸 Ningún bot principal/sub en este grupo\n'
  }

  const mentions = botsEnGrupoDetalles.map(b => b.jid)

  await conn.sendMessage(m.chat, { text: txt, mentions }, { quoted: m })
}

handler.command = ['sockets', 'bots']
handler.group = true
export default handler