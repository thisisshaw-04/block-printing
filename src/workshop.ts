import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { motifs, pigments, svgMarkup, type Motif } from './motifs';
import { canvas, canvasTexture, contactShadow, seeded, weaveTexture, woodMaterial,linenTexture,concreteMaterial } from './materials';

export type Impression = {
  position:{x:number;z:number};rotation:number;scale:number;motif:Motif;color:string;
  opacity:number;pressure:number;randomSeed:number;
};
export type Snapshot = {
  ready:boolean;held:boolean;ink:number;pigment:number;motif:Motif;count:number;redo:number;
  view:'work'|'inspect'|'overview';mode:'free'|'repeat'|'border';rotation:number;size:number;
  muted:boolean;status:string;clothOffset:number;pressing:boolean;
  snap:boolean;showGrid:boolean;showPreview:boolean;spacing:number;
};
const W=24,H=5.6,TEX_W=4096,TEX_H=Math.round(TEX_W*H/W),RELIEF=.115;
const clamp=THREE.MathUtils.clamp;
const smooth=(v:number)=>v*v*(3-2*v);
export class Workshop {
  readonly renderer:THREE.WebGLRenderer;
  readonly scene=new THREE.Scene();
  readonly camera=new THREE.PerspectiveCamera(42,1,.05,130);
  readonly ray=new THREE.Raycaster();
  readonly clothGroup=new THREE.Group();
  readonly station=new THREE.Group();
  readonly block=new THREE.Group();
  readonly blockArt=new THREE.Group();
  readonly relief=new THREE.Group();
  readonly reliefMaterial:THREE.MeshStandardMaterial;
  readonly cloth:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshStandardMaterial>;
  readonly paintCanvas=canvas(TEX_W,TEX_H);
  readonly paintTexture:THREE.CanvasTexture;
  readonly stampBuffer=canvas(512,512);
  readonly shadow:THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
  readonly pad:THREE.Mesh;
  readonly padPosition=new THREE.Vector3(-2.7,.37,3.6);
  readonly wood=woodMaterial();
  readonly darkWood=woodMaterial(true);
  readonly pigmentMeshes:THREE.Mesh[]=[];
  readonly spareBlocks:THREE.Group[]=[];
  readonly disposals:(()=>void)[]=[];
  readonly target=new THREE.Vector3(-1.9,.23,1.1);
  readonly lookAt=new THREE.Vector3(0,0,.8);
  readonly cameraGoal=new THREE.Vector3();
  readonly lookGoal=new THREE.Vector3();
  readonly baseHeights:Float32Array;
  history:Impression[]=[];
  future:Impression[]=[];
  state:Snapshot={ready:false,held:false,ink:0,pigment:0,motif:motifs[0],count:0,redo:0,view:'work',mode:'free',rotation:0,size:.86,muted:true,status:'Pick up a block. Make your first impression.',clothOffset:0,pressing:false,snap:false,showGrid:false,showPreview:true,spacing:1.2};
  pointer=new THREE.Vector2();
  hoverPoint:THREE.Vector3|null=null;
  guide=new THREE.Group();
  previewCanvas=canvas(512,512);
  previewTexture=canvasTexture(this.previewCanvas);
  preview=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,depthTest:false,opacity:.5}));
  press:null|{start:number;released:number|null;kind:'cloth'|'ink';committed:boolean;lift:number|null;fromY:number;contactY:number;point:THREE.Vector3;from:THREE.Vector3;travel:number}=null;
  rotation=0;
  frame=0;
  lastTime=0;
  orbit=0;
  elevation=0;
  zoom=1;
  inspectTime=0;
  pressDepth=0;
  draggingView=false;
  dragOrigin={x:0,y:0};
  audio:AudioContext|null=null;
  reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  disposed=false;
  reality:'day'|'night'='day';

  constructor(readonly host:HTMLElement,readonly onChange:(s:Snapshot)=>void) {
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.96;
    this.renderer.domElement.setAttribute('aria-label','Interactive block printing worktable');
    this.renderer.domElement.tabIndex=0;this.renderer.domElement.setAttribute('role','application');
    host.append(this.renderer.domElement);
    this.scene.background=new THREE.Color('#e9e7de');
    const pmrem=new THREE.PMREMGenerator(this.renderer), env=new RoomEnvironment();
    this.scene.environment=pmrem.fromScene(env,.04).texture;this.scene.environmentIntensity=.25;env.dispose();pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight('#fffaf1','#9a9b93',.85));
    const sun=new THREE.DirectionalLight('#fff5e9',2.4);sun.position.set(-6,7,3);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:8,bottom:-8,near:1,far:28});sun.shadow.bias=-.00015;sun.shadow.normalBias=.012;sun.shadow.radius=3;
    this.scene.add(sun);
    const fill=new THREE.DirectionalLight('#e4ecff',.45);fill.position.set(6,6,-3);this.scene.add(fill);
    this.scene.add(this.clothGroup,this.station,this.block);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'#e6e3d9',roughness:1}));floor.name='studio-floor';floor.rotation.x=-Math.PI/2;floor.position.y=-.57;floor.receiveShadow=true;this.scene.add(floor);
    const tableMat=woodMaterial(true);
    tableMat.map!.repeat.set(6,2);tableMat.normalMap!.repeat.set(6,2);
    tableMat.map!.rotation=tableMat.normalMap!.rotation=Math.PI/2;
    tableMat.normalScale.set(.22,.22);tableMat.roughness=.74;
    const table=new THREE.Mesh(new RoundedBoxGeometry(28,.52,9.1,3,.08),tableMat);table.name='worktable';table.position.y=-.28;table.receiveShadow=true;table.castShadow=true;this.scene.add(table);
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.9,.94,.13,64),concreteMaterial());plinth.name='inspection-plinth';plinth.position.set(0,-.38,0);plinth.castShadow=true;plinth.receiveShadow=true;plinth.visible=false;this.scene.add(plinth);

    this.paintTexture=canvasTexture(this.paintCanvas);this.paintTexture.wrapS=this.paintTexture.wrapT=THREE.ClampToEdgeWrapping;
    const weave=weaveTexture();
    const clothGeo=new THREE.PlaneGeometry(W,H,220,70);clothGeo.rotateX(-Math.PI/2);
    const pos=clothGeo.attributes.position as THREE.BufferAttribute;
    this.baseHeights=new Float32Array(pos.count);
    for(let i=0;i<pos.count;i++) {
      const x=pos.getX(i),z=pos.getZ(i);
      const y=this.fabricHeight(x,z);
      pos.setXYZ(i,x,y,z);this.baseHeights[i]=y;
    }
    clothGeo.computeVertexNormals();
    const linen=linenTexture();
    const clothMat=new THREE.MeshPhysicalMaterial({map:this.paintTexture,bumpMap:linen,bumpScale:.025,roughness:.94,sheen:.35,sheenRoughness:.9,sheenColor:'#f4eee1',side:THREE.DoubleSide,color:'#ffffff'});
    clothMat.onBeforeCompile=shader=>{shader.uniforms.linen={value:linen};shader.fragmentShader='uniform sampler2D linen;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat fiber = dot(texture2D(linen, vMapUv * vec2(10., 2.3333)).rgb, vec3(.299,.587,.114));\ndiffuseColor.rgb *= .72 + fiber * .45;');};
    this.cloth=new THREE.Mesh(clothGeo,clothMat);
    this.cloth.receiveShadow=true;this.cloth.castShadow=true;this.clothGroup.add(this.cloth);
    this.addFringe();this.redrawTextile();
    this.clothGroup.add(this.guide);this.rebuildGrid();
    this.preview.material.map=this.previewTexture;this.preview.rotation.x=-Math.PI/2;this.preview.renderOrder=10;this.preview.visible=false;this.scene.add(this.preview);

    const tray=new THREE.Mesh(new RoundedBoxGeometry(1.88,.29,1.36,3,.07),this.darkWood);tray.name='ink-tray';tray.position.copy(this.padPosition);tray.position.y=.15;tray.castShadow=true;tray.receiveShadow=true;this.station.add(tray);
    const padMat=new THREE.MeshStandardMaterial({color:pigments[0].color,roughness:.56,bumpMap:weave,bumpScale:.008});
    this.pad=new THREE.Mesh(new RoundedBoxGeometry(1.64,.15,1.12,3,.05),padMat);this.pad.position.copy(this.padPosition);this.pad.position.y=.28;this.pad.receiveShadow=true;this.pad.castShadow=true;this.pad.userData.kind='ink';this.station.add(this.pad);
    this.createPigments();this.createSpareBlocks();this.createRag();
    this.reliefMaterial=this.wood.clone();this.reliefMaterial.roughness=.73;this.reliefMaterial.color.setRGB(2.7,2.3,1.75);
    this.block.add(this.blockArt);this.makeBlock();this.block.position.copy(this.target);
    this.shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.8,1.8),new THREE.MeshBasicMaterial({map:contactShadow(),transparent:true,depthWrite:false,opacity:.34}));
    this.shadow.rotation.x=-Math.PI/2;this.scene.add(this.shadow);
    this.camera.position.set(0,7.7,7.4);this.camera.lookAt(this.lookAt);
    this.bindEvents();this.resize();
    this.state.ready=true;this.emit();this.frame=requestAnimationFrame(this.animate);
  }
  fabricHeight(x:number,z:number) {
    return .10+.002*Math.sin(x*1.7+z*.45)+.001*Math.sin(z*5.3+x*.38);
  }
  addFringe() {
    const points:number[]=[],rand=seeded(43);
    for(const side of [-1,1])for(let z=-H/2+.025;z<H/2;z+=.026){const x=side*W/2,y=this.fabricHeight(x,z);points.push(x,y,z,x+side*(.12+rand()*.12),y-.023,z+(rand()-.5)*.035);}
    for(let x=-W/2;x<W/2;x+=.045)for(const side of [-1,1]){let z=side*H/2,y=this.fabricHeight(x,z)+.015;points.push(x,y,z,x+(rand()-.5)*.009,y-.005,z+side*(.005+rand()*.009));}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));this.clothGroup.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#c9c5b7',transparent:true,opacity:.85})));
  }
  createPigments() {
    pigments.forEach((p,i)=>{
      const bowl=new THREE.Group(),outer=new THREE.Mesh(new THREE.CylinderGeometry(.32,.27,.21,40),new THREE.MeshStandardMaterial({color:'#dad4c8',roughness:.86}));
      outer.position.y=.115;outer.castShadow=true;outer.receiveShadow=true;bowl.add(outer);
      const rim=new THREE.Mesh(new THREE.TorusGeometry(.291,.026,10,48),new THREE.MeshStandardMaterial({color:'#f5f0e4',roughness:.8}));rim.rotation.x=Math.PI/2;rim.position.y=.22;bowl.add(rim);
      const ink=new THREE.Mesh(new THREE.CircleGeometry(.268,48),new THREE.MeshStandardMaterial({color:p.color,roughness:.39}));ink.rotation.x=-Math.PI/2;ink.position.y=.225;ink.userData.pigment=i;bowl.add(ink);this.pigmentMeshes.push(ink);
      bowl.position.set(-2.2+i*.84,.01,-3.37);this.station.add(bowl);
    });
  }
  makeRelief(motif:Motif,size:number,material:THREE.Material,depth=RELIEF) {
    const data=new SVGLoader().parse(svgMarkup(motif));
    const shapes=data.paths.flatMap(p=>SVGLoader.createShapes(p));
    const geometry=new THREE.ExtrudeGeometry(shapes,{depth,bevelEnabled:true,bevelSize:.12,bevelThickness:.002,bevelSegments:1,curveSegments:7});
    geometry.scale(size/120,size/120,1);geometry.translate(-size/2,-size/2,0);geometry.rotateX(Math.PI/2);
    const uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/120,uv.getY(i)/120);
    const mesh=new THREE.Mesh(geometry,[material,this.darkWood]);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
  }
  blockBody(motif:Motif,size:number,depth=.36){
    const points=new SVGLoader().parse(svgMarkup(motif)).paths.flatMap(p=>p.subPaths.flatMap(s=>s.getPoints(14))).map(p=>({x:(p.x-60)*size/120,y:(p.y-60)*size/120})).sort((a,b)=>a.x-b.x||a.y-b.y);
    const cross=(a:typeof points[0],b:typeof points[0],c:typeof points[0])=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    const half=(list:typeof points)=>{const h:typeof points=[];for(const p of list){while(h.length>1&&cross(h[h.length-2],h[h.length-1],p)<=0)h.pop();h.push(p);}return h;};
    const hull=half(points).slice(0,-1).concat(half([...points].reverse()).slice(0,-1));
    const shape=new THREE.Shape();hull.forEach((p,i)=>{const length=Math.hypot(p.x,p.y)||1,x=p.x+p.x/length*.065,y=p.y+p.y/length*.065;i?shape.lineTo(x,y):shape.moveTo(x,y);});shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.025,bevelThickness:.014,bevelSegments:3,steps:4});
    geo.rotateX(Math.PI/2);geo.translate(0,depth,0);
    const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i),y=pos.getY(i);if(y>.02&&y<depth-.02){const wear=.003*Math.sin(x*91+z*47+y*19);pos.setX(i,x+wear);pos.setZ(i,z+wear*.6);}}geo.computeVertexNormals();
    const body=new THREE.Mesh(geo,this.darkWood);body.castShadow=true;body.receiveShadow=true;return body;
  }
  createSpareBlocks() {
    [motifs[1],motifs[2]].forEach((motif,i)=>{
      const g=new THREE.Group();const b=this.blockBody(motif,.68,.28);g.add(b);
      const m=this.makeRelief(motif,.68,this.wood,.065);m.rotation.x=Math.PI;m.position.y=.30;g.add(m);g.position.set(3.3+i*1.1,0,-3.45);g.rotation.y=i?-.2:.13;g.userData.motif=motif.id;this.station.add(g);this.spareBlocks.push(g);
    });
  }
  createRag() {
    const geo=new THREE.PlaneGeometry(1.55,.74,28,15);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;
    for(let i=0;i<p.count;i++)p.setY(i,.11+Math.sin(p.getX(i)*19)*.024+Math.cos(p.getZ(i)*11)*.035);geo.computeVertexNormals();
    const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:'#e6e1d5',roughness:1,bumpMap:weaveTexture(),bumpScale:.01,side:THREE.DoubleSide}));mesh.position.set(2.8,.02,3.5);mesh.rotation.y=-.18;mesh.castShadow=true;mesh.receiveShadow=true;this.station.add(mesh);
  }
  makeBlock() {
    this.updatePreviewTexture();
    while(this.blockArt.children.length){const child=this.blockArt.children.pop()!;child.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});child.parent=null;}
    this.relief.clear();
    const s=this.state.size;
    const body=this.blockBody(this.state.motif,s);this.blockArt.add(body);
    for(const x of [-.19,.19]){const support=new THREE.Mesh(new RoundedBoxGeometry(.12,.16,.20,2,.025),this.wood);support.position.set(x,.42,0);support.castShadow=true;this.blockArt.add(support);}
    const grip=new THREE.Mesh(new RoundedBoxGeometry(.59,.16,.23,4,.055),this.wood);grip.position.y=.50;grip.castShadow=true;this.blockArt.add(grip);
    this.relief.add(this.makeRelief(this.state.motif,s,this.reliefMaterial));this.blockArt.add(this.relief);
    // One SVG defines both the extruded printing face and its transferred pixels.
    const label=canvas(256,256),ctx=label.getContext('2d')!;ctx.translate(128,128);ctx.scale(1.5,1.5);ctx.translate(-60,-60);ctx.fillStyle='rgba(37,24,12,.24)';this.state.motif.paths.forEach(d=>ctx.fill(new Path2D(d),'evenodd'));
    const mark=new THREE.Mesh(new THREE.PlaneGeometry(s*.85,s*.85),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(label),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));mark.rotation.x=-Math.PI/2;mark.position.y=.376;this.blockArt.add(mark);
  }
  updatePreviewTexture(){
    const c=this.previewCanvas.getContext('2d')!;c.clearRect(0,0,512,512);c.save();c.scale(512/120,512/120);c.fillStyle=pigments[this.state.pigment].color;this.state.motif.paths.forEach(d=>c.fill(new Path2D(d),'evenodd'));c.restore();
    c.strokeStyle='#496f85';c.lineWidth=2;c.setLineDash([10,7]);c.strokeRect(2,2,508,508);c.setLineDash([]);this.previewTexture.needsUpdate=true;
  }
  rebuildGrid(){
    this.guide.children.forEach(o=>{const l=o as THREE.LineSegments;l.geometry.dispose();(l.material as THREE.Material).dispose();});this.guide.clear();const p:number[]=[],step=this.state.mode==='repeat'?this.state.size*1.35:this.state.spacing;
    for(let x=Math.ceil(-W/2/step)*step;x<=W/2;x+=step)p.push(x,.122,-H/2,x,.122,H/2);
    for(let z=Math.ceil(-H/2/step)*step;z<=H/2;z+=step)p.push(-W/2,.122,z,W/2,.122,z);
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));this.guide.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:'#62859a',transparent:true,opacity:.28,depthWrite:false})));
  }
  setGuides(patch:Partial<Pick<Snapshot,'snap'|'showGrid'|'showPreview'|'spacing'>>){if(this.press)return;Object.assign(this.state,patch);this.state.spacing=clamp(this.state.spacing,.3,2.5);this.rebuildGrid();this.realign();this.emit();}
  realign(){if(this.hoverPoint){this.hoverPoint=this.align(this.hoverPoint);this.target.x=this.hoverPoint.x;this.target.z=this.hoverPoint.z;}}
  printHere(){if(!this.state.held||this.press)return;if(!this.hoverPoint){this.state.status='Choose a position on the cloth first.';this.emit();return;}this.startPress('cloth',this.align(this.hoverPoint),true);}
  bindEvents() {
    const el=this.renderer.domElement;
    const on=(target:EventTarget,name:string,fn:EventListener,options?:AddEventListenerOptions)=>{target.addEventListener(name,fn,options);this.disposals.push(()=>target.removeEventListener(name,fn,options));};
    on(el,'pointermove',this.pointerMove as EventListener);
    on(el,'pointerdown',this.pointerDown as EventListener);
    on(window,'pointerup',this.pointerUp as EventListener);
    on(window,'pointercancel',this.pointerCancel as EventListener);
    on(window,'blur',this.pointerCancel as EventListener);
    on(el,'contextmenu',((e:Event)=>e.preventDefault()) as EventListener);
    on(el,'wheel',this.wheel as EventListener,{passive:false});
    on(window,'keydown',this.keyDown as EventListener);
    const resize=new ResizeObserver(()=>this.resize());resize.observe(this.host);this.disposals.push(()=>resize.disconnect());
  }
  updateRay(e:PointerEvent) {
    const r=this.renderer.domElement.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);
  }
  hitCloth() {
    this.cloth.updateWorldMatrix(true,false);return this.ray.intersectObject(this.cloth,false)[0]?.point ?? null;
  }
  pointerMove=(e:PointerEvent)=>{
    if(this.draggingView){this.orbit=clamp(this.orbit+(e.clientX-this.dragOrigin.x)*.004,-.4,.4);this.elevation=clamp(this.elevation+(e.clientY-this.dragOrigin.y)*.006,-1,2);this.dragOrigin={x:e.clientX,y:e.clientY};return;}
    this.updateRay(e);
    if(this.state.view!=='work')return;
    const bowls=this.ray.intersectObjects(this.pigmentMeshes);const ink=this.ray.intersectObject(this.pad)[0];const hit=this.hitCloth();
    if(this.press)return;
    if(this.state.held && hit){const p=this.align(hit);this.target.set(p.x,this.fabricHeight(p.x-this.state.clothOffset,p.z)+RELIEF+.54,p.z);this.hoverPoint=p;}
    if(this.state.held && ink){this.target.set(this.padPosition.x,.97,this.padPosition.z);this.hoverPoint=null;}
    this.renderer.domElement.style.cursor=bowls.length?'pointer':this.state.held?'grabbing':this.ray.intersectObject(this.block,true).length?'grab':'default';
  };
  pointerDown=(e:PointerEvent)=>{
    if(e.button===2||e.altKey){this.draggingView=true;this.dragOrigin={x:e.clientX,y:e.clientY};this.renderer.domElement.setPointerCapture(e.pointerId);return;}
    if(e.button!==0)return;
    this.updateRay(e);this.renderer.domElement.focus({preventScroll:true});
    if(this.state.view==='inspect'){this.draggingView=true;this.dragOrigin={x:e.clientX,y:e.clientY};return;}
    if(this.state.view==='overview')return;
    const bowl=this.ray.intersectObjects(this.pigmentMeshes)[0];if(bowl){this.setPigment(bowl.object.userData.pigment);return;}
    const spare=this.ray.intersectObjects(this.spareBlocks,true)[0];if(spare){let o=spare.object;while(o.parent&&!o.userData.motif)o=o.parent;const motif=motifs.find(m=>m.id===o.userData.motif);if(motif)this.selectMotif(motif);return;}
    if(!this.state.held){if(this.ray.intersectObject(this.block,true).length){this.pickUp();}return;}
    if(this.press)return;
    if(this.ray.intersectObject(this.pad)[0]){this.startPress('ink',this.padPosition.clone());return;}
    const hit=this.hitCloth();if(hit){this.hoverPoint=this.align(hit);this.target.set(this.hoverPoint.x,.85,this.hoverPoint.z);if(e.pointerType!=='touch')this.startPress('cloth',this.hoverPoint);else this.emit();}
  };
  pointerUp=()=>{
    this.draggingView=false;
    if(this.press&&this.press.released===null)this.press.released=performance.now();
  };
  pointerCancel=()=>{this.draggingView=false;if(this.press){this.press=null;this.state.pressing=false;this.pressDepth=0;this.restoreCloth();this.target.y=.7;this.emit();}};
  wheel=(e:WheelEvent)=>{e.preventDefault();if(this.state.held&&this.state.view==='work'&&!e.ctrlKey)this.rotate(Math.sign(e.deltaY)*Math.PI/24);else this.zoom=clamp(this.zoom+e.deltaY*.00065,.65,1.5);};
  keyDown=(e:KeyboardEvent)=>{
    if(document.querySelector('[data-stage="compose"]'))return;
    if((e.target as HTMLElement).closest('input,textarea,button,[role="dialog"]'))return;
    if(e.ctrlKey||e.metaKey){if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?this.redo():this.undo();}return;}
    if(e.code==='Space'){e.preventDefault();if(!this.state.held)this.pickUp();else if(!e.repeat)this.printHere();}
    if(e.key.toLowerCase()==='q')this.rotate(-Math.PI/12);if(e.key.toLowerCase()==='e')this.rotate(Math.PI/12);
    if(e.key==='Escape'){if(this.state.view!=='work')this.setView('work');else this.putDown();}
    if(e.key.toLowerCase()==='i')this.inkBlock();
    if(e.key.startsWith('Arrow')){e.preventDefault();const step=this.state.mode==='repeat'?this.state.size*1.35:this.state.snap?this.state.spacing:.12;const p=(this.hoverPoint??this.target).clone();p.x+=e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0;p.z+=e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0;this.hoverPoint=this.align(p);this.realign();}
  };
  align(p:THREE.Vector3) {
    p=p.clone();const size=this.state.size,offset=this.state.clothOffset;
    if(this.state.snap){const step=this.state.spacing;p.x=Math.round((p.x-offset)/step)*step+offset;p.z=Math.round(p.z/step)*step;}
    if(this.state.mode==='repeat'){const step=size*1.35;p.x=Math.round((p.x-offset)/step)*step+offset;p.z=Math.round(p.z/step)*step;}
    if(this.state.mode==='border')p.z=Math.sign(p.z||1)*(H/2-size*.7);
    const margin=size*.5*(Math.abs(Math.cos(this.state.rotation))+Math.abs(Math.sin(this.state.rotation)))+.03;
    p.x=clamp(p.x,-W/2+offset+margin,W/2+offset-margin);p.z=clamp(p.z,-H/2+margin,H/2-margin);return p;
  }
  startPress(kind:'cloth'|'ink',point:THREE.Vector3,autoRelease=false) {
    if(this.press||this.state.view!=='work')return;
    if(kind==='cloth'&&this.state.ink<.065){this.state.status='The block is dry. Touch the pigment pad to re-ink.';this.emit();return;}
    const time=performance.now();const contactY=kind==='ink'?.36+RELIEF:this.fabricHeight(point.x-this.state.clothOffset,point.z)+RELIEF+.008;
    this.target.copy(point);this.target.y=contactY+.53;
    const distance=Math.hypot(this.block.position.x-point.x,this.block.position.z-point.z),travel=distance>.5?280:0;
    this.press={start:time,released:autoRelease?time+180+travel:null,kind,committed:false,lift:null,fromY:Math.max(this.block.position.y,contactY+.3),contactY,point:point.clone(),from:this.block.position.clone(),travel};
    this.rotation=this.state.rotation;this.block.rotation.y=-this.rotation;
    this.state.pressing=true;this.state.status=kind==='ink'?'Taking up pigment':'Pressing into the weave';this.emit();
  }
  pickUp() {if(this.state.view!=='work')this.setView('work');this.state.held=true;this.target.y=.76;this.state.status=this.state.ink>.065?'Position the block. Press, then lift.':'Touch the pigment pad to ink the block.';this.playSound('lift');this.emit();}
  putDown() {if(this.press)return;this.state.held=false;this.target.y=this.fabricHeight(this.target.x-this.state.clothOffset,this.target.z)+RELIEF+.008;this.state.status='Pick up your block to continue.';this.emit();}
  inkBlock() {if(this.press)return;this.setView('work');this.state.held=true;this.target.copy(this.padPosition);this.startPress('ink',this.padPosition.clone(),true);}
  resetPigment(){this.state.ink=0;this.reliefMaterial.map=this.wood.map;this.reliefMaterial.color.setRGB(2.7,2.3,1.75);this.reliefMaterial.roughness=.73;this.reliefMaterial.needsUpdate=true;}
  setPigment(i:number) {if(this.press)return;this.state.pigment=i;(this.pad.material as THREE.MeshStandardMaterial).color.set(pigments[i].color);this.resetPigment();this.state.status=`${pigments[i].name} is on the pad. Ink your block.`;this.updatePreviewTexture();this.emit();}
  selectMotif(motif:Motif) {if(this.press)return;this.state.motif=motif;this.resetPigment();this.makeBlock();this.inspectTime=performance.now();this.setView('inspect');this.state.status='A flat motif, carved into relief.';this.emit();}
  rotate(r:number) {if(this.press)return;this.state.rotation+=r;this.realign();this.emit();}
  setSize(size:number) {if(this.press)return;this.state.size=size;this.makeBlock();this.rebuildGrid();this.realign();this.emit();}
  setMode(mode:Snapshot['mode']){this.state.mode=mode;this.rebuildGrid();this.realign();this.emit();}
  setOffset(value:number){if(this.press||this.state.view!=='work')return;this.state.clothOffset=clamp(value,-7.5,7.5);this.clothGroup.position.x=this.state.clothOffset;this.emit();}
  setView(view:Snapshot['view']) {
    if(this.press)return;
    this.state.view=view;this.orbit=0;this.elevation=0;this.zoom=1;
    const gallery=view==='inspect';
    this.station.visible=this.clothGroup.visible=!gallery;
    this.scene.getObjectByName('worktable')!.visible=!gallery;
    this.scene.getObjectByName('inspection-plinth')!.visible=gallery;
    this.setReality(this.reality);
    if(view==='inspect'){this.target.set(0,1.35,0);this.state.status='Turn the block. See the carved printing face.';}
    if(view==='work'){this.blockArt.rotation.x=0;this.target.set(-.7,.78,.75);this.state.held=true;this.state.status=this.state.ink>.065?'Position the block. Press, then lift.':'Touch the pigment pad to ink the block.';}
    if(view==='work')this.realign();
    if(view==='overview')this.state.status='Every impression, part of the whole.';
    this.emit();
  }
  setReality(reality:'day'|'night') {
    this.reality=reality;const night=reality==='night';
    (this.scene.background as THREE.Color).set(night?'#080d0b':'#f6f7f4');
    const floor=this.scene.getObjectByName('studio-floor') as THREE.Mesh<THREE.PlaneGeometry,THREE.MeshStandardMaterial>;
    floor.material.color.set(night?'#111e19':'#f4f5f1');
    const table=this.scene.getObjectByName('worktable') as THREE.Mesh<THREE.BufferGeometry,THREE.MeshStandardMaterial>;
    table.material.color.set(night?'#8d9895':'#e5d4b9');
    this.renderer.toneMappingExposure=night?.8:.96;
  }
  resetCamera(){this.orbit=0;this.elevation=0;this.zoom=1;this.emit();}
  toggleMute(){this.state.muted=!this.state.muted;if(!this.state.muted)this.playSound('lift');this.emit();}
  undo(){if(this.press)return;const s=this.history.pop();if(s){this.future.push(s);this.redrawTextile();this.state.status='Last impression lifted.';this.emit();}}
  redo(){if(this.press)return;const s=this.future.pop();if(s){this.history.push(s);this.redrawTextile();this.state.status='Impression restored.';this.emit();}}
  clear(){if(this.press)return;this.history=[];this.future=[];this.redrawTextile();this.state.status='A fresh length of cloth.';this.emit();}
  commit(press:NonNullable<Workshop['press']>,time:number) {
    press.committed=true;
    if(press.kind==='ink'){this.state.ink=1;this.reliefMaterial.map=null;this.reliefMaterial.color.set(pigments[this.state.pigment].color);this.reliefMaterial.roughness=.38;this.reliefMaterial.needsUpdate=true;this.state.status='Freshly inked. Make an impression.';this.playSound('ink');}
    else {
      const pressure=clamp(((press.released??time)-press.start)/800,.15,1),randomSeed=Math.floor(Math.random()*1e8),rand=seeded(randomSeed);
      const impression:Impression={position:{x:press.point.x-this.state.clothOffset,z:press.point.z},rotation:this.state.rotation,scale:this.state.size,motif:this.state.motif,color:pigments[this.state.pigment].color,opacity:(.86+rand()*.10)*(.85+pressure*.15)*Math.sqrt(.45+this.state.ink*.55),pressure,randomSeed};
      this.history.push(impression);this.future=[];this.drawImpression(impression);this.paintTexture.needsUpdate=true;this.state.ink=Math.max(0,this.state.ink-.125);this.reliefMaterial.roughness=.4+(1-this.state.ink)*.4;this.state.status=this.state.ink<.065?'Time to re-ink the block.':'An impression, made by hand.';this.playSound('stamp');
    }
    this.emit();
  }
  redrawTextile() {
    const ctx=this.paintCanvas.getContext('2d')!;ctx.fillStyle='#eeeade';ctx.fillRect(0,0,TEX_W,TEX_H);
    const rand=seeded(978);ctx.globalAlpha=.085;
    for(let y=0;y<TEX_H;y+=2){ctx.fillStyle=y%4?'#aca999':'#fffef4';ctx.fillRect(0,y,TEX_W,1);}
    for(let x=0;x<TEX_W;x+=3){ctx.fillStyle=x%6?'#b9b6a8':'#ffffff';ctx.fillRect(x,0,1,TEX_H);}
    for(let i=0;i<7000;i++){ctx.fillStyle=rand()>.5?'#c1bdac':'#ffffff';ctx.fillRect(rand()*TEX_W,rand()*TEX_H,1,2+rand()*5);}
    ctx.globalAlpha=.18;ctx.fillStyle='#a7a395';ctx.fillRect(0,8,TEX_W,1);ctx.fillRect(0,TEX_H-9,TEX_W,1);ctx.globalAlpha=1;
    this.history.forEach(s=>this.drawImpression(s));this.paintTexture.needsUpdate=true;
  }
  drawImpression(s:Impression) {
    const stamp=this.stampBuffer.getContext('2d')!,rand=seeded(s.randomSeed);
    stamp.clearRect(0,0,512,512);stamp.save();stamp.scale(512/120,512/120);stamp.fillStyle=s.color;s.motif.paths.forEach(d=>stamp.fill(new Path2D(d),'evenodd'));stamp.restore();
    stamp.globalCompositeOperation='destination-out';stamp.fillStyle='#000';
    for(let i=0;i<1500;i++){stamp.globalAlpha=.12+rand()*.5;stamp.fillRect(rand()*512,rand()*512,.7+rand()*1.1,1+rand()*3);}
    stamp.globalAlpha=.13;for(let y=0;y<512;y+=5)stamp.fillRect(0,y,512,.7);
    for(let i=0;i<4;i++){const x=rand()*512,y=rand()*512,r=18+rand()*30,g=stamp.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(0,0,0,${.16*(1-s.pressure)})`);g.addColorStop(1,'transparent');stamp.globalAlpha=1;stamp.fillStyle=g;stamp.fillRect(x-r,y-r,r*2,r*2);}
    stamp.globalAlpha=1;stamp.globalCompositeOperation='source-over';
    const ctx=this.paintCanvas.getContext('2d')!,size=s.scale*TEX_W/W;ctx.save();ctx.translate((s.position.x/W+.5)*TEX_W,(s.position.z/H+.5)*TEX_H);ctx.rotate(s.rotation);ctx.globalAlpha=s.opacity;ctx.globalCompositeOperation='multiply';ctx.drawImage(this.stampBuffer,-size/2,-size/2,size,size);ctx.restore();
  }
  exportPNG() {const a=document.createElement('a');a.download='hand-printed-textile.png';a.href=this.paintCanvas.toDataURL('image/png');a.click();}
  playSound(kind:'stamp'|'ink'|'lift') {
    if(this.state.muted)return;
    try{this.audio??=new AudioContext();if(this.audio.state==='suspended')void this.audio.resume();const duration=kind==='lift'?.09:.15,buf=this.audio.createBuffer(1,this.audio.sampleRate*duration,this.audio.sampleRate),data=buf.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*7);const source=this.audio.createBufferSource(),filter=this.audio.createBiquadFilter(),gain=this.audio.createGain();source.buffer=buf;filter.type='lowpass';filter.frequency.value=kind==='ink'?850:kind==='lift'?1400:420;gain.gain.value=.12;source.connect(filter).connect(gain).connect(this.audio.destination);source.start();}catch{/* Audio is optional; printing remains available. */}
  }
  restoreCloth(){const p=this.cloth.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,this.baseHeights[i]);p.needsUpdate=true;}
  resize(){const {width,height}=this.host.getBoundingClientRect();this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();const mobile=width/height<.9;this.padPosition.x=mobile?-1.25:-2.7;this.pad.position.x=this.padPosition.x;const tray=this.station.getObjectByName('ink-tray')!;tray.position.x=this.padPosition.x;tray.scale.x=tray.scale.z=this.pad.scale.x=this.pad.scale.z=mobile?.78:1;this.pigmentMeshes.forEach((m,i)=>{m.parent!.position.x=(-2.2+i*.84)*(mobile?.68:1);m.parent!.scale.setScalar(mobile?.82:1);});this.spareBlocks.forEach(b=>b.visible=!mobile);}
  emit(){this.state.count=this.history.length;this.state.redo=this.future.length;this.onChange({...this.state});}
  animate=(time:number)=>{
    if(this.disposed)return;const dt=Math.min((time-this.lastTime)/1000,.2)||.016;this.lastTime=time;const lerp=1-Math.exp(-dt*12), view=this.state.view,aspect=this.camera.aspect;
    const mobile=aspect<.9;const distance=(mobile?1.43:1)*this.zoom;
    if(view==='overview'){this.lookGoal.set(0,0,0);this.cameraGoal.set(0,(mobile?58:Math.max(20,40/aspect))*this.zoom,2.7);}
    else if(view==='inspect'){const inspectDistance=Math.max(.9,this.state.size/.86);this.lookGoal.set(0,1.25,0);this.cameraGoal.set(Math.sin(this.orbit)*3,1.25+(1.35+this.elevation)*inspectDistance,2.25*distance*inspectDistance);}
    else {this.lookGoal.set(0,0,.8);this.cameraGoal.set(Math.sin(this.orbit)*9, (7.7+this.elevation)*distance,7.4*distance);}
    this.camera.up.lerp(view==='overview'&&mobile?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0),1-Math.exp(-dt*4)).normalize();
    this.camera.position.lerp(this.cameraGoal,1-Math.exp(-dt*4));this.lookAt.lerp(this.lookGoal,1-Math.exp(-dt*4));this.camera.lookAt(this.lookAt);
    this.clothGroup.position.x=THREE.MathUtils.damp(this.clothGroup.position.x,view==='overview'?0:this.state.clothOffset,10,dt);
    this.block.visible=view!=='overview';this.shadow.visible=view==='work';
    this.guide.visible=view==='work'&&this.state.showGrid;
    this.preview.visible=view==='work'&&this.state.held&&this.state.showPreview&&!!this.hoverPoint&&!this.press;
    if(this.hoverPoint){const p=this.align(this.hoverPoint);this.preview.position.set(p.x,this.fabricHeight(p.x-this.state.clothOffset,p.z)+.016,p.z);this.preview.rotation.set(-Math.PI/2,0,-this.state.rotation);this.preview.scale.set(this.state.size,this.state.size,1);}
    this.blockArt.rotation.x=THREE.MathUtils.damp(this.blockArt.rotation.x,view==='inspect'?-2.17:0,7,dt);
    this.relief.scale.y=THREE.MathUtils.lerp(this.relief.scale.y,view==='inspect'?clamp((time-this.inspectTime)/750,.02,1):1,lerp);
    this.rotation=THREE.MathUtils.damp(this.rotation,this.state.rotation+(view==='inspect'?Math.sin(time*.0003)*.14:0),12,dt);this.block.rotation.y=-this.rotation;
    if(this.press){const p=this.press,elapsed=time-p.start-p.travel;
      const moving=p.travel?clamp((time-p.start)/p.travel,0,1):1;
      this.block.position.x=THREE.MathUtils.lerp(p.from.x,p.point.x,smooth(moving));this.block.position.z=THREE.MathUtils.lerp(p.from.z,p.point.z,smooth(moving));
      if(p.lift!==null){const t=clamp((time-p.lift)/270,0,1);this.block.position.y=THREE.MathUtils.lerp(p.contactY-.018,p.contactY+.53,smooth(t));if(t>=1){this.press=null;this.state.pressing=false;this.restoreCloth();this.emit();}}
      else {const t=clamp(elapsed/175,0,1);this.block.position.y=THREE.MathUtils.lerp(p.fromY,p.contactY-.018,smooth(t));
        if(t===1){this.pressDepth=.018;if(p.kind==='cloth'){const pos=this.cloth.geometry.attributes.position,cx=p.point.x-this.state.clothOffset,cz=p.point.z;for(let i=0;i<pos.count;i++){const d=Math.pow(pos.getX(i)-cx,2)+Math.pow(pos.getZ(i)-cz,2);pos.setY(i,this.baseHeights[i]-.018*Math.exp(-d/(this.state.size*.5)));}pos.needsUpdate=true;}}
        if(p.released!==null&&time>=p.released&&elapsed>225){if(!p.committed)this.commit(p,time);p.lift=time;}
      }
      this.pad.scale.y=THREE.MathUtils.damp(this.pad.scale.y,p.kind==='ink'&&elapsed>140&&p.lift===null?.86:1,18,dt);
    } else {this.block.position.lerp(this.target,lerp);this.pad.scale.y=THREE.MathUtils.damp(this.pad.scale.y,1,12,dt);}
    const height=Math.max(0,this.block.position.y-.17);this.shadow.position.set(this.block.position.x,.135,this.block.position.z);this.shadow.scale.setScalar(.65+height*.47);this.shadow.material.opacity=clamp(.47-height*.23,.08,.47);
    this.renderer.render(this.scene,this.camera);this.frame=requestAnimationFrame(this.animate);
  };
  dispose(){this.disposed=true;cancelAnimationFrame(this.frame);this.disposals.forEach(f=>f());this.audio?.close();this.scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});this.renderer.dispose();this.renderer.domElement.remove();}
}
