import yts from 'yt-search';

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    throw `*👑 Dime el nombre de la música encantada que quieres que busque.`;
  }

  try {
    await m.react('🕒'); // Reacción de búsqueda

    const search = await yts(text);
    const videoInfo = search.all?.[0];

    if (!videoInfo) {
      throw '*No encontré nada we*';
    }

    const body = `💜 Estoy buscando ${videoInfo.title} desde el canal ${videoInfo.author.name}
> 😺 *Como lo quieres:*`;

    await conn.sendMessage(
      m.chat,
      {
        image: { url: videoInfo.thumbnail },
        caption: body,
        footer: 'Yotsuba Nakano IA',
        buttons: [
          { buttonId: `.ytmp3 ${videoInfo.url}`, buttonText: { displayText: 'Como Audio' } },
          { buttonId: `.play2 ${videoInfo.url}`, buttonText: { displayText: 'Como Video' } },
        ],
        viewOnce: true,
        headerType: 4,
      },
      { quoted: m }
    );

    await m.react('✅'); // Reacción de éxito
  } catch (e) {
    await m.reply(`❌ *Error:* ${e.message}`);
    await m.react('✖️');
  }
};

handler.command = ['play', 'playvid'];
handler.tags = ['downloader'];
handler.group = true;
handler.limit = 6;

export default handler;