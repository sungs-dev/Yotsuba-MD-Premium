// Código creado por Félix 

const handler = async (m, { conn, text, participants, isAdmin, isBotAdmin, rcanal }) => {
  // Verifica si el usuario es admin
  if (!isAdmin) {
    await conn.sendMessage(
      rcanal, // <- usa rcanal como el canal de salida
      { text: `*👑 Este comando solo puede ser usado por admins.*` },
      { quoted: rcanal }
    );
    return;
  }

  // Verifica que haya texto
  if (!text) {
    await conn.sendMessage(
      rcanal, // <- usa rcanal como el canal de salida
      { text: `*🙃 Escribe el mensaje a enviar. Ejemplo: #tag Hola grupo.*` },
      { quoted: rcanal }
    );
    return;
  }

  // Obtén todos los ids de los participantes salvo el bot
  let mentions = participants
    .filter(u => u.id !== conn.user.jid) // omite al bot
    .map(u => u.id);

  // Envía el mensaje mencionando a todos, usando el canal
  await conn.sendMessage(
    rcanal, // <- usa rcanal como el canal de salida
    { text, mentions }
    // Sin quoted, como lo pediste
  );
};

handler.command = ['tag', 'hidetag'];
handler.group = true; // solo en grupos

export default handler;