import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {ArrowRight,Plus} from 'lucide-react';
import {woodMaterial,canvas,canvasTexture,seeded} from './materials';
import {motifs,svgMarkup} from './motifs';
import {heroMotif,heroOutline} from './heroMotif';
import './landing.css';
import './practice.css';
import reliefPhoto from './assets/practice-relief.png';
import pigmentPhoto from './assets/practice-pigment.png';
import printingPhoto from './assets/practice-printing.png';
import repeatPhoto from './assets/practice-repeat.jpg';

const discoveries=[
 {label:'Carve the block',body:'The design is traced onto wood. The maker cuts away the spaces around it, leaving a raised printing surface.',source:'https://www.dsource.in/resource/pethapur-block-making/making-process'},
 {label:'Apply the colour',body:'The raised face is pressed onto a colour pad. An even coating helps transfer the fine carved details to the cloth.',source:'https://us.daughtersofindia.net/blogs/on-the-journal/postcards-from-india-issue-10-hand-block-printing'},
 {label:'Press onto fabric',body:'Prepared fabric is laid flat on a padded table. The printer positions the inked block, presses firmly, then lifts it to reveal the impression.',source:'https://us.daughtersofindia.net/blogs/on-the-journal/postcards-from-india-issue-10-hand-block-printing'},
 {label:'Align and repeat',body:'The next impression is aligned with the last, using repeat points on the block. The printer reloads the colour and continues across the fabric.',source:'https://www.dsource.in/resource/pethapur-block-making/making-process'},
];

function Motif({x=0,y=0,size=100,index=1}:{x?:number;y?:number;size?:number;index?:number}){return <g transform={`translate(${x} ${y}) scale(${size/120})`} fill="currentColor">{motifs[index].paths.map((d,i)=><path key={i} d={d} fillRule="evenodd"/>)}</g>;}
function DiscoveryDrawing({index}:{index:number}){
 const photos=[
  {src:reliefPhoto,alt:'Carved wooden printing block with blue pigment on its raised floral relief',caption:'Carved relief and its printed impression.'},
  {src:pigmentPhoto,alt:'A red-inked floral block held above its impression on yellow fabric',caption:'Pigment on the raised face transfers to cloth.'},
  {src:printingPhoto,alt:'Hands aligning and pressing wooden blocks onto repeating textile patterns',caption:'Align, press, lift, and repeat.'},
  {src:repeatPhoto,alt:'A printer aligning a handled block with floral repeats on yellow fabric',caption:'Aligning the next impression.'},
 ];
 const photo=photos[index];
 return <figure className="practice-reference"><img src={photo.src} alt={photo.alt}/></figure>;
}

