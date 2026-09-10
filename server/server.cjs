'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {GameEngine,PLAYABLE,UPGRADES,clamp}=require('../dist/js/engine.js');
const PUBLIC=path.resolve(__dirname,'../dist');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function createRoomServer(options={}){
 const rooms=new Map(),createRates=new Map();
 const allowed=(options.allowedOrigins||process.env.ALLOWED_ORIGINS||'*').split(',').map(s=>s.trim());
 const maxRooms=Number(process.env.MAX_ROOMS)||24;
 const cleanName=(v,defaultName)=>String(v||defaultName).replace(/[<>]/g,'').replace(/[\u0000-\u001f]/g,'').trim().slice(0,32)||defaultName;
 const loadout=b=>{const out={type:PLAYABLE.includes(b?.type)?b.type:'destroyer',upgrades:{}};for(const k of Object.keys(UPGRADES))out.upgrades[k]=clamp(Math.floor(Number(b?.upgrades?.[k])||0),0,4);return out;};
 function member(b){return {id:crypto.randomUUID(),token:crypto.randomBytes(32).toString('hex'),name:cleanName(b.name,'กัปตัน'),...loadout(b),ready:false,connected:false,stream:null,lastSeen:Date.now(),disconnectAt:null,shipId:null,bucket:45,rateAt:Date.now()};}
 function code(){let k;do{k=crypto.randomBytes(5).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(k));return k;}
 function info(r){return {code:r.code,name:r.name,mission:r.mission,difficulty:r.difficulty,status:r.status,host:r.host,private:r.private,members:r.members.map(m=>({id:m.id,name:m.name,type:m.type,ready:m.ready,connected:m.connected,shipId:m.shipId})),capacity:4};}
 function packet(r,m){return {room:info(r),yourId:m.id,shipId:m.shipId,state:r.game?r.game.publicSnapshot():null,events:r.events.slice(-28),serverTime:Date.now()};}
 function send(r,m){if(!m.stream||m.stream.destroyed)return;const frame='event: frame\ndata: '+JSON.stringify(packet(r,m))+'\n\n';if(m.stream.writableLength>1024*1024){m.stream.destroy();return;}m.stream.write(frame);}
 function broadcast(r){for(const m of r.members)send(r,m);}
 function auth(req,r){const token=(req.headers.authorization||'').replace(/^Bearer /,'');const m=r.members.find(m=>m.token===token);if(!m)throw Object.assign(Error('เซสชันหมดอายุ กรุณาเข้าห้องใหม่'),{status:401});m.lastSeen=Date.now();return m;}
 const requireHost=(r,m)=>{if(r.host!==m.id)throw Object.assign(Error('คำสั่งนี้ใช้ได้เฉพาะเจ้าของห้อง'),{status:403});};
 function detach(r,m,remove=false){if(m.stream){m.stream.end();m.stream=null;}m.connected=false;m.disconnectAt=Date.now();const ship=r.game?.state.ships.find(e=>e.id===m.shipId);if(ship){ship.input={throttle:0,steer:0};if(remove)ship.owner=null;}if(remove){r.members=r.members.filter(x=>x!==m);if(r.host===m.id)r.host=r.members.find(x=>x.connected)?.id||r.members[0]?.id;if(!r.members.length){rooms.delete(r.code);return;}}broadcast(r);}
 function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
 async function body(req){let total=0,chunks=[];for await(const chunk of req){total+=chunk.length;if(total>16384)throw Object.assign(Error('คำขอมีขนาดใหญ่เกินไป'),{status:413});chunks.push(chunk);}try{return chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};}catch(e){throw Object.assign(Error('ข้อมูลคำขอไม่ถูกต้อง'),{status:400});}}
 const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;if(origin){if(!allowed.includes('*')&&!allowed.includes(origin)){json(res,403,{error:'โดเมนนี้ไม่ได้รับอนุญาตให้เชื่อมต่อ'});return;}res.setHeader('Access-Control-Allow-Origin',allowed.includes('*')?'*':origin);res.setHeader('Vary','Origin');}
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  try{
   const url=new URL(req.url,'http://local'),route=url.pathname;
   if(route==='/api/health'){json(res,200,{ok:true,game:'IRON TIDE',version:2,rooms:rooms.size});return;}
   if(route==='/api/rooms'&&req.method==='GET'){json(res,200,{rooms:[...rooms.values()].filter(r=>!r.private&&r.members.length).map(info)});return;}
   if(route==='/api/rooms'&&req.method==='POST'){
    const ip=req.socket.remoteAddress||'local',now=Date.now(),rate=createRates.get(ip)||{at:now,n:0};if(now-rate.at>60000){rate.at=now;rate.n=0;}if(++rate.n>8)throw Object.assign(Error('สร้างห้องบ่อยเกินไป รอสักครู่'),{status:429});createRates.set(ip,rate);if(rooms.size>=maxRooms)throw Object.assign(Error('เซิร์ฟเวอร์มีห้องเต็มแล้ว ลองใหม่ภายหลัง'),{status:503});
    const b=await body(req),m=member(b.pilot||{}),r={code:code(),name:cleanName(b.name,'กองเรือของเพื่อน'),mission:clamp(Number(b.mission)|0,0,2),difficulty:['easy','normal','hard'].includes(b.difficulty)?b.difficulty:'normal',private:!!b.private,members:[m],host:m.id,status:'waiting',game:null,events:[],eventSeq:0,created:now,lastActive:now};rooms.set(r.code,r);json(res,201,{room:info(r),playerId:m.id,token:m.token});return;
   }
   const match=/^\/api\/rooms\/([A-F0-9]{6})\/(join|stream|ready|loadout|configure|start|command|pause|lobby|leave)$/.exec(route);
   if(match){const r=rooms.get(match[1]);if(!r)throw Object.assign(Error('ไม่พบห้องนี้ หรือห้องถูกปิดแล้ว'),{status:404});const op=match[2];r.lastActive=Date.now();
    if(op==='join'&&req.method==='POST'){if(r.status!=='waiting')throw Object.assign(Error('รอบนี้เริ่มแล้ว รอเจ้าของห้องกลับล็อบบี้'),{status:409});if(r.members.length>=4)throw Object.assign(Error('ห้องเต็มแล้ว'),{status:409});const b=await body(req),m=member(b.pilot||{});r.members.push(m);json(res,200,{room:info(r),playerId:m.id,token:m.token});broadcast(r);return;}
    const m=auth(req,r);
    if(op==='stream'&&req.method==='GET'){
     if(m.stream)m.stream.end();const stream=res;m.stream=stream;m.connected=true;m.disconnectAt=null;const ship=r.game?.state.ships.find(x=>x.id===m.shipId&&x.hp>0);if(ship)ship.owner=m.id;
     res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();res.write(': IRON TIDE stream\n\n');broadcast(r);
     res.on('close',()=>{if(m.stream!==stream)return;m.stream=null;m.connected=false;m.disconnectAt=Date.now();m.lastSeen=Date.now();const sh=r.game?.state.ships.find(x=>x.id===m.shipId);if(sh)sh.input={throttle:0,steer:0};});return;
    }
    if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return;}const b=await body(req);
    if(op==='ready'){if(r.status!=='waiting')throw Object.assign(Error('รอบนี้เริ่มแล้ว'),{status:409});m.ready=!!b.ready;}
    if(op==='loadout'){if(!['waiting','finished'].includes(r.status))throw Object.assign(Error('เปลี่ยนเรือได้ในล็อบบี้หรือหลังจบรอบ'),{status:409});Object.assign(m,loadout(b));m.ready=false;}
    if(op==='configure'){requireHost(r,m);if(r.status!=='waiting')throw Object.assign(Error('เปลี่ยนภารกิจได้ในล็อบบี้'),{status:409});r.mission=clamp(Number(b.mission)|0,0,2);r.difficulty=['easy','normal','hard'].includes(b.difficulty)?b.difficulty:r.difficulty;for(const p of r.members)p.ready=false;}
    if(op==='start'){requireHost(r,m);if(r.status!=='waiting')throw Object.assign(Error('ภารกิจเริ่มแล้ว'),{status:409});if(!r.members.every(p=>p.ready&&p.connected))throw Object.assign(Error('รอผู้เล่นทุกคนเชื่อมต่อและกดพร้อม'),{status:409});r.game=new GameEngine();r.game.start(r.mission,r.difficulty,r.members.map(p=>({id:p.id,name:p.name,type:p.type,upgrades:p.upgrades})),crypto.randomUUID());r.game.listener=e=>{if(['fire','hit','sunk','scan','drone','jump','land','intercept','end','domeDown'].includes(e.type)){r.events.push({seq:++r.eventSeq,type:e.type,kind:e.kind,shipId:e.ship?.id,team:e.ship?.team,x:e.ship?.x,y:e.ship?.y});r.events=r.events.slice(-60);}};for(const p of r.members)p.shipId=r.game.forOwner(p.id).id;r.status='playing';r.game.state.running=true;}
    if(op==='command'){
     if(r.status!=='playing')throw Object.assign(Error('ภารกิจยังไม่เริ่มหรือจบแล้ว'),{status:409});const now=Date.now();m.bucket=Math.min(45,m.bucket+(now-m.rateAt)/1000*35);m.rateAt=now;if(m.bucket<1)throw Object.assign(Error('ส่งคำสั่งเร็วเกินไป'),{status:429});m.bucket--;
     const sh=r.game.state.ships.find(x=>x.id===m.shipId&&x.owner===m.id&&x.hp>0);if(!sh){json(res,200,{ok:true,spectator:true});return;}if(b.input)r.game.input(sh.id,b.input);if(b.aim&&finite(b.aim.x)&&finite(b.aim.y))r.game.setTarget(b.aim.x,b.aim.y,sh.id);
     const errors=[];for(const cmd of (Array.isArray(b.actions)?b.actions:[]).slice(0,8)){if(typeof cmd.action!=='string')continue;const arg={targetId:Number.isInteger(cmd.targetId)?cmd.targetId:undefined};const result=r.game.action(cmd.action,sh.id,arg);if(!result.ok)errors.push(result.reason);}json(res,200,{ok:true,errors});return;
    }
    if(op==='pause'){requireHost(r,m);if(r.status!=='playing')throw Object.assign(Error('ยังไม่ได้อยู่ในภารกิจ'),{status:409});r.game.state.running=!!b.running;}
    if(op==='lobby'){requireHost(r,m);if(r.status==='playing')throw Object.assign(Error('ต้องจบภารกิจก่อนกลับล็อบบี้'),{status:409});r.game=null;r.events=[];r.status='waiting';for(const p of r.members){p.ready=false;p.shipId=null;}}
    if(op==='leave'){detach(r,m,true);json(res,200,{ok:true});return;}
    json(res,200,{ok:true,room:info(r)});broadcast(r);return;
   }
   if(route.startsWith('/api/')){json(res,404,{error:'ไม่พบ API ที่เรียก'});return;}
   if(req.method!=='GET'&&req.method!=='HEAD'){json(res,405,{error:'Method not allowed'});return;}
   const rel=decodeURIComponent(route)==='/'?'index.html':decodeURIComponent(route).replace(/^\/+/,''),file=path.resolve(PUBLIC,rel);if(!file.startsWith(PUBLIC+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
  }catch(e){if(!res.headersSent)json(res,e.status||400,{error:e.status?e.message:'คำขอไม่ถูกต้อง'});else res.end();}
 });
 let frame=0;const timer=setInterval(()=>{const now=Date.now();for(const r of rooms.values()){
  for(const m of [...r.members]){if(!m.connected&&m.disconnectAt&&now-m.disconnectAt>3000){const sh=r.game?.state.ships.find(x=>x.id===m.shipId);if(sh&&sh.owner===m.id)sh.owner=null;}if(!m.connected&&now-m.lastSeen>90000){detach(r,m,true);}}
  if(!rooms.has(r.code))continue;if(r.game&&r.status==='playing'){r.game.tick(.05);if(r.game.state.ended)r.status='finished';}if(frame%2===0)broadcast(r);
  if(now-r.lastActive>3600000){for(const m of r.members)m.stream?.end();rooms.delete(r.code);}
 }if(frame%1200===0)for(const [ip,r]of createRates)if(now-r.at>120000)createRates.delete(ip);frame++;},50);timer.unref();
 const close=()=>new Promise(resolve=>{clearInterval(timer);for(const r of rooms.values())for(const m of r.members)m.stream?.end();server.closeAllConnections?.();server.close(resolve);});
 return {server,rooms,close};
}
if(require.main===module){const app=createRoomServer(),port=Number(process.env.PORT)||3000;app.server.listen(port,'0.0.0.0',()=>console.log('IRON TIDE 2 server listening on port '+port));process.on('SIGTERM',()=>app.close().then(()=>process.exit(0)));process.on('SIGINT',()=>app.close().then(()=>process.exit(0)));}
module.exports={createRoomServer};
