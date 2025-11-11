let R = Math.random;
let Fl = Math.floor;
let toM = (a) => "@" + a.split("@")[0];
function handler(m, {groupMetadata}) {
  let ps = groupMetadata.participants.map((v) => v.id);
  let a = ps[Fl(R() * ps.length)];
  let b;
  do b = ps[Fl(R() * ps.length)];
  while (b === a);
  let c;
  do c = ps[Fl(R() * ps.length)];
  while (b === a);
  let d;
  do d = ps[Fl(R() * ps.length)];
  while (b === a);
  let e;
  do e = ps[Fl(R() * ps.length)];
  while (b === a);
  let f;
  do f = ps[Fl(R() * ps.length)];
  while (b === a);
  let g;
  do g = ps[Fl(R() * ps.length)];
  while (b === a);
  let h;
  do h = ps[Fl(R() * ps.length)];
  while (b === a);
  let i;
  do i = ps[Fl(R() * ps.length)];
  while (b === a);
  let j;
  do j = ps[Fl(R() * ps.length)];
  while (b === a);
  m.reply(
    `*_Las 5 mejores parejas del grupo_*
    
1 - ${toM(a)} y ${toM(b)}
- Esta pareja esta destinada a estar junta 💙

2 - ${toM(c)} y ${toM(d)}
- Esta pareja son dos pequeños tortolitos enamorados ✨

3 - ${toM(e)} y ${toM(f)}
- Esta pareja ya tiene 2 hijos 🤱🧑‍🍼

4 - ${toM(g)} y ${toM(h)}
- Estos ya se casaron en secreto 💍

5 - ${toM(i)} y ${toM(j)}
- Esta pareja se esta de luna de miel ✨🥵😍`,
    null,
    {
      mentions: [a, b, c, d, e, f, g, h, i, j],
    }
  );
}
handler.help = ["formarpareja5"];
handler.tags = ["fun"];
handler.command = ["formarpareja5"];
handler.register = true;
handler.group = true;

export default handler;