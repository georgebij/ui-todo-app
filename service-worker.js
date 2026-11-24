// Retire the previous task app's offline cache. No new caching in V1.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{await self.clients.claim();await self.registration.unregister();for(const client of await self.clients.matchAll({type:'window'})){if(client.url.startsWith(self.registration.scope))await client.navigate(client.url);}})()));
