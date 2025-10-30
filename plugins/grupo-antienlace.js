// Código creado por Félix OFC

const linkRegex = /https:\/\/\S+/i;

export async function before(m, { conn, isAdmin, isBotAdmin }) {
  if (!m.isGroup) return;
  if (!m.text) return;
  const chat = global.db.data.chats[m.chat];
  if (!chat) return;

  // Gestión de comando activar/desactivar anti-enlace
  if (/^#anti(enlace|link)(\s)?(on|off)?$/i.test(m.text.trim())) {
    if (!isAdmin) {
      await conn.reply(m.chat, `🤨 Solo los administradores pueden usar este comando.`, m);
      return !0;
    }
    const arg = m.text.trim().split(/\s+/)[1]?.toLowerCase();
    if (arg === 'on') {
      chat.antilink = true;
      await conn.reply(m.chat, `👑 El *Anti-enlace* ha sido activado.`, m);
    } else if (arg === 'off') {
      chat.antilink = false;
      await conn.reply(m.chat, `👑 El *Anti-enlace* ha sido desactivado.`, m);
    } else {
      await conn.reply(m.chat, `👑 Usa: #antilink on | #antilink off`, m);
    }
    return !0;
  }

  // Si anti-enlace está desactivado, no hace nada
  if (!chat.antilink) return;

  // Los admins pueden enviar enlaces
  if (isAdmin) return;

  // Detectar enlace
  if (linkRegex.test(m.text)) {
    // Elimina el mensaje (solo si el bot es admin)
    if (isBotAdmin) {
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.key.participant }});
    }
    // Advierte al usuario
    await conn.reply(m.chat, `👑 El \`Anti-enlace\` está activado, no compartas enlaces si no quieres que un administrador te eliminé.`, m);
    return !0;
  }
} 