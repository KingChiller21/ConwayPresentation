(function(root,factory){const life=factory();if(typeof module==='object'&&module.exports)module.exports=life;else root.Life=life;})(globalThis,()=>{
'use strict';
const gunRows=[
'........................O...........',
'......................O.O...........',
'............OO......OO............OO',
'...........O...O....OO............OO',
'OO........O.....O...OO..............',
'OO........O...O.OO....O.O...........',
'..........O.....O.......O...........',
'...........O...O....................',
'............OO......................'
];
function fromRows(rows){return rows.flatMap((r,y)=>[...r].flatMap((v,x)=>v==='O'?[[x,y]]:[]));}
const gun=fromRows(gunRows);
const knall=[[-1,3],[0,3],[1,3],[-1,2],[1,2],[-1,1],[1,1],[-1,-1],[1,-1],[-1,-2],[1,-2],[-1,-3],[0,-3],[1,-3]];
const patterns={
  cell:{label:'Einzelzelle',points:[[0,0]]},
  block:{label:'Block',points:[[0,0],[1,0],[0,1],[1,1]]},
  beehive:{label:'Bienenstock',points:[[1,0],[2,0],[0,1],[3,1],[1,2],[2,2]]},
  blinker:{label:'Blinker',points:[[0,0],[1,0],[2,0]]},
  beacon:{label:'Beacon',points:[[0,0],[1,0],[0,1],[1,1],[2,2],[3,2],[2,3],[3,3]]},
  glider:{label:'Gleiter',points:[[1,0],[2,1],[0,2],[1,2],[2,2]]},
  knall:{label:'Knall · AyG',points:knall},
  gun:{label:'Gosper-Gleiterkanone',points:gun}
};
const levels={
 rules:{label:'1 · Conway Rules',size:7,points:[],speed:2,birth:3,surviveMin:2,surviveMax:3,aging:false,note:'Beginne mit einzelnen Zellen. Baue Block, Bienenstock, Blinker und Beacon direkt im Raster.'},
 glider:{label:'2 · Gleiter & Knall',size:50,pattern:'glider',offset:[7,7],speed:4,birth:3,surviveMin:2,surviveMax:3,aging:false,note:'Führe den Gleiter vor, lass ihn am Rand verschwinden oder mit einem Block kollidieren. Setze danach das Original-Knallmuster aus Are you God?'},
 gun:{label:'3 · Gleiterkanone',size:100,pattern:'gun',offset:[7,9],speed:10,birth:3,surviveMin:2,surviveMax:3,aging:false,note:'Gosper-Gleiterkanone: Alle 30 Generationen entsteht ein neuer Gleiter, der diagonal nach rechts unten fliegt.'},
 random:{label:'4 · Zufallswelt',size:100,speed:8,birth:3,surviveMin:2,surviveMax:3,aging:true,note:'100 × 100 unter Conways B3/S23, mit Zellalter. Starte eine Zufallswelt und beobachte, was verschwindet und was bleibt.'},
 final:{label:'5 · Das letzte Experiment',size:100,pattern:'cell',offset:[50,50],speed:5,birth:1,surviveMin:2,surviveMax:3,aging:true,note:'Nur eine Zelle. Die Geburtsregel ist geheim auf B1 geändert, die Überlebensregel bleibt S23. Beginne bei 5 Generationen/s, dann die philosophische Schlussfrage.'},
 block:{label:'Block (V0.1)',size:8,pattern:'block',offset:[3,3],speed:4,birth:3,surviveMin:2,surviveMax:3,aging:false,hidden:true},
 blinker:{label:'Blinker (V0.1)',size:9,pattern:'blinker',offset:[3,4],speed:4,birth:3,surviveMin:2,surviveMax:3,aging:false,hidden:true},
 empty:{label:'Leer (V0.1)',size:20,points:[],speed:4,birth:3,surviveMin:2,surviveMax:3,aging:false,hidden:true}
};
function stamp(cells,size,points,anchorX,anchorY,remove=false){for(const [px,py]of points){let x=px+anchorX,y=py+anchorY;if(x>=0&&x<size&&y>=0&&y<size)cells[y*size+x]=remove?0:1;}}
function randomUnit(seed){let v=seed>>>0;return()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296;};}
function seed(name='rules',size,options={}){const l=levels[name];if(!l)throw Error('Unbekanntes Level');size=size??l.size;if(!Number.isInteger(size)||size<5||size>150)throw Error('Raster: 5–150');const cells=Array(size*size).fill(0),randomSeed=options.randomSeed??20261209;if(name==='random'){const rand=randomUnit(randomSeed);for(let i=0;i<cells.length;i++)cells[i]=rand()<.28?1:0;}else if(l.pattern){const offset=l.offset||[Math.floor(size/2),Math.floor(size/2)];stamp(cells,size,patterns[l.pattern].points,offset[0],offset[1]);}else if(l.points?.length){stamp(cells,size,l.points,0,0);}
return{size,name,cells,ages:cells.map(v=>v?1:0),generation:0,population:cells.reduce((a,b)=>a+b,0),running:false,speed:l.speed,birth:l.birth,surviveMin:l.surviveMin,surviveMax:l.surviveMax,aging:l.aging,randomSeed};}
function next(s){const{size,cells,birth=3,surviveMin=2,surviveMax=3}=s,oldAges=s.ages||cells.map(v=>v?1:0),result=Array(cells.length).fill(0),ages=Array(cells.length).fill(0);let population=0;for(let y=0;y<size;y++)for(let x=0;x<size;x++){let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx>=0&&xx<size&&yy>=0&&yy<size)n+=cells[yy*size+xx];}const i=y*size+x,isAlive=cells[i]===1;const alive=isAlive?(n>=surviveMin&&n<=surviveMax):n===birth;if(alive){result[i]=1;ages[i]=isAlive?Math.min(255,(oldAges[i]||1)+1):1;population++;}}return{...s,cells:result,ages,population,generation:s.generation+1};}
function command(s,c){if(!c||typeof c!=='object')throw Error('Ungültiger Befehl');switch(c.type){
case 'seed':{const name=c.name||s.name,options={randomSeed:c.newRandom?Math.floor(Math.random()*4294967296):s.randomSeed};return seed(name,c.size,options);}
case 'clear':return{...s,cells:Array(s.size*s.size).fill(0),ages:Array(s.size*s.size).fill(0),population:0,generation:0,running:false};
case 'step':if(s.running)throw Error('Erst pausieren');return next(s);
case 'run':if(typeof c.value!=='boolean')throw Error('Ungültiger Status');return{...s,running:c.value};
case 'speed':if(!Number.isInteger(c.value)||c.value<1||c.value>21)throw Error('Tempo: 1–21');return{...s,speed:c.value};
case 'toggle':if(s.running)throw Error('Erst pausieren');if(!Number.isInteger(c.index)||c.index<0||c.index>=s.cells.length)throw Error('Ungültige Zelle');{const cells=s.cells.slice(),ages=s.ages.slice();cells[c.index]=1-cells[c.index];ages[c.index]=cells[c.index]?1:0;return{...s,cells,ages,population:s.population+(cells[c.index]?1:-1)};}
case 'stamp':if(s.running)throw Error('Erst pausieren');if(!patterns[c.pattern]||!Number.isInteger(c.x)||!Number.isInteger(c.y)||c.x<0||c.y<0||c.x>=s.size||c.y>=s.size)throw Error('Ungültige Formation');{const cells=s.cells.slice(),ages=s.ages.slice();stamp(cells,s.size,patterns[c.pattern].points,c.x,c.y,!!c.remove);for(let i=0;i<cells.length;i++)ages[i]=cells[i]?(ages[i]||1):0;return{...s,cells,ages,population:cells.reduce((a,b)=>a+b,0)};}
default:throw Error('Unbekannter Befehl');}}
return{levels,patterns,seed,next,command};});
