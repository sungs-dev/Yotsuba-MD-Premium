import { watchFile, unwatchFile } from "fs"
import chalk from "chalk"
import { fileURLToPath } from "url"
import fs from "fs"

// ====

global.owner = [
"573235915041",
"16503058299"
]

global.suittag = ["1829×××××××"] 
global.prems = []

// ====

global.libreria = "Baileys Multi Device"
global.vs = "^1.8.2|Latest"
global.nameqr = "✯ Yotsuba Nakano ✰"
global.sessions = "Sessions/Principal"
global.jadi = "Sessions/SubBot"
global.yukiJadibts = true

// ====

global.botname = "Yotsuba Nakano"
global.textbot = "✰ 𝐃𝐞𝐬𝐜𝐨𝐧𝐨𝐬𝐢𝐝𝐨 𝐗𝐳𝐬𝐲 (•̀ᴗ•́)و"
global.dev = "✰ 𝐃𝐞𝐬𝐜𝐨𝐧𝐨𝐬𝐢𝐝𝐨 𝐗𝐳𝐬𝐲 (•̀ᴗ•́)و"
global.author = "✰ 𝐃𝐞𝐬𝐜𝐨𝐧𝐨𝐬𝐢𝐝𝐨 𝐗𝐳𝐬𝐲 (•̀ᴗ•́)و"
global.etiqueta = "✰ 𝐃𝐞𝐬𝐜𝐨𝐧𝐨𝐬𝐢𝐝𝐨 𝐗𝐳𝐬𝐲 (•̀ᴗ•́)و"
global.currency = "Estrellas"
global.emoji = "👑"
global.banner = "https://files.catbox.moe/o2zoj6.png"
global.icono = "https://files.catbox.moe/o2zoj6.png"
global.catalogo = "https://files.catbox.moe/o2zoj6.png"

// ====

global.group = "https://chat.whatsapp.com/Ht5ck9c1Eji2TRBXSkTHjY?mode=wwt"
global.community = "https://whatsapp.com/channel/0029VbBkjlfLSmbWl3SH6737"
global.channel = "https://whatsapp.com/channel/0029VbBkjlfLSmbWl3SH6737"
global.github = "https://whatsapp.com/channel/0029VbBkjlfLSmbWl3SH6737"
global.gmail = "https://whatsapp.com/channel/0029VbBkjlfLSmbWl3SH6737"
global.ch = {
ch1: "120363421036863665@newsletter"
}

// ====

global.APIs = {
xyro: { url: "https://xyro.site", key: null },
yupra: { url: "https://api.yupra.my.id", key: null },
vreden: { url: "https://api.vreden.web.id", key: null },
delirius: { url: "https://api.delirius.store", key: null },
zenzxz: { url: "https://api.zenzxz.my.id", key: null },
siputzx: { url: "https://api.siputzx.my.id", key: null }
}

// ====

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
unwatchFile(file)
console.log(chalk.redBright("Update 'settings.js'"))
import(`${file}?update=${Date.now()}`)
})
