// commands/dprimary.js

import fs from 'fs';
import path from 'path';

const PRIMARY_JSON = 'jsons/primary.json';

const handler = async (m, { conn, isOwner }) => {
  if (!isOwner) {
    await conn.sendMessage(m.chat, { text: '*🚫 Solo el Owner puede usar este comando.*' }, { quoted: m });
    return;
  }

  let target;
  if (m.mentionedJid && m.mentionedJid.length) {
    target = m.mentionedJid[0];
  } else if (m.quoted && m.quoted.sender) {
    target = m.quoted.sender;
  } else {
    await conn.sendMessage(m.chat, { text: '*📌 Debes mencionar o responder al bot que quieres quitar de Principal.*' }, { quoted: m });
    return;
  }

  if (!fs.existsSync(PRIMARY_JSON)) {
    await conn.sendMessage(m.chat, { text: '*❌ No hay Bots principales guardados.*' }, { quoted: m });
    return;
  }

  let primarys = JSON.parse(fs.readFileSync(PRIMARY_JSON));
  if (!primarys.includes(target)) {
    await conn.sendMessage(m.chat, { text: '*❌ Ese bot no está como Principal.*' }, { quoted: m });
    return;
  }

  // Remover
  primarys = primarys.filter(jid => jid !== target);
  fs.writeFileSync(PRIMARY_JSON, JSON.stringify(primarys, null, 2));

  await conn.sendMessage(m.chat, { text: `*✅ Bot eliminado de Principal.*\n@${target.split('@')[0]}`, mentions: [target] });
};

handler.command = ['dprimary', 'quitarprincipal'];
handler.owner = true;

export default handler;