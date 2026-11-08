// Bubble-tea stand (grades 3–8): run a stand for 14 days. Each morning you see the weather forecast, set a price,
// decide how many cups of tea to make (fresh tea and pearls go bad at the end of the day) and buy packs of cups.
// Customers come depending on the real weather and your price. Profit = revenue − cost.
import { T } from '../util.js';
import { mon } from '../money.js';

export const meta = {
  id: 'sim-tea', grades: [3, 8], icon: '🧋', area: 'earn',
  name: T('珍奶小老闆：14 天經營挑戰', 'Bubble Tea Boss: a 14-day business'),
  blurb: T('看天氣、訂價錢、準備材料，經營你的珍珠奶茶攤，看看能賺多少！', 'Check the weather, set your price, prepare supplies and run your own bubble tea stand. How much profit can you make?'),
};
export const DAYS = 14;
// all money in cents
export const CFG = {
  tw: { start: 150000, ing: 1500, pack: 10000, packN: 25, ref: 5000, prices: [3000, 3500, 4000, 4500, 5000, 5500, 6000, 7000, 8000] },
  us: { start: 15000, ing: 150, pack: 1000, packN: 25, ref: 500, prices: [250, 300, 350, 400, 450, 500, 550, 600, 700, 800] },
};
export const WEATHER = {
  hot: { e: '☀️', zh: '大熱天', en: 'Hot and sunny', base: 70 },
  warm: { e: '🌤️', zh: '晴時多雲', en: 'Warm', base: 50 },
  cloudy: { e: '☁️', zh: '陰天', en: 'Cloudy', base: 34 },
  rain: { e: '🌧️', zh: '下雨', en: 'Rainy', base: 18 },
};
const WKEYS = Object.keys(WEATHER);

export function newGame(r, cur) {
  const c = CFG[cur];
  const s = { cur, day: 1, cash: c.start, cups: 25, rep: 1, log: [], totals: { rev: 0, cost: 0, sold: 0, wasted: 0, missed: 0 } };
  s.cost0 = c.pack; s.cash -= c.pack; s.totals.cost += c.pack;   // the first pack of cups is bought for you
  s.forecast = forecastFor(r);
  return s;
}
function forecastFor(r) { return { real: r.pick(WKEYS.concat(['hot', 'warm'])), guess: null }; }
// the forecast shown in the morning is right 75% of the time, otherwise one step off
export function morning(r, s) {
  const f = s.forecast, i = WKEYS.indexOf(f.real);
  f.guess = r.chance(0.75) ? f.real : WKEYS[Math.max(0, Math.min(3, i + r.pick([-1, 1])))];
  return f.guess;
}
// how many customers want tea at this price (before running out)
export function demand(r, s, price) {
  const c = CFG[s.cur], base = WEATHER[s.forecast.real].base;
  const pf = Math.max(0, Math.min(1.7, (2 * c.ref - price) / c.ref));   // ref price → 1, 1.5×ref → 0.5, 2×ref → 0
  const noise = 0.8 + 0.4 * r();
  return Math.max(0, Math.round(base * pf * noise * s.rep));
}
// what the player can afford: making `make` cups needs ingredients; packs of cups cost extra
export function cost(s, make, packs) { const c = CFG[s.cur]; return make * c.ing + packs * c.pack; }
export function maxMake(s, packs) { const c = CFG[s.cur]; return Math.max(0, Math.min(Math.floor((s.cash - packs * c.pack) / c.ing), s.cups + packs * c.packN)); }

// play one day: returns the day's report
export function playDay(r, s, { price, make, packs }) {
  const c = CFG[s.cur];
  if (!c.prices.includes(price)) throw new Error('bad price');
  if (!(Number.isInteger(make) && make >= 0 && Number.isInteger(packs) && packs >= 0)) throw new Error('bad choice');
  if (make > maxMake(s, packs)) throw new Error('cannot afford that');
  const spend = cost(s, make, packs);
  s.cash -= spend; s.cups += packs * c.packN;
  const want = demand(r, s, price);
  const sold = Math.min(want, make, s.cups);
  const rev = sold * price;
  s.cups -= sold; s.cash += rev;
  const wasted = make - sold, missed = want - sold;
  // fair prices and not running out make people come back
  const fair = price <= c.ref * 1.2;
  s.rep = Math.max(0.6, Math.min(1.4, s.rep + (fair ? 0.04 : -0.05) + (missed > 5 ? -0.03 : 0)));
  const rep = { day: s.day, weather: s.forecast.real, guess: s.forecast.guess, price, make, packs, want, sold, rev, spend, profit: rev - spend, wasted, missed, cash: s.cash };
  s.log.push(rep);
  s.totals.rev += rev; s.totals.cost += spend; s.totals.sold += sold; s.totals.wasted += wasted; s.totals.missed += missed;
  s.day++;
  s.forecast = forecastFor(r);
  return rep;
}
export const profitOf = (s) => s.totals.rev - s.totals.cost;

