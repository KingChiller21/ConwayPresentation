'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {seed,next,command}=require('./public/life.js');
const files={
 '/':['index.html','text/html; charset=utf-8'],
 '/live':['index.html','text/html; charset=utf-8'],
 '/life.js':['life.js','text/javascript; charset=utf-8'],
 '/app.js':['app.js','text/javascript; charset=utf-8'],
 '/style.css':['style.css','text/css; charset=utf-8'],
 '/qr-live.svg':['qr-live.svg','image/svg+xml']
};
function createServer(){
 const sessions=new Map(),liveClients=new Set(),ttl=6*60*60*1000;
 let activeId=null,liveOwnerToken=null;
 const send=(res,code,data)=>{res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));};
 const event=(res,data)=>{if(res.destroyed)return false;if(res.writableLength>512000){res.destroy();return false;}res.write('data: '+JSON.stringify(data)+'\n\n');return true;};
 const compact=s=>({waiting:false,size:s.size,name:s.name,generation:s.generation,population:s.population,running:s.running,speed:s.speed,aging:s.aging,packed:Buffer.from(s.ages).toString('base64')});
 function notifyWaiting(){for(const res of liveClients)if(!event(res,{waiting:true}))liveClients.delete(res);}
 function broadcast(s){const full=JSON.stringify(s.state);for(const res of s.clients){if(res.destroyed||res.writableLength>512000){res.destroy();s.clients.delete(res);}else res.write('data: '+full+'\n\n');}if(activeId===s.id){const packet=compact(s.state);for(const res of liveClients)if(!event(res,packet))liveClients.delete(res);}}
 function stopClock(s){clearInterval(s.clock);s.clock=null;}
 function clock(s){stopClock(s);if(s.state.running)s.clock=setInterval(()=>{s.state=next(s.state);broadcast(s);},1000/s.state.speed);}
 function remove(s){stopClock(s);for(const res of s.clients)res.end();sessions.delete(s.id);if(activeId===s.id){activeId=null;liveOwnerToken=null;notifyWaiting();}}
 function read(req){return new Promise((resolve,reject)=>{let body='',tooBig=false;req.on('data',chunk=>{if(tooBig)return;body+=chunk;if(body.length>8192){tooBig=true;reject(Error('Anfrage zu groß'));}});req.on('end',()=>{if(!tooBig){try{resolve(JSON.parse(body||'{}'));}catch{reject(Error('Ungültiges JSON'));}}});req.on('error',reject);});}
 function createSession(){const id=crypto.randomBytes(8).toString('hex'),token=crypto.randomBytes(32).toString('hex');const s={id,token,state:seed(),clients:new Set(),last:Date.now(),clock:null};sessions.set(id,s);return s;}
 function clean(){for(const s of sessions.values())if(Date.now()-s.last>ttl&&s.clients.size===0&&!(activeId===s.id&&liveClients.size))remove(s);}
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost'),p=url.pathname;
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(req.method==='GET'&&files[p]){const[f,m]=files[p];try{res.writeHead(200,{'content-type':m,'cache-control':'no-cache'});res.end(fs.readFileSync(path.join(__dirname,'public',f)));}catch{res.writeHead(404);res.end();}return;}
  if(req.method==='GET'&&p==='/health'){send(res,200,{ok:true,live:!!activeId});return;}
  if(req.method==='GET'&&p==='/api/live'){const s=sessions.get(activeId);send(res,200,s?compact(s.state):{waiting:true});return;}
  if(req.method==='GET'&&p==='/api/live/events'){
   if(liveClients.size>=32){send(res,503,{error:'Zuschauerraum voll'});return;}
   res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache, no-transform','connection':'keep-alive','x-accel-buffering':'no'});
   liveClients.add(res);const s=sessions.get(activeId);if(s){s.last=Date.now();event(res,compact(s.state));}else event(res,{waiting:true});res.on('close',()=>liveClients.delete(res));return;
  }
  if(req.method==='POST'&&p==='/api/live/start'){
   try{
    const data=await read(req),current=sessions.get(activeId);
    if(current&&data.presenterToken!==liveOwnerToken){send(res,409,{error:'Eine Live-Präsentation läuft bereits. Bitte am Moderatorgerät fortsetzen.'});return;}
    if(process.env.PRESENTATION_ADMIN_KEY&&data.adminKey!==process.env.PRESENTATION_ADMIN_KEY){send(res,403,{error:'Moderator-Schlüssel ungültig'});return;}
    clean();if(sessions.size>=32){send(res,503,{error:'Zu viele Sitzungen'});return;}
    if(current){stopClock(current);current.state.running=false;}
    const s=createSession();liveOwnerToken=crypto.randomBytes(32).toString('hex');activeId=s.id;broadcast(s);
    send(res,201,{id:s.id,token:s.token,presenterToken:liveOwnerToken,state:s.state});
   }catch(e){send(res,400,{error:e.message});}return;
  }
  if(req.method==='POST'&&p==='/api/sessions'){
   clean();if(sessions.size>=32){send(res,503,{error:'Zu viele Sitzungen'});return;}
   const s=createSession();send(res,201,{id:s.id,token:s.token,state:s.state});return;
  }
  const m=p.match(/^\/api\/sessions\/([a-f0-9]{16})(?:\/(events|command))?$/);
  if(!m||!sessions.has(m[1])){send(res,404,{error:'Sitzung nicht gefunden'});return;}
  const s=sessions.get(m[1]);s.last=Date.now();
  if(req.method==='GET'&&!m[2]){send(res,200,s.state);return;}
  if(req.method==='GET'&&m[2]==='events'){
   if(s.clients.size>=24){send(res,503,{error:'Sitzung voll'});return;}
   res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache, no-transform','connection':'keep-alive','x-accel-buffering':'no'});
   s.clients.add(res);event(res,s.state);res.on('close',()=>s.clients.delete(res));return;
  }
  if(req.method==='POST'&&m[2]==='command'){
   if(req.headers.authorization!=='Bearer '+s.token){send(res,403,{error:'Nur der Moderator darf steuern'});return;}
   try{s.state=command(s.state,await read(req));clock(s);broadcast(s);send(res,200,s.state);}catch(e){send(res,400,{error:e.message});}return;
  }
  send(res,405,{error:'Methode nicht erlaubt'});
 });
 const maintenance=setInterval(()=>{
  if(activeId&&liveClients.size){const s=sessions.get(activeId);if(s)s.last=Date.now();}
  clean();for(const s of sessions.values())for(const res of s.clients){if(res.destroyed)s.clients.delete(res);else res.write(': heartbeat\n\n');}
  for(const res of liveClients){if(res.destroyed)liveClients.delete(res);else res.write(': heartbeat\n\n');}
 },15000);maintenance.unref();
 server.on('close',()=>{clearInterval(maintenance);for(const s of sessions.values())remove(s);for(const r of liveClients)r.end();liveClients.clear();});
 return server;
}
if(require.main===module)createServer().listen(process.env.PORT||8080,'0.0.0.0',()=>console.log('Conway Presentation V0.2 bereit'));
module.exports={createServer};
