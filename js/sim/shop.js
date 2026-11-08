// Pretend shop (grades 1–4): a customer buys something and pays; the child taps coins and bills from the cash
// drawer to give the right change. Pure logic (makeRound, judge, headless) + a small UI (mount).
import { T } from '../util.js';
import { mon, denoms, fewest, moneySVG, pile, tallyText } from '../money.js';

export const meta = {
  id: 'sim-shop', grades: [1, 4], icon: '🏪', area: 'spend',
  name: T('小小商店：找錢遊戲', 'Little Shop: give the change'),
  blurb: T('你是店員！客人付錢後，點錢櫃裡的硬幣和鈔票，找回正確的零錢。', 'You run the shop! When a customer pays, tap coins and bills in the cash drawer to give the right change.'),
};
const ROUNDS = 6;
const CUSTOMERS = ['🐼', '🐰', '🦊', '🐻', '🐱', '🐶', '🐨', '🐸', '🐯', '🐵'];
const ITEMS = [
  ['🍎', '蘋果', 'an apple'], ['🧃', '果汁', 'a juice box'], ['✏️', '鉛筆', 'a pencil'], ['📒', '筆記本', 'a notebook'],
  ['🍙', '飯糰', 'a rice ball'], ['🧸', '小熊玩偶', 'a teddy bear'], ['🎈', '氣球', 'a balloon'], ['🍪', '餅乾', 'cookies'],
  ['⚽', '足球', 'a soccer ball'], ['📚', '故事書', 'a storybook'], ['🖍️', '蠟筆', 'crayons'], ['🍦', '冰淇淋', 'an ice cream'],
];

// one customer: price, what they pay with, the change
export function makeRound(r, cur, g) {
  let price, paid;
  if (cur === 'tw') {
    if (g <= 2) { price = r.int(3, 95) * 100; paid = 10000; }
    else { price = r.int(25, 960) * 100; paid = [10000, 50000, 100000].find((b) => b > price); }
    if (g >= 3 && r.chance(0.3) && paid < 100000) paid = [50000, 100000].find((b) => b > paid) || paid;
  } else {
    if (g <= 2) { price = r.int(5, 95); paid = 100; }
    else { price = r.int(105, 1895); paid = [500, 1000, 2000].find((b) => b > price); }
    if (g >= 3 && r.chance(0.3) && paid < 2000) paid = [1000, 2000].find((b) => b > paid) || paid;
  }
  const [emoji, zh, en] = r.pick(ITEMS);
  return { price, paid, change: paid - price, who: r.pick(CUSTOMERS), item: { emoji, zh, en } };
}
// the drawer offers every denomination smaller than what was paid
export const drawer = (cur, paid) => denoms(cur).filter((d) => d < paid);
// judge a tray of coins/bills against the change
export function judge(round, tray, cur) {
  const sum = tray.reduce((s, d) => s + d, 0);
  const best = fewest(round.change, cur).length;
  return { sum, ok: sum === round.change, fewest: sum === round.change && tray.length === best, best, diff: sum - round.change };
}

// play a whole game without a screen: sometimes give wrong change first, then the right one
export function headless(r, cur) {
  const g = r.int(1, 4); let score = 0;
  for (let i = 0; i < ROUNDS; i++) {
    const rd = makeRound(r, cur, g);
    if (!(rd.change > 0 && rd.price > 0 && Number.isInteger(rd.change))) return 'bad round ' + JSON.stringify(rd);
    if (cur === 'tw' && rd.change % 100) return 'cents in NT$ change';
    const ds = drawer(cur, rd.paid);
    if (r.chance(0.4)) { const wrong = [r.pick(ds)]; if (judge(rd, wrong, cur).ok && wrong[0] !== rd.change) return 'wrong tray judged ok'; }
    // build the change greedily from the drawer only
    let left = rd.change; const tray = [];
    for (const d of ds.slice().reverse()) while (left >= d) { tray.push(d); left -= d; }
    if (left) return 'drawer cannot make change';
    const j = judge(rd, tray, cur);
    if (!j.ok || !j.fewest) return 'greedy change rejected';
    score++;
  }
  return score === ROUNDS ? true : 'score';
}

