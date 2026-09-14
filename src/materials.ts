import * as THREE from 'three';
import woodImage from './assets/wood.jpg';
import woodNormal from './assets/wood-normal.jpg';
import linenImage from './assets/linen.jpg';

export function seeded(seed: number) {
  return () => { seed |= 0; seed = seed + 0x6d2b79f5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function canvas(w:number,h:number) {
  const c=document.createElement('canvas'); c.width=w; c.height=h; return c;
}
export function canvasTexture(c:HTMLCanvasElement, repeat=1) {
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(repeat,repeat); t.anisotropy=8; return t;
}
export function woodMaterial(dark=false) {
  const loader=new THREE.TextureLoader(),map=loader.load(woodImage),normal=loader.load(woodNormal);
  map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=normal.wrapS=normal.wrapT=THREE.RepeatWrapping;
  map.anisotropy=normal.anisotropy=8;
  return new THREE.MeshStandardMaterial({map,normalMap:normal,normalScale:new THREE.Vector2(.45,.45),roughness:.82,color:dark?new THREE.Color(1.5,1.2,.95):new THREE.Color(2.25,2.05,1.7)});
}
export function linenTexture(){const t=new THREE.TextureLoader().load(linenImage);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(10,10*5.6/24);t.anisotropy=8;return t;}
export function weaveTexture() {
  const c=canvas(512,512),ctx=c.getContext('2d')!,im=ctx.createImageData(512,512),rand=seeded(778);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
    const threadX=Math.cos(x*Math.PI/4),threadY=Math.cos(y*Math.PI/4);
    const over=(Math.floor(x/8)+Math.floor(y/8))%2===0;
    const v=142+(over?threadX*28+threadY*12:threadY*28+threadX*12)+(rand()-.5)*15;
    const i=(y*512+x)*4; im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;
  }
  ctx.putImageData(im,0,0);
  const t=canvasTexture(c);t.colorSpace=THREE.NoColorSpace;t.repeat.set(40,9.3);return t;
}
export function contactShadow() {
  const c=canvas(128,128),ctx=c.getContext('2d')!;
  const g=ctx.createRadialGradient(64,64,8,64,64,62);g.addColorStop(0,'rgba(33,23,16,.5)');g.addColorStop(.45,'rgba(33,23,16,.28)');g.addColorStop(1,'rgba(33,23,16,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
  return new THREE.CanvasTexture(c);
}
