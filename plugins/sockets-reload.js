const handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return;
  await conn.sendMessage(m.chat, { text: '*♻️ Recargando bot...*' }, { quoted: m });
  process.send('reset');
};

handler.command = ['reload'];
handler.owner = true;

export default handler;