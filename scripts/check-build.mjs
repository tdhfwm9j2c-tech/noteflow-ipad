import {readFile,readdir} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const scope='https://example.test/noteflow-ipad/';
const stores=new Map(),handlers={};let offline=false;
const fetchFile=async input=>{if(offline)throw Error('offline');const url=typeof input==='string'?input:input.url;assert.ok(url.startsWith(scope),'asset escaped repository subpath');const rel=url.slice(scope.length)||'index.html';return new Response(await readFile('dist/'+rel));};
const caches={open:async name=>{if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {addAll:async urls=>{for(const url of urls)store.set(url,await fetchFile(url));},match:async req=>store.get(typeof req==='string'?req:req.url)?.clone(),put:async(req,r)=>store.set(typeof req==='string'?req:req.url,r.clone())};},keys:async()=>[...stores.keys()],delete:async key=>stores.delete(key)};
vm.runInNewContext(await readFile('dist/sw.js','utf8'),{self:{registration:{scope},clients:{claim:async()=>{}},addEventListener:(event,handler)=>handlers[event]=handler},caches,fetch:fetchFile,URL,Response,location:{origin:new URL(scope).origin}});
await new Promise((resolve,reject)=>handlers.install({waitUntil:p=>p.then(resolve,reject)}));
stores.set('noteflow-shell-stale',new Map());
await new Promise((resolve,reject)=>handlers.activate({waitUntil:p=>p.then(resolve,reject)}));
assert.ok(!stores.has('noteflow-shell-stale'));
offline=true;
async function request(url,mode='cors'){return new Promise((resolve,reject)=>handlers.fetch({request:{method:'GET',url,mode},respondWith:p=>p.then(resolve,reject)}));}
assert.ok((await (await request(scope,'navigate')).text()).includes('NoteFlow'));
const assets=await readdir('dist/assets');for(const asset of assets){const response=await request(scope+'assets/'+asset);assert.ok(response.ok);assert.ok((await response.arrayBuffer()).byteLength>0);}
assert.ok(assets.some(x=>x.includes('worker')));
const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'));assert.equal(manifest.start_url,'./');for(const icon of manifest.icons)assert.ok((await request(new URL(icon.src,scope).href)).ok);
console.log('PASS: repository subpath, offline shell + every asset/PDF worker, icons, stale cache cleanup (service-worker simulation; not browser QA)');
