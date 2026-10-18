import {PDFDocument,degrees} from 'pdf-lib';
import {drawPaper,drawStroke,type Notebook} from './core.ts';
export async function createPdf(note:Notebook,readPdf:(id:string)=>Promise<Uint8Array|undefined>,makeCanvas:()=>HTMLCanvasElement){
 const out=await PDFDocument.create(),source=new Map<string,PDFDocument>();
 for(const p of note.pages){let target;
  if(p.pdfId){if(!source.has(p.pdfId)){const bytes=await readPdf(p.pdfId);if(!bytes)throw Error('PDF 원본 누락');source.set(p.pdfId,await PDFDocument.load(bytes));}const copied=await out.copyPages(source.get(p.pdfId)!,[p.pdfIndex||0]);target=out.addPage(copied[0]);}
  else target=out.addPage([p.width,p.height]);
  const c=makeCanvas(),scale=Math.min(2,4096/Math.max(p.width,p.height));c.width=Math.ceil(p.width*scale);c.height=Math.ceil(p.height*scale);const ctx=c.getContext('2d')!;ctx.scale(c.width/p.width,c.height/p.height);if(!p.pdfId)drawPaper(ctx,p);for(const s of p.strokes)drawStroke(ctx,s);
  const png=await out.embedPng(c.toDataURL('image/png'));
  const crop=target.getCropBox(),rotation=((target.getRotation().angle%360)+360)%360;
  const swapped=rotation===90||rotation===270;
  target.drawImage(png,{x:crop.x+(rotation===90||rotation===180?crop.width:0),y:crop.y+(rotation===180||rotation===270?crop.height:0),width:swapped?crop.height:crop.width,height:swapped?crop.width:crop.height,rotate:degrees(rotation)});c.width=c.height=1;
 }
 return out.save();
}
