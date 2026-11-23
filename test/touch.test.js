'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const Life=require('../public/life.js');
test('viewer pinch zoom, one finger pan, reset and read-only simulation',()=>{
 const elements=new Map();
 const ctx2d={fillRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){}};
 function fakeElement(id){
  const cls={toggle(){}};
  return {id,hidden:false,disabled:false,children:[],dataset:{},classList:cls,style:{},textContent:'',value:'',
   append(child){this.children.push(child);},replaceChildren(){this.children=[];},
   getBoundingClientRect(){return {left:0,top:0,width:400,height:400};},
   getContext(){return ctx2d;},setPointerCapture(){},
   addEventListener(type,cb){this['_'+type]=cb;},setAttribute(){}};
 }
 const $=id=>{if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id);};
 const document={getElementById:$,documentElement:{dataset:{theme:'dark'}},
  querySelector(){return $('.workspace');},addEventListener(){},createElement(){return fakeElement('dynamic');}};
 const sandbox={document,window:{CONWAY_OFFLINE:true,addEventListener(){}},Life,
  location:{protocol:'file:'},localStorage:{getItem(){return null;},setItem(){}},
  getComputedStyle(){return {getPropertyValue(){return '#000';}}},
  devicePixelRatio:1,ResizeObserver:undefined,clearInterval,setInterval,console};
 vm.createContext(sandbox);
 const source=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
 vm.runInContext(source,sandbox);
 vm.runInContext("update(Life.seed('final'));mode='viewer';",sandbox);
 const board=$('board');
 const pointer=(type,id,x,y)=>board['on'+type]({pointerId:id,pointerType:'touch',isPrimary:id===1,clientX:x,clientY:y,preventDefault(){}});
 pointer('pointerdown',1,170,200);
 pointer('pointerdown',2,230,200);
 pointer('pointermove',2,275,200);
 pointer('pointerup',2,275,200);
 pointer('pointermove',1,145,230);
 pointer('pointerup',1,145,230);
 const read=()=>vm.runInContext('({zoom,panX,panY,generation:state.generation,population:state.population})',sandbox);
 const changed=read();
 assert.ok(changed.zoom>1.2,'pinch must enlarge the board');
 assert.ok(Math.abs(changed.panX)+Math.abs(changed.panY)>1,'single finger must pan the enlarged board');
 assert.equal(changed.generation,0,'navigation must not step simulation');
 assert.equal(changed.population,1,'navigation must not alter cells');
 $('zoomReset').onclick();
 const reset=read();assert.equal(reset.zoom,1);assert.equal(reset.panX,0);assert.equal(reset.panY,0);
 vm.runInContext("update(Life.seed('rules'));",sandbox);
 assert.equal(read().zoom,1,'level switch resets the local camera');
});