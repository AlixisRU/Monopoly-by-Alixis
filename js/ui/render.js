// UI rendering only. Game rules remain in js/engine/game.js.
let sel = null;
let previousPositions = Object.create(null);
let previousDice = '';

const pick = index => { sel = index; render(); };

function chooseBoard(id) {
  if (!BOARD_MAPS[id] || BOARD_MAPS[id].status !== 'available') return;
  selectedBoard = id;
  const card = $('standard-map-card');
  if (card) {
    card.classList.toggle('selected', id === 'standard');
    card.setAttribute('aria-pressed', String(id === 'standard'));
  }
}

function copyRoomLink() {
  if (!S) return;
  const link = location.origin + location.pathname + '#' + S.code;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(() => {
      const button = document.querySelector('.room-chip button');
      if (button) {
        button.textContent = '✓';
        window.setTimeout(() => { button.textContent = '▢'; }, 1400);
      }
    }).catch(() => window.prompt('Скопируйте ссылку на комнату:', link));
  } else {
    window.prompt('Скопируйте ссылку на комнату:', link);
  }
}

function opt(key, values) {
  return host
    ? `<select aria-label="${key === 'money' ? 'Стартовый капитал' : 'Бонус за старт'}" onchange="cfg('${key}',+this.value)">${values.map(value => `<option value="${value}" ${S.cfg[key] == value ? 'selected' : ''}>${value}</option>`).join('')}</select>`
    : S.cfg[key];
}

function mid() {
  const link = location.origin + location.pathname + '#' + S.code;
  const board = BOARD_MAPS[S.cfg.board] || BOARD_MAPS.standard;
  if (S.phase === 'lobby') {
    return `<div class="room-lobby-content">
      <span class="section-kicker">ROOM CREATED</span>
      <h2>Комната готова</h2>
      <div class="mid-room-code">${esc(S.code)}</div>
      <p>Пригласите друзей по коду или отправьте им ссылку.</p>
      <p class="room-link-text">${esc(link)}</p>
      <div class="mid-map-pill">♧ &nbsp; ${esc(board.name)} · ${board.rows} × ${board.columns}</div>
      <p>Стартовый капитал: ${opt('money', [1000, 1500, 2000, 3000])}<br>Бонус за Старт: ${opt('bonus', [200, 300, 500])}</p>
      <p>Игроков в комнате: <b>${S.players.length} / 8</b></p>
      ${host ? `<button onclick="startGame()" ${S.players.length < 2 ? 'disabled' : ''}>Начать игру</button>` : '<p>Ожидаем, пока хост начнёт игру…</p>'}
    </div>`;
  }
  if (S.phase === 'over') return `<div class="room-lobby-content game-over-content"><span class="section-kicker">GAME FINISHED</span><h2>Победитель</h2><div class="winner-name">${esc(S.over)}</div><p>Партия завершена. Спасибо за игру!</p></div>`;

  const player = cur();
  const mine = player.id === me;
  const tile = T[player.pos];
  let actions = '';
  if (mine) {
    if (S.phase === 'roll') {
      actions = `<button onclick="send('roll')" ${player.cash < 0 ? 'disabled' : ''}>${player.jail > 0 ? 'Бросить на дубль' : 'Бросить кубики'}</button>`;
      if (player.jail > 0 && player.cash >= 50) actions += `<button class="alt" onclick="send('pay')">Заплатить $50</button>`;
    }
    if (S.phase === 'buy') actions = `<button onclick="send('buy')">Купить ${esc(tile.n)} · $${tile.price}</button><button class="alt" onclick="send('skip')">Отказаться</button>`;
    if (S.phase === 'end') actions = `<button onclick="send('end')">Закончить ход</button>` + (player.cash < 0 ? `<p>Долг $${-player.cash}. Заложите объекты или продайте постройки.</p>` : '');
  }
  const diceKey = (S.dice || []).join('-');
  const rolling = diceKey !== previousDice && S.dice && S.dice.some(Boolean);
  previousDice = diceKey;
  return `<div class="turn-content">
    <span class="section-kicker">${mine ? 'YOUR TURN' : 'CURRENT PLAYER'}</span>
    <h2>${mine ? 'Ваш ход' : 'Ходит ' + esc(player.name)}${player.jail > 0 ? ' · тюрьма' : ''}</h2>
    <div class="dice ${rolling ? 'rolling' : ''}" aria-label="Результат броска кубиков"><span class="die">${S.dice[0] || '·'}</span><span class="die">${S.dice[1] || '·'}</span></div>
    ${actions ? `<div class="mid-actions">${actions}</div>` : `<p>Сейчас ход другого игрока. Следите за событиями справа.</p>`}
  </div>`;
}