function FloatingBlock({pointer,onBegin}:{pointer:React.RefObject<{x:number;y:number}>;onBegin:()=>void}){
 const host=useRef<HTMLButtonElement>(null),[fallback,setFallback]=useState(false),spin=useRef(0),drag=useRef<{x:number;y:number;spin:number;moved:boolean}|null>(null);
 useEffect(()=>{
  const el=host.current!;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{setFallback(true);return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.13;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden','true');el.appendChild(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,30);camera.position.set(0,0,6.8);
  const env=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromScene(env,.04);scene.environment=environment.texture;scene.environmentIntensity=.42;env.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#fff9ec','#6c7480',1.5));
  const key=new THREE.DirectionalLight('#fff3dc',4.3);key.position.set(-3,5,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0004;key.shadow.normalBias=.015;scene.add(key);
  const fill=new THREE.DirectionalLight('#e3eafa',2.2);fill.position.set(4,-1,2);scene.add(fill);
  const rim=new THREE.DirectionalLight('#ffb35e',3.6);rim.position.set(-3,1,-2);scene.add(rim);
  const block=new THREE.Group();scene.add(block);
  const wood=woodMaterial(true),raised=woodMaterial();wood.color.set('#a39889');wood.roughness=.92;wood.normalScale.set(.72,.72);
  const pigment=canvas(512,512),ctx=pigment.getContext('2d')!,pixels=ctx.createImageData(512,512),random=seeded(81);
  for(let i=0;i<pixels.data.length;i+=4){const wear=random()>.985,v=wear?120:205+random()*45;pixels.data[i]=v;pixels.data[i+1]=v;pixels.data[i+2]=v;pixels.data[i+3]=255;}
  ctx.putImageData(pixels,0,0);raised.map?.dispose();raised.map=canvasTexture(pigment);raised.color.set('#04668c');raised.roughness=.69;raised.normalScale.set(.38,.38);
  const outline=new THREE.Shape();heroOutline.forEach(([x,y],i)=>{const px=(x-60)*2.5/120,py=(60-y)*2.5/120;if(i===0)outline.moveTo(px,py);else outline.lineTo(px,py);});outline.closePath();
  const bodyGeo=new THREE.ExtrudeGeometry(outline,{depth:.43,bevelEnabled:true,bevelSize:.022,bevelThickness:.018,bevelSegments:3,steps:3});bodyGeo.translate(0,0,-.215);
  const bodyUV=bodyGeo.attributes.uv;for(let i=0;i<bodyUV.count;i++)bodyUV.setXY(i,bodyUV.getX(i)/2.5+.5,bodyUV.getY(i)/2.5+.5);
  const body=new THREE.Mesh(bodyGeo,wood);body.castShadow=true;body.receiveShadow=true;block.add(body);
  const shapes=new SVGLoader().parse(svgMarkup(heroMotif)).paths.flatMap(p=>SVGLoader.createShapes(p));
  const reliefGeo=new THREE.ExtrudeGeometry(shapes,{depth:3.7,bevelEnabled:true,bevelSize:.035,bevelThickness:.12,bevelSegments:2,curveSegments:12});
  reliefGeo.scale(2.5/120,2.5/120,2.5/120);reliefGeo.translate(-1.25,-1.25,.224);
  const uv=reliefGeo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/120,uv.getY(i)/120);
  const relief=new THREE.Mesh(reliefGeo,[raised,wood]);relief.scale.y=-1;relief.castShadow=true;relief.receiveShadow=true;block.add(relief);
  for(const x of [-.52,.52]){const foot=new THREE.Mesh(new RoundedBoxGeometry(.18,.23,.36,3,.04),wood);foot.position.set(x,0,-.36);foot.castShadow=true;block.add(foot);}
  const handle=new THREE.Mesh(new RoundedBoxGeometry(1.38,.33,.30,5,.09),wood);handle.position.set(0,0,-.59);handle.castShadow=true;block.add(handle);
  const resize=()=>{const {width,height}=el.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const motion=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,last=0;
  const animate=(time:number)=>{const dt=Math.min((time-last)/1000,.05)||.016;last=time;const t=time/1000;const m=motion.matches;
   block.rotation.x=THREE.MathUtils.damp(block.rotation.x,.22+(m?0:pointer.current.y*.27),6,dt);
   block.rotation.y=THREE.MathUtils.damp(block.rotation.y,-.37+spin.current+(m?0:pointer.current.x*.4+Math.sin(t*.45)*.045),6,dt);
   block.rotation.z=THREE.MathUtils.damp(block.rotation.z,-.19+(m?0:pointer.current.x*.045),6,dt);
   if(m)block.rotation.set(.22,-.37+spin.current,-.19);block.position.y=m?0:Math.sin(t*1.2)*.055;
   renderer.render(scene,camera);frame=requestAnimationFrame(animate);
  };frame=requestAnimationFrame(animate);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();scene.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});wood.map?.dispose();wood.normalMap?.dispose();raised.map?.dispose();raised.normalMap?.dispose();wood.dispose();raised.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <button ref={host} className="hero-block" aria-label="Enter the studio: compose your printing block" onPointerDown={e=>{if(e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,spin:spin.current,moved:false};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current){const d=drag.current,dx=e.clientX-d.x;d.moved=d.moved||Math.hypot(dx,e.clientY-d.y)>7;if(d.moved)spin.current=d.spin+dx*.009;}}} onPointerCancel={()=>{drag.current=null;}} onClick={()=>{if(!drag.current?.moved)onBegin();drag.current=null;}} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();spin.current+=(e.key==='ArrowLeft'?-1:1)*Math.PI/4;}}}>
  {fallback&&<span className="block-fallback"><svg viewBox="0 0 120 120" aria-hidden="true">{heroMotif.paths.map((d,i)=><path key={i} d={d} fill="currentColor" fillRule="evenodd"/>)}</svg></span>}
 </button>;
}

