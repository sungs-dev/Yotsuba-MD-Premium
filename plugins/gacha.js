import fs from 'fs';
import { promises as fsp } from 'fs';

/* Rutas de archivos */
const CHARACTERS_FILE = './src/database/characters.json';
const WAIFUS_VENTA_FILE = './src/database/waifusVenta.json';
const HAREM_FILE = './src/database/harem.json';
const CLAIM_MSG_FILE = './src/database/userClaimConfig.json';

/* Utilidades compartidas */
async function loadCharacters() {
  const data = await fsp.readFile(CHARACTERS_FILE, 'utf-8');
  return JSON.parse(data);
}
async function saveCharacters(characters) {
  await fsp.writeFile(CHARACTERS_FILE, JSON.stringify(characters, null, 2), 'utf-8');
}

async function loadVentas() {
  try {
    const data = await fsp.readFile(WAIFUS_VENTA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}
async function saveVentas(ventas) {
  await fsp.writeFile(WAIFUS_VENTA_FILE, JSON.stringify(ventas, null, 2), 'utf-8');
}

async function loadHarem() {
  try {
    const data = await fsp.readFile(HAREM_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}
async function saveHarem(harem) {
  await fsp.writeFile(HAREM_FILE, JSON.stringify(harem, null, 2), 'utf-8');
}

async function loadClaimMessages() {
  try {
    const data = await fsp.readFile(CLAIM_MSG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}
async function getCustomClaimMessage(userId, username, characterName) {
  const messages = await loadClaimMessages();
  const template = messages[userId] || '🌟 *$user* ha reclamado a *$character*';
  return template
    .replace(/\$user/g, username)
    .replace(/\$character/g, characterName);
}

/* ---------------------------
   Handler: claim / reclamar / c
   --------------------------- */
export const cooldownsClaim = {}; // mantiene cooldowns por usuario para claim

export const claimHandler = async (m, { conn }) => {
  const userId = m.sender;
  const now = Date.now();

  if (cooldownsClaim[userId] && now < cooldownsClaim[userId]) {
    const remaining = cooldownsClaim[userId] - now;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    // Mensaje con emojis variados 👑
    return conn.reply(m.chat, `⏳ Debes esperar *${minutes}m ${seconds}s* antes de reclamar otra waifu.`, m);
  }

  if (!m.quoted || !m.quoted.text) {
    return conn.reply(m.chat, '👑 Debes *citar un personaje válido* para reclamarlo.', m);
  }

  try {
    const characters = await loadCharacters();

    const match = m.quoted.text.match(/𝙄𝘿:\s*\*([^\*]+)\*/i);
    if (!match) return conn.reply(m.chat, '👑 No se pudo detectar el ID del personaje.', m);

    const id = match[1].trim();
    const character = characters.find(c => c.id === id);

    if (!character) return conn.reply(m.chat, '👑 Personaje no encontrado.', m);

    if (character.user && character.user !== userId) {
      return conn.reply(m.chat,
        `🌟 El personaje *${character.name}* ya fue reclamado por @${character.user.split('@')[0]}.`,
        m,
        { mentions: [character.user] });
    }

    character.user = userId;
    character.status = 'Reclamado';
    await saveCharacters(characters);

    const username = await conn.getName(userId);
    const mensajeFinal = await getCustomClaimMessage(userId, username, character.name);

    await conn.reply(m.chat, mensajeFinal, m);

    cooldownsClaim[userId] = now + 30 * 60 * 1000; // 30 minutos

  } catch (e) {
    conn.reply(m.chat, `✘ Error al reclamar waifu:\n${e.message}`, m);
  }
};

claimHandler.help = ['claim'];
claimHandler.tags = ['waifus'];
claimHandler.command = ['claim', 'reclamar', 'c'];
claimHandler.group = true;

/* ---------------------------
   Handler: comprarwaifu / buy
   --------------------------- */
export const buyHandler = async (m, { conn, args }) => {
  const userId = m.sender;
  const user = global.db.data.users[userId];

  if (!args[0]) return m.reply('🌟 Usa: *#comprarwaifu <nombre de waifu>*');

  const nombre = args.join(' ').trim().toLowerCase();

  const ventas = await loadVentas();
  const characters = await loadCharacters();

  const venta = ventas.find(w => w.name.toLowerCase() === nombre);
  if (!venta) return m.reply('✘ Esa waifu no está en venta.');

  if (venta.vendedor === userId) return m.reply('✘ No puedes comprar tu propia waifu.');

  const precio = parseInt(venta.precio);

  if (user.coin < precio) {
    return m.reply(`✘ No tienes suficientes *${m.moneda}*. Necesitas *¥${precio.toLocaleString()} ${m.moneda}*.`);
  }

  const waifu = characters.find(c => c.name.toLowerCase() === nombre);
  if (!waifu) return m.reply('✘ No se encontró ese personaje en la base de datos.');

  user.coin -= precio;
  const vendedorId = venta.vendedor;
  global.db.data.users[vendedorId].coin += precio;

  waifu.user = userId;
  waifu.status = "Reclamado";

  const nuevasVentas = ventas.filter(w => w.name.toLowerCase() !== nombre);
  await saveVentas(nuevasVentas);
  await saveCharacters(characters);

  let nombreComprador = await conn.getName(userId);
  let textoPrivado = `🌟 Tu waifu *${waifu.name}* fue comprada por *${nombreComprador}*.\nGanaste *¥${precio.toLocaleString()} ${m.moneda}*.`;
  await conn.sendMessage(vendedorId, { text: textoPrivado }, { quoted: m });

  m.reply(`Has comprado a *${waifu.name}* por *¥${precio.toLocaleString()} ${m.moneda}* exitosamente!\nAhora es parte de tu harem.`);
};

buyHandler.help = ['comprarwaifu <nombre>'];
buyHandler.tags = ['waifus'];
buyHandler.command = ['comprarwaifu', 'buycharacter', 'buychar', 'buyc'];
buyHandler.group = true;
buyHandler.register = true;

/* ---------------------------
   Handler: regalar / givewaifu
   --------------------------- */
export const giveHandler = async (m, { conn, args }) => {
  const userId = m.sender;

  if (args.length < 2) {
    await conn.reply(m.chat, '🌟 Debes especificar el nombre del personaje y mencionar a quien quieras regalarlo. 👑', m);
    return;
  }

  const characterName = args.slice(0, -1).join(' ').toLowerCase().trim();
  let who = (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : null;

  if (!who) {
    await conn.reply(m.chat, '🌟 Debes mencionar a un usuario válido.', m);
    return;
  }

  try {
    const characters = await loadCharacters();
    const character = characters.find(c => c.name.toLowerCase() === characterName && c.user === userId);

    if (!character) {
      await conn.reply(m.chat, `👑 *${characterName}* no está reclamado por ti.`, m);
      return;
    }

    character.user = who;
    await saveCharacters(characters);

    const harem = await loadHarem();
    const userEntryIndex = harem.findIndex(entry => entry.userId === who);

    if (userEntryIndex !== -1) {
      harem[userEntryIndex].characterId = character.id;
      harem[userEntryIndex].lastClaimTime = Date.now();
    } else {
      const userEntry = {
        userId: who,
        characterId: character.id,
        lastClaimTime: Date.now()
      };
      harem.push(userEntry);
    }

    await saveHarem(harem);

    await conn.reply(m.chat, `❤ *${character.name}* ha sido regalado a @${who.split('@')[0]}!`, m, { mentions: [who] });
  } catch (error) {
    await conn.reply(m.chat, `✘ Error al regalar el personaje: ${error.message}`, m);
  }
};

giveHandler.help = ['regalar <nombre del personaje> @usuario'];
giveHandler.tags = ['anime'];
giveHandler.command = ['regalar', 'givewaifu', 'givechar'];
giveHandler.group = true;

/* ---------------------------
   Handler: vender / sell
   --------------------------- */
export const sellHandler = async (m, { args, conn }) => {
  const userId = m.sender;
  const texto = args.join(' ').trim();

  let personaje = null;
  let precio = null;

  if (m.quoted?.text) {

    const idMatch = m.quoted.text.match(/ID:\s*\*([^\*]+)\*/i);
    if (!idMatch) return m.reply('🌟 No se pudo encontrar el ID del personaje citado.');
    const id = idMatch[1].trim();
    const characters = await loadCharacters();
    personaje = characters.find(c => c.id === id);
    precio = parseInt(args[0]);
  } else {
    const precioDetectado = args.find(a => !isNaN(a));
    if (!precioDetectado) {
      return m.reply('🌟 Ingresa un precio válido.\n> Ejemplo: *#vender Miku Nakano 40000*');
    }

    precio = parseInt(precioDetectado);
    if (isNaN(precio) || precio < 1) {
      return m.reply('🌟 El precio debe ser un número válido mayor que 0.');
    }

    const nombre = args.filter(a => a !== precioDetectado).join(' ').toLowerCase();
    const characters = await loadCharacters();
    personaje = characters.find(c => c.name.toLowerCase() === nombre);

    if (!personaje) return m.reply(`🌟 Personaje *"${nombre}"* no encontrado.`);
  }

  if (personaje.user !== userId) return m.reply('🌟 Esta waifu no te pertenece.');

  const ventas = await loadVentas();

  personaje.enVenta = true;
  personaje.precioVenta = precio;

  ventas.push({
    id: personaje.id,
    name: personaje.name,
    precio: precio,
    vendedor: userId,
    fecha: Date.now()
  });

  // guardar characters actualizados y ventas
  await saveCharacters(await loadCharacters());
  await saveVentas(ventas);

  m.reply(`🙈 Has puesto en venta a *${personaje.name}* por *¥${precio.toLocaleString()} ${m.moneda}*.`);
};

sellHandler.help = ['venderwaifu'];
sellHandler.tags = ['waifus'];
sellHandler.command = ['vender', 'sell'];
sellHandler.group = true;
sellHandler.register = true;

/* ---------------------------
   Handler: vote / votar
   (Adaptado desde uno de los snippets originales)
   --------------------------- */
export let voteCooldowns = new Map();
export const voteCooldownTime = 1 * 60 * 60 * 1000; // 1 hora

let characterVotes = new Map();

export const voteHandler = async (m, { conn, args }) => {
  try {
    const userId = m.sender;

    if (voteCooldowns.has(userId)) {
      const expirationTime = voteCooldowns.get(userId) + voteCooldownTime;
      const now = Date.now();
      if (now < expirationTime) {
        const timeLeft = expirationTime - now;
        const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        await conn.reply(m.chat, `👑 Debes esperar *${Math.floor(minutes)} minutos ${seconds} segundos* para usar *#vote* de nuevo.`, m);
        return;
      }
    }

    const characters = await loadCharacters();
    const characterName = args.join(' ');

    if (!characterName) {
      await conn.reply(m.chat, '👑 Debes especificar un personaje para votarlo.', m);
      return;
    }

    const originalCharacterName = characterName;
    const character = characters.find(c => c.name.toLowerCase() === originalCharacterName.toLowerCase());

    if (!character) {
      await conn.reply(m.chat, '👑 Personaje no encontrado. Asegúrate de que el nombre esté en el formato correcto.', m);
      return;
    }

    if (characterVotes.has(originalCharacterName) && Date.now() < characterVotes.get(originalCharacterName)) {
      const expirationTime = characterVotes.get(originalCharacterName);
      const timeLeft = expirationTime - Date.now();
      const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);
      await conn.reply(m.chat, `👑 El personaje *${originalCharacterName}* ya ha sido votado recientemente. Debes esperar *${Math.floor(minutes)} minutos ${seconds} segundos* para volver a votar.`, m);
      return;
    }

    const incrementValue = Math.floor(Math.random() * 10) + 1;
    character.value = String(Number(character.value) + incrementValue);
    character.votes = (character.votes || 0) + 1;
    await saveCharacters(characters);

    const harem = await loadHarem();
    const userEntry = harem.find(entry => entry.userId === userId && entry.characterId === character.id);

    if (!userEntry) {
      harem.push({
        userId: userId,
        characterId: character.id,
        lastVoteTime: Date.now(),
        voteCooldown: Date.now() + voteCooldownTime
      });
    } else {
      userEntry.lastVoteTime = Date.now();
      userEntry.voteCooldown = Date.now() + voteCooldownTime;
    }
    await saveHarem(harem);

    voteCooldowns.set(userId, Date.now());
    characterVotes.set(originalCharacterName, Date.now() + voteCooldownTime);

    await conn.reply(m.chat, `✰ Votaste por el personaje *${originalCharacterName}*\n> Su nuevo valor es *${character.value}* (incrementado en *${incrementValue}*)\n> Total de votos: *${character.votes}*`, m);
  } catch (e) {
    await conn.reply(m.chat, `✘ Error al actualizar el valor: ${e.message}`, m);
  }
};

voteHandler.help = ['vote <nombre>'];
voteHandler.tags = ['anime'];
voteHandler.command = ['vote', 'votar'];
voteHandler.group = true;
voteHandler.register = true;

/* ---------------------------
   Handler: roll waifu (rw / rollwaifu)
   --------------------------- */
export const rollCooldowns = {};

export const rollHandler = async (m, { conn }) => {
  const userId = m.sender;
  const now = Date.now();

  if (rollCooldowns[userId] && now < rollCooldowns[userId]) {
    const remainingTime = Math.ceil((rollCooldowns[userId] - now) / 1000);
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return await conn.reply(m.chat, `🌟 ¡Espera *${minutes} minutos y ${seconds} segundos* Para solicitar una nueva waifu.`, m);
  }

  try {
    const characters = await loadCharacters();
    const randomCharacter = characters[Math.floor(Math.random() * characters.length)];
    const randomImage = Array.isArray(randomCharacter.img) ? randomCharacter.img[Math.floor(Math.random() * randomCharacter.img.length)] : randomCharacter.img;

    const harem = await loadHarem();
    const userEntry = harem.find(entry => entry.characterId === randomCharacter.id);
    const statusMessage = randomCharacter.user 
      ? `Reclamado por @${randomCharacter.user.split('@')[0]}` 
      : 'Libre';

    const message = `- *Nombre:*\n*${randomCharacter.name}*\n- *Genero:* ${randomCharacter.gender}\n- *Estado:*\n*${statusMessage}*`;

    const mentions = randomCharacter.user ? [randomCharacter.user] : [];
    await conn.sendFile(m.chat, randomImage, `${randomCharacter.name}.jpg`, message, m, { mentions });

    rollCooldowns[userId] = now + 15 * 60 * 1000; // 15 minutos

  } catch (error) {
    await conn.reply(m.chat, `✘ Error al cargar el personaje: ${error.message}`, m);
  }
};

rollHandler.help = ['rw', 'rollwaifu'];
rollHandler.tags = ['gacha'];
rollHandler.command = ['rw', 'rollwaifu'];
rollHandler.group = true;