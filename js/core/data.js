// Shared data and state for Alixis's Monopoly Mod.
const $ = id => document.getElementById(id);
const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const COL = ['#e4572e', '#2e86ab', '#6a994e', '#9b5de5', '#f2a541', '#d1495b', '#00a6a6', '#8d6e63'];
const CN = 'Lima,Hanoi,Nairobi,Lisbon,Cairo,Bogotá,Prague,Seoul,Vienna,Mumbai,Istanbul,Toronto,Madrid,Berlin,Sydney,Rome,Dubai,Moscow,Paris,Singapore,Shanghai,London,Tokyo,New York,Hong Kong,Zurich'.split(',');

// Map registry: the standard 11x11 / 40-space board is the only playable map in V1.02.
const BOARD_MAPS = {
  standard: {
    id: 'standard', name: 'Standard Board', rows: 11, columns: 11,
    spaces: 40, status: 'available', description: 'Классическая карта · 11 × 11'
  }
};
let selectedBoard = 'standard';

const SP = { 0: ['go', 'Старт'], 10: ['jail', 'Тюрьма'], 20: ['free', 'Парковка'], 30: ['goto', 'В тюрьму'] };
[5, 15, 25, 35].forEach((i, k) => SP[i] = ['port', 'Порт ' + (k + 1)]);
[4, 38].forEach(i => SP[i] = ['tax', 'Налог']);
[2, 17, 22, 33].forEach(i => SP[i] = ['luck', 'Удача']);

let k = 0;
const T = [];
for (let i = 0; i < 40; i++) {
  if (SP[i]) {
    const [ty, n] = SP[i];
    T.push({ ty, n, price: ty === 'port' ? 200 : 0, rent: 50, tax: i === 4 ? 100 : 150 });
  } else {
    const price = 60 + k * 14;
    const group = Math.floor(k / 3);
    T.push({ ty: 'city', n: CN[k], price, rent: Math.round(price / 8), g: group, hc: 50 + group * 20, band: `hsl(${group * 42} 55% 48%)` });
    k++;
  }
}

// Maps the 40 perimeter spaces onto an 11x11 CSS grid.
const P = i => i <= 10 ? [10, 10 - i] : i <= 20 ? [20 - i, 0] : i <= 30 ? [0, i - 20] : [i - 30, 10];

let S = null, me = null, host = false, peer = null, conn = null, conns = [], name = '';
const err = message => { $('err').textContent = message; };
