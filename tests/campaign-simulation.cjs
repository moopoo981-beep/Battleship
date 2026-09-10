'use strict';
const assert=require('node:assert/strict'),{GameEngine,dist,clamp}=require('../dist/js/engine.js');
// One scripted human uses only ordinary commands; allied AI controls the rest.
function run(mission,difficulty,seed=427){
 const g=new GameEngine(seed);g.start(mission,difficulty,[{id:'local',name:'Test Captain',type:mission===2?'battleship':'destroyer',upgrades:{}}]);g.state.running=true;let clock=0;
 while(!g.state.ended&&g.state.time<800){g.tick(.05);clock+=.05;if(clock<.35)continue;clock=0;const p=g.forOwner('local');if(!p||p.hp<=0)continue;const s=g.state;
  if(p.hp<p.maxHP*.60)g.action('repair');if(s.projectiles.some(x=>x.team!=='player'&&dist(x,p)<5)||s.drones.some(x=>dist(x,p)<5))g.action('defense');g.action('scan');
  const targets=s.ships.filter(e=>e.team==='enemy'&&e.hp>0&&g.isVisible(e)&&!(e.type==='uplink'&&!s.objectiveOpen)).sort((a,b)=>dist(a,p)-dist(b,p)),e=targets[0];
  if(!e){g.setTarget(18,20);g.action('move');continue;}
  if(dist(p,e)>p.range*.7){g.setTarget(clamp(e.x,2,34),clamp(e.y+4,2,34));g.action('move');}
  const flight=1.3+dist(p,e)*.11;g.setTarget(e.x+(e.vx||0)*flight,e.y+(e.vy||0)*flight);g.action('gun');if(p.type==='battleship')g.action('anchor');
  for(const t of targets.slice(0,p.lockLimit))if(!p.locks.includes(t.id))g.action('lock',p.id,{targetId:t.id});g.action('missile');if(dist(p,e)<12){g.setTarget(e.x,e.y);g.action('torpedo');}
 }
 const out={mission:mission+1,difficulty,win:g.state.ended?.win,seconds:Math.round(g.state.time),kills:g.state.stats.kills,reason:g.state.ended?.reason};console.log(JSON.stringify(out));return out;
}
if(require.main===module)for(const difficulty of ['easy','normal'])for(let m=0;m<3;m++)assert(run(m,difficulty).win,'Mission '+(m+1)+' must be winnable');
module.exports={run};
