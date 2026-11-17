// Extracted from the original Мир-Монополия build. Logic preserved during refactor.
/* ---------- networking ---------- */
function getName(){name=$('nm').value.trim()||'Игрок';return name}
function show(){$('lobby').hidden=true;$('game').hidden=false}
function create(){
  getName();host=true;me='H';
  const code=Math.random().toString(36).slice(2,6).toUpperCase();
  peer=new Peer('gmono-'+code);
  peer.on('open',()=>{
    S={code,players:[{id:'H',name,color:COL[0],pos:0,cash:1500,jail:0,out:false}],owner:{},houses:{},mort:{},cfg:{money:1500,bonus:200},turn:0,phase:'lobby',dice:[0,0],log:[],over:null};
    history.replaceState(0,'','#'+code);show();render();
  });
  peer.on('connection',c=>{
    conns.push(c);
    c.on('data',m=>{
      if(m.t=='join'&&S.phase=='lobby'&&S.players.length<8&&!S.players.some(p=>p.id==c.peer)){
        S.players.push({id:c.peer,name:String(m.n||'Игрок').slice(0,14),color:COL[S.players.length],pos:0,cash:1500,jail:0,out:false});bc();
      }else if(m.t=='a')act(c.peer,m.a,m.i);
      else if(m.t=='c'){const q=S.players.find(x=>x.id==c.peer);if(q)say(q.name,String(m.c).slice(0,200))}
    });
  });
  peer.on('error',e=>e.type=='unavailable-id'?create():err('Ошибка сети: '+e.type));
}
function joinRoom(){
  getName();const code=$('cd').value.trim().toUpperCase();
  if(code.length<4)return err('Введите код комнаты из 4 символов');
  host=false;peer=new Peer();
  peer.on('open',id=>{
    me=id;conn=peer.connect('gmono-'+code,{reliable:true});
    conn.on('open',()=>conn.send({t:'join',n:name}));
    conn.on('data',m=>{if(m.t=='s'){S=m.s;show();render()}});
    conn.on('close',()=>{err('Хост отключился. Создайте новую комнату.');$('lobby').hidden=false;$('game').hidden=true});
  });
  peer.on('error',e=>err(e.type=='peer-unavailable'?'Комната с таким кодом не найдена':'Ошибка сети: '+e.type));
}
if(location.hash.length==5)$('cd').value=location.hash.slice(1);
