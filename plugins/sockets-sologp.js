// commands/sologp.js

const handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return;
  conn.public = false;
  await conn.sendMessage(m.chat, { text: '*🔒 Bot configurado para SOLO GRUPOS.*' }, { quoted: m });
};

handler.command = ['sologp'];
handler.owner = true;

export default handler;