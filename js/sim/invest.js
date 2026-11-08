// Investing over 30 years (grades 9–12): put the same money every year into a savings account, a stock index fund,
// a single company's stock — and your own mix. Returns are random but realistic: the index fund swings, the single
// stock swings much more and can even go bankrupt. Shows compounding and why diversification matters.
import { T } from '../util.js';
import { mon, rdiv } from '../money.js';

export const meta = {
  id: 'sim-invest', grades: [9, 12], icon: '📈', area: 'invest',
  name: T('30 年投資實驗室', 'The 30-Year Investing Lab'),
  blurb: T('同樣每個月存一筆錢：放銀行、買指數基金、押一支股票，30 年後差多少？', 'Put the same money in every month: a bank account, an index fund or one single stock. What happens after 30 years?'),
};
export const YEARS = 30;
export const CFG = {
  tw: { monthly: [300000, 500000, 1000000], saveBp: 150 },
  us: { monthly: [10000, 25000, 50000], saveBp: 200 },
};
export const PRESETS = [
  { id: 'save', zh: '全部存銀行', en: 'All in savings', mix: [100, 0, 0] },
  { id: 'safe', zh: '保守', en: 'Careful', mix: [60, 40, 0] },
  { id: 'bal', zh: '平衡', en: 'Balanced', mix: [30, 70, 0] },
  { id: 'index', zh: '全部指數基金', en: 'All index fund', mix: [0, 100, 0] },
  { id: 'bold', zh: '大膽', en: 'Bold', mix: [0, 50, 50] },
  { id: 'one', zh: '全押一支股票', en: 'All in one stock', mix: [0, 0, 100] },
];
const gauss = (r) => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// one year of market history, in basis points (1% = 100)
export function yearReturns(r, cur) {
  const index = Math.round(clamp(800 + 1600 * gauss(r), -4500, 4500));
  // a single company: follows the market a bit, plus its own big swings; about 1% a year it goes bankrupt
  const bankrupt = r() < 0.01;
  const stock = bankrupt ? -10000 : Math.round(clamp(0.6 * index + 300 + 3500 * gauss(r), -9000, 12000));
  return { save: CFG[cur].saveBp, index, stock, bankrupt };
}
const growBp = (b, bp) => Number(rdiv(BigInt(b) * BigInt(10000 + bp), 10000n));

export function newGame(cur, monthlyIdx, mix) {
  if (mix.reduce((a, b) => a + b, 0) !== 100 || mix.some((x) => x < 0 || x % 10)) throw new Error('mix must be tens adding to 100');
  const yearly = CFG[cur].monthly[monthlyIdx] * 12;
  return { cur, yearly, mix, year: 0, put: 0, bal: { save: 0, index: 0, stock: 0, mix: 0 }, hist: [{ year: 0, put: 0, save: 0, index: 0, stock: 0, mix: 0 }], events: [], rets: [], companies: 1 };
}
// add this year's money at the start of the year, then apply the year's returns
export function stepYear(r, s) {
  const y = yearReturns(r, s.cur), b = s.bal;
  s.year++; s.put += s.yearly;
  b.save = growBp(b.save + s.yearly, y.save);
  b.index = growBp(b.index + s.yearly, y.index);
  b.stock = growBp(b.stock + s.yearly, y.stock);
  // your mix is rebalanced to the chosen percentages every year
  const tot = b.mix + s.yearly, p0 = rdiv(tot * s.mix[0], 100), p1 = rdiv(tot * s.mix[1], 100), p2 = tot - p0 - p1;
  b.mix = growBp(p0, y.save) + growBp(p1, y.index) + growBp(Math.max(0, p2), y.stock);
  if (y.bankrupt) { s.events.push({ year: s.year, kind: 'bankrupt' }); s.companies++; }
  else if (y.index <= -1500) s.events.push({ year: s.year, kind: 'crash', bp: y.index });
  else if (y.index >= 2500) s.events.push({ year: s.year, kind: 'boom', bp: y.index });
  s.rets.push(y);
  s.hist.push({ year: s.year, put: s.put, ...b });
  return y;
}