function info() {
  if (sel === null) return '<div class="empty-state"><span>⌖</span><p>Выберите клетку на игровом поле, чтобы посмотреть информацию об объекте.</p></div>';
  const tile = T[sel];
  const owner = S.players.find(player => player.id === S.owner[sel]);
  let html = `<b>${esc(tile.n)}</b><div>Цена: ${tile.price ? '$' + tile.price : '—'}${owner ? `<br>Владелец: ${esc(owner.name)}` : ''}${S.mort[sel] ? '<br><span class="mortgage-label">В ЗАЛОГЕ</span>' : ''}</div>`;
  if (tile.ty === 'city') html += `<div>Аренда: $${tile.rent}, с монополией $${tile.rent * 2}<br>1–4 дома: ${[1, 2, 3, 4].map(level => '$' + tile.rent * MULT[level]).join(' / ')}<br>Отель: $${tile.rent * MULT[5]}<br>Строительство: $${tile.hc}</div>`;
  if (tile.ty === 'port') html += '<div>Аренда: $50 за каждый порт владельца</div>';
  if (owner && owner.id === me && S.phase !== 'lobby' && S.phase !== 'over' && cur().id === me && (tile.ty === 'city' || tile.ty === 'port')) {
    const button = (action, label) => `<button onclick="send('${action}',${sel})">${label}</button>`;
    html += `<div class="property-actions">${tile.ty === 'city' ? button('build', 'Построить') + button('sell', 'Продать дом') : ''}${S.mort[sel] ? button('unmort', 'Выкупить') : button('mort', 'Заложить')}</div>`;
  }
  return html;
}

function render() {
  if (!S) return;
  const roomLabel = $('room-code-label');
  if (roomLabel) roomLabel.textContent = S.code;
  const statusLabel = $('game-status-label');
  if (statusLabel) statusLabel.textContent = S.phase === 'lobby' ? 'ROOM LOBBY' : S.phase === 'over' ? 'GAME FINISHED' : 'GAME IN PROGRESS';

  let boardHtml = '';
  T.forEach((tile, index) => {
    const [row, column] = P(index);
    const owner = S.players.find(player => player.id === S.owner[index]);
    const houses = S.houses[index] || 0;
    const occupants = S.players.filter(player => player.pos === index && !player.out);
    const hasArrived = occupants.some(player => previousPositions[player.id] !== undefined && previousPositions[player.id] !== index);
    const label = `${tile.n}${tile.price ? ', цена $' + tile.price : ''}`;
    boardHtml += `<button type="button" class="c ${tile.ty} ${S.mort[index] ? 'm' : ''} ${sel === index ? 'selected-space' : ''}" onclick="pick(${index})" style="grid-area:${row + 1}/${column + 1}" aria-label="${esc(label)}" aria-pressed="${sel === index}">
      ${tile.band ? `<i style="background:${tile.band}"></i>` : ''}
      ${houses ? `<span class="hs">${houses === 5 ? '◆' : '▲'.repeat(houses)}</span>` : ''}
      <b>${esc(tile.n)}</b>${tile.price ? `<small>$${tile.price}</small>` : ''}
      ${owner ? `<u style="background:${owner.color}" title="Владелец: ${esc(owner.name)}"></u>` : ''}
      <span class="tk">${occupants.map(player => `<span class="${hasArrived ? 'token-arrive' : ''}" style="background:${player.color}" title="${esc(player.name)}"></span>`).join('')}</span>
    </button>`;
  });
  $('board').innerHTML = boardHtml + `<div id="mid">${mid()}</div>`;

  $('pl').innerHTML = S.players.map((player, index) => `<div class="pl ${S.phase !== 'lobby' && index === S.turn ? 'on' : ''} ${player.out ? 'out' : ''}"><span class="dot" style="background:${player.color};color:${player.color}"></span><span>${esc(player.name)}${player.id === me ? ' <small>(вы)</small>' : ''}</span><em>$${player.cash}</em></div>`).join('');
  $('player-count').textContent = `${S.players.length}/8`;
  $('info').innerHTML = info();
  $('log').innerHTML = S.log.length ? S.log.map((entry, index) => `<div>${index === 0 ? '<span class="status-dot"></span> ' : ''}${esc(entry)}</div>`).join('') : '<div class="empty-log">Здесь появится история игры.</div>';

  S.players.forEach(player => { previousPositions[player.id] = player.pos; });
}

// Allow the game to start with the selected standard map before a room exists.
chooseBoard(selectedBoard);
