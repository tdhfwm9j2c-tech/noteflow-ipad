export type Point={x:number;y:number;p:number};
export type Stroke={id:string;tool:'pen'|'highlighter';color:string;width:number;points:Point[]};
export type Paper='blank'|'lined'|'grid'|'dot'|'cornell';
export type Page={id:string;width:number;height:number;paper:Paper;strokes:Stroke[];pdfId?:string;pdfIndex?:number};
export type Notebook={id:string;title:string;folder:string;updated:number;pages:Page[]};
export type State={version:1;folders:string[];notebooks:Notebook[]};
export const uid=()=>crypto.randomUUID();
export const newPage=():Page=>({id:uid(),width:794,height:1123,paper:'lined',strokes:[]});
export const initial=():State=>({version:1,folders:['공부','아이디어'],notebooks:[]});
export function drawStroke(ctx:CanvasRenderingContext2D,s:Stroke){const pts=s.points;if(!pts.length)return;ctx.save();ctx.globalAlpha=s.tool==='highlighter'?.27:1;ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineCap='round';ctx.lineJoin='round';if(pts.length===1){ctx.beginPath();ctx.arc(pts[0].x,pts[0].y,s.width/2,0,Math.PI*2);ctx.fill();}else if(s.tool==='highlighter'){ctx.lineWidth=s.width;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(const p of pts.slice(1))ctx.lineTo(p.x,p.y);ctx.stroke();}else for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];ctx.lineWidth=s.width*(s.tool==='pen'?.45+.85*(a.p+b.p)/2:1);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}ctx.restore();}
export function drawPaper(ctx:CanvasRenderingContext2D,p:Page){ctx.fillStyle='#fffefb';ctx.fillRect(0,0,p.width,p.height);ctx.strokeStyle='#dce4e7';ctx.fillStyle='#cdd8dc';ctx.lineWidth=.7;const gap=28;if(p.paper==='grid')for(let x=gap;x<p.width;x+=gap){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,p.height);ctx.stroke();}if(['lined','grid','cornell'].includes(p.paper))for(let y=70;y<p.height;y+=gap){ctx.beginPath();ctx.moveTo(p.paper==='cornell'?170:30,y);ctx.lineTo(p.width-30,y);ctx.stroke();}if(p.paper==='dot')for(let y=42;y<p.height;y+=gap)for(let x=35;x<p.width;x+=gap){ctx.beginPath();ctx.arc(x,y,1,0,Math.PI*2);ctx.fill();}if(p.paper==='cornell'){ctx.beginPath();ctx.moveTo(160,45);ctx.lineTo(160,p.height-160);ctx.moveTo(30,p.height-160);ctx.lineTo(p.width-30,p.height-160);ctx.stroke();}}
let dbPromise:Promise<IDBDatabase>|undefined;
export function db(){return dbPromise??=new Promise((resolve,reject)=>{const r=indexedDB.open('noteflow',1);r.onupgradeneeded=()=>{r.result.createObjectStore('data');r.result.createObjectStore('pdf');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function read<T>(store:string,key:string):Promise<T|undefined>{const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function write(store:string,key:string,value:unknown){const d=await db();return new Promise<void>((resolve,reject)=>{const t=d.transaction(store,'readwrite');t.objectStore(store).put(value,key);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
export function validateState(s:unknown):s is State {
 if(!s||typeof s!=='object')return false;
 const a=s as State;
 if(a.version!==1||!Array.isArray(a.folders)||!a.folders.every(x=>typeof x==='string')||!Array.isArray(a.notebooks))return false;
 return a.notebooks.every(n=>typeof n.id==='string'&&typeof n.title==='string'&&typeof n.folder==='string'&&Number.isFinite(n.updated)&&Array.isArray(n.pages)&&n.pages.length>0&&n.pages.every(p=>{
  if(typeof p.id!=='string'||!Number.isFinite(p.width)||p.width<=0||p.width>5000||!Number.isFinite(p.height)||p.height<=0||p.height>5000||!['blank','lined','grid','dot','cornell'].includes(p.paper)||!Array.isArray(p.strokes))return false;
  if(p.pdfId&&(typeof p.pdfId!=='string'||!Number.isInteger(p.pdfIndex)||p.pdfIndex!<0))return false;
  return p.strokes.every(t=>['pen','highlighter'].includes(t.tool)&&typeof t.id==='string'&&typeof t.color==='string'&&Number.isFinite(t.width)&&t.width>0&&Array.isArray(t.points)&&t.points.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&Number.isFinite(q.p)));
 }));
}