export function headless(r, cur) {
  const p = r.pick(PRESETS), s = newGame(cur, r.int(0, 2), p.mix);
  while (s.year < YEARS) stepYear(r, s);
  for (const h of s.hist) for (const k of ['put', 'save', 'index', 'stock', 'mix']) {
    if (!Number.isSafeInteger(h[k]) || h[k] < 0) return `bad balance ${k}=${h[k]}`;
  }
  if (s.put !== s.yearly * YEARS) return 'contributions';
  if (s.bal.save <= s.put) return 'savings should grow';
  if (p.mix[0] === 100 && s.bal.mix !== s.bal.save) return 'all-savings mix must equal savings';
  if (p.mix[1] === 100 && s.bal.mix !== s.bal.index) return 'all-index mix must equal index';
  const sm = summary(s);
  if (!sm.learned.length) return 'no summary';
  return true;
}
// NT$ balances are shown rounded to whole dollars (they grow by percentages, so cents appear inside the math)
const show = (c, cur, lang) => { const m = mon(cur); const w = rdiv(Math.abs(c), 100) * 100 * Math.sign(c || 1); return lang === 'zh' ? m.z(w) : m.e(w); };
export function summary(s) {
  const cur = s.cur, b = s.bal, z = (c) => show(c, cur, 'zh'), e = (c) => show(c, cur, 'en');
  const cagr = (v) => (s.put ? v / s.put : 0);
  const crashes = s.events.filter((x) => x.kind === 'crash').length, bk = s.events.filter((x) => x.kind === 'bankrupt').length;
  const learned = [
    T(`30 年你一共投入 ${z(s.put)}。存銀行變成 ${z(b.save)}，指數基金變成 ${z(b.index)}，單一股票變成 ${z(b.stock)}，你的組合變成 ${z(b.mix)}。`,
      `Over 30 years you put in ${e(s.put)}. Savings grew to ${e(b.save)}, the index fund to ${e(b.index)}, the single stock to ${e(b.stock)}, and your mix to ${e(b.mix)}.`),
    T(`複利：賺到的錢會再幫你賺錢。指數基金最後是投入金額的 ${cagr(b.index).toFixed(1)} 倍，越早開始、時間越長，效果越大。`,
      `Compounding: your earnings earn more earnings. The index fund ended at ${cagr(b.index).toFixed(1)}× what you put in. The earlier you start, the stronger it gets.`),
    T(`風險與報酬：股票長期平均報酬比存款高，但每年上下起伏很大${crashes ? `（這 30 年遇到 ${crashes} 次大跌）` : ''}。存款很穩，但成長慢，還可能跟不上通膨。`,
      `Risk and return: stocks have earned more than savings over long periods, but they swing up and down${crashes ? ` (${crashes} big crash year${crashes > 1 ? 's' : ''} in this run)` : ''}. Savings are steady but grow slowly and may not beat inflation.`),
    T(`分散投資：指數基金一次買進很多家公司，一家出事影響不大；只買一支股票，結果全看那家公司${bk ? `（這次有 ${bk} 家公司倒閉，錢歸零！）` : ''}。`,
      `Diversification: an index fund owns many companies, so one failure hurts little. With a single stock, everything depends on one company${bk ? ` (in this run ${bk} compan${bk > 1 ? 'ies' : 'y'} went bankrupt and the money went to zero!)` : ''}.`),
    T('72 法則：用 72 除以年報酬率，大約就是錢翻倍要幾年。8% 大約 9 年翻一倍。', 'Rule of 72: 72 ÷ the yearly return ≈ years to double. At 8%, about 9 years.'),
    T('再按一次「重新開始」：每次的市場歷史都不一樣，看看單一股票的結果差多大。', 'Press “Start over” and run again: every market history is different — notice how wildly the single stock’s result changes.'),
  ];
  return { score: T(`你的組合：${z(b.mix)}（投入 ${z(s.put)}）`, `Your mix: ${e(b.mix)} (you put in ${e(s.put)})`), learned };
}

