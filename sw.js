// Snack Manager service worker: notifications (Safari-friendly) + offline cache for the scanner libraries.
const CACHE='snack-manager-v1';
const LIBS=['https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js','https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'];
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(async c=>{
    for(const u of LIBS){try{if(!(await c.match(u,{ignoreVary:true})))await c.put(u,await fetch(u,{mode:'no-cors'}))}catch(_){}}
    for(const u of ['./','index.html']){try{await c.add(u)}catch(_){}}
  }));
});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.hostname==='unpkg.com'){ // libraries: cache first
    e.respondWith(caches.match(r,{ignoreVary:true}).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res})));
  }else if(r.mode==='navigate'){ // app page: network first, cached copy when offline
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
  }
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus' in c)return c.focus()}
    return self.clients.openWindow('./');
  }));
});
