import {Shape} from 'three';
import {circle,type Motif} from './motifs';

// The hooked silhouette is shared by the backing and its carved perimeter.
const outline=new Shape();
outline.moveTo(85,8);outline.bezierCurveTo(50,1,12,40,15,78);
outline.bezierCurveTo(18,109,56,121,85,101);
outline.bezierCurveTo(110,83,100,51,77,49);
outline.bezierCurveTo(61,48,62,37,73,28);
outline.bezierCurveTo(82,23,91,18,85,8);
export const heroOutline=outline.getPoints(100).map(p=>[p.x,p.y] as const);
const paths:string[]=[
 'M82,12 C50,7 18,43 20,77 C23,104 56,115 82,97 C102,82 95,55 76,54 C55,52 55,35 70,25 Q85,17 82,12 Z M77,17 C49,17 23,46 25,76 C28,99 55,108 78,93 C95,81 91,61 75,60 C48,58 48,34 67,22 Q73,18 77,17 Z',
 'M38,84 C27,66 36,39 60,25 L62,27 C41,43 35,63 42,78 Z',
 'M41,84 C52,100 78,99 86,81 L88,82 C80,106 50,106 38,89 Z',
];
// Closely spaced recessed cuts divide the perimeter into hand-carved ribs.
const bezier=(v:number[],t:number)=>{const u=1-t;return u*u*u*v[0]+3*u*u*t*v[1]+3*u*t*t*v[2]+t*t*t*v[3];};
function ribbedBorder(ox:number[],oy:number[],ix:number[],iy:number[],count:number){
 const p=(t:number,f:number)=>{const x=bezier(ox,t),y=bezier(oy,t);return `${(x+(bezier(ix,t)-x)*f).toFixed(3)},${(y+(bezier(iy,t)-y)*f).toFixed(3)}`;};
 for(let i=1;i<count;i++){const t=i/count,d=.18/count;paths[0]+=` M${p(t-d,.22)} L${p(t+d,.22)} L${p(t+d,.8)} L${p(t-d,.8)}Z`;}
}
ribbedBorder([82,50,18,20],[12,7,43,77],[77,49,23,25],[17,17,46,76],35);
ribbedBorder([20,23,56,82],[77,104,115,97],[25,28,55,78],[76,99,108,93],28);
ribbedBorder([82,102,95,76],[97,82,55,54],[78,95,91,75],[93,81,61,60],22);
function leaf(x:number,y:number,angle:number,length:number,width:number){
 const a=angle*Math.PI/180,p=(u:number,v:number)=>`${(x+u*Math.cos(a)-v*Math.sin(a)).toFixed(3)},${(y+u*Math.sin(a)+v*Math.cos(a)).toFixed(3)}`;
 let d=`M${p(0,0)} C${p(-width,-length*.32)} ${p(-width*.65,-length*.82)} ${p(0,-length)} C${p(width*.65,-length*.82)} ${p(width,-length*.32)} ${p(0,0)}Z`;
 for(const side of [-1,1])for(let j=0;j<5;j++){const t=.25+j*.125,w=width*.47*Math.sin(t*Math.PI);d+=` M${p(side*.5,-length*t)} Q${p(side*w,-length*(t+.04))} ${p(side*(w+.45),-length*(t+.15))} Q${p(side*w*.5,-length*(t+.09))} ${p(side*.5,-length*(t+.045))}Z`;}
 paths.push(d);
}
function flower(x:number,y:number,r:number,count:number,phase:number){
 for(let i=0;i<count;i++){const a=i*Math.PI*2/count+phase;leaf(x+Math.sin(a)*r*.25,y-Math.cos(a)*r*.25,a*180/Math.PI,r*.7,r*.2);}
 paths.push(circle(x,y,r*.2)+' '+circle(x,y,r*.12),circle(x,y,r*.07));
 for(let i=0;i<count;i++){const a=(i+.5)*Math.PI*2/count+phase;paths.push(circle(x+Math.sin(a)*r*.7,y-Math.cos(a)*r*.7,.55));}
}
flower(62,80,17.5,11,.12);flower(48,57,8,7,.3);flower(77,66,6.5,6,.7);
leaf(48,76,-42,18,4.5);leaf(52,46,29,17,4);leaf(36,69,-14,16,3.7);
leaf(77,93,55,12,3);leaf(46,93,-62,12,3);leaf(60,39,40,11,3);
for(let i=0;i<23;i++){const a=(140+i*7)*Math.PI/180,x=59+32*Math.cos(a),y=70+30*Math.sin(a);if(x<50||y>93)paths.push(circle(x,y,.65));}
for(let i=0;i<10;i++){const t=i/9;paths.push(circle(33+25*t*t,53-26*t,.7));}
export const heroMotif:Motif={id:'carved-paisley-garden',name:'Paisley garden carving',family:'Ornamental',paths};