// ---------- UI ----------
export function mount(el, ctx) {
  const { cur } = ctx, m = mon(cur);
  const g = Math.min(4, Math.max(1, ctx.grade || 2));
  const r = ctx.rng;
  let k = 0, firstTry = 0, tries = 0, tray = [], round = makeRound(r, cur, g), state = 'play', msg = null;
  const finish = () => {
    state = 'end';
    ctx.done(firstTry / ROUNDS, {
      score: T(`第一次就找對：${firstTry} / ${ROUNDS} 位客人`, `Right on the first try: ${firstTry} / ${ROUNDS} customers`),
      learned: [
        T('找錢＝客人付的錢 − 價錢。', 'Change = what the customer paid − the price.'),
        T('「往上數」：從價錢開始，一個一個加，加到客人付的錢為止。', '"Count up": start at the price and add coins until you reach what the customer paid.'),
        T('先用大的硬幣或鈔票，找的錢張數最少，也比較不容易出錯。', 'Use the biggest coins and bills first: fewer pieces and fewer mistakes.'),
        T('找完錢再數一次：價錢 + 找的錢 = 付的錢。', 'Check: price + change = what was paid.'),
      ],
    });
  };
  function render() {
    const L = ctx.L;
    if (state === 'end') return;
    const sum = tray.reduce((s, d) => s + d, 0);
    el.innerHTML = `<div class="sim shop">
      <div class="simbar"><span>${L('客人', 'Customer')} ${k + 1} / ${ROUNDS}</span><span>⭐ ${firstTry}</span></div>
      <div class="counter">
        <div class="cust"><span class="who">${round.who}</span><div class="bubble">${L(`我要買${round.item.zh} ${round.item.emoji}，<b>${m.zf(round.price)}</b>。給你 <b>${m.zf(round.paid)}</b>！`, `I'd like ${round.item.en} ${round.item.emoji} for <b>${m.ef(round.price)}</b>. Here is <b>${m.ef(round.paid)}</b>!`)}</div></div>
        <div class="paid">${pile([round.paid], cur)}</div>
      </div>
      <h3>${L('找給客人的錢（點一下可以拿回來）', 'Change for the customer (tap a piece to take it back)')}</h3>
      <div class="tray" aria-live="polite">${tray.length ? tray.map((d, i) => `<button class="mbtn" data-t="${i}" aria-label="remove">${moneySVG(d, cur, true)}</button>`).join('') : `<span class="muted">${L('還沒有放錢', 'Empty')}</span>`}</div>
      <p class="sumline">${L('已經放了：', 'So far: ')}<b>${m.zf(sum)}</b></p>
      <h3>${L('錢櫃', 'Cash drawer')}</h3>
      <div class="drawer">${drawer(cur, round.paid).slice().reverse().map((d) => `<button class="mbtn" data-d="${d}" aria-label="${m.name(d).en}">${moneySVG(d, cur, true)}</button>`).join('')}</div>
      <div class="acts"><button class="btn big" id="give">${L('找錢給客人', 'Give change')}</button><button class="btn ghost" id="clr">${L('全部拿回', 'Clear')}</button></div>
      <div class="fb ${msg?.ok ? 'ok' : msg ? 'no' : ''}">${msg ? ctx.X(msg.t) : ''}</div>
      ${state === 'next' ? `<div class="next"><button class="btn big" id="nx">${k + 1 < ROUNDS ? L('下一位客人 →', 'Next customer →') : L('看結果 →', 'See results →')}</button></div>` : ''}
    </div>`;
    el.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => { if (state !== 'play') return; tray.push(+b.dataset.d); msg = null; render(); }));
    el.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => { if (state !== 'play') return; tray.splice(+b.dataset.t, 1); render(); }));
    el.querySelector('#clr').onclick = () => { if (state === 'play') { tray = []; render(); } };
    el.querySelector('#give').onclick = () => {
      if (state !== 'play' || !tray.length) return;
      const j = judge(round, tray, cur); tries++;
      if (j.ok) {
        if (tries === 1) firstTry++;
        msg = { ok: true, t: j.fewest ? T(`✅ 對了！找 ${m.zf(round.change)}，而且用了最少的錢（${j.best} 個）！`, `✅ Right! ${m.ef(round.change)} change, with the fewest pieces (${j.best})!`)
          : T(`✅ 對了，找 ${m.zf(round.change)}！小挑戰：其實只要 ${j.best} 個就夠：${tallyText(fewest(round.change, cur), cur).zh}。`, `✅ Right, ${m.ef(round.change)} change! Challenge: it can be done with just ${j.best} pieces: ${tallyText(fewest(round.change, cur), cur).en}.`) };
        state = 'next';
      } else if (tries >= 3) {
        msg = { ok: false, t: T(`應該找 ${m.zf(round.paid)} − ${m.zf(round.price)} = ${m.zf(round.change)}，例如：${tallyText(fewest(round.change, cur), cur).zh}。`, `The change is ${m.ef(round.paid)} − ${m.ef(round.price)} = ${m.ef(round.change)}, for example: ${tallyText(fewest(round.change, cur), cur).en}.`) };
        state = 'next';
      } else msg = { ok: false, t: j.diff > 0 ? T(`🤔 找太多了，多了 ${m.zf(j.diff)}。拿回一些再試試。`, `🤔 That's too much — ${m.ef(j.diff)} extra. Take some back and try again.`) : T(`🤔 還不夠，還差 ${m.zf(-j.diff)}。`, `🤔 Not enough yet — ${m.ef(-j.diff)} short.`) };
      render();
    };
    const nx = el.querySelector('#nx');
    if (nx) { nx.onclick = () => { if (++k >= ROUNDS) return finish(); round = makeRound(r, cur, g); tray = []; tries = 0; msg = null; state = 'play'; render(); }; nx.focus({ preventScroll: true }); }
  }
  render();
  return { render };
}
