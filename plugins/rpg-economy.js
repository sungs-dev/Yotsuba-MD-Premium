// Code created by Félix ofc
// Don't remove credits
// --> Github: https://github.com/FELIX-OFC

const currency = 'Coins';

// Inicializar base de datos si no existe
if (!global.db) global.db = { data: { users: {}, chats: {} } };
if (!global.db.data) global.db.data = { users: {}, chats: {} };
if (!global.db.data.users) global.db.data.users = {};
if (!global.db.data.chats) global.db.data.chats = {};

function formatTime(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const txt = [];
  if (h > 0) txt.push(`${h} hora${h !== 1 ? 's' : ''}`);
  if (m > 0 || h > 0) txt.push(`${m} minuto${m !== 1 ? 's' : ''}`);
  txt.push(`${s} segundo${s !== 1 ? 's' : ''}`);
  return txt.join(' ');
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const cofres = [
  "Has encontrado un cofre mágico en el reyno de Miku",
  "Has encontrado un cofre mágico en el reyno de Hatsune",
  "Has encontrado un cofre mágico en el reyno de Makima",
  "Has encontrado un cofre mágico en el reyno de Kotori Itsuka",
  "Has encontrado un cofre mágico en el reyno de Tanjiro"
];

// ==================== HANDLER PRINCIPAL ====================
let handler = async (m, { conn, args, usedPrefix, command, isAdmin }) => {
  const ctxErr = (global.rcanalx || {})
  const ctxWarn = (global.rcanalw || {})
  const ctxOk = (global.rcanalr || {})

  try {
    // Verificar si es grupo
    if (!m.isGroup) {
      return conn.reply(m.chat, '👑 Está funcion solo puede ser usada en grupos.', m, rcanal);
    }

    // COMANDO ECONOMY
    if (command === 'economy' || command === 'economia') {
      if (!isAdmin) {
        return conn.reply(m.chat, '🤨 Este comando no es para ti. Solo los reyes y aprendizes pueden usarlo we', m, rcanal);
      }

      // Inicializar chat si no existe
      if (!global.db.data.chats[m.chat]) {
        global.db.data.chats[m.chat] = { economy: true };
      }

      const action = args[0]?.toLowerCase();
      const currentStatus = global.db.data.chats[m.chat].economy;

      if (!action) {
        const estado = currentStatus ? 'Activado' : 'Desactivado;
        return conn.reply(m.chat, 
          `Estado del sistema rpg` +
          `🌟 *Opción:* ${usedPrefix}economy <on/off>\n` +
          `👑 *Estado actual:* ${estado}\n\n` +
          `💜 *Activa o desactiva los comandos de economía en este grupo usando las opciones.*`,
          m, rcanal
        );
      }

      if (action === 'on' || action === 'activar') {
        if (currentStatus) {
          return conn.reply(m.chat, '🤨 Eso estaba activado we', m, rcanal);
        }
        global.db.data.chats[m.chat].economy = true;
        return conn.reply(m.chat, 
          'Rpg activado ' +
          '*¡Ahora pueden disfrutar y tener dinero en este grupo!*',
          m, rcanal
        );
      }

      if (action === 'off' || action === 'desactivar') {
        if (!currentStatus) {
          return conn.reply(m.chat, '🤨 Esa webada ya estaba desactivada pinché bruto de mrd', m, rcanal);
        }
        global.db.data.chats[m.chat].economy = false;
        return conn.reply(m.chat, 
          '🌟 Sistema de economía desactivado ' +
          '🤣 Ahora todos serán pobres',
          m, rcanal
        );
      }

      return conn.reply(m.chat, '🤨 Ese formato ni lo conozco we. Usa on u off para manejar dinero', m, rcanal);
    }

    // VERIFICAR SI LA ECONOMÍA ESTÁ ACTIVA PARA OTROS COMANDOS
    if (!global.db.data.chats[m.chat]?.economy) {
      return conn.reply(m.chat, 
        `👑 *¡El sistema de economía está desactivado!*\n\n` +
        `☆ Un administrador puede activarlo con:\n` +
        `» ${usedPrefix}economy on`,
        m, rcanal
      );
    }

    // COMANDO BALANCE
    if (command === 'balance' || command === 'bal' || command === 'dinero') {
      let target = m.sender;

      // Verificar si mencionaron a alguien
      if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0];
      } else if (m.quoted) {
        target = m.quoted.sender;
      }

      // Inicializar usuario si no existe
      if (!global.db.data.users[target]) {
        global.db.data.users[target] = {
          coin: 1000, // Dinero inicial
          bank: 0,
          exp: 0,
          lastDaily: 0,
          lastcofre: 0,
          streak: 0
        };
      }

      const user = global.db.data.users[target];
      const coin = user.coin || 0;
      const bank = user.bank || 0;
      const total = coin + bank;

      let name = 'Usuario';
      try {
        name = await conn.getName(target);
      } catch {
        name = target.split('@')[0];
      }

      const texto = 
        `👑 Balance de ${name.toUpperCase()}\n\n` +
        `🌟 *En la Cartera:* ¥${coin.toLocaleString()} ${currency}\n` +
        `🏦 *En el Banco:* ¥${bank.toLocaleString()} ${currency}\n` +
        `💰 *En Total:* ¥${total.toLocaleString()} ${currency}\n\n` +
        `> *¡Usa más los comandos de economía para ser el top 1!*`;

      await conn.reply(m.chat, texto, m, rcanal);
    }

    // COMANDO DAILY
    if (command === 'daily' || command === 'diario') {
      const user = global.db.data.users[m.sender] || {
        coin: 1000,
        bank: 0,
        exp: 0,
        lastDaily: 0,
        streak: 0
      };

      const now = Date.now();
      const gap = 86400000; // 24 horas

      if (user.lastDaily && now < user.lastDaily + gap) {
        const waitTime = formatTime(Math.floor((user.lastDaily + gap - now) / 1000));
        return conn.reply(m.chat, 
          `💛 Vuelve en ` +
          `${waitTime}\n` +
          `> Exelente día!`,
          m, rcanal
        );
      }

      // Calcular recompensa
      const baseReward = 5000;
      const streakBonus = (user.streak || 0) * 500;
      const reward = baseReward + streakBonus;
      const expGain = 50;

      // Actualizar usuario
      user.coin = (user.coin || 1000) + reward;
      user.exp = (user.exp || 0) + expGain;
      user.streak = (user.streak || 0) + 1;
      user.lastDaily = now;

      // Guardar en la base de datos
      global.db.data.users[m.sender] = user;

      await conn.reply(m.chat,
        `👑 Recompensa diaria!\n\n` +
        `💰 *Coins:* ¥${reward.toLocaleString()} ${currency}\n` +
        `⭐ *Experiencia:* +${expGain} EXP\n` +
        `Exelente regalo. Vuelve ` +
        `mañana`,
        m, rcanal
      );
    }

    // COMANDO COFRE
    if (command === 'cofre' || command === 'coffer') {
      const user = global.db.data.users[m.sender] || {
        coin: 1000,
        bank: 0,
        exp: 0,
        lastcofre: 0
      };

      const now = Date.now();
      const gap = 86400000; // 24 horas

      if (user.lastcofre && now < user.lastcofre + gap) {
        const waitTime = formatTime(Math.floor((user.lastcofre + gap - now) / 1000));
        return conn.reply(m.chat,
          `*👑 Vuelve a reclamar un fore en:*\n\n` +
          `💜 *${waitTime}*\n` +
          `> ☪︎︎︎̸⃘̸࣭ٜ࣪࣪࣪۬◌⃘۪֟፝֯۫۫︎⃪𐇽۫۬👑⃘⃪۪֟፝֯۫۫۫۬◌⃘࣭ٜ࣪࣪࣪۬☪︎︎︎︎̸`,
          m, rcanal
        );
      }

      const reward = Math.floor(Math.random() * 3000) + 2000;
      const expGain = Math.floor(Math.random() * 30) + 20;

      user.coin = (user.coin || 1000) + reward;
      user.exp = (user.exp || 0) + expGain;
      user.lastcofre = now;

      global.db.data.users[m.sender] = user;

      await conn.reply(m.chat,
        `👑 Cofre de Hoy 👑\n\n` +
        `${pickRandom(cofres)}\n\n` +
        `💰 *Recompensa:* ¥${reward.toLocaleString()} ${currency}\n` +
        `⭐ *Experiencia:* +${expGain} EXP\n\n` +
        `> Vuelve a reclamar en ${waitTime} 🥰`,
        m, rcanal
      );
    }

    // COMANDO BALTOP
    if (command === 'baltop' || command === 'top') {
      const users = Object.entries(global.db.data.users)
        .map(([jid, data]) => ({
          jid,
          coin: data.coin || 0,
          bank: data.bank || 0,
          total: (data.coin || 0) + (data.bank || 0)
        }))
        .filter(user => user.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      if (users.length === 0) {
        return conn.reply(m.chat,
          `👑 Lista del top 👑\n\n` +
          `☹ *Aún no hay usuarios con dinero en su cartera.*\n` +
          `🛠 *Usa ${usedPrefix}daily para comenzar una aventura en este mundo mágico.*`,
          m, rcanal
        );
      }

      let text = `🌟 TOP 10 USUARIOS CON MÁS DINERO 🌟\n\n`;

      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        let name = 'Usuario';
        try {
          name = await conn.getName(user.jid);
        } catch {
          name = user.jid.split('@')[0];
        }

        text += `${i + 1}. 🎯 *${name}*\n`;
        text += `   💰 Total: ¥${user.total.toLocaleString()} ${currency}\n\n`;
      }

      await conn.reply(m.chat, text, m, rcanal);
    }

  } catch (error) {
    console.error('Error en economía:', error);
    conn.reply(m.chat, '😔 Ocurrió un error. Intenta nuevamente.', m, rcanal);
  }
};

// Configuración del handler
handler.help = [
  'economy',
  'balance', 
  'daily',
  'cofre',
  'baltop'
];

handler.tags = ['economy'];
handler.command = [
  'economy', 'economia',
  'balance', 'bal', 'dinero', 
  'daily', 'diario',
  'cofre', 'coffer',
  'baltop', 'top'
];
handler.group = true;

export default handler;