export function Landing({onBegin}:{onBegin:()=>void}){
 const pointer=useRef({x:0,y:0}),[active,setActive]=useState<number|null>(null);
 const closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const keepOpen=()=>{if(closeTimer.current)clearTimeout(closeTimer.current);};
 const closeSoon=()=>{keepOpen();closeTimer.current=setTimeout(()=>setActive(null),180);};
 const open=(i:number)=>{keepOpen();setActive(i);};
 useEffect(()=>{const outside=(e:PointerEvent)=>{if(!(e.target as HTMLElement).closest('.discovery-point,.discovery-card')){keepOpen();setActive(null);}};document.addEventListener('pointerdown',outside);return()=>{keepOpen();document.removeEventListener('pointerdown',outside);};},[]);
 const current=active===null?null:discoveries[active];
 return <section className="landing" aria-label="Introduction to block printing" onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();pointer.current={x:(e.clientX-r.left)/r.width*2-1,y:(e.clientY-r.top)/r.height*2-1};}} onPointerLeave={()=>{pointer.current={x:0,y:0};}} onKeyDown={e=>{if(e.key==='Escape')setActive(null);}}>
  <div className="landing-grid" aria-hidden="true"/>
  <div className="landing-heading"><span className="landing-eyebrow">THE PRINTMAKER'S TABLE</span><h1>Block<br/><em>printing.</em></h1><p>A design is carved into a wooden block, coated with colour, then pressed onto fabric. Repeating the print builds the pattern.</p></div>
  <div className="hero-block-wrap"><div className="block-shadow" aria-hidden="true"/><FloatingBlock pointer={pointer} onBegin={onBegin}/></div>
  <div className="discovery-points" aria-label="Discover the craft"><svg className="process-orbit" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="50" cy="50" rx="44" ry="44"/></svg>{discoveries.map((d,i)=><button key={d.label} className={`discovery-point point-${i} ${active===i?'is-active':''}`} aria-label={`Discover ${d.label.toLowerCase()}`} aria-expanded={active===i} aria-controls="discovery-card" onPointerEnter={e=>{if(e.pointerType==='mouse')open(i);}} onPointerLeave={e=>{if(e.pointerType==='mouse')closeSoon();}} onFocus={()=>open(i)} onBlur={closeSoon} onClick={()=>open(i)}><span className="point-disc">0{i+1}<Plus size={15}/></span><span className="point-label">{d.label}</span></button>)}</div>
  {current&&<aside className="discovery-card compact-discovery" id="discovery-card" aria-label={current.label} aria-live="polite" onPointerEnter={keepOpen} onPointerLeave={closeSoon} onFocusCapture={keepOpen} onBlurCapture={closeSoon}><DiscoveryDrawing index={active!}/><p>{current.body}</p></aside>}
  <div className="landing-entry"><span className="entry-cue">MOVE TO TILT · DRAG TO TURN</span><button onClick={onBegin}>Click the block. Make it yours.<ArrowRight size={17}/></button><span className="entry-caption">BEGIN WITH 01 / COMPOSE</span></div>
 </section>;
}
