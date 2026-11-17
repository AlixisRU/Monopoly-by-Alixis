// Extracted from the original Мир-Монополия build. Logic preserved during refactor.
/* ---------- rendering ---------- */
let sel=null;
const pick=i=>{sel=i;render()};
function opt(k,arr){return host?`<select onchange="cfg('${k}',+this.value)">${arr.map(v=>`<option ${S.cfg[k]==v?'selected':''}>${v}</option>`).join('')}</select>`:S.cfg[k]}
function mid(){
  const link=location.origin+location.pathname+'#'+S.code;
  if(S.phase=='lobby')return `<h2>Комната ${S.code}</h2><p>Ссылка для друзей:<br><b style="word-break:break-all">${esc(link)}</b></p><p>Стартовый капитал: $${opt('money',[1000,1500,2000,3000])}<br>Бонус за Старт: $${opt('bonus',[200,300,500])}</p><p>Игроков: ${S.players.length} из 8</p>`+
    (host?`<button onclick="startGame()" ${S.players.length<2?'disabled':''}>Начать игру</button>`:'<p>Ждём, пока хост начнёт игру…</p>');
  if(S.phase=='over')return `<h2>Победил ${esc(S.over)}</h2>`;
  const p=cur(),mine=p.id==me,t=T[p.pos];let b='';
  if(mine){
    if(S.phase=='roll'){b=`<button onclick="send('roll')" ${p.cash<0?'disabled':''}>${p.jail>0?'Бросить на дубль':'Бросить кубики'}</button>`;if(p.jail>0&&p.cash>=50)b+=`<button class="alt" onclick="send('pay')">Заплатить $50</button>`}
    if(S.phase=='buy')b=`<button onclick="send('buy')">Купить ${t.n} за $${t.price}</button><button class="alt" onclick="send('skip')">Отказаться</button>`;
    if(S.phase=='end')b=`<button onclick="send('end')">Закончить ход</button>`+(p.cash<0?`<p>Долг $${-p.cash}. Заложите объекты (клик по клетке) или завершите ход.</p>`:'');
  }
  return `<h2>${mine?'Ваш ход':'Ходит '+esc(p.name)}${p.jail>0?' (тюрьма)':''}</h2><div class="dice" aria-label="Кубики">${S.dice[0]?S.dice.join(' ＋ '):'—'}</div>${b}`;
}
function info(){
  if(sel==null)return '<small>Нажмите на клетку, чтобы увидеть аренду и управлять объектом.</small>';
  const t=T[sel],o=S.players.find(x=>x.id==S.owner[sel]);
  let h=`<b>${t.n}</b><br>Цена $${t.price||'—'}${o?`, владелец ${esc(o.name)}`:''}${S.mort[sel]?' (в залоге)':''}`;
  if(t.ty=='city')h+=`<br>Аренда: $${t.rent}, с монополией $${t.rent*2}<br>1–4 дома: ${[1,2,3,4].map(l=>'$'+t.rent*MULT[l]).join(' / ')}<br>Отель: $${t.rent*MULT[5]}<br>Дом стоит $${t.hc}`;
  if(t.ty=='port')h+='<br>Аренда $50 за каждый порт владельца';
  if(o&&o.id==me&&S.phase!='lobby'&&S.phase!='over'&&cur().id==me&&(t.ty=='city'||t.ty=='port')){
    const bt=(a,l)=>`<button class="alt" onclick="send('${a}',${sel})">${l}</button>`;
    h+='<br>'+(t.ty=='city'?bt('build','Построить')+bt('sell','Продать дом'):'')+(S.mort[sel]?bt('unmort','Выкупить'):bt('mort','Заложить'));
  }
  return h;
}
function render(){
  if(!S)return;
  let h='';
  T.forEach((t,i)=>{
    const[r,c]=P(i),o=S.players.find(x=>x.id==S.owner[i]),l=S.houses[i]||0;
    h+=`<div class="c ${t.ty} ${S.mort[i]?'m':''}" onclick="pick(${i})" style="grid-area:${r+1}/${c+1}">${t.band?`<i style="background:${t.band}"></i>`:''}${l?`<span class="hs">${l==5?'◆':'▲'.repeat(l)}</span>`:''}<b>${t.n}</b>${t.price?`<small>$${t.price}</small>`:''}${o?`<u style="background:${o.color}"></u>`:''}<div class="tk">${S.players.filter(p=>p.pos==i&&!p.out).map(p=>`<span style="background:${p.color}"></span>`).join('')}</div></div>`;
  });
  $('board').innerHTML=h+`<div id="mid">${mid()}</div>`;
  $('pl').innerHTML=S.players.map((p,i)=>`<div class="pl ${S.phase!='lobby'&&i==S.turn?'on':''} ${p.out?'out':''}"><span class="dot" style="background:${p.color}"></span>${esc(p.name)}${p.id==me?' (вы)':''}<em>$${p.cash}</em></div>`).join('');
  $('info').innerHTML=info();
  $('log').innerHTML=S.log.map(l=>`<div>${esc(l)}</div>`).join('');
}
