// commands/cprimary.js

import fs from 'fs';
import path from 'path';

// Rutas globales
const PRIMARY_JSON = 'jsons/primary.json';
const PRINCIPAL_DIR = global.sessions; // Ej: "Sessions/Principal"
const SUBBOT_DIR = global.jadi;        // Ej: "Sessions/SubBot"

// Devuelve el JID del bot principal del servidor (primer bot de la carpeta principal)
function getOwnerPrincipalJid() {
  const files = fs.readdirSync(PRINCIPAL_DIR).filter(f => !f.startsWith('.'));
  return files.length ? files[0] : null; // Primer bot principal
}

// Inicializa el json si no existe y pone el bot principal del servidor
function ensurePrimaryJson() {
  if (!fs.existsSync(PRIMARY_JSON)) {
    const firstJid = getOwnerPrincipalJid();
    if (firstJid) {
      fs.writeFileSync(PRIMARY_JSON, JSON.stringify([firstJid], null, 2));
    } else {
      fs.writeFileSync(PRIMARY_JSON, JSON.stringify([], null, 2));
    }
  }
}

const handler = async (m, { conn, isOwner }) => {
  ensurePrimaryJson();

  // Solo el owner puede usar
  if (!isOwner) {
    await conn.sendMessage(m.chat, { text: '*🚫 Solo el Owner puede usar este comando.*' }, { quoted: m });
    return;
  }

  // Debe mencionar o responder
  let target;
  if (m.mentionedJid && m.mentionedJid.length) {
    target = m.mentionedJid[0];
  } else if (m.quoted && m.quoted.sender) {
    target = m.quoted.sender;
  } else {
    await conn.sendMessage(m.chat, { text: '*📌 Debes mencionar o responder al bot que quieres añadir como Principal.*' }, { quoted: m });
    return;
  }

  // Verifica si es SubBot (carpeta existe)
  if (!fs.existsSync(path.join(SUBBOT_DIR, target))) {
    await conn.sendMessage(m.chat, { text: '*❌ No se encontró esa persona en la carpeta de SubBots.*' }, { quoted: m });
    return;
  }

  // Verifica si ya es principal
  let primarys = JSON.parse(fs.readFileSync(PRIMARY_JSON));
  if (primarys.includes(target)) {
    await conn.sendMessage(m.chat, { text: '*🜸 Ese bot ya es principal.*' }, { quoted: m });
    return;
  }

  // Añade como principal y actualiza el archivo
  primarys.push(target);
  fs.writeFileSync(PRIMARY_JSON, JSON.stringify(primarys, null, 2));

  await conn.sendMessage(m.chat, { text: `*✅ Bot añadido como Principal.*\n@${target.split('@')[0]}`, mentions: [target] });
};

handler.command = ['cprimary', 'addprimary'];
handler.owner = true;

export default handler;