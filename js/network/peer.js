// PeerJS networking. The room creator remains the authoritative game host.
function getName() {
  name = $('nm').value.trim() || 'Игрок';
  return name;
}
function show() {
  $('lobby').hidden = true;
  $('game').hidden = false;
  document.body.classList.add('in-game');
}
function create() {
  getName();
  host = true;
  me = 'H';
  const code = Math.random().toString(36).slice(2, 6).toUpperCase();
  peer = new Peer('gmono-' + code);
  peer.on('open', () => {
    S = {
      code,
      players: [{ id: 'H', name, color: COL[0], pos: 0, cash: 1500, jail: 0, out: false }],
      owner: {}, houses: {}, mort: {},
      cfg: { money: 1500, bonus: 200, board: selectedBoard },
      turn: 0, phase: 'lobby', dice: [0, 0], log: [], over: null
    };
    history.replaceState(0, '', '#' + code);
    show();
    render();
  });
  peer.on('connection', c => {
    conns.push(c);
    c.on('data', message => {
      if (message.t === 'join' && S && S.phase === 'lobby' && S.players.length < 8 && !S.players.some(p => p.id === c.peer)) {
        S.players.push({ id: c.peer, name: String(message.n || 'Игрок').slice(0, 14), color: COL[S.players.length], pos: 0, cash: 1500, jail: 0, out: false });
        bc();
      } else if (message.t === 'a') {
        act(c.peer, message.a, message.i);
      } else if (message.t === 'c') {
        const player = S && S.players.find(item => item.id === c.peer);
        if (player) say(player.name, String(message.c).slice(0, 200));
      }
    });
    c.on('close', () => {
      conns = conns.filter(item => item !== c);
    });
  });
  peer.on('error', event => event.type === 'unavailable-id' ? create() : err('Ошибка сети: ' + event.type));
}
function joinRoom() {
  getName();
  const code = $('cd').value.trim().toUpperCase();
  if (code.length !== 4) return err('Введите код комнаты из 4 символов');
  host = false;
  peer = new Peer();
  peer.on('open', id => {
    me = id;
    conn = peer.connect('gmono-' + code, { reliable: true });
    conn.on('open', () => conn.send({ t: 'join', n: name }));
    conn.on('data', message => {
      if (message.t === 's') {
        S = message.s;
        show();
        render();
      }
    });
    conn.on('close', () => {
      err('Хост отключился. Создайте новую комнату.');
      $('lobby').hidden = false;
      $('game').hidden = true;
      document.body.classList.remove('in-game');
    });
  });
  peer.on('error', event => err(event.type === 'peer-unavailable' ? 'Комната с таким кодом не найдена' : 'Ошибка сети: ' + event.type));
}
if (location.hash.length === 5) $('cd').value = location.hash.slice(1);
