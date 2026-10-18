import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCanvas} from '@napi-rs/canvas';
const assets=(await readdir('dist/assets')).map(x=>'./assets/'+x);
const version=createHash('sha256').update(assets.join()).update(await readFile('dist/index.html')).update(await readFile('dist/manifest.webmanifest')).update(await readFile('public/sw.js')).update(await readFile('scripts/finalize.mjs')).digest('hex').slice(0,12);
let sw=await readFile('public/sw.js','utf8');sw=sw.replace("noteflow-shell-v1",'noteflow-shell-'+version).replace("'./icon.svg',","'./icon.svg',..."+JSON.stringify(assets)+",");await writeFile('dist/sw.js',sw);
for(const size of [192,512]){const c=createCanvas(size,size),ctx=c.getContext('2d');ctx.fillStyle='#315b4c';ctx.fillRect(0,0,size,size);ctx.strokeStyle='white';ctx.lineWidth=size*.085;ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(size*.29,size*.74);ctx.lineTo(size*.29,size*.26);ctx.lineTo(size*.71,size*.74);ctx.lineTo(size*.71,size*.26);ctx.stroke();await writeFile('dist/icon-'+size+'.png',c.toBuffer('image/png'));}
