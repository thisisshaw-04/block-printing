import {circle,type Motif} from './motifs';

// The backing and outer petals share the same lobed contour.
const lobes=8;
export const heroOutline=Array.from({length:320},(_,i)=>{
 const a=i*Math.PI*2/320,r=47+7*Math.cos(lobes*a);
 return [60+Math.sin(a)*r,60-Math.cos(a)*r] as const;
});
const paths:string[]=[];
for(let i=0;i<lobes;i++){
 const a=i*Math.PI*2/lobes;
 const p=(x:number,y:number)=>`${(60+x*Math.cos(a)-y*Math.sin(a)).toFixed(3)},${(60+x*Math.sin(a)+y*Math.cos(a)).toFixed(3)}`;
 let leaf=`M${p(0,-13)} C${p(-18,-24)} ${p(-12,-43)} ${p(0,-51)} C${p(15,-42)} ${p(15,-23)} ${p(0,-13)}Z`;
 // Narrow negative channels leave a raised midrib and individually carved veins.
 for(const side of [-1,1])for(let j=0;j<7;j++){
  const y=-20-j*3.6,w=5.7*Math.sin((j+1)/9*Math.PI);
  leaf+=` M${p(side*1.1,y)} Q${p(side*w,y-1)} ${p(side*(w+.8),y-5)} Q${p(side*w*.55,y-2)} ${p(side*1.1,y-1.15)}Z`;
 }
 paths.push(leaf);
 const b=a+Math.PI/lobes;
 for(const r of [30,35,40])paths.push(circle(60+Math.sin(b)*r,60-Math.cos(b)*r,r===35?1.3:.9));
}
paths.push(circle(60,60,12.5)+' '+circle(60,60,10.8));
for(let i=0;i<12;i++){
 const a=i*Math.PI/6;
 const p=(r:number,t:number)=>`${60+Math.sin(t)*r},${60-Math.cos(t)*r}`;
 paths.push(`M${p(3,a)} Q${p(9,a-.29)} ${p(10,a)} Q${p(9,a+.29)} ${p(3,a)}Z`);
}
paths.push(circle(60,60,2.1));
export const heroMotif:Motif={id:'carved-floral-specimen',name:'Carved floral medallion',family:'Botanical',paths};
