//--> Hecho por Ado-rgb (github.com/Ado-rgb)
// •|• No quites créditos..

let handler = async (m, { conn, text }) => {
  if (!text || !text.endsWith('@g.us')) {
    return m.reply('☆ Uso correcto:\n> .delprimary 120363xxxxxx@g.us')
  }

  const groupId = text.trim()

  try {
    const metadata = await conn.groupMetadata(groupId)
    const participants = metadata.participants
    const userInGroup = participants.find(p => p.id === m.sender)

    if (!userInGroup) return m.reply('No estás en ese grupo.')

    // validar admin
    if (!userInGroup.admin && userInGroup.role !== 'admin' && userInGroup.role !== 'superadmin') {
      return m.reply('☆ No sos admin en ese grupo.')
    }

    if (!global.db.data.chats[groupId]) global.db.data.chats[groupId] = {}

    if (!global.db.data.chats[groupId].primaryBot) {
      return m.reply('Ese grupo no tiene un bot primario asignado.')
    }

    delete global.db.data.chats[groupId].primaryBot
    global.db.data.chats[groupId].allBots = true

    m.reply(`☆ Se eliminó el bot primario del grupo:\n*${metadata.subject}*\n\nAhora todos los bots pueden responder.`)
  } catch (e) {
    console.error(e)
    m.reply('☆ No pude acceder a ese grupo. Asegúrate de que el bot esté dentro del grupo y el ID sea correcto.')
  }
}

handler.help = ['delprimary <IDgrupoxxxx@g.us>']
handler.tags = ['serbot']
handler.command = ['delprimary']

export default handler