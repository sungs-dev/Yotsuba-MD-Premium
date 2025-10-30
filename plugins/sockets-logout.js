// commands/logout.js

const handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return;
  await conn.sendMessage(m.chat, { text: '*👋 Cerrando sesión...*' }, { quoted: m });
  await conn.logout();
};

handler.command = ['logout'];
handler.owner = true;

export default handler;