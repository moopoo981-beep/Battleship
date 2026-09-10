'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createRoomServer}=require('../server/server.cjs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,timeout=3000){const start=Date.now();while(!fn()){if(Date.now()-start>timeout)throw Error('Timed out waiting for condition');await sleep(25);}}
async function setup(t,opts={}){const app=createRoomServer(opts);await new Promise(r=>app.server.listen(0,'127.0.0.1',r));t.after(()=>app.close());const base='http://127.0.0.1:'+app.server.address().port;
 async function req(route,data,token,extra={}){const headers={...extra};if(data!==undefined)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;const res=await fetch(base+route,{method:data===undefined?'GET':'POST',headers,body:data===undefined?undefined:JSON.stringify(data)});const body=await res.json();return {status:res.status,...body};}
 async function stream(auth){const ac=new AbortController(),res=await fetch(base+'/api/rooms/'+auth.room.code+'/stream',{headers:{Authorization:'Bearer '+auth.token},signal:ac.signal});assert.equal(res.status,200);const frames=[],reader=res.body.getReader();let ended=false;const done=(async()=>{const d=new TextDecoder();let buffer='';try{while(!ended){const r=await reader.read();if(r.done)break;buffer+=d.decode(r.value,{stream:true});let at;while((at=buffer.indexOf('\n\n'))>=0){const part=buffer.slice(0,at);buffer=buffer.slice(at+2);const line=part.split('\n').find(x=>x.startsWith('data: '));if(line)frames.push(JSON.parse(line.slice(6)));}}}catch(e){if(e.name!=='AbortError')throw e;}})();const stop=async()=>{ended=true;ac.abort();await done;};t.after(stop);await until(()=>frames.length>0);return {frames,stop,get last(){return frames.at(-1);}};}
 return {app,base,req,stream};
}
test('rooms list, private rooms, access control, capacity and readiness',async t=>{
 const {req}=await setup(t);
 assert.equal((await req('/api/health')).version,2);
 const host=await req('/api/rooms',{name:'Test Fleet',pilot:{name:'A',type:'destroyer'}});assert.equal(host.status,201);
 const code=host.room.code,guest=await req('/api/rooms/'+code+'/join',{pilot:{name:'B',type:'frigate'}});
 assert.equal(guest.status,200);assert.notEqual(guest.token,host.token);
 const list=await req('/api/rooms');assert.equal(list.rooms[0].members.length,2);assert(!JSON.stringify(list).includes(host.token));
 assert.equal((await req('/api/rooms/'+code+'/start',{},guest.token)).status,403);
 assert.equal((await req('/api/rooms/'+code+'/start',{},host.token)).status,409);
 assert.equal((await req('/api/rooms/'+code+'/ready',{ready:true},'wrong')).status,401);
 await req('/api/rooms/'+code+'/join',{pilot:{name:'C'}});await req('/api/rooms/'+code+'/join',{pilot:{name:'D'}});
 assert.equal((await req('/api/rooms/'+code+'/join',{pilot:{name:'E'}})).status,409);
 const secret=await req('/api/rooms',{name:'Secret',private:true,pilot:{name:'S'}});
 assert(!(await req('/api/rooms')).rooms.some(r=>r.code===secret.room.code));
});
test('two actual HTTP clients receive common simulation, control only their ship, pause, reconnect and replay',async t=>{
 const {req,stream,app}=await setup(t),a=await req('/api/rooms',{name:'Integration',mission:0,pilot:{name:'Alpha',type:'destroyer'}}),code=a.room.code,b=await req('/api/rooms/'+code+'/join',{pilot:{name:'Bravo',type:'frigate'}}),sa=await stream(a),sb=await stream(b);
 await req('/api/rooms/'+code+'/ready',{ready:true},a.token);await req('/api/rooms/'+code+'/ready',{ready:true},b.token);
 assert.equal((await req('/api/rooms/'+code+'/start',{},a.token)).status,200);
 await until(()=>sa.last.state?.running&&sb.last.state?.running);
 assert.notEqual(sa.last.shipId,sb.last.shipId);assert.equal(sa.last.state.matchId,sb.last.state.matchId);
 const game=app.rooms.get(code).game,pa=game.forOwner(a.playerId),pb=game.forOwner(b.playerId),beforeB=pb.throttle;
 await req('/api/rooms/'+code+'/command',{shipId:pb.id,input:{throttle:99,steer:0},aim:{x:10,y:23},actions:[]},a.token);
 await sleep(250);assert(pa.throttle>0);assert.equal(pb.throttle,beforeB);assert(pa.throttle<=1);
 assert.equal((await req('/api/rooms/'+code+'/join',{pilot:{name:'late'}})).status,409);
 assert.equal((await req('/api/rooms/'+code+'/pause',{running:false},b.token)).status,403);
 await req('/api/rooms/'+code+'/pause',{running:false},a.token);const stopped=game.state.time;await sleep(150);assert.equal(game.state.time,stopped);
 await req('/api/rooms/'+code+'/pause',{running:true},a.token);
 const oldId=pb.id;await sb.stop();await until(()=>game.state.ships.find(x=>x.id===oldId)?.owner===null,4000);
 const sb2=await stream(b);await until(()=>game.state.ships.find(x=>x.id===oldId)?.owner===b.playerId);assert.equal(sb2.last.shipId,oldId);
 // Force only terminal state here to test transport and room replay, not balancing.
 game.end(true,'Transport test victory');await until(()=>sa.last.state?.ended&&sb2.last.state?.ended);
 assert.equal(sa.last.state.ended.credits,sb2.last.state.ended.credits);
 assert.equal((await req('/api/rooms/'+code+'/loadout',{type:'cruiser',upgrades:{missile:2,armor:1}},b.token)).status,200);
 assert.equal((await req('/api/rooms/'+code+'/lobby',{},a.token)).status,200);await until(()=>sa.last.room.status==='waiting'&&sa.last.state===null);
 assert(sa.last.room.members.every(x=>!x.ready));
 await req('/api/rooms/'+code+'/ready',{ready:true},a.token);await req('/api/rooms/'+code+'/ready',{ready:true},b.token);
 assert.equal((await req('/api/rooms/'+code+'/start',{},a.token)).status,200);
 const upgraded=app.rooms.get(code).game.forOwner(b.playerId);assert.equal(upgraded.type,'cruiser');assert.equal(upgraded.missiles,28);assert.equal(upgraded.maxHP,909);
 assert.equal((await req('/api/rooms/'+code+'/loadout',{type:'battleship'},b.token)).status,409);
 await req('/api/rooms/'+code+'/leave',{},a.token);await until(()=>sb2.last.room.host===b.playerId);
});
test('CORS rejects disallowed origins and request bodies cannot edit world state',async t=>{
 const {req}=await setup(t,{allowedOrigins:'https://example.github.io'});
 assert.equal((await req('/api/rooms',undefined,null,{Origin:'https://wrong.example'})).status,403);
 const res=await req('/api/rooms',undefined,null,{Origin:'https://example.github.io'});assert.equal(res.status,200);
 const p=await req('/api/rooms',{pilot:{type:'uplink',upgrades:{armor:999}}});
 assert.equal(p.room.members[0].type,'destroyer');
});
test('packaged RoomClient parses live streams and sends multiplayer commands',async t=>{
 const fs=require('node:fs'),vm=require('node:vm'),{base,app}=await setup(t);
 function client(){const memory=new Map(),ctx={window:{},location:{origin:base,protocol:'http:'},URL,fetch,AbortController,TextDecoder,setTimeout,clearTimeout,sessionStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)}};vm.runInNewContext(fs.readFileSync(require.resolve('../dist/js/network.js'),'utf8'),ctx);const c=new ctx.window.IronTideNetwork();c.setBase(base);const data=[];c.onFrame=p=>data.push(p);const notices=[];c.onNotice=s=>notices.push(s);t.after(()=>c.disconnect());return {c,data,notices};}
 const a=client(),b=client();assert.equal((await a.c.health()).version,2);await a.c.create({name:'Packaged client',pilot:{name:'One',type:'destroyer'}});await b.c.join(a.c.code,{name:'Two',type:'frigate'});await until(()=>a.c.status==='online'&&b.c.status==='online');
 await a.c.roomAction('ready',{ready:true});await b.c.roomAction('ready',{ready:true});await a.c.roomAction('start');await until(()=>a.data.at(-1).state?.running&&b.data.at(-1).state?.running);
 const state=a.data.at(-1).state;assert.equal(state.matchId,b.data.at(-1).state.matchId);a.c.queue('scan');await a.c.send({throttle:1,steer:0},{x:14,y:25});await sleep(200);
 const p=app.rooms.get(a.c.code).game.forOwner(a.c.playerId);assert(p.scanCD>0);assert(p.throttle>0);assert.equal(a.notices.length,0);
 await b.c.leave();await until(()=>a.data.at(-1).room.members.length===1);await a.c.leave();
});
