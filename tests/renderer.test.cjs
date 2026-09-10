'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {GameEngine}=require('../dist/js/engine.js');
const shaders=[];
function renderer(){
 const record={draws:0,buffers:[],attrs:new Map(),shaders:[]};let count=0;
 const gl=new Proxy({VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,LINK_STATUS:35714,COMPILE_STATUS:35713,TRIANGLES:4,LINES:1,ARRAY_BUFFER:34962,FLOAT:5126,
 createShader:type=>({type}),shaderSource:(shader,src)=>{shaders.push({type:shader.type,source:src});},getShaderParameter:()=>true,getProgramParameter:()=>true,createProgram:()=>({}),createBuffer:()=>({}),getUniformLocation:(_,n)=>n,getAttribLocation:(_,n)=>({aPos:0,aNormal:1,aColor:2}[n]),
 bufferData:(_,arr)=>{assert(arr instanceof Float32Array);assert.equal(arr.length%3===0||arr.length%10===0,true);assert(arr.every(Number.isFinite),'all uploaded vertices must be finite');record.buffers.push(arr.length);},drawArrays:(_,first,n)=>{assert(Number.isInteger(n));assert(n>0);record.draws++;},
 },{get:(t,k)=>k in t?t[k]:()=>{}});
 const canvas={clientWidth:1280,clientHeight:800,width:1280,height:800,getContext:()=>gl,addEventListener:()=>{},getBoundingClientRect:()=>({left:0,top:0,width:1280,height:800})};
 const context={window:{devicePixelRatio:1},Float32Array,console};vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/js/renderer.js','utf8'),context);const g=new GameEngine(427);g.start(0);const r=new context.window.IronTideRenderer(canvas,g);return {g,r,record};
}
test('renderer produces finite ocean, ship, grid and effects geometry in all missions',()=>{const {g,r,record}=renderer();for(let mission=0;mission<3;mission++){g.start(mission);g.state.ships.forEach(s=>{s.visibleUntil=999;s.defenseUntil=9;s.repairUntil=9;});g.effect('hit',8,8);g.effect('splash',4,5);g.state.drones.push({x:4,y:5,age:1});g.state.running=true;for(let i=0;i<10;i++){g.tick(.05);r.render(.05);}}assert.equal(record.draws,90);});
test('camera projection and click unprojection agree across camera modes',()=>{const {g,r}=renderer();for(let mode=0;mode<3;mode++){r.render(.016);for(const p of [[g.selected.x,g.selected.y],[g.selected.x+1,g.selected.y+1],[g.selected.x-1,g.selected.y-1]]){const screen=r.project(p[0],p[1],0);const back=r.pick(screen.x,screen.y);assert(back);assert(Math.abs(back.x-p[0])<.001);assert(Math.abs(back.y-p[1])<.001);}r.cameraMode();}});
test('WebGL failure is reported without throwing from construction',()=>{const context={window:{},Float32Array};vm.runInNewContext(fs.readFileSync(__dirname+'/../dist/js/renderer.js','utf8'),context);const r=new context.window.IronTideRenderer({getContext:()=>null,addEventListener:()=>{}},{});assert.equal(r.gl,null);assert(r.error);});
if(process.env.IRON_TIDE_SHADER_EXPORT){renderer();fs.writeFileSync(process.env.IRON_TIDE_SHADER_EXPORT,JSON.stringify(shaders.slice(0,4)));}
