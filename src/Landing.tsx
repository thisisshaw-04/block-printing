import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {ArrowUpRight,ArrowRight,X,Plus} from 'lucide-react';
import {woodMaterial} from './materials';
import {motifs,svgMarkup} from './motifs';
import './landing.css';

const discoveries=[
 {label:'The block',title:'Carve away. Leave a mark.',kicker:'01 / WOOD → RELIEF',body:'A maker removes the wood around a design. The raised surface is what touches the cloth. In Pethapur, Gujarat, block makers trace, drill and chisel seasoned teak, then finish the block with a handle.',source:'D’source · IDC, IIT Bombay',url:'https://www.dsource.in/resource/pethapur-block-making/making-process',note:'The raised parts print. The spaces stay clear.'},
 {label:'The colour',title:'Colour has a method.',kicker:'02 / BLOCK → COLOUR',body:'Direct printing puts colour onto cloth. In resist printing, a paste protects selected areas while the cloth is dyed. Complex multicolour designs can need several blocks, each carrying a different part of the design and aligned to the last.',source:'V&A · Resist block printing',url:'https://www.vam.ac.uk/blog/fabric-of-india/location-scout-part-ii-resist-block-printing',note:'Different blocks. One layered design.'},
 {label:'The repeat',title:'One stamp becomes a rhythm.',kicker:'03 / MARK → PATTERN',body:'Press, lift, align, repeat. Small registration points help the printer place one impression beside the next. A single motif can travel across a length of cloth, building a pattern through careful, repeated movements.',source:'D’source · Making process',url:'https://www.dsource.in/resource/pethapur-block-making/making-process',note:'Look for the tiny alignment marks.'},
 {label:'The people',title:'A living craft, in many places.',kicker:'04 / KNOWLEDGE → GENERATIONS',body:'India’s printing traditions are distinct, shaped by local materials and communities. Bagru, Sanganer, Bagh and ajrakh each have their own practices. Block makers, printers and dyers bring different skills to the same piece of cloth.',source:'Impart · Museum of Art & Photography',url:'https://imp-art.org/articles/block-printing/',note:'Many traditions. No single recipe.'},
];

function Motif({x=0,y=0,size=100,index=1}:{x?:number;y?:number;size?:number;index?:number}){return <g transform={`translate(${x} ${y}) scale(${size/120})`} fill="currentColor">{motifs[index].paths.map((d,i)=><path key={i} d={d} fillRule="evenodd"/>)}</g>;}
function DiscoveryDrawing({index}:{index:number}){
 return <svg className={`discovery-drawing drawing-${index}`} viewBox="0 0 260 130" role="img" aria-label={['Illustration of a raised motif on a wooden block','Illustration of three colour layers making a pattern','Illustration of aligned repeating impressions','Illustration of a family of printing motifs'][index]}>
  {index===0?<><path d="M64 30L168 13 209 43 105 62Z" fill="#a78159"/><path d="M64 30v55l41 32V62Z" fill="#775334"/><path d="M105 62l104-19v55l-104 19Z" fill="#95724d"/><g transform="matrix(.85,-.15,.52,.38,81,23)" style={{color:'#ead7b2'}}><Motif size={109}/></g><path d="M174 16l23-12M185 55h48" fill="none" stroke="currentColor" strokeWidth=".6"/><text x="192" y="70">RELIEF</text></>:
  index===1?<><g opacity=".8" style={{color:'#a74834'}}><Motif x={18} y={22} size={80}/></g><g style={{color:'#c8963c'}}><Motif x={91} y={22} size={80}/></g><g style={{color:'#345878'}}><Motif x={164} y={22} size={80}/></g><path d="M95 57h10m-5-5v10M167 57h10m-5-5v10" stroke="currentColor"/><text x="27" y="118">01</text><text x="112" y="118">02</text><text x="196" y="118">03</text></>:
  index===2?<><path d="M18 21h224v93H18Z M92 21v93M167 21v93" fill="none" stroke="currentColor" strokeWidth=".5" strokeDasharray="3 4"/>{[21,95,169].map((x,i)=><g key={x} opacity={1-i*.15}><Motif x={x} y={25} size={69}/><path d={`M${x-3} 16v10m-5-5h10`} fill="none" stroke="currentColor"/></g>)}</>:
  <>{[1,3,5].map((m,i)=><g key={m} style={{color:['#345878','#a74834','#567354'][i]}}><Motif x={15+i*81} y={23} size={69} index={m}/></g>)}<path d="M27 111H234" stroke="currentColor" strokeWidth=".5"/><text x="26" y="126">BLOCK MAKER → PRINTER → DYER</text></>}
 </svg>;
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
  scene.add(new THREE.HemisphereLight('#fff7e4','#6a523c',2));
  const key=new THREE.DirectionalLight('#fff3dc',4.3);key.position.set(-3,5,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0004;key.shadow.normalBias=.015;scene.add(key);
  const fill=new THREE.DirectionalLight('#dce8ff',1.5);fill.position.set(4,-1,2);scene.add(fill);
  const block=new THREE.Group();scene.add(block);
  const wood=woodMaterial(true),raised=woodMaterial();raised.color.setRGB(3.1,2.85,2.25);raised.normalScale.set(.22,.22);
  const body=new THREE.Mesh(new RoundedBoxGeometry(2.42,2.42,.42,5,.065),wood);body.castShadow=true;body.receiveShadow=true;block.add(body);
  const shapes=new SVGLoader().parse(svgMarkup(motifs[1])).paths.flatMap(p=>SVGLoader.createShapes(p));
  const reliefGeo=new THREE.ExtrudeGeometry(shapes,{depth:5.4,bevelEnabled:true,bevelSize:.35,bevelThickness:.3,bevelSegments:2,curveSegments:10});
  reliefGeo.scale(2.06/120,2.06/120,2.06/120);reliefGeo.translate(-1.03,-1.03,.224);
  const uv=reliefGeo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/120,uv.getY(i)/120);
  const relief=new THREE.Mesh(reliefGeo,[raised,wood]);relief.scale.y=-1;relief.castShadow=true;relief.receiveShadow=true;block.add(relief);
  for(let i=0;i<4;i++){const edge=new THREE.Mesh(new RoundedBoxGeometry(2.23,.035,.055,2,.009),raised);edge.rotation.z=i*Math.PI/2;edge.position.set(i%2?(i===1?1.11:-1.11):0,i%2?0:(i===0?1.11:-1.11),.23);block.add(edge);}
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
  {fallback&&<span className="block-fallback"><svg viewBox="0 0 120 120" aria-hidden="true"><Motif size={120}/></svg></span>}
 </button>;
}

