// REGEX para detectar enlaces (http(s), www, .com, .net, .org, .gg, etc.)
const linkRegex = /(https?:\/\/\S+|www\.\S+|\b[\w\d\-.]+\.(com|net|org|gg|me|xyz|info|io|edu|gov|biz|dev|shop|live|tv|site|online|app|club|link|store|media|cloud|fun|pro|vip|icu|space|top|studio|center|agency|name|today|solutions|website|social|group|chat|capital|cool|company|news|press|network|world|help|works|plus|run|systems|zone|tools|tube|team|one|page|games|design|direct|center|events|market|partners|school|services|show|support|technology|tips|trade|ventures|wiki|works|click|email|expert|global|life|money|photo|pics|rocks|tech|web|xyz|io|ai|co|in|to|us|uk|ca|au|de|fr|es|it|jp|ru|br|za|nl|se|no|fi|dk|pl|gr|cz|sk|tr|ro|hu|lt|lv|ee|bg|hr|si|rs|ua|by|md|az|ge|am|kz|kg|uz|tm|tj|mn|kr|cn|tw|hk|mo|vn|th|my|sg|ph|id|lk|bd|np|pk|af|ir|iq|sy|jo|lb|il|ps|eg|ma|dz|tn|ly|sd|et|ss|so|dj|er|ke|tz|ug|rw|bi|mw|zm|zm|mg|zw|ao|cm|cv|cf|td|ne|ng|sn|gm|gw|mr|ml|bf|sl|lr|ci|gh|tg|bj|ng|za|mz|sw|na|bw|ls|sz|km|sc|mu|yt|re|pm|bl|mf|gp|mq|gf|sr|cw|aw|sx|bq|vg|ai|ms|bm|tc|ky|jm|bs|bb|lc|vc|gd|dm|ag|kn|vi|pr|do|ht|cu|bs|us|ca|mx|gt|bz|sv|hn|ni|cr|pa|co|ec|pe|bo|py|uy|ar|cl|br|gy|sr|gf|fk)\b)/gi

const handler = async (m, { conn, usedPrefix, command, args, isAdmin, isOwner }) => {
  const chat = global.db.data.chats[m.chat]
  // Estado por defecto: activado si no existe
  let isAntiLink = chat && typeof chat.antienlace !== 'undefined' ? chat.antienlace : true

  // Comando para activar/desactivar antienlace (solo admins/owner)
  if (['antienlace', 'antilink'].includes(command)) {
    if (!(isAdmin || isOwner)) {
      return conn.reply(m.chat, '🤨 Solo los administradores pueden activar o desactivar el antienlace.', m, rcanal)
    }
    if (args[0] === 'on' || args[0] === 'enable') {
      if (isAntiLink) return conn.reply(m.chat, `💜 La función *${command}* ya estaba *activada*.`, m, rcanal)
      isAntiLink = true
    } else if (args[0] === 'off' || args[0] === 'disable') {
      if (!isAntiLink) return conn.reply(m.chat, `👑 La función *${command}* ya estaba *desactivada*.`, m, rcanal)
      isAntiLink = false
    } else {
      return conn.reply(
        m.chat,
        `👑 Los admins pueden activar o desactivar la función *${command}* utilizando:\n\n💜 *${command}* enable\n💜 *${command}* disable\n\n🛠 Estado actual » *${isEnable ? '✓ Activada' : '✗ Desactivada'}*`,
        m, rcanal
      )
    }
    chat.antienlace = isAntiLink
    return conn.reply(m.chat, `👑 La función *${command}* fue *${isAntiLink ? 'activada' : 'desactivada'}* para este grupo.`, m, rcanal)
  }
}

// Detectar enlaces y eliminar mensaje si antienlace está activado
export async function detectLink(conn, m) {
  const chat = global.db.data.chats[m.chat]
  const isAntiLink = chat && typeof chat.antienlace !== 'undefined' ? chat.antienlace : true

  // Si no está activado o es admin/owner, ignorar
  if (!isAntiLink) return
  if (m.isGroup && (m.isAdmin || m.isOwner)) return

  // Si el mensaje contiene un enlace
  if (linkRegex.test(m.text)) {
    // Responder primero
    await conn.sendMessage(m.chat, { text: '🤨 No envíes enlace si no quieres que te eliminé.' }, { quoted: m })
    // Borrar el mensaje original
    await conn.sendMessage(m.chat, {
      delete: m.key
    })
  }
}

handler.help = ['antienlace', 'antilink']
handler.tags = ['group']
handler.command = ['antienlace', 'antilink']
handler.group = true

export default handler