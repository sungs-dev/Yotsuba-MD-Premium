// commands/self.js

const handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return;
  conn.public = false;
  await conn.sendMessage(m.chat, { text: '*🔒 Bot en modo SELF (solo responde al owner).*' }, { quoted: m });
};

handler.command = ['self'];
handler.owner = true;

export default handler;