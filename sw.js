// Service worker: guarda a "casca" do app para abrir offline.
// Os dados do TSE/IBGE (outras origens) não passam por aqui: seguem direto para a rede.
const CACHE='apura-v1';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||new URL(req.url).origin!==location.origin)return;
  // Rede primeiro (para sempre pegar a versão nova da página); cache se estiver offline.
  e.respondWith(fetch(req).then(r=>{
    if(r.ok){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp))}
    return r;
  }).catch(()=>caches.match(req).then(r=>r||(req.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
