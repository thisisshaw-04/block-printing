import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
import {writeFileSync} from 'node:fs';
// Rectify the photographed printing face and trace its blue relief as geometry.
const {data,info}=await sharp('src/assets/practice-relief.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
const boundary=[[8,456],[27,420],[74,389],[133,359],[192,338],[248,340],[293,369],[340,372],[392,349],[410,326],[464,310],[510,312],[548,330],[568,357],[566,388],[589,408],[638,398],[680,412],[726,436],[765,478],[783,515],[777,547],[810,572],[857,582],[893,612],[905,650],[897,685],[917,709],[935,733],[925,776],[900,802],[838,828],[787,858],[750,910],[721,939],[686,960],[621,964],[566,952],[521,923],[481,910],[421,925],[364,940],[301,919],[263,885],[253,841],[219,799],[174,783],[135,742],[112,698],[88,660],[61,624],[37,564],[18,514]];
const inside=(x,y)=>{let hit=false;for(let i=0,j=boundary.length-1;i<boundary.length;j=i++){const a=boundary[i],b=boundary[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
const N=650,mask=new Uint8Array(N*N);
const source=(u,v)=>[u*730+v*305-50,400-u*185+v*630];
const inverse=(x,y)=>{x+=50;y-=400;const det=730*630+305*185;return [(630*x-305*y)/det,(185*x+730*y)/det];};
for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){
 const [sx,sy]=source(x/N,y/N);if(!inside(sx,sy))continue;
 const i=(Math.round(sy)*info.width+Math.round(sx))*info.channels,r=data[i],g=data[i+1],b=data[i+2];
 if(b>r*1.30&&g>r*1.18&&b>48&&g>40)mask[y*N+x]=1;
}
// Oriented contour edges preserve the recessed holes through extrusion.
const edges=new Map(),key=(x,y)=>y*(N+1)+x;
const add=(a,b)=>{if(!edges.has(a))edges.set(a,[]);edges.get(a).push(b);};
for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++)if(mask[y*N+x]){
 if(!mask[(y-1)*N+x])add(key(x,y),key(x+1,y));
 if(!mask[y*N+x+1])add(key(x+1,y),key(x+1,y+1));
 if(!mask[(y+1)*N+x])add(key(x+1,y+1),key(x,y+1));
 if(!mask[y*N+x-1])add(key(x,y+1),key(x,y));
}
const loops=[];
while(edges.size){const start=edges.keys().next().value;let cur=start,loop=[];do{loop.push([cur%(N+1),Math.floor(cur/(N+1))]);const next=edges.get(cur);if(!next)break;const n=next.pop();if(!next.length)edges.delete(cur);cur=n;}while(cur!==start);
 const area=loop.reduce((s,p,i)=>{const q=loop[(i+1)%loop.length];return s+p[0]*q[1]-p[1]*q[0];},0)/2;
 if(Math.abs(area)>7){loop=loop.filter((p,i,a)=>{const q=a[(i+a.length-1)%a.length],r=a[(i+1)%a.length];return (p[0]-q[0])*(r[1]-p[1])!==(p[1]-q[1])*(r[0]-p[0]);});loops.push(loop);}
}
const path=loops.map(loop=>loop.map((p,i)=>`${i?'L':'M'}${(p[0]*120/N).toFixed(2)},${(p[1]*120/N).toFixed(2)}`).join('')+'Z').join(' ');
writeFileSync('src/assets/reference-carving.json',JSON.stringify({outline:boundary.map(([x,y])=>inverse(x,y).map(v=>v*120)),path}));
console.log(`Traced ${loops.length} relief contours from the reference.`);
