const handler = async (m, { conn }) => {
  try {
    // let who = m?.message?.extendedTextMessage?.contextInfo?.participant || m?.mentionedJid[0] || await m?.quoted?.sender;
   let texto = await m.mentionedJid
   let who = texto.length > 0 ? texto[0] : (m.quoted ? await m.quoted.sender : false)
    if (!who) return m.reply('*ᐛ👑* Mensiona a un ciudadano de este mundo mágico para quitarle sus *privilegios altos.*');

    const groupMetadata = await conn.groupMetadata(m.chat);
    const participant = groupMetadata.participants.find(participant => participant.jid === who);

    if (!participant || !participant.admin) {
    return conn.reply(m.chat, `🤨 *@${who.split('@')[0]}* no es administrador del grupo!`, m, { mentions: [who] });
    }

    if (who === groupMetadata.owner) {
      return m.reply('🤨 ¿Quieres que te quite admin?');
    }

    if (who === conn.user.jid) {
      return m.reply('😒 No puedo quitarme admin yo misma we');
    }

    await conn.groupParticipantsUpdate(m.chat, [who], 'demote');
    await conn.reply(m.chat, `*@${who.split('@')[0]}* Ya no es admin`, m, { mentions: [who] });
  } catch (e) {
    await m.reply(`Error`);
  }
};

handler.help = ['demote'];
handler.tags = ['grupo'];
handler.command = ['demote'];
handler.admin = true;
handler.botAdmin = true;

export default handler;