export function headless(r, cur) {
  const c = CFG[cur], s = newGame(r, cur);
  while (s.day <= DAYS) {
    morning(r, s);
    const price = r.pick(c.prices), packs = s.cups < 30 && s.cash > c.pack + 20 * c.ing ? r.int(0, 2) : 0;
    const mx = maxMake(s, packs);
    const make = r.int(0, mx);
    const before = s.cash;
    const rep = playDay(r, s, { price, make, packs });
    if (s.cash !== before - rep.spend + rep.rev) return 'cash mismatch';
    if (s.cash < 0 || s.cups < 0 || !Number.isInteger(s.cash)) return 'negative/float cash ' + s.cash;
    if (cur === 'tw' && s.cash % 100) return 'NT$ cents';
  }
  if (s.cash !== c.start + profitOf(s)) return 'profit mismatch';
  const sum = summary(s);
  if (!sum.learned.length) return 'no summary';
  return true;
}

export function summary(s) {
  const m = mon(s.cur), c = CFG[s.cur], P = profitOf(s), t = s.totals;
  const best = s.log.reduce((a, b) => (b.profit > a.profit ? b : a), s.log[0]);
  const learned = [
    T(`利潤＝收入 − 成本：${m.zf(t.rev)} − ${m.zf(t.cost)} = ${m.zf(P)}。`, `Profit = revenue − cost: ${m.ef(t.rev)} − ${m.ef(t.cost)} = ${m.ef(P)}.`),
    T('價錢太高，客人變少；價錢太低，賣很多卻賺不多。好價錢要剛剛好。', 'Price too high → fewer customers; price too low → you sell a lot but earn little. The best price is in between.'),
    T(`天氣會改變需求：熱天最好賣，下雨天客人少。看預報準備材料（預報偶爾也會不準）。`, `Weather changes demand: hot days sell best, rainy days are slow. Use the forecast to plan (it is sometimes wrong).`),
  ];
  if (t.wasted > t.sold * 0.25) learned.push(T(`你倒掉了 ${t.wasted} 杯沒賣完的茶，每杯材料 ${m.zf(c.ing)}，浪費 ${m.zf(t.wasted * c.ing)}。準備太多也是成本！`, `You threw away ${t.wasted} unsold cups; at ${m.ef(c.ing)} each that wasted ${m.ef(t.wasted * c.ing)}. Making too much is a cost too!`));
  if (t.missed > 20) learned.push(T(`有 ${t.missed} 位客人因為賣完了沒買到，這是「錯過的收入」。`, `${t.missed} customers left because you ran out — that is income you missed.`));
  learned.push(T('每天的收入不一定一樣，留一些現金當週轉金，才有錢買明天的材料。', 'Income changes day to day. Keep some cash so you can buy tomorrow’s supplies.'));
  return {
    score: T(`14 天總利潤：${m.zf(P)}（最好的一天：第 ${best.day} 天，賺 ${m.zf(best.profit)}）`, `Total profit after 14 days: ${m.ef(P)} (best day: day ${best.day}, ${m.ef(best.profit)})`),
    learned,
  };
}

