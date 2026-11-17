// Extracted from the original Мир-Монополия build. Logic preserved during refactor.
/* ---------- logic (runs only on the host) ---------- */
const cur=()=>S.players[S.turn];
const MULT=[1,5,12,25,35,50];
const G={};T.forEach((t,i)=>{if(t.g!==undefined)(G[t.g]=G[t.g]||[]).push(i)});
const own=(i,p)=>S.owner[i]==p.id;
const full=(i,p)=>G[T[i].g].every(j=>own(j,p));
function log(m){S.log.unshift(m);S.log=S.log.slice(0,60)}
function bc(){conns.forEach(c=>c.open&&c.send({t:'s',s:S}));render()}
function pay(p,a,to){p.cash-=a;if(to)to.cash+=a}
function rentOf(i,o){
  const t=T[i];if(S.mort[i])return 0;
  if(t.ty=='port')return 50*Object.keys(S.owner).filter(j=>T[j].ty=='port'&&S.owner[j]==o.id).length;
  const l=S.houses[i]||0;return t.rent*MULT[l]*(l==0&&full(i,o)?2:1);
}
function liq(p){let s=0;for(const i in S.owner)if(S.owner[i]==p.id){if(!S.mort[i])s+=T[i].price/2;s+=(S.houses[i]||0)*(T[i].hc||0)/2}return s}
function bust(p){
  p.out=true;log(p.name+' разорился');
  for(const i in S.owner)if(S.owner[i]==p.id){delete S.owner[i];delete S.houses[i];delete S.mort[i]}
  const alive=S.players.filter(x=>!x.out);
  if(alive.length==1){S.over=alive[0].name;S.phase='over'}
}
function next(){do{S.turn=(S.turn+1)%S.players.length}while(cur().out);S.phase='roll';S.again=false;S.dbl=0}
function jail(p){p.pos=10;p.jail=3;S.again=false;S.dbl=0;S.phase='end';log(p.name+' отправлен в тюрьму')}
function land(p){
  const t=T[p.pos];S.phase='end';
  if(t.ty=='city'||t.ty=='port'){
    const o=S.players.find(x=>x.id==S.owner[p.pos]);
    if(!o){if(p.cash>=t.price)S.phase='buy';else log('Не хватает денег на '+t.n)}
    else if(o!=p){const r=rentOf(p.pos,o);if(r){log(`${p.name} платит ${o.name} $${r}`);pay(p,r,o)}else log(t.n+' в залоге: аренды нет')}
  }else if(t.ty=='tax'){log(`${p.name} платит налог $${t.tax}`);pay(p,t.tax)}
  else if(t.ty=='luck'){
    const a=[-100,-50,50,100,150][Math.random()*5|0];
    log(`Удача: ${p.name} ${a>0?'+':'−'}$${Math.abs(a)}`);
    a>0?p.cash+=a:pay(p,-a);
  }else if(t.ty=='goto')jail(p);
}
function move(p,s){
  const n=p.pos+s;
  if(n>=40){p.cash+=S.cfg.bonus;log(`${p.name} прошёл Старт: +$${S.cfg.bonus}`)}
  p.pos=n%40;land(p);
}
function manage(p,a,i){
  const t=T[i],l=S.houses[i]||0,g=G[t.g]||[];
  if(a=='mort'&&!S.mort[i]&&!g.some(j=>S.houses[j])){S.mort[i]=1;p.cash+=t.price/2;log(`${p.name} заложил ${t.n}`)}
  else if(a=='unmort'&&S.mort[i]){const c=Math.ceil(t.price*.55);if(p.cash>=c){p.cash-=c;delete S.mort[i];log(`${p.name} выкупил ${t.n}`)}}
  else if(t.ty!='city')return;
  else if(a=='build'&&l<5&&full(i,p)&&!g.some(j=>S.mort[j])&&l<=Math.min(...g.map(j=>S.houses[j]||0))&&p.cash>=t.hc){p.cash-=t.hc;S.houses[i]=l+1;log(`${p.name} строит: ${t.n}`)}
  else if(a=='sell'&&l>0&&l>=Math.max(...g.map(j=>S.houses[j]||0))){p.cash+=t.hc/2;S.houses[i]=l-1;log(`${p.name} продаёт постройку: ${t.n}`)}
}
function act(pid,a,i){
  if(!S||S.phase=='lobby'||S.phase=='over')return;
  if(i!==undefined&&!(Number.isInteger(i)&&i>=0&&i<40))return;
  const p=cur();if(p.id!=pid)return;const t=T[i];
  if(a=='roll'&&S.phase=='roll'&&p.cash>=0){
    const d=[1+Math.random()*6|0,1+Math.random()*6|0],dbl=d[0]==d[1];S.dice=d;let go=true;
    if(p.jail>0){
      if(dbl){p.jail=0;log(p.name+' выбросил дубль и вышел из тюрьмы')}
      else if(--p.jail>0){log(p.name+' остаётся в тюрьме');S.phase='end';go=false}
      else{log(p.name+' платит $50 и выходит из тюрьмы');pay(p,50)}
    }else{S.dbl=dbl?(S.dbl||0)+1:0;if(S.dbl==3){jail(p);go=false}else S.again=dbl}
    if(go)move(p,d[0]+d[1]);
  }else if(a=='pay'&&S.phase=='roll'&&p.jail>0&&p.cash>=50){p.jail=0;pay(p,50);log(p.name+' заплатил $50 и вышел из тюрьмы')}
  else if(a=='buy'&&S.phase=='buy'){const q=T[p.pos];S.owner[p.pos]=p.id;p.cash-=q.price;log(`${p.name} купил ${q.n}`);S.phase='end'}
  else if(a=='skip'&&S.phase=='buy')S.phase='end';
  else if(a=='end'&&S.phase=='end'){
    if(p.cash<0){
      if(p.cash+liq(p)<0){bust(p);if(S.phase!='over')next()}
      else{log(p.name+': сначала покройте долг, заложив объекты');bc();return}
    }else next();
  }else if(t&&own(i,p)&&['build','sell','mort','unmort'].includes(a))manage(p,a,i);
  if(S.phase=='end'&&S.again&&p.cash>=0&&!p.out){S.phase='roll';S.again=false}
  bc();
}
function startGame(){if(host&&S.players.length>1&&S.phase=='lobby'){S.players.forEach(p=>p.cash=S.cfg.money);S.phase='roll';log('Игра началась');bc()}}
const cfg=(k,v)=>{if(host&&S.phase=='lobby'){S.cfg[k]=v;bc()}};
const say=(n,m)=>{log(`💬 ${n}: ${m}`);bc()};
function chat(){
  const m=$('cm').value.trim();if(!m||!S)return;$('cm').value='';
  host?say(S.players[0].name,m.slice(0,200)):conn&&conn.send({t:'c',c:m.slice(0,200)});
}
const send=(a,i)=>host?act('H',a,i):conn&&conn.send({t:'a',a,i});