export function Landing({onBegin}:{onBegin:()=>void}){
 const pointer=useRef({x:0,y:0}),[active,setActive]=useState<number|null>(null),[sources,setSources]=useState(false);
 const sourceDialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(sources)sourceDialog.current?.showModal();},[sources]);
 const current=active===null?null:discoveries[active];
 return <section className="landing" aria-label="Introduction to block printing" onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();pointer.current={x:(e.clientX-r.left)/r.width*2-1,y:(e.clientY-r.top)/r.height*2-1};}} onPointerLeave={()=>{pointer.current={x:0,y:0};}} onKeyDown={e=>{if(e.key==='Escape')setActive(null);}}>
  <div className="landing-grid" aria-hidden="true"/>
  <div className="landing-heading"><span className="landing-eyebrow">THE ART OF HAND BLOCK PRINTING</span><h1>Small block.<br/><em>Endless</em><br/>possibilities.</h1><p>A carved piece of wood.<br/>A little colour. A human hand.<br/>That’s where a pattern begins.</p></div>
  <div className="landing-intro"><span className="landing-eyebrow">AN IMPRESSION, MADE BY HAND</span><p>Block printing brings a carved design to cloth, one press at a time.</p><span className="intro-explore">Explore the circles.<br/>Then make a mark of your own.</span></div>
  <div className="block-orbit" aria-hidden="true"><svg viewBox="0 0 700 600"><ellipse cx="350" cy="303" rx="290" ry="204" transform="rotate(-24 350 303)"/><path d="M87 220h50M543 130h54M580 426h47M136 460h40"/><circle cx="350" cy="303" r="260" strokeDasharray="1 18"/></svg></div>
  <div className="hero-block-wrap"><div className="block-shadow" aria-hidden="true"/><FloatingBlock pointer={pointer} onBegin={onBegin}/></div>
  <div className="discovery-points" aria-label="Discover the craft">{discoveries.map((d,i)=><button key={d.label} className={`discovery-point point-${i} ${active===i?'is-active':''}`} aria-label={`Discover ${d.label.toLowerCase()}`} aria-expanded={active===i} aria-controls="discovery-card" onPointerEnter={e=>{if(e.pointerType==='mouse')setActive(i);}} onFocus={()=>setActive(i)} onClick={()=>setActive(i)}><span className="point-disc">0{i+1}<Plus size={15}/></span><span className="point-label">{d.label}</span></button>)}</div>
  {current&&<aside className="discovery-card" id="discovery-card" aria-label={current.label} aria-live="polite"><header><span>{current.kicker}</span><button aria-label="Close discovery" onClick={()=>setActive(null)}><X size={14}/></button></header><DiscoveryDrawing index={active!}/><h2>{current.title}</h2><p>{current.body}</p><span className="drawing-note">{current.note}</span><a href={current.url} target="_blank" rel="noreferrer">{current.source}<ArrowUpRight size={12}/></a></aside>}
  <div className="landing-entry"><span className="entry-cue">MOVE TO TILT · DRAG TO TURN</span><button onClick={onBegin}>Click the block. Make it yours.<ArrowRight size={17}/></button><span className="entry-caption">BEGIN WITH 01 / COMPOSE</span></div>
  <footer className="landing-footer"><div><span className="footer-dot"/>A DIGITAL PLAYGROUND FOR A HANDMADE CRAFT</div><button onClick={()=>setSources(true)}>The craft & our sources<ArrowUpRight size={13}/></button><span className="landing-edition">COMPOSE / CARVE / PRINT</span></footer>
  {sources&&<dialog className="craft-sources" ref={sourceDialog} onCancel={()=>setSources(false)} aria-labelledby="craft-sources-title"><button className="sources-close" aria-label="Close sources" onClick={()=>setSources(false)}><X/></button><span className="landing-eyebrow">BEHIND THE EXPERIENCE</span><h2 id="craft-sources-title">Made to explore.<br/>Rooted in a living craft.</h2><p>This studio is a playful introduction to designing a block and making repeated impressions. Real textile traditions involve skilled carving, fabric preparation, colour chemistry, washing and finishing that vary by place and practice.</p><p>Our illustrations explain ideas; they are not archival objects or instructions for one specific regional tradition.</p><ul>{[discoveries[0],discoveries[1],discoveries[3],{source:'Government Museum Chennai · Printing methods',url:'https://govtmuseumchennai.org/museum-section/textile-block-gallery/block-printing-method'}].map(d=><li key={d.url}><a href={d.url} target="_blank" rel="noreferrer">{d.source}<ArrowUpRight size={14}/></a></li>)}</ul><button className="primary" onClick={()=>{setSources(false);onBegin();}}>Try the studio<ArrowRight size={16}/></button></dialog>}
 </section>;
}
