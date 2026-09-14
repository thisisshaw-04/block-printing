import {useEffect,useRef,useState} from 'react';
import {getStroke} from 'perfect-freehand';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {ArrowRight,Check,PenLine,Trash2,Undo2,Upload,X} from 'lucide-react';
import {motifs,svgMarkup,type Motif} from './motifs';

function outline(points:number[][],size:number){
  const edge=getStroke(points,{size,thinning:.15,smoothing:.65,streamline:.4,simulatePressure:true});
  if(edge.length<3)return '';
  return `M${edge.map(p=>`${p[0].toFixed(2)},${p[1].toFixed(2)}`).join('L')}Z`;
}
function normalizedPaths(svg:string,scale=1,x=60,y=60){
  const parsed=new SVGLoader().parse(svg);
  const paths=parsed.paths.filter(p=>p.userData?.style.fill!=='none');
  const all=paths.flatMap(p=>p.subPaths.flatMap(s=>s.getPoints(12)));
  if(!all.length)throw new Error('Choose an SVG with filled shapes.');
  const minX=Math.min(...all.map(p=>p.x)),minY=Math.min(...all.map(p=>p.y));
  const width=Math.max(...all.map(p=>p.x))-minX,height=Math.max(...all.map(p=>p.y))-minY;
  const factor=108/Math.max(width,height,1)*scale,cx=minX+width/2,cy=minY+height/2;
  return paths.map(p=>p.subPaths.map(s=>`M${s.getPoints(12).map(v=>`${((v.x-cx)*factor+x).toFixed(2)},${((v.y-cy)*factor+y).toFixed(2)}`).join('L')}Z`).join(' '));
}
export function DesignDialog({onClose,onCreate}:{onClose:()=>void;onCreate:(m:Motif)=>void}){
  const dialog=useRef<HTMLDialogElement>(null),drawing=useRef<HTMLCanvasElement>(null),input=useRef<HTMLInputElement>(null),points=useRef<number[][]>([]),isDrawing=useRef(false);
  const [actions,setActions]=useState<string[][]>([]),[draft,setDraft]=useState(''),[size,setSize]=useState(4),[ornament,setOrnament]=useState<Motif|null>(null),[message,setMessage]=useState('');
  useEffect(()=>{dialog.current!.showModal();},[]);
  useEffect(()=>{const c=drawing.current!,ctx=c.getContext('2d')!;ctx.clearRect(0,0,c.width,c.height);ctx.save();ctx.scale(c.width/120,c.height/120);ctx.fillStyle='#29362e';for(const d of [...actions.flat(),draft].filter(Boolean))ctx.fill(new Path2D(d),'evenodd');ctx.restore();},[actions,draft]);
  function point(e:{clientX:number;clientY:number}){const r=drawing.current!.getBoundingClientRect();return[(e.clientX-r.left)/r.width*120,(e.clientY-r.top)/r.height*120,.5];}
  function addOrnament(m:Motif,p:number[]){setActions(a=>[...a,normalizedPaths(svgMarkup(m),.35,p[0],p[1])]);}
  async function importSVG(file:File|undefined){if(!file)return;if(file.size>120000){setMessage('Choose an SVG smaller than 120 KB.');return;}try{const text=await file.text();const dom=new DOMParser().parseFromString(text,'image/svg+xml');if(dom.querySelector('parsererror')||dom.documentElement.localName!=='svg'||dom.querySelectorAll('*').length>400)throw new Error('This SVG could not be read. Try a simpler filled motif.');const paths=normalizedPaths(text);if(paths.join('').length>160000)throw new Error('This motif is too detailed. Try a simpler SVG.');setActions(a=>[...a,paths]);setMessage('');}catch(e){setMessage(e instanceof Error?e.message:'This SVG could not be read.');}}
  return <dialog ref={dialog} className="design-dialog" onCancel={onClose} onClick={e=>{if(e.target===dialog.current)onClose();}} aria-labelledby="design-title">
    <div className="design-inner"><div className="panel-heading"><div><span className="overline">YOUR OWN PRINTING FACE</span><h2 id="design-title">Begin with a mark.</h2></div><button className="icon-button" aria-label="Close drawing" title="Close drawing" onClick={onClose}><X size={18}/></button></div>
      <div className="drawing-surface"><canvas ref={drawing} width="600" height="600" aria-label="Draw your own motif" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const motif=motifs.find(m=>m.id===e.dataTransfer.getData('text/plain'));if(motif)addOrnament(motif,point(e));}} onPointerDown={e=>{const p=point(e);if(ornament){addOrnament(ornament,p);return;}e.currentTarget.setPointerCapture(e.pointerId);points.current=[p];isDrawing.current=true;setDraft(outline(points.current,size));}} onPointerMove={e=>{if(!isDrawing.current)return;points.current.push(point(e));setDraft(outline(points.current,size));}} onPointerUp={()=>{if(!isDrawing.current)return;const path=outline(points.current,size);if(path)setActions(a=>[...a,[path]]);isDrawing.current=false;setDraft('');}} onPointerCancel={()=>{isDrawing.current=false;setDraft('');}}/></div>
      <div className="ornament-strip" aria-label="Ornaments">{motifs.slice(0,8).map(m=><button key={m.id} className={ornament?.id===m.id?'active':''} aria-label={`Place ${m.name}`} title={`Place ${m.name}`} draggable onDragStart={e=>e.dataTransfer.setData('text/plain',m.id)} onClick={()=>setOrnament(m)}><svg viewBox="0 0 120 120" aria-hidden="true">{m.paths.map((d,i)=><path key={i} d={d} fill="currentColor" fillRule="evenodd"/>)}</svg></button>)}</div>
      <div className="drawing-tools"><button className={`icon-button ${!ornament?'active':''}`} aria-label="Draw with brush" title="Draw with brush" onClick={()=>setOrnament(null)}><PenLine size={18}/></button><input aria-label="Brush size" type="range" min="1" max="10" step=".5" value={size} onChange={e=>setSize(Number(e.target.value))}/><button className="icon-button" aria-label="Undo drawing" title="Undo drawing" disabled={!actions.length} onClick={()=>setActions(a=>a.slice(0,-1))}><Undo2 size={18}/></button><button className="icon-button" aria-label="Clear drawing" title="Clear drawing" disabled={!actions.length} onClick={()=>setActions([])}><Trash2 size={18}/></button><button className="icon-button" aria-label="Import SVG" title="Import SVG" onClick={()=>input.current!.click()}><Upload size={18}/></button><input hidden ref={input} type="file" accept=".svg,image/svg+xml" onChange={e=>void importSVG(e.target.files?.[0])}/></div>
      {message&&<p role="alert" className="drawing-message">{message}</p>}
      <button className="primary make-block" disabled={!actions.length||actions.flat().join('').length>200000} onClick={()=>onCreate({id:`custom-${Date.now()}`,name:'Your carved motif',family:'Custom',paths:actions.flat()})}>Carve this block<ArrowRight size={17}/></button>
    </div>
  </dialog>;
}
