import {CatmullRomCurve3,Vector3} from 'three';
import type {Motif} from './motifs';
import carving from './assets/reference-carving.json';

const perimeter=new CatmullRomCurve3(carving.outline.map(([x,y])=>new Vector3(x,y,0)),true,'centripetal');
export const heroOutline=perimeter.getPoints(300).map(p=>[p.x,p.y] as const);
export const heroMotif:Motif={id:'reference-floral-block',name:'Carved floral printing block',family:'Ornamental',paths:[carving.path]};
