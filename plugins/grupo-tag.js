// Código creado por Félix 

const handler = async (m, { conn, text, participants, isAdmin, isBotAdmin }) => {
  // Verifica si el usuario es admin
  if (!isAdmin) {
    await conn.sendMessage(
      m.chat,
      { text: `*👑 Este comando solo puede ser usado por admins.*` },
      { quoted: m }
    );
    return;
  }

  // Función auxiliar para extraer texto de un mensaje citado
  const extractQuotedText = (msg) => {
    if (!msg || !msg.quoted) return null;
    const quoted = msg.quoted.message || msg.quoted;
    // Posibles ubicaciones del texto/caption según tipo de mensaje (Baileys)
    return quoted.conversation
      || quoted.extendedTextMessage?.text
      || quoted.imageMessage?.caption
      || quoted.videoMessage?.caption
      || quoted.documentMessage?.caption
      || quoted?.caption
      || null;
  };

  // Si no hay texto en el comando, intenta obtenerlo del mensaje al que se responde
  let body = text?.trim();
  if (!body) {
    body = extractQuotedText(m);
  }

  // Si aún no hay texto, pide que se proporcione
  if (!body) {
    await conn.sendMessage(
      m.chat,
      { text: `*🙃 Escribe el mensaje a enviar o responde a un mensaje con el comando. Ejemplo: #tag Hola grupo.*` },
      { quoted: m }
    );
    return;
  }

  // Obtén todos los ids de los participantes salvo el bot
  const mentions = participants
    .filter(u => u.id !== conn.user.jid) // omite al bot
    .map(u => u.id);

  // Envía el mensaje mencionando a todos SIN responder al mensaje original
  await conn.sendMessage(
    m.chat,
    { text: body, mentions }
  );
};

handler.command = ['tag', 'hidetag'];
handler.group = true; // solo en grupos

export default handler;