// ---------- UI ----------
export function mount(el, ctx) {
  const { cur } = ctx, m = mon(cur), c = CFG[cur], r = ctx.rng;
  const s = newGame(r, cur);
  morning(r, s);
  let price = c.ref, packs = 0, make = 30, last = null;
  const mk = () => Math.max(0, Math.min(make, maxMake(s, packs)));
  function chart() {
    // daily profit bars (one series, so no legend); positive up, negative down
    if (!s.log.length) return '';
    const W = 320, H = 110, n = DAYS, bw = W / n - 4, mx = Math.max(1, ...s.log.map((d) => Math.abs(d.profit)));
    const y0 = H / 2;
    let g = `<line x1="0" y1="${y0}" x2="${W}" y2="${y0}" class="f-grid"/>`;
    s.log.forEach((d, i) => {
      const h = Math.max(1, (Math.abs(d.profit) / mx) * (H / 2 - 6)), x = i * (W / n) + 2;
      g += `<rect x="${x.toFixed(1)}" y="${(d.profit >= 0 ? y0 - h : y0).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="2" class="${d.profit >= 0 ? 'bar-pos' : 'bar-neg'}"><title>${ctx.L('第', 'Day ')}${d.day}${ctx.L(' 天', '')}: ${ctx.L(m.zf(d.profit), m.ef(d.profit))}</title></rect>`;
    });
    return `<figure class="minichart"><figcaption>${ctx.L('每天的利潤', 'Profit each day')}</figcaption><svg viewBox="0 0 ${W} ${H}" width="100%" role="img">${g}</svg></figure>`;
  }
  function render() {
    const L = ctx.L, X = ctx.X;
    const w = WEATHER[s.forecast.guess], spend = cost(s, mk(), packs);
    el.innerHTML = `<div class="sim tea">
      <div class="simbar"><span>📅 ${L(`第 ${s.day} / ${DAYS} 天`, `Day ${s.day} / ${DAYS}`)}</span><span>💰 ${L(m.zf(s.cash), m.ef(s.cash))}</span><span>🥤 ${L(`杯子 ${s.cups} 個`, `${s.cups} cups`)}</span><span>${L('口碑', 'Reputation')} ${'★'.repeat(Math.round(s.rep * 3))}</span></div>
      ${last ? `<div class="report"><b>${L(`第 ${last.day} 天結果`, `Day ${last.day} results`)}</b> ${WEATHER[last.weather].e} ${L(WEATHER[last.weather].zh, WEATHER[last.weather].en)}${last.guess !== last.weather ? L('（預報不準！）', ' (the forecast was wrong!)') : ''}<br>
        ${L(`想買的客人 ${last.want} 位，賣出 ${last.sold} 杯`, `${last.want} customers wanted tea, you sold ${last.sold}`)}${last.wasted ? L(`，倒掉 ${last.wasted} 杯`, `, threw away ${last.wasted}`) : ''}${last.missed ? L(`，${last.missed} 位客人沒買到`, `, ${last.missed} customers missed out`) : ''}。<br>
        ${L(`收入 ${m.zf(last.rev)} − 成本 ${m.zf(last.spend)} = 利潤 <b class="${last.profit >= 0 ? 'pos' : 'neg'}">${m.zf(last.profit)}</b>`, `Revenue ${m.ef(last.rev)} − cost ${m.ef(last.spend)} = profit <b class="${last.profit >= 0 ? 'pos' : 'neg'}">${m.ef(last.profit)}</b>`)}</div>` : `<div class="report">${L(`歡迎開店！你有 ${m.zf(s.cash)} 現金和 ${s.cups} 個杯子（第一包杯子 ${m.zf(c.pack)} 已經幫你買好）。每杯的茶和珍珠材料 ${m.zf(c.ing)}，當天沒賣完就要倒掉。`, `Welcome! You have ${m.ef(s.cash)} cash and ${s.cups} cups (the first pack of cups, ${m.ef(c.pack)}, is already bought). Tea and pearls cost ${m.ef(c.ing)} per cup and must be thrown away if not sold that day.`)}</div>`}
      ${chart()}
      <div class="forecast">${w.e} <b>${L('今天的天氣預報：', 'Today’s forecast: ')}${L(w.zh, w.en)}</b></div>
      <div class="ctl"><label>${L('每杯賣多少錢？', 'Price per cup')}</label><div class="seg">${c.prices.map((p) => `<button class="${p === price ? 'on' : ''}" data-p="${p}">${L(m.zf(p), m.ef(p))}</button>`).join('')}</div></div>
      <div class="ctl"><label>${L(`買幾包杯子？（1 包 ${c.packN} 個，${m.zf(c.pack)}）`, `Packs of cups to buy (${c.packN} per pack, ${m.ef(c.pack)})`)}</label>
        <div class="step"><button data-k="-1">−</button><b>${packs}</b><button data-k="1">+</button></div></div>
      <div class="ctl"><label>${L(`今天做幾杯？（材料每杯 ${m.zf(c.ing)}，最多 ${maxMake(s, packs)} 杯）`, `Cups to make today (${m.ef(c.ing)} each, max ${maxMake(s, packs)})`)}</label>
        <div class="step"><button data-m="-10">−10</button><button data-m="-1">−1</button><b>${mk()}</b><button data-m="1">+1</button><button data-m="10">+10</button></div></div>
      ${s.cups + packs * c.packN < 5 ? `<p class="fb no">⚠️ ${L('杯子快用完了！沒有杯子就不能賣，記得買一包杯子。', 'You are almost out of cups! No cups means no sales — buy a pack.')}</p>` : ''}
      <p class="sumline">${L(`今天要花：${m.zf(spend)}`, `Today’s spending: ${m.ef(spend)}`)}</p>
      <div class="acts"><button class="btn big" id="open">🧋 ${L('開店！', 'Open the stand!')}</button></div>
    </div>`;
    el.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => { price = +b.dataset.p; render(); }));
    el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { packs = Math.max(0, packs + +b.dataset.k); while (packs && cost(s, 0, packs) > s.cash) packs--; render(); }));
    el.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { make = Math.max(0, mk() + +b.dataset.m); render(); }));
    el.querySelector('#open').onclick = () => {
      last = playDay(r, s, { price, make: mk(), packs }); packs = 0;
      if (s.day > DAYS) { const sm = summary(s); return ctx.done(Math.max(0, Math.min(1, profitOf(s) / (c.start * 1.5))), { ...sm, extra: chart() + reportTable() }); }
      morning(r, s); render();
    };
    void X;
  }
  function reportTable() {
    const L = ctx.L;
    return `<div class="tblwrap"><table class="tbl"><tr><th>${L('天', 'Day')}</th><th></th><th>${L('價錢', 'Price')}</th><th>${L('賣出', 'Sold')}</th><th>${L('利潤', 'Profit')}</th></tr>${s.log.map((d) => `<tr><td>${d.day}</td><td>${WEATHER[d.weather].e}</td><td>${L(m.zf(d.price), m.ef(d.price))}</td><td>${d.sold}/${d.make}</td><td class="${d.profit >= 0 ? 'pos' : 'neg'}">${L(m.zf(d.profit), m.ef(d.profit))}</td></tr>`).join('')}</table></div>`;
  }
  render();
  return { render };
}
