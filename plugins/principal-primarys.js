// commands/primarys.js

import fs from 'fs';

const PRIMARY_JSON = 'jsons/primary.json';

const handler = async (m, { conn }) => {
  if (!fs.existsSync(PRIMARY_JSON)) {
    await conn.sendMessage(m.chat, { text: '*〔 BOTS PRINCIPALES 〕*\n\n🜸 1: (No hay bots principales aún)' }, { quoted: m });
    return;
  }

  let primarys = JSON.parse(fs.readFileSync(PRIMARY_JSON));
  if (!primarys.length) {
    await conn.sendMessage(m.chat, { text: '*〔 BOTS PRINCIPALES 〕*\n\n🜸 1: (No hay bots principales aún)' }, { quoted: m });
    return;
  }

  let txt = '*〔 BOTS PRINCIPALES 〕*\n\n';
  primarys.forEach((jid, i) => {
    txt += `🜸 ${i + 1}: @${jid.split('@')[0]}\n`;
  });
  await conn.sendMessage(m.chat, { text: txt.trim(), mentions: primarys }, { quoted: m });
};

handler.command = ['primarys'];
handler.group = true;

export default handler;