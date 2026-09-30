// @ts-nocheck — ported drawing code from the prototype; the public surface is typed via AnimDef below.
/**
 * Per-animation drawing code (the “rigs”). Each entry builds its SVG scene once
 * and redraws it for a normalised time t ∈ [0,1]:
 *   build(svg, mode) → state      frame(state, t, mode)
 *   cam(t) → default camera       hud(t, mode) → [value, label]
 * Titles, descriptions and step scripts live in meta.json / scripts.json.
 */
import { E, L, CL, EZ, seg, kf, glowDefs } from '../../../../engine/svg';
import type { AnimDef } from '../../../../engine/animation/types';

export const ANIM_DEFS = {
/* ---------------- A1 centrifuge ---------------- */
cent:{
hud:t=>t<.1?["—","FORCE"]:t<.38?["1,000 ×g","FORCE"]:t<.66?["10,000 ×g","FORCE"]:["100,000 ×g","FORCE"],
cam:t=>{const P=[[0,0,0,1200,675],[.08,0,0,1200,675],[.12,40,40,560,315],[.36,40,40,560,315],[.4,390,40,560,315],[.64,390,40,560,315],[.68,740,40,560,315],[.88,740,40,560,315],[.96,0,0,1200,675]];return kf(t,P)},
build(svg){glowDefs(svg);const S={tubes:[],parts:[]};const T=[{cx:320},{cx:670},{cx:1020}];const R=[14,7,3.6,1.9],C=['#8aa0c8','#3ddc97','#ff8a3d','#3fb6ff'],N=[7,26,55,110];
 T.forEach((tb,k)=>{const g=E('g',{opacity:k?0:1},svg);E('path',{d:`M${tb.cx-60} 110 V480 Q${tb.cx-60} 560 ${tb.cx} 560 Q${tb.cx+60} 560 ${tb.cx+60} 480 V110`,fill:'rgba(63,182,255,.05)',stroke:'#5a6b8c','stroke-width':3},g);
  const rot=E('g',{},g);for(let i=0;i<3;i++)E('path',{d:`M${tb.cx-110} ${300} a110 110 0 0 1 ${220} 0`,fill:'none',stroke:'#3fb6ff','stroke-opacity':.25,'stroke-width':2,'stroke-dasharray':'4 10',transform:`rotate(${i*120} ${tb.cx} 300)`},rot);
  const lab=E('text',{x:tb.cx,y:610,'text-anchor':'middle',fill:'#fff','font-size':22,'font-weight':700,opacity:0},g);lab.textContent=['沈殿：核','沈殿：ミトコンドリア・リソソーム','沈殿：ミクロゾーム'][k];
  const sup=E('text',{x:tb.cx,y:95,'text-anchor':'middle',fill:'#3fb6ff','font-size':22,'font-weight':700,opacity:0},g);sup.textContent='上清：サイトゾル';
  S.tubes.push({g,rot,lab,sup,cx:tb.cx});
  for(let ty=k;ty<4;ty++)for(let i=0;i<N[ty];i++){const x=tb.cx-50+Math.random()*100,y=130+Math.random()*400;const c=E('circle',{cx:x,cy:y,r:R[ty],fill:ty==1&&i%3==0?'#e3263f':C[ty],opacity:.9},g);
   const px=tb.cx-40+Math.random()*80,py=548-Math.random()*(ty==0?22:ty==1?16:10)-(ty?0:0);S.parts.push({c,k,ty,x,y,px,py,ph:Math.random()*6})}})
 return S},
frame(S,t){const ph=[[.1,.36],[.38,.64],[.66,.9]];
 S.tubes.forEach((tb,k)=>{const [a,b]=ph[k];tb.g.setAttribute('opacity',k==0?1:CL((t-a+.03)/.03));tb.rot.setAttribute('transform',t>a&&t<b?`rotate(${t*4000} ${tb.cx} 300)`:'');tb.rot.setAttribute('opacity',t>a&&t<b?1:0);
  tb.lab.setAttribute('opacity',CL((t-b+.04)/.05));tb.sup.setAttribute('opacity',k==2?CL((t-.9)/.04):0)});
 S.parts.forEach(p=>{const [a,b]=ph[p.k];let x=p.x+Math.sin(t*40+p.ph)*2,y=p.y,op=.9;
  if(p.ty==p.k){const u=EZ(seg(t,a,b));x=L(p.x,p.px,u);y=L(p.y,p.py,u)}
  else{if(t>b)op=CL(1-(t-b)/.03)}
  if(p.k==2&&p.ty==3){op=.9;if(t>.9)p.c.setAttribute('filter','url(#gl)')}
  p.c.setAttribute('cx',x);p.c.setAttribute('cy',y);p.c.setAttribute('opacity',op)})}},
/* ---------------- A2 secretory ---------------- */
sec:{
hud:(t,m)=>{const mn=t<.08?0:t<.3?L(0,5,seg(t,.08,.3)):t<.5?L(5,8,seg(t,.3,.5)):t<.6?L(8,12,seg(t,.5,.6)):12;return[`${mn.toFixed(0)} min`,"AFTER ³H-LEUCINE"]},
cam:t=>kf(t,[[0,0,0,1200,675],[.06,0,0,1200,675],[.12,150,120,640,360],[.26,300,120,640,360],[.36,420,120,640,360],[.52,540,120,640,360],[.64,560,80,640,360],[.82,560,80,640,360],[.95,0,0,1200,675]]),
build(svg){glowDefs(svg);const S={};
 E('path',{d:'M1130 40 C1110 200 1150 470 1130 640',fill:'none',stroke:'#5a6b8c','stroke-width':6},svg);E('text',{x:1060,y:30,fill:'#8d94a8','font-size':18},svg).textContent='細胞膜';
 E('circle',{cx:40,cy:340,r:170,fill:'#161b2a',stroke:'#8aa0c8','stroke-width':4,'stroke-dasharray':'26 6'},svg);E('text',{x:60,y:345,fill:'#8aa0c8','font-size':22},svg).textContent='核';
 [0,1,2].forEach(i=>{E('path',{d:`M${230+i*55} 160 C${280+i*55} 260 ${280+i*55} 420 ${230+i*55} 520`,fill:'none',stroke:'#e3263f','stroke-width':26,'stroke-opacity':.25},svg);E('path',{d:`M${230+i*55} 160 C${280+i*55} 260 ${280+i*55} 420 ${230+i*55} 520`,fill:'none',stroke:'#ffd1d8','stroke-width':34,'stroke-dasharray':'0 16','stroke-linecap':'round',opacity:.55},svg)});
 E('text',{x:210,y:140,fill:'#ff8a9a','font-size':20,'font-weight':700},svg).textContent='粗面小胞体';
 [0,1,2,3].forEach(i=>E('path',{d:`M${600+i*34} 230 Q${650+i*34} 340 ${600+i*34} 450`,fill:'none',stroke:'#f5c542','stroke-width':16,'stroke-linecap':'round','stroke-opacity':.8},svg));
 E('text',{x:580,y:215,fill:'#f5c542','font-size':18},svg).textContent='シス';E('text',{x:700,y:215,fill:'#f5c542','font-size':18},svg).textContent='トランス';
 E('path',{d:'M760 300 q20 -20 40 0 t40 0 M760 340 q20 20 40 0 t40 0 M760 380 q20 -20 40 0 t40 0',fill:'none',stroke:'#f5c542','stroke-width':6,opacity:.7},svg);E('text',{x:780,y:430,fill:'#f5c542','font-size':18},svg).textContent='TGN';
 S.gran=E('circle',{cx:960,cy:420,r:0,fill:'rgba(227,38,63,.18)',stroke:'#e3263f','stroke-width':3},svg);S.granL=E('text',{x:905,y:490,fill:'#ff8a9a','font-size':18,opacity:0},svg);S.granL.textContent='分泌顆粒';
 S.ves=E('circle',{r:26,fill:'rgba(255,255,255,.04)',stroke:'#8fd6ff','stroke-width':3,opacity:0},svg);
 S.coat=E('circle',{r:32,fill:'none',stroke:'#3fb6ff','stroke-width':5,'stroke-dasharray':'2 6',opacity:0},svg);
 S.vl=E('text',{fill:'#8fd6ff','font-size':16,opacity:0},svg);
 S.cargo=[];for(let i=0;i<7;i++)S.cargo.push(E('circle',{r:6,fill:'#ff4d63',filter:'url(#gl)'},svg));
 S.wave=E('circle',{cx:1130,cy:420,r:0,fill:'none',stroke:'#3fb6ff','stroke-width':4,opacity:0},svg);
 S.out=[];for(let i=0;i<7;i++)S.out.push(E('circle',{r:6,fill:'#ff4d63',opacity:0,filter:'url(#gl)'},svg));
 return S},
frame(S,t,m){const con=m=='con';
 const K=con?[[0,300,340],[.1,300,340],[.24,300,340],[.3,590,330],[.48,730,330],[.54,800,340],[.62,1000,300],[.7,1118,300],[1,1118,300]]
 :[[0,300,340],[.1,300,340],[.24,300,340],[.3,590,330],[.48,730,330],[.54,800,340],[.6,960,420],[.8,960,420],[.88,1112,420],[1,1112,420]];
 const [x,y]=kf(t,K);
 const inVes=(t>.24&&t<.3)||(con?(t>.54&&t<.7):(t>.54&&t<.6));
 S.ves.setAttribute('cx',x);S.ves.setAttribute('cy',y);S.ves.setAttribute('opacity',inVes?1:0);
 S.coat.setAttribute('cx',x);S.coat.setAttribute('cy',y);S.coat.setAttribute('opacity',(!con&&t>.54&&t<.6)?1:0);
 S.vl.setAttribute('x',x+36);S.vl.setAttribute('y',y-30);S.vl.textContent=t<.3?'輸送小胞（クラスリンなし）':con?'輸送小胞（クラスリンなし）':'クラスリン被覆';S.vl.setAttribute('opacity',inVes?1:0);
 const g=!con&&t>=.6&&t<.88;S.gran.setAttribute('r',g?46:(!con&&t>=.88?L(46,0,seg(t,.88,.92)):0));S.granL.setAttribute('opacity',!con&&t>.6&&t<.9?1:0);
 if(!con&&t>=.6){S.gran.setAttribute('cx',x);S.gran.setAttribute('cy',y)}
 const rel=con?t>.7:t>.88;
 S.cargo.forEach((c,i)=>{const a=i/7*6.28+t*8,rr=inVes?12:(g?24:14);c.setAttribute('cx',x+Math.cos(a)*rr*(.4+.6*((i%3)/2)));c.setAttribute('cy',y+Math.sin(a)*rr*(.4+.6*((i%3)/2)));c.setAttribute('opacity',rel?0:1)});
 const rt=con?seg(t,.7,.85):seg(t,.88,1);S.out.forEach((c,i)=>{c.setAttribute('cx',1130+rt*(40+i*9));c.setAttribute('cy',y-40+i*13+Math.sin(i+t*9)*6);c.setAttribute('opacity',rel?1-rt*.5:0)});
 const w=!con?seg(t,.78,.88):0;S.wave.setAttribute('r',L(0,160,w));S.wave.setAttribute('opacity',w>0&&w<1?1-w:0)}},
/* ---------------- A3 endocytosis ---------------- */
endo:{
hud:t=>{const p=t<.42?7.2:t<.6?L(7.2,6,seg(t,.42,.5)):t<.8?L(6,5.5,seg(t,.6,.7)):L(5.5,4.7,seg(t,.8,.9));return[`pH ${p.toFixed(1)}`,"LUMEN"]},
cam:t=>kf(t,[[0,0,0,1200,675],[.06,0,0,1200,675],[.1,80,40,560,315],[.38,80,90,560,315],[.46,280,200,560,315],[.58,280,200,560,315],[.66,520,240,600,338],[.78,560,240,600,338],[.86,640,240,560,315],[.95,0,0,1200,675]]),
build(svg){glowDefs(svg);const S={};
 S.mem=E('path',{fill:'none',stroke:'#5a6b8c','stroke-width':6},svg);E('text',{x:40,y:100,fill:'#8d94a8','font-size':18},svg).textContent='細胞膜（外）';
 S.rec=[];for(let i=0;i<4;i++)S.rec.push(E('path',{d:'',stroke:'#8fd6ff','stroke-width':4,fill:'none'},svg));
 S.lig=[];for(let i=0;i<4;i++)S.lig.push(E('circle',{r:8,fill:'#f5c542',filter:'url(#gl)'},svg));
 S.cl=[];for(let i=0;i<10;i++)S.cl.push(E('circle',{r:5,fill:'#3fb6ff',opacity:0},svg));
 S.ve=E('circle',{r:34,fill:'rgba(245,197,66,.06)',stroke:'#8fd6ff','stroke-width':3,opacity:0},svg);
 S.ee=E('ellipse',{cx:520,cy:380,rx:80,ry:55,fill:'rgba(63,182,255,.08)',stroke:'#3fb6ff','stroke-width':3},svg);E('text',{x:460,y:465,fill:'#8fd6ff','font-size':18},svg).textContent='初期エンドソーム';
 S.le=E('ellipse',{cx:800,cy:430,rx:80,ry:55,fill:'rgba(182,156,255,.08)',stroke:'#b69cff','stroke-width':3},svg);E('text',{x:740,y:515,fill:'#b69cff','font-size':18},svg).textContent='後期エンドソーム';
 S.ly=E('circle',{cx:1040,cy:440,r:62,fill:'rgba(227,38,63,.08)',stroke:'#e3263f','stroke-width':3},svg);E('text',{x:990,y:530,fill:'#ff8a9a','font-size':18},svg).textContent='リソソーム';
 S.rv=E('circle',{r:16,fill:'none',stroke:'#8fd6ff','stroke-width':3,opacity:0},svg);
 E('path',{d:'M140 600 Q180 560 220 600 M150 620 Q180 590 210 620',fill:'none',stroke:'#f5c542','stroke-width':10,'stroke-linecap':'round'},svg);E('text',{x:120,y:650,fill:'#f5c542','font-size':18},svg).textContent='ゴルジ（TGN）';
 S.mv=E('circle',{r:18,fill:'rgba(227,38,63,.1)',stroke:'#3fb6ff','stroke-width':4,'stroke-dasharray':'2 5',opacity:0},svg);S.mt=E('text',{fill:'#ff8a9a','font-size':15,opacity:0},svg);S.mt.textContent='M-6-P';
 S.h=[];for(let i=0;i<12;i++){const tx=E('text',{fill:'#ff4d63','font-size':18,'font-weight':700,opacity:0},svg);tx.textContent='H⁺';S.h.push(tx)}
 return S},
frame(S,t){const dip=EZ(seg(t,.14,.3))*110,pinch=seg(t,.3,.36);
 const cx=320;let d=`M0 140 H${cx-120} C${cx-60} 140 ${cx-70} ${140+dip} ${cx} ${140+dip} C${cx+70} ${140+dip} ${cx+60} 140 ${cx+120} 140 H1200`;
 if(pinch>0)d=`M0 140 H${cx-120} C${cx-60} 140 ${cx-40} ${140+8*(1-pinch)} ${cx} ${140+8*(1-pinch)} C${cx+40} ${140+8*(1-pinch)} ${cx+60} 140 ${cx+120} 140 H1200`;
 S.mem.setAttribute('d',d);
 const [vx,vy]=kf(t,[[0,cx,285],[.36,cx,285],[.42,520,380],[.6,520,380],[.66,800,430],[.8,800,430],[.86,1040,440],[1,1040,440]]);
 const inV=t>=.3;S.ve.setAttribute('cx',vx);S.ve.setAttribute('cy',vy);S.ve.setAttribute('opacity',t>=.3&&t<.42?1:0);
 const ly=seg(t,.86,.98);
 S.lig.forEach((c,i)=>{let x,y;if(t<.14){const u=EZ(seg(t,.02,.14));x=cx-60+i*40;y=L(40,128,u)}else if(!inV){x=cx-60+i*40;y=128;const off=(i-1.5)/1.5;x=cx+off*L(60,40,EZ(seg(t,.14,.3)));y=L(128,140+dip-16,EZ(seg(t,.14,.3)))+Math.abs(off)*(-dip*.35)}else{const a=i/4*6.28+t*3;x=vx+Math.cos(a)*14;y=vy+Math.sin(a)*14}
  c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('opacity',1-ly);c.setAttribute('r',8*(1-ly*.8))});
 S.rec.forEach((p,i)=>{const off=(i-1.5)/1.5;let x=cx+off*L(60,40,EZ(seg(t,.14,.3))),y=L(140,140+dip,EZ(seg(t,.14,.3)))+Math.abs(off)*(-dip*.35);
  if(t>=.3){if(t<.46){const a=i/4*6.28;x=vx+Math.cos(a)*26;y=vy+Math.sin(a)*26}else{const u=EZ(seg(t,.46,.58));x=L(520+(i-1.5)*8,cx+180+i*30,u);y=L(330,140,u)}}
  p.setAttribute('d',`M${x} ${y} v-10 m0 0 l-6 -8 m6 8 l6 -8`);p.setAttribute('opacity',t>.58&&t<.62?.5:1)});
 const clo=t>.14&&t<.4?(t<.36?EZ(seg(t,.14,.26)):1-seg(t,.36,.4)):0;
 S.cl.forEach((c,i)=>{const a=Math.PI*(.1+.8*i/9);let x,y;if(t<.3){x=cx-Math.cos(a)*L(90,48,EZ(seg(t,.14,.3)));y=140+dip*Math.sin(a)+8}else{const b=i/10*6.28;x=vx+Math.cos(b)*42;y=vy+Math.sin(b)*42}c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('opacity',clo)});
 const rv=seg(t,.46,.58);S.rv.setAttribute('cx',L(520,cx+220,EZ(rv)));S.rv.setAttribute('cy',L(330,160,EZ(rv)));S.rv.setAttribute('opacity',rv>0&&rv<1?1:0);
 const mm=seg(t,.62,.74);S.mv.setAttribute('cx',L(220,760,EZ(mm)));S.mv.setAttribute('cy',L(580,450,EZ(mm)));S.mv.setAttribute('opacity',mm>0&&mm<1?1:0);S.mt.setAttribute('x',L(220,760,EZ(mm))+22);S.mt.setAttribute('y',L(580,450,EZ(mm))-18);S.mt.setAttribute('opacity',mm>0&&mm<1?1:0);
 S.h.forEach((h,i)=>{const on=(t>.6&&t<.8)||(t>.86);const bx=t>.84?1040:800,by=t>.84?440:430,a=i/12*6.28;const r=L(120,40,((t*3+i/12)%1));h.setAttribute('x',bx+Math.cos(a)*r);h.setAttribute('y',by+Math.sin(a)*r*.7);h.setAttribute('opacity',on?.8:0)});
 S.ee.setAttribute('filter',t>.42&&t<.6?'url(#gl)':'');S.le.setAttribute('filter',t>.6&&t<.8?'url(#gl)':'');S.ly.setAttribute('filter',t>.8?'url(#gl)':'');
 S.ly.setAttribute('fill',`rgba(227,38,63,${t>.86?.08+.2*ly:.08})`)}},
/* ---------------- A4 motors ---------------- */
motor:{
hud:t=>[t<.5?"KINESIN":"DYNEIN","MOTOR"],
cam:t=>kf(t,[[0,0,0,1200,675],[.1,0,0,1200,675],[.2,200,160,700,394],[.45,500,160,700,394],[.52,400,160,700,394],[.76,60,160,700,394],[.84,560,120,700,394],[.96,0,0,1200,675]]),
build(svg){glowDefs(svg);const S={};
 E('path',{d:'M1150 40 V640',stroke:'#5a6b8c','stroke-width':6},svg);E('text',{x:1080,y:30,fill:'#8d94a8','font-size':18},svg).textContent='細胞膜';
 E('rect',{x:70,y:320,width:40,height:14,rx:4,fill:'#3fb6ff'},svg);E('rect',{x:83,y:307,width:14,height:40,rx:4,fill:'#8fd6ff'},svg);E('text',{x:40,y:300,fill:'#8fd6ff','font-size':18},svg).textContent='中心体（MTOC）';
 E('text',{x:120,y:400,fill:'#fff','font-size':30,'font-weight':900},svg).textContent='−';S.pl=E('text',{y:400,fill:'#fff','font-size':30,'font-weight':900},svg);S.pl.textContent='＋';
 S.mt=E('rect',{x:110,y:326,height:30,rx:6,fill:'#0d1d2b',stroke:'#3fb6ff','stroke-width':3},svg);
 S.dm=E('g',{},svg);
 S.k=E('g',{},svg);E('circle',{cx:0,cy:-78,r:30,fill:'rgba(227,38,63,.12)',stroke:'#e3263f','stroke-width':3},S.k);for(let i=0;i<5;i++)E('circle',{cx:-12+i*6,cy:-78+(i%2)*8-4,r:4,fill:'#ff4d63'},S.k);
 E('path',{d:'M0 -48 V-24',stroke:'#f5c542','stroke-width':4},S.k);S.kl=[E('path',{stroke:'#f5c542','stroke-width':5,fill:'none','stroke-linecap':'round'},S.k),E('path',{stroke:'#f5c542','stroke-width':5,fill:'none','stroke-linecap':'round'},S.k)];
 E('text',{x:-40,y:-118,fill:'#f5c542','font-size':18},S.k).textContent='キネシン＋分泌小胞';
 S.d=E('g',{},svg);E('ellipse',{cx:0,cy:66,rx:48,ry:22,fill:'#0f1a22',stroke:'#3ddc97','stroke-width':3},S.d);E('path',{d:'M-30 66 l8 -12 l8 24 l8 -24 l8 24 l8 -24 l8 12',fill:'none',stroke:'#3ddc97','stroke-width':2},S.d);
 S.dl=[E('path',{stroke:'#b69cff','stroke-width':5,fill:'none','stroke-linecap':'round'},S.d),E('path',{stroke:'#b69cff','stroke-width':5,fill:'none','stroke-linecap':'round'},S.d)];
 E('text',{x:-60,y:120,fill:'#b69cff','font-size':18},S.d).textContent='ダイニン＋ミトコンドリア';
 return S},
frame(S,t){const len=900+Math.sin(t*14)*30*(t>.78?1:.3);S.mt.setAttribute('width',len);S.pl.setAttribute('x',110+len-10);
 while(S.dm.firstChild)S.dm.removeChild(S.dm.firstChild);const n=Math.floor(len/22);for(let i=0;i<n;i++)E('rect',{x:113+i*22,y:329,width:18,height:11,rx:3,fill:i%2?'#8fd6ff':'#3fb6ff',opacity:i>n-3&&t>.78?.4+.6*Math.abs(Math.sin(t*30+i)):.6},S.dm);
 const kx=L(260,960,EZ(seg(t,.16,.5)));S.k.setAttribute('transform',`translate(${kx},326)`);const st=Math.sin(t*120);S.kl[0].setAttribute('d',`M0 -24 L${-8+st*8} -2`);S.kl[1].setAttribute('d',`M0 -24 L${8-st*8} -2`);
 const dx=L(980,300,EZ(seg(t,.5,.8)));S.d.setAttribute('transform',`translate(${dx},356)`);const sd=Math.sin(t*110);S.dl[0].setAttribute('d',`M0 44 L${-8+sd*8} 2`);S.dl[1].setAttribute('d',`M0 44 L${8-sd*8} 2`);
 S.k.setAttribute('filter',t>.16&&t<.5?'url(#gl)':'');S.d.setAttribute('filter',t>.5&&t<.8?'url(#gl)':'')}},
/* ---------------- A5 cilia ---------------- */
cilia:{
hud:(t,m)=>[m=='iso'?"SLIDE":"BEND","MODE"],
cam:t=>kf(t,[[0,0,0,1200,675],[.1,250,60,700,394],[.9,250,60,700,394],[1,0,0,1200,675]]),
build(svg){glowDefs(svg);const S={};S.a=E('path',{fill:'none',stroke:'#3fb6ff','stroke-width':22,'stroke-linecap':'round'},svg);S.b=E('path',{fill:'none',stroke:'#8fd6ff','stroke-width':22,'stroke-linecap':'round'},svg);
 S.dy=[];for(let i=0;i<9;i++)S.dy.push(E('path',{stroke:'#e3263f','stroke-width':5,fill:'none','stroke-linecap':'round'},svg));
 S.nx=[];for(let i=0;i<4;i++)S.nx.push(E('line',{stroke:'#b69cff','stroke-width':5},svg));
 S.base=E('rect',{x:470,y:560,width:260,height:24,rx:6,fill:'#26324a'},svg);E('text',{x:480,y:610,fill:'#8d94a8','font-size':18},svg).textContent='基部（基底小体側）';
 return S},
frame(S,t,m){const iso=m=='iso';const u=Math.sin(Math.max(0,t-.1)*9)*CL((t-.08)/.2);
 const pt=(off,s)=>{if(iso){return[560+off,560-s*380-(off>0?u*90:0)]}const th=u*.9;if(Math.abs(th)<1e-3)return[600+off,560-s*380];const r=380/(Math.abs(th)+1e-3);const a=s*th;const R=r+off*Math.sign(th||1)*-1;const cx0=600+Math.sign(th||1)*r;return[cx0-Math.cos(a)*(R)*Math.sign(th||1),560-Math.sin(Math.abs(a))*R]};
 const path=off=>{let d='';for(let i=0;i<=20;i++){const [x,y]=pt(off,i/20);d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)}return d};
 S.a.setAttribute('d',path(-40));S.b.setAttribute('d',path(40));
 S.dy.forEach((p,i)=>{const s=.1+i*.09;const [x1,y1]=pt(-40,s),[x2,y2]=pt(40,s+(iso?0:.0));p.setAttribute('d',`M${x1+11} ${y1} Q${(x1+x2)/2} ${(y1+y2)/2-14-Math.sin(t*60+i)*6} ${x2-11} ${y2-(iso?u*90:0)}`)});
 S.nx.forEach((l,i)=>{const s=.2+i*.22;const [x1,y1]=pt(-40,s),[x2,y2]=pt(40,s);l.setAttribute('x1',x1+11);l.setAttribute('y1',y1);l.setAttribute('x2',x2-11);l.setAttribute('y2',y2);l.setAttribute('opacity',iso?0:1)})}},
