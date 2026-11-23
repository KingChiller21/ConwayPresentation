'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {seed,next,command,patterns,levels}=require('../public/life.js');
const {createServer}=require('../server.js');

test('five presentation levels have exact agreed settings and fresh states',()=>{
 assert.deepEqual(['rules','glider','gun','random','final'].map(k=>levels[k].size),[7,50,100,100,100]);
 const rules=seed('rules');assert.equal(rules.population,0);assert.equal(rules.birth,3);
 const final=seed('final');assert.equal(final.population,1);assert.deepEqual([final.birth,final.surviveMin,final.surviveMax,final.speed,final.aging],[1,2,3,5,true]);
 const first=next(final);assert.equal(first.population,8);assert.equal(first.generation,1);
 const reset=command(next(first),{type:'seed',name:'final'});assert.equal(reset.generation,0);assert.equal(reset.running,false);assert.equal(reset.population,1);assert.equal(reset.speed,5);
 const cleared=command(final,{type:'clear'});assert.equal(cleared.name,'final');assert.equal(cleared.birth,1);assert.equal(cleared.population,0);
});
test('Knall coordinates match original Are-you-God design',()=>{
 assert.equal(patterns.knall.points.length,14);
 assert.deepEqual(patterns.knall.points.slice(0,3),[[-1,3],[0,3],[1,3]]);
 assert.deepEqual(patterns.knall.points.slice(-3),[[-1,-3],[0,-3],[1,-3]]);
});
test('Gosper glider gun shoots diagonally and keeps its central generator',()=>{
 let s=seed('gun');assert.equal(s.population,36);for(let i=0;i<180;i++)s=next(s);
 const distant=s.cells.reduce((count,c,i)=>count+(c&&i%s.size>49&&Math.floor(i/s.size)>29),0);
 assert.ok(distant>=15,'at least three gliders travelled down and to the right');
 assert.ok(s.population>36);
});
test('ages are maintained and stamps work without changing generation',()=>{
 let s=seed('block');s=next(s);assert.equal(Math.max(...s.ages),2);
 let b=seed('rules');b=command(b,{type:'stamp',pattern:'beacon',x:1,y:1});assert.equal(b.population,8);assert.equal(b.generation,0);
 b=command(b,{type:'stamp',pattern:'beacon',x:1,y:1,remove:true});assert.equal(b.population,0);
 assert.throws(()=>command(b,{type:'stamp',pattern:'invalid',x:1,y:1}));
 const a=seed('random'),c=seed('random');assert.deepEqual(a.cells,c.cells,'random demo replays on reset');
});
test('fixed /live stream waits before start, broadcasts to 8, and survives changing active session',async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port,abort=new AbortController();
 const post=(url,body,token)=>fetch(base+url,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 const readers=[];
 try{
  assert.equal((await fetch(base+'/live')).status,200);
  assert.equal((await fetch(base+'/qr-live.svg')).status,200);
  for(let i=0;i<8;i++){
   const res=await fetch(base+'/api/live/events',{signal:abort.signal});assert.equal(res.status,200);const reader=res.body.getReader();readers.push({reader,buffer:''});
  }
  async function readState(i){let r=readers[i];while(!r.buffer.includes('\n\n')){const chunk=await r.reader.read();if(chunk.done)throw Error('stream ended');r.buffer+=new TextDecoder().decode(chunk.value);}let end=r.buffer.indexOf('\n\n'),message=r.buffer.slice(0,end);r.buffer=r.buffer.slice(end+2);assert.ok(message.startsWith('data: '));return JSON.parse(message.slice(6));}
  let initial=await Promise.all(readers.map((_,i)=>readState(i)));assert.ok(initial.every(x=>x.waiting));
  const started=await(await post('/api/live/start',{})).json();assert.ok(started.id);assert.ok(started.token);assert.ok(started.presenterToken);
  let updates=await Promise.all(readers.map((_,i)=>readState(i)));assert.ok(updates.every(s=>s.name==='rules'&&s.generation===0));
  assert.equal((await post('/api/sessions/'+started.id+'/command',{type:'seed',name:'final'})).status,403);
  assert.equal((await post('/api/live/start',{})).status,409);
  assert.equal((await post('/api/sessions/'+started.id+'/command',{type:'seed',name:'final'},started.token)).status,200);
  updates=await Promise.all(readers.map((_,i)=>readState(i)));assert.ok(updates.every(s=>s.name==='final'&&s.packed));
  const packed=Buffer.from(updates[0].packed,'base64');assert.equal(packed.length,10000);assert.equal(packed.filter(n=>n>0).length,1);
  assert.equal(updates[0].birth,undefined,'viewer stream must not reveal hidden rule settings');
  assert.equal((await post('/api/sessions/'+started.id+'/command',{type:'step'},started.token)).status,200);
  updates=await Promise.all(readers.map((_,i)=>readState(i)));assert.ok(updates.every(x=>x.generation===1&&x.population===8));
  const r=await(await post('/api/live/start',{presenterToken:started.presenterToken})).json();assert.notEqual(r.id,started.id);
  updates=await Promise.all(readers.map((_,i)=>readState(i)));assert.ok(updates.every(x=>x.name==='rules'&&x.generation===0));
  const last=await(await fetch(base+'/api/live')).json();assert.equal(last.name,'rules');
 }finally{abort.abort();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
