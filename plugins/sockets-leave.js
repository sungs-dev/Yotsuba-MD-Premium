// commands/leave.js

const handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return;
  if (!m.isGroup) return;
  await conn.sendMessage(m.chat, { text: '*👋 Saliendo del grupo...*' }, { quoted: m });
  await conn.groupLeave(m.chat);
};

handler.command = ['leave'];
handler.owner = true;

export default handler;