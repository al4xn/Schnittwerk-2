// SW.js
/* Schnittwerk service worker – keeps the game playable offline once it was loaded online.
   Game files: network first (so updates arrive), cache as fallback. Matter.js: cache first. */
const V='schnittwerk-1.2.0',FILES=['./','index.html','style.css','game.js','icon.svg','manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES).catch(()=>{})).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.pathname.startsWith('/api/'))return;
  const isLib=/matter(\.min)?\.js$/.test(u.pathname);
  if(isLib){e.respondWith(caches.match(r).then(m=>m||fetch(r).then(x=>{const c=x.clone();caches.open(V).then(ch=>ch.put(r,c));return x;})));return;}
  if(u.origin===location.origin){
    e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(ch=>ch.put(r,c));return x;}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
  }
});