/* ---------------- A6 signal ---------------- */
sig:{
hud:(t,m)=>[m=='sig'?"rER":"CYTOSOL","DESTINATION"],
cam:t=>kf(t,[[0,0,0,1200,675],[.1,200,120,760,428],[.9,200,120,760,428],[1,0,0,1200,675]]),
build(svg){glowDefs(svg);const S={};E('rect',{x:0,y:120,width:1200,height:70,fill:'rgba(227,38,63,.08)'},svg);E('path',{d:'M0 190 H1200',stroke:'#e3263f','stroke-width':6},svg);E('text',{x:30,y:160,fill:'#ff8a9a','font-size':20},svg).textContent='小胞体の内腔';E('text',{x:30,y:230,fill:'#8d94a8','font-size':18},svg).textContent='サイトゾル';
 S.mr=E('path',{fill:'none',stroke:'#f5c542','stroke-width':5},svg);S.rb=E('g',{},svg);E('ellipse',{cx:0,cy:0,rx:46,ry:30,fill:'#1e2a3c',stroke:'#8fd6ff','stroke-width':3},S.rb);E('ellipse',{cx:0,cy:34,rx:34,ry:18,fill:'#16202e',stroke:'#8fd6ff','stroke-width':3},S.rb);
 S.ch=E('path',{fill:'none',stroke:'#3ddc97','stroke-width':6,'stroke-linecap':'round',filter:'url(#gl)'},svg);S.sg=E('path',{fill:'none',stroke:'#ff4d63','stroke-width':8,'stroke-linecap':'round',filter:'url(#gl)'},svg);
 S.lb=E('text',{fill:'#fff','font-size':20,'font-weight':700,opacity:0},svg);return S},
frame(S,t,m){const sig=m=='sig';const mv=sig?EZ(seg(t,.4,.62)):0;const rx=560,ry=L(470,232,mv);
 S.mr.setAttribute('d',`M200 ${ry+52} Q400 ${ry+40} ${rx} ${ry+52} T 1000 ${ry+52}`);S.rb.setAttribute('transform',`translate(${rx},${ry})`);
 const g=seg(t,.08,.95);let pts=[];const N=Math.floor(g*40)+1;
 for(let i=0;i<N;i++){const s=i/40;let x,y;if(sig&&t>.62){x=rx+Math.sin(s*20)*14;y=ry-30-(N-1-i)*4.2}else{x=rx+Math.cos(s*30)*s*120;y=ry-30-s*100+Math.sin(s*25)*s*40}pts.push([x,y])}
 S.ch.setAttribute('d',pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(''));
 const lead=pts.slice(-Math.min(pts.length,6));S.sg.setAttribute('d',sig&&lead.length>1?lead.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(''):'');
 S.lb.setAttribute('x',rx+70);S.lb.setAttribute('y',sig?ry-40:ry-120);S.lb.textContent=sig?(t<.62?'シグナル配列（札）':'rERに付着 → 内腔へ'):'遊離のまま → サイトゾル蛋白質';S.lb.setAttribute('opacity',t>.3?1:0)}}
} as unknown as Record<string, AnimDef>;
