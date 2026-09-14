export type Motif = { id: string; name: string; family: string; paths: string[] };

const n = (v: number) => Number(v.toFixed(3));
export function circle(x: number, y: number, r: number) {
  return `M ${n(x-r)},${n(y)} a ${r},${r} 0 1,0 ${2*r},0 a ${r},${r} 0 1,0 ${-2*r},0 Z`;
}
function petal(cx: number, cy: number, angle: number, length: number, width: number) {
  const a = angle * Math.PI / 180;
  const p = (x: number, y: number) => `${n(cx + x*Math.cos(a)-y*Math.sin(a))},${n(cy+x*Math.sin(a)+y*Math.cos(a))}`;
  return `M ${p(0,0)} C ${p(-width,-length*.35)} ${p(-width*.6,-length*.8)} ${p(0,-length)} C ${p(width*.6,-length*.8)} ${p(width,-length*.35)} ${p(0,0)} Z`;
}
function flower(cx: number, cy: number, count: number, radius: number, length: number, width: number) {
  return Array.from({length:count},(_,i)=> {
    const a = i*Math.PI*2/count;
    return petal(cx+Math.sin(a)*radius,cy-Math.cos(a)*radius,i*360/count,length,width);
  });
}
const dotRing = (x:number,y:number,r:number,count:number,size:number) => Array.from({length:count},(_,i)=>circle(x+Math.cos(i*Math.PI*2/count)*r,y+Math.sin(i*Math.PI*2/count)*r,size));
const lotus = [
  petal(60,73,0,57,15),petal(55,76,-29,54,15),petal(65,76,29,54,15),
  petal(54,80,-60,48,13),petal(66,80,60,48,13),
  'M22,82 Q60,96 98,82 Q83,108 60,102 Q37,108 22,82 Z M35,90 Q60,101 85,90 Q60,96 35,90 Z',
  'M57,104 L63,104 L62,114 L58,114 Z',
  ...dotRing(60,80,5,5,1.4),
];
const paisley = [
  'M82,10 C51,4 15,40 18,76 C20,107 55,120 82,101 C107,84 99,52 75,51 C61,51 58,39 70,29 C78,24 85,21 82,10 Z M78,16 C53,15 23,44 24,76 C27,101 52,111 77,96 C97,82 92,58 75,57 C53,57 50,38 66,25 C69,22 75,19 78,16 Z',
  'M73,22 C48,23 29,54 31,77 C33,97 54,104 73,91 C86,82 87,65 73,64 C50,65 43,43 62,28 Q66,24 73,22 Z M45,70 C43,51 62,47 69,63 C77,67 80,78 69,85 C53,96 36,87 45,70 Z',
  ...flower(59,75,7,4,10,4),circle(59,75,2.7),
  ...[0,1,2,3,4,5,6,7].map(i=>circle(37+Math.sin(i*.34)*-8,40+i*6,1.3)),
];
const sprig = [
  'M58,108 Q63,81 57,53 L61,53 Q68,83 62,109 Z',
  petal(58,88,-60,30,10),petal(64,77,60,29,10),petal(58,65,-65,20,8),
  ...flower(60,36,8,7,20,7),circle(60,36,5),...dotRing(60,36,12,8,1.3),
];
const vine = ['M55,112 C86,75 25,58 58,9 L63,11 C32,58 94,75 61,113 Z',
  petal(60,95,-68,35,11),petal(66,79,57,33,11),petal(51,59,-70,33,11),petal(51,42,54,32,11),petal(57,24,-24,20,8)];
const rosette = [...flower(60,60,12,20,33,8),...flower(60,60,12,8,17,4.6),circle(60,60,5),...dotRing(60,60,29,12,1.5)];
const jasmine = [...flower(60,60,8,9,32,13),circle(60,60,6),...dotRing(60,60,17,8,1.8)];
const lattice = [
  'M60,5 L115,60 L60,115 L5,60 Z M60,13 L13,60 L60,107 L107,60 Z',
  'M60,21 L99,60 L60,99 L21,60 Z M60,28 L28,60 L60,92 L92,60 Z',
  ...flower(60,60,4,6,24,11),circle(60,60,3),
  circle(60,13,2),circle(13,60,2),circle(107,60,2),circle(60,107,2),
];
const border = [
  'M5,100 H115 V104 H5 Z M5,109 H115 V112 H5 Z',
  ...[20,60,100].flatMap(x=>[petal(x,88,0,35,9),petal(x-2,89,-55,25,8),petal(x+2,89,55,25,8),circle(x,45,2.4)]),
  'M4,94 Q20,82 40,94 Q60,82 80,94 Q100,82 116,94 L116,97 Q100,87 80,97 Q60,87 40,97 Q20,87 4,97 Z',
];
const corner = ['M12,12 H105 V17 H17 V106 H12 Z M23,25 H28 V93 H23 Z M28,23 H93 V28 H28 Z',
  petal(42,42,135,67,16),petal(43,43,95,49,13),petal(43,43,175,49,13),
  circle(36,36,4),...dotRing(92,92,7,7,2)];
const fern = ['M58,112 L62,112 L62,19 L58,19 Z',
  ...[0,1,2,3].flatMap(i=>[petal(57,96-i*20,-58,36-i*4,9),petal(63,96-i*20,58,36-i*4,9)]),petal(60,28,0,23,8)];

export const motifs: Motif[] = [
  {id:'lotus',name:'Lotus bloom',family:'Botanical',paths:lotus},
  {id:'paisley',name:'Paisley',family:'Ornamental',paths:paisley},
  {id:'sprig',name:'Floral sprig',family:'Botanical',paths:sprig},
  {id:'rosette',name:'Marigold',family:'Floral',paths:rosette},
  {id:'vine',name:'Climbing vine',family:'Botanical',paths:vine},
  {id:'lattice',name:'Jali diamond',family:'Geometric',paths:lattice},
  {id:'border',name:'Petal border',family:'Border',paths:border},
  {id:'corner',name:'Garden corner',family:'Corner',paths:corner},
  {id:'jasmine',name:'Jasmine',family:'Floral',paths:jasmine},
  {id:'fern',name:'Fern frond',family:'Botanical',paths:fern},
];

export const pigments = [
  {name:'Indigo',color:'#284d70'}, {name:'Madder',color:'#922f3e'},
  {name:'Ochre',color:'#ba852f'}, {name:'Charcoal',color:'#373b39'},
  {name:'Forest',color:'#3d6651'}, {name:'Terracotta',color:'#b45f47'},
];
export function svgMarkup(motif: Motif) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${motif.paths.map(d=>`<path fill="#000" fill-rule="evenodd" d="${d}"/>`).join('')}</svg>`;
}
