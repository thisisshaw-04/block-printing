import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {getStroke} from 'perfect-freehand';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {MousePointer2,PenLine,Undo2,Redo2,Copy,ClipboardPaste,Scissors,Trash2,RotateCw,ArrowRight} from 'lucide-react';
import {motifs,type Motif} from './motifs';
type Element={id:number;paths:string[];x:number;y:number;scale:number;rotation:number};
function MotifElement({element,selected,moving,transform}:{element:Element;selected:boolean;moving:boolean;transform:string}){
 const artwork=useRef<SVGGElement>(null),[bounds,setBounds]=useState({x:0,y:0,width:120,height:120});
 useLayoutEffect(()=>{const b=artwork.current!.getBBox();setBounds({x:b.x,y:b.y,width:b.width,height:b.height});},[element.paths]);
 const pad=4/element.scale;
 return <g data-element={element.id} transform={transform} style={{cursor:moving?'grab':'crosshair'}}>
  <rect className="motif-hit-area" x={bounds.x-pad} y={bounds.y-pad} width={bounds.width+pad*2} height={bounds.height+pad*2} fill="transparent" pointerEvents={moving?'all':'none'}/>
  <g ref={artwork} pointerEvents="none" className={selected?'motif-ink is-selected':'motif-ink'}>{element.paths.map((d,i)=><path key={i} d={d} fillRule="evenodd"/>)}</g>
  {selected&&moving&&<rect x={bounds.x-pad} y={bounds.y-pad} width={bounds.width+pad*2} height={bounds.height+pad*2} fill="none" stroke="#9a7458" strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" pointerEvents="none"/>}
 </g>;
}
export function DesignDialog({onCreate}:{onCreate:(m:Motif)=>void}){
 const [elements,setElements]=useState<Element[]>([]),[history,setHistory]=useState<Element[][]>([]),[selected,setSelected]=useState<number|null>(null),[mode,setMode]=useState<'move'|'draw'>('move'),[brush,setBrush]=useState(2),[draft,setDraft]=useState('');
 const surface=useRef<SVGSVGElement>(null),gesture=useRef<{x:number;y:number;original:Element[];points:number[][];id:number|null}|null>(null),serial=useRef(0);
 const transform=(e:Element)=>`translate(${e.x} ${e.y}) rotate(${e.rotation}) scale(${e.scale}) translate(-60 -60)`;
 const [future,setFuture]=useState<Element[][]>([]),[clipboard,setClipboard]=useState<Element|null>(null);
 const remember=()=>{setHistory(h=>[...h.slice(-39),elements]);setFuture([]);};
 const undo=()=>{if(!history.length)return;setFuture(f=>[elements,...f]);setElements(history[history.length-1]);setHistory(h=>h.slice(0,-1));setSelected(null);};
 const redo=()=>{if(!future.length)return;setHistory(h=>[...h,elements]);setElements(future[0]);setFuture(f=>f.slice(1));setSelected(null);};
 const remove=()=>{if(selected===null)return;remember();setElements(a=>a.filter(e=>e.id!==selected));setSelected(null);};
 const copy=()=>{const e=elements.find(e=>e.id===selected);if(e)setClipboard({...e,paths:[...e.paths]});return e;};
 const paste=(source=clipboard)=>{if(!source)return;remember();const item={...source,paths:[...source.paths],id:++serial.current,x:Math.min(105,source.x+5),y:Math.min(105,source.y+5)};setElements(a=>[...a,item]);setSelected(item.id);setMode('move');setClipboard(item);};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{
  if((e.target as HTMLElement).closest('input,textarea,select,[contenteditable=true]')||gesture.current)return;
  const mod=e.ctrlKey||e.metaKey,k=e.key.toLowerCase();
  if(mod&&['c','x','v','d','z','y'].includes(k)){e.preventDefault();e.stopImmediatePropagation();if(k==='c')copy();if(k==='x'){if(copy())remove();}if(k==='v')paste();if(k==='d'){const el=copy();if(el)paste(el);}if(k==='z')e.shiftKey?redo():undo();if(k==='y')redo();}
  else if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();remove();}
  else if(e.key==='Escape')setSelected(null);
  else if(selected!==null&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const step=e.shiftKey?5:1;remember();setElements(a=>a.map(el=>el.id===selected?{...el,x:Math.max(0,Math.min(120,el.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0))),y:Math.max(0,Math.min(120,el.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0)))}:el));}
 };window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);});
 const point=(x:number,y:number)=>{const p=new DOMPoint(x,y).matrixTransform(surface.current!.getScreenCTM()!.inverse());return {x:Math.max(0,Math.min(120,p.x)),y:Math.max(0,Math.min(120,p.y))};};
 const add=(m:Motif,x=60,y=60)=>{remember();const id=++serial.current;setElements(a=>[...a,{id,paths:m.paths,x,y,scale:.48,rotation:0}]);setSelected(id);setMode('move');};
 const change=(patch:Partial<Element>)=>{remember();setElements(a=>a.map(e=>e.id===selected?{...e,...patch}:e));};
 const chosen=elements.find(e=>e.id===selected);
 const outline=(points:number[][])=>{const p=getStroke(points,{size:brush,thinning:.2,smoothing:.6,streamline:.5,simulatePressure:true});return p.length?`M${p.map(v=>v.join(',')).join('L')}Z`:'';};
 const finish=()=>{const g=gesture.current;if(!g)return;if(mode==='draw'){const d=outline(g.points);if(d){remember();setElements(a=>[...a,{id:++serial.current,paths:[d],x:60,y:60,scale:1,rotation:0}]);}}else if(g.id!==null&&elements.some((el,i)=>el.x!==g.original[i].x||el.y!==g.original[i].y)){setHistory(h=>[...h.slice(-39),g.original]);setFuture([]);}gesture.current=null;surface.current?.classList.remove('is-dragging');setDraft('');};
 const cancel=()=>{if(gesture.current)setElements(gesture.current.original);gesture.current=null;surface.current?.classList.remove('is-dragging');setDraft('');};
 const carve=()=>{const svg=`<svg xmlns="http://www.w3.org/2000/svg">${elements.map(e=>`<g transform="${transform(e)}">${e.paths.map(d=>`<path d="${d}" fill="#000" fill-rule="evenodd"/>`).join('')}</g>`).join('')}</svg>`;const paths=new SVGLoader().parse(svg).paths.map(p=>p.subPaths.map(s=>`M${s.getPoints(12).map(v=>`${v.x.toFixed(3)},${v.y.toFixed(3)}`).join('L')}Z`).join(''));onCreate({id:`custom-${Date.now()}`,name:'Your carved motif',family:'Original',paths});};
 return <section className="composer" aria-label="Compose your block">
  <div className="compose-heading"><span className="overline">COMPOSE → CARVE → PRINT</span><h1 tabIndex={-1}>FORM,<br/>{' '}BY <em>HAND.</em></h1><p>A wooden block.<br/>A carved surface.<br/>An impression of your own.</p></div>
  <div className="compose-workspace" data-empty={!elements.length&&!draft}>
   <div className="compose-toolbar"><button title="Select and move" aria-label="Select and move" aria-pressed={mode==='move'} onClick={()=>setMode('move')}><MousePointer2/></button><button title="Draw" aria-label="Draw" aria-pressed={mode==='draw'} onClick={()=>{setMode('draw');setSelected(null);}}><PenLine/></button><input title="Brush size" aria-label="Brush size" type="range" min=".5" max="6" step=".5" value={brush} onChange={e=>setBrush(+e.target.value)}/><span/><button title="Undo" aria-label="Undo design" disabled={!history.length} onClick={undo}><Undo2/></button><button title="Redo (Ctrl/Cmd+Shift+Z)" aria-label="Redo design" disabled={!future.length} onClick={redo}><Redo2/></button><button title="Copy (Ctrl/Cmd+C)" aria-label="Copy element" disabled={selected===null} onClick={copy}><Copy/></button><button title="Cut (Ctrl/Cmd+X)" aria-label="Cut element" disabled={selected===null} onClick={()=>{if(copy())remove();}}><Scissors/></button><button title="Paste (Ctrl/Cmd+V)" aria-label="Paste element" disabled={!clipboard} onClick={()=>paste()}><ClipboardPaste/></button><button title="Clear canvas" aria-label="Clear canvas" disabled={!elements.length} onClick={()=>{remember();setElements([]);setSelected(null);}}><Trash2/></button></div>
   <div className="specimen-surface">
    {!elements.length&&!draft&&<div className="block-invitation" aria-hidden="true"><span>01 / YOUR PRINTING BLOCK</span><strong>Make your mark.</strong><p>Drop a motif here<br/>or draw your own.</p></div>}
   <svg className="compose-canvas" ref={surface} viewBox="0 0 120 120" role="img" aria-label="Motif drawing canvas" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const m=motifs.find(m=>m.id===e.dataTransfer.getData('text/plain'));if(m){const p=point(e.clientX,e.clientY);add(m,p.x,p.y);}}} onPointerDown={e=>{if(e.button!==0)return;e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);const p=point(e.clientX,e.clientY),id=Number((e.target as SVGElement).closest('[data-element]')?.getAttribute('data-element'))||null;if(mode==='move'&&id!==null)e.currentTarget.classList.add('is-dragging');setSelected(mode==='move'?id:null);gesture.current={...p,original:elements,points:[[p.x,p.y]],id};if(mode==='draw')setDraft(outline([[p.x,p.y]]));}} onPointerMove={e=>{const g=gesture.current;if(!g)return;const p=point(e.clientX,e.clientY);if(mode==='draw'){g.points.push([p.x,p.y]);setDraft(outline(g.points));}else if(g.id!==null)setElements(g.original.map(el=>el.id===g.id?{...el,x:Math.max(15,Math.min(105,el.x+p.x-g.x)),y:Math.max(15,Math.min(105,el.y+p.y-g.y))}:el));}} onPointerUp={finish} onPointerCancel={cancel} onLostPointerCapture={finish}>
    <defs><pattern id="drawing-grid" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="0" cy="0" r=".22" fill="#b6ae9d"/></pattern></defs><rect className="canvas-paper" width="120" height="120"/><rect className="canvas-grid" width="120" height="120" fill="url(#drawing-grid)"/>

    {elements.map(el=><MotifElement key={el.id} element={el} selected={selected===el.id} moving={mode==='move'} transform={transform(el)}/>)}<path d={draft} className="motif-ink" pointerEvents="none"/>
   </svg>
   <span className="surface-corner c1" aria-hidden="true"/><span className="surface-corner c2" aria-hidden="true"/><span className="surface-corner c3" aria-hidden="true"/><span className="surface-corner c4" aria-hidden="true"/>
   </div>
   <div className="surface-guidance">{elements.length?'ARRANGE / ROTATE / REFINE':'SELECT A FORM TO BEGIN'}</div>
   <div className="element-controls"><span>{elements.length} {elements.length===1?'element':'elements'}</span>{chosen&&<><label>Scale<input aria-label="Element scale" type="range" min=".15" max=".85" step=".05" value={chosen.scale} onChange={e=>change({scale:+e.target.value})}/></label><button title="Rotate element" aria-label="Rotate element" onClick={()=>change({rotation:chosen.rotation+15})}><RotateCw size={17}/></button><button title="Delete element" aria-label="Delete element" onClick={()=>{remember();setElements(a=>a.filter(e=>e.id!==selected));setSelected(null);}}><Trash2 size={17}/></button></>}</div>
  </div>
  <aside className="compose-library" aria-label="Ornament library"><div className="library-heading"><span className="overline">[ THE MOTIF LIBRARY ]</span><h2>Build your printing block.</h2><p>Drag to the block. Click to add.</p></div><div className="compose-motifs">{motifs.map((m,i)=><button key={m.id} draggable onDragStart={e=>e.dataTransfer.setData('text/plain',m.id)} onClick={()=>add(m)} title={m.name} aria-label={`Add ${m.name}`}><span className="specimen-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><svg viewBox="0 0 120 120" aria-hidden="true">{m.paths.map((d,i)=><path key={i} d={d} fill="currentColor" fillRule="evenodd"/>)}</svg><span>{m.name}</span></button>)}</div><p className="library-note"><span className="library-diagram" aria-hidden="true">⊕ ── ◇ ── ▦</span>Every pattern begins<br/>with a single mark.<span>DESIGNED BY YOU / PRINTED BY HAND</span></p></aside>
  <aside className="field-notes" aria-label="Composition details"><div className="field-title"><span>BLOCK NOTES</span><span>↗ 001</span></div><h2>Your block.<br/>Your pattern.</h2><dl><dt>MARKS</dt><dd>{String(elements.length).padStart(2,'0')}</dd><dt>TOOL</dt><dd>{mode==='draw'?'Freehand':'Arrange'}</dd><dt>MEDIUM</dt><dd>Wood → cloth</dd></dl><div className="field-barcode" aria-hidden="true"/><span className="field-caption">COMPOSE A MOTIF / CARVE IT / PRINT IT</span></aside>
  <aside className="process-note"><div className="field-title">[ A PRACTICE, NOT A PERFECT PRINT ]</div><p>Choose a shape. Follow a line. Let small variations become part of the pattern.</p><div className="process-map" aria-hidden="true"><span>01<br/>FORM</span><i/><span>02<br/>RELIEF</span><i/><span>03<br/>PRINT</span></div><span className="field-caption">SLOW MAKING / ORIGINAL IMPRESSIONS</span></aside>
  <footer className="compose-footer"><span><strong>YOUR COMPOSITION</strong>{String(elements.length).padStart(2,'0')} {elements.length===1?'mark':'marks'} / ready for your hands</span><button className="primary" disabled={!elements.length} onClick={carve}>Carve this block<ArrowRight size={17}/></button></footer>
 </section>;
}