// ---------- UI ----------
const SERIES = [
  { k: 'mix', zh: '你的組合', en: 'Your mix', cls: 's1' },
  { k: 'index', zh: '指數基金', en: 'Index fund', cls: 's2' },
  { k: 'save', zh: '銀行存款', en: 'Savings', cls: 's3' },
  { k: 'stock', zh: '單一股票', en: 'One stock', cls: 's4' },
];
export function mount(el, ctx) {
  const { cur } = ctx, m = mon(cur), r = ctx.rng;
  let monthlyIdx = 1, mix = [30, 70, 0], s = null, hover = null;
  const money = (c) => show(c, cur, ctx.lang());
  let cw = 0;
  const CW = () => (cw ||= Math.max(320, Math.min(720, Math.round(el.clientWidth - 40) || 640)));
  function chart() {
    const W = CW(), H = Math.round(Math.max(220, Math.min(320, W * 0.5))), pl = 54, pr = 86, pt = 12, pb = 28;
    const max = Math.max(1, ...s.hist.flatMap((h) => [h.put, h.save, h.index, h.stock, h.mix]));
    const X = (y) => pl + (y / YEARS) * (W - pl - pr), Y = (v) => pt + (1 - v / max) * (H - pt - pb);
    let g = '';
    for (let i = 0; i <= 4; i++) { const v = (max * i) / 4; g += `<line x1="${pl}" x2="${W - pr}" y1="${Y(v)}" y2="${Y(v)}" class="f-grid"/><text x="${pl - 6}" y="${Y(v) + 4}" text-anchor="end" class="ax">${short(v)}</text>`; }
    for (let y = 0; y <= YEARS; y += 5) g += `<text x="${X(y)}" y="${H - 8}" text-anchor="middle" class="ax">${y}</text>`;
    const path = (k) => s.hist.map((h, i) => `${i ? 'L' : 'M'}${X(h.year).toFixed(1)},${Y(h[k]).toFixed(1)}`).join('');
    g += `<path d="${path('put')}" class="ln put"/>`;
    const last = s.hist[s.hist.length - 1];
    // end labels, nudged apart so they don't collide
    const ends = SERIES.map((sr) => ({ sr, y: Y(last[sr.k]) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 14) ends[i].y = ends[i - 1].y + 14;
    for (const sr of SERIES.slice().reverse()) g += `<path d="${path(sr.k)}" class="ln ${sr.cls}"/>`;
    if (s.year) for (const { sr, y } of ends) g += `<text x="${X(last.year) + 6}" y="${y + 4}" class="lbl">${ctx.L(sr.zh, sr.en)}</text>`;
    if (hover != null && s.hist[hover]) { const h = s.hist[hover]; g += `<line x1="${X(h.year)}" x2="${X(h.year)}" y1="${pt}" y2="${H - pb}" class="xh"/>` + SERIES.map((sr) => `<circle cx="${X(h.year)}" cy="${Y(h[sr.k])}" r="4" class="dot ${sr.cls}"/>`).join(''); }
    g += `<rect x="${pl}" y="${pt}" width="${W - pl - pr}" height="${H - pt - pb}" fill="transparent" class="hit"/>`;
    let tip = '';
    if (hover != null && s.hist[hover]) {
      const h = s.hist[hover];
      tip = `<div class="tip" style="left:${Math.min(pl + 8, 60)}px"><b>${ctx.L(`第 ${h.year} 年`, `Year ${h.year}`)}</b>${SERIES.map((sr) => `<span><i class="sw ${sr.cls}"></i>${ctx.L(sr.zh, sr.en)} ${money(h[sr.k])}</span>`).join('')}<span><i class="sw put"></i>${ctx.L('投入本金', 'Put in')} ${money(h.put)}</span></div>`;
    }
    const legend = `<div class="legend">${SERIES.map((sr) => `<span><i class="sw ${sr.cls}"></i>${ctx.L(sr.zh, sr.en)}</span>`).join('')}<span><i class="sw put"></i>${ctx.L('投入本金', 'Money put in')}</span></div>`;
    return `<figure class="viz">${legend}<div class="vizbox"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${ctx.L('各種投資 30 年的變化', 'Growth of each choice over 30 years')}">${g}</svg>${tip}</div></figure>`;
  }
  function short(v) {
    const d = v / 100, L = ctx.L;
    if (cur === 'tw') return d >= 1e8 ? L(`${(d / 1e8).toFixed(1)}億`, `${(d / 1e6).toFixed(0)}M`) : d >= 1e4 ? L(`${Math.round(d / 1e4)}萬`, d >= 1e6 ? `${(d / 1e6).toFixed(1)}M` : `${Math.round(d / 1e3)}k`) : `${Math.round(d)}`;
    return d >= 1e6 ? `$${(d / 1e6).toFixed(1)}M` : d >= 1e3 ? `$${Math.round(d / 1e3)}k` : `$${Math.round(d)}`;
  }
  function setup() {
    const L = ctx.L;
    el.innerHTML = `<div class="sim invest">
      <p>${L('每個月存一筆固定的錢（每年年初一次投入），選擇放在哪裡，然後讓時間跑 30 年。四條線同時比較：全部存銀行、全部買指數基金、全部買一支股票，以及你自己的組合。', 'Put in a fixed amount every month (added at the start of each year), choose where it goes, and let 30 years run. Four lines run side by side: all in savings, all in an index fund, all in one stock, and your own mix.')}</p>
      <div class="ctl"><label>${L('每個月投入', 'Each month')}</label><div class="seg">${CFG[cur].monthly.map((c, i) => `<button class="${i === monthlyIdx ? 'on' : ''}" data-mi="${i}">${L(m.z(c), m.e(c))}</button>`).join('')}</div></div>
      <div class="ctl"><label>${L('你的組合', 'Your mix')}</label><div class="seg">${PRESETS.map((p) => `<button class="${p.mix.join() === mix.join() ? 'on' : ''}" data-p="${p.id}">${L(p.zh, p.en)}</button>`).join('')}</div></div>
      <div class="mixrow"><label>${L('指數基金', 'Index fund')} <b>${mix[1]}%</b><input type="range" min="0" max="100" step="10" value="${mix[1]}" id="ri"></label>
        <label>${L('單一股票', 'One stock')} <b>${mix[2]}%</b><input type="range" min="0" max="100" step="10" value="${mix[2]}" id="rs"></label>
        <span>${L('銀行存款', 'Savings')} <b>${mix[0]}%</b></span></div>
      <div class="mixbar"><i class="s3" style="width:${mix[0]}%"></i><i class="s2" style="width:${mix[1]}%"></i><i class="s4" style="width:${mix[2]}%"></i></div>
      <p class="muted">${L(`假設：存款年利率 ${CFG[cur].saveBp / 100}%；指數基金平均每年約 8%，但每年可能大漲或大跌；單一股票起伏更大，每年約有 1% 的機會公司倒閉。這是模擬，不是預測。`, `Assumptions: savings pay ${CFG[cur].saveBp / 100}% a year; the index fund averages about 8% a year but can rise or fall a lot in any year; a single stock swings even more and has about a 1% chance each year of the company going bankrupt. This is a simulation, not a prediction.`)}</p>
      <div class="acts"><button class="btn big" id="go">▶ ${L('開始 30 年', 'Start the 30 years')}</button></div></div>`;
    el.querySelectorAll('[data-mi]').forEach((b) => (b.onclick = () => { monthlyIdx = +b.dataset.mi; setup(); }));
    el.querySelectorAll('[data-p]').forEach((b) => (b.onclick = () => { mix = PRESETS.find((p) => p.id === b.dataset.p).mix.slice(); setup(); }));
    const ri = el.querySelector('#ri'), rs = el.querySelector('#rs');
    ri.oninput = () => { mix[1] = +ri.value; if (mix[1] + mix[2] > 100) mix[2] = 100 - mix[1]; mix[0] = 100 - mix[1] - mix[2]; setup(); el.querySelector('#ri').focus(); };
    rs.oninput = () => { mix[2] = +rs.value; if (mix[1] + mix[2] > 100) mix[1] = 100 - mix[2]; mix[0] = 100 - mix[1] - mix[2]; setup(); el.querySelector('#rs').focus(); };
    el.querySelector('#go').onclick = () => { s = newGame(cur, monthlyIdx, mix.slice()); render(); };
  }
  function render() {
    if (!s) return setup();
    const L = ctx.L;
    const y = s.rets[s.rets.length - 1];
    const ev = s.events.filter((x) => x.year === s.year).map((x) => x.kind === 'bankrupt' ? L('💥 你買的那家公司倒閉了！股票變成 0，之後的錢改買另一家公司。', '💥 The company you owned went bankrupt! The stock is worth 0; new money goes into another company.')
      : x.kind === 'crash' ? L(`📉 股市大跌 ${(-x.bp / 100).toFixed(1)}%！別慌，長期投資的人會經歷好幾次。`, `📉 Market crash: ${(x.bp / 100).toFixed(1)}%! Long-term investors live through several of these.`)
        : L(`🚀 股市大漲 ${(x.bp / 100).toFixed(1)}%！`, `🚀 Boom year: +${(x.bp / 100).toFixed(1)}%!`)).join('<br>');
    const pctTxt = (bp) => `${bp >= 0 ? '+' : '−'}${Math.abs(bp / 100).toFixed(1)}%`;
    el.innerHTML = `<div class="sim invest">
      <div class="simbar"><span>📅 ${L(`第 ${s.year} / ${YEARS} 年`, `Year ${s.year} / ${YEARS}`)}</span><span>${L('已投入', 'Put in')} ${money(s.put)}</span><span>${L('你的組合', 'Your mix')} <b>${money(s.bal.mix)}</b></span></div>
      ${y ? `<div class="report">${L('今年報酬：', 'This year: ')}${L('存款', 'savings')} ${pctTxt(y.save)} · ${L('指數基金', 'index fund')} ${pctTxt(y.index)} · ${L('單一股票', 'one stock')} ${pctTxt(y.stock)}${ev ? '<br>' + ev : ''}</div>` : ''}
      <div id="cv">${chart()}</div>
      <div class="acts">${s.year < YEARS ? `<button class="btn big" id="y1">${L('下一年', 'Next year')} →</button><button class="btn" id="y5">+5 ${L('年', 'years')}</button><button class="btn ghost" id="yall">${L('直接到第 30 年', 'Jump to year 30')}</button>`
        : `<button class="btn big" id="fin">${L('看看學到什麼 →', 'What did I learn? →')}</button>`}<button class="btn ghost" id="again">🔄 ${L('重新開始', 'Start over')}</button></div></div>`;
    const adv = (n) => { for (let i = 0; i < n && s.year < YEARS; i++) stepYear(r, s); hover = null; render(); };
    el.querySelector('#y1')?.addEventListener('click', () => adv(1));
    el.querySelector('#y5')?.addEventListener('click', () => adv(5));
    el.querySelector('#yall')?.addEventListener('click', () => adv(YEARS));
    el.querySelector('#fin')?.addEventListener('click', () => { const sm = summary(s); const final = s; ctx.done(Math.min(1, s.bal.mix / Math.max(1, s.put) / 3), { ...sm, extra: () => { const keep = s; s = final; const c = chart(); s = keep; return c + endTable(final); } }); });
    el.querySelector('#again').onclick = () => { s = null; hover = null; setup(); };
    const svg = el.querySelector('#cv svg');
    const onMove = (ev) => {
      const rc = svg.getBoundingClientRect(), x = ((ev.clientX - rc.left) / rc.width) * CW();
      const yr = Math.round(((x - 54) / (CW() - 54 - 86)) * YEARS);
      const nh = Math.max(0, Math.min(s.hist.length - 1, yr));
      if (nh !== hover) { hover = nh; el.querySelector('#cv').innerHTML = chart(); bind(); }
    };
    const bind = () => { const sv = el.querySelector('#cv svg'); sv.onpointermove = onMove; sv.onpointerleave = () => { hover = null; el.querySelector('#cv').innerHTML = chart(); bind(); }; };
    bind();
  }
  function endTable(st) {
    const L = ctx.L;
    return `<div class="tblwrap"><table class="tbl"><tr><th></th><th>${L('30 年後', 'After 30 years')}</th><th>${L('倍數', '× put in')}</th></tr>${SERIES.map((sr) => `<tr><td><i class="sw ${sr.cls}"></i>${L(sr.zh, sr.en)}</td><td class="num">${money(st.bal[sr.k])}</td><td class="num">${(st.bal[sr.k] / st.put).toFixed(2)}×</td></tr>`).join('')}<tr class="tot"><td>${L('投入本金', 'Money put in')}</td><td class="num">${money(st.put)}</td><td class="num">1.00×</td></tr></table></div>`;
  }
  setup();
  return { render };
}
