// Elementary & middle-school money units: coins and bills, change, needs and wants, budgets, saving, earning,
// online safety, unit price, discounts, tax, bank ledgers, opportunity cost, profit, simple interest, bundle deals.
// See SPEC.md. All money is integer cents; Taiwan amounts are whole NT dollars.
import { T, num, sum, lcm, ansNum, ansChoice } from '../util.js';
import { mon, pile, fewest, tally, tallyText, ansCents, fmCents, denoms, CUR, isCoin, pctOfBp } from '../money.js';

// ---------------------------------------------------------------- helpers
const KIDS = [['小明', 'Max'], ['小美', 'Mia'], ['阿傑', 'Jay'], ['欣怡', 'Emma'], ['志豪', 'Leo'], ['雅婷', 'Ava'], ['家豪', 'Noah'], ['佳穎', 'Lily']];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
const cdiv = (a, b) => Math.floor((a + b - 1) / b);          // ceiling of a / b for positive integers
const pl = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;
const tbl = (head, rows) => `<table class="tbl">${head ? `<tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr>` : ''}${rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`;
const ABC = ['A', 'B', 'C', 'D'];
// break one coin/bill into the fewest smaller pieces (a 10 → two 5s, a quarter → 10 + 10 + 5)
function breakUp(d, cur) { const ds = denoms(cur).filter((x) => x < d).reverse(); const o = []; let c = d; for (const x of ds) while (c >= x) { o.push(x); c -= x; } return o; }
// the same money with one piece broken into smaller pieces (null if nothing can be broken)
function splitOne(r, list, cur) {
  const can = list.map((d, i) => [d, i]).filter(([d]) => d > denoms(cur)[0]);
  if (!can.length) return null;
  const [d, i] = r.pick(can);
  return [...list.slice(0, i), ...list.slice(i + 1), ...breakUp(d, cur)];
}
// running totals when counting from the biggest piece
const countOn = (list) => { let run = 0; return list.slice().sort((a, b) => b - a).map((d) => (run += d)); };
const twoPiles = (a, b, cur) => '<div style="display:flex;flex-wrap:wrap;gap:22px;align-items:flex-start">' +
  [['A', a], ['B', b]].map(([l, x]) => `<div><div style="font-weight:800;font-size:1.3em;margin-bottom:4px">${l}</div>${pile(x, cur, true)}</div>`).join('') + '</div>';
const safeTip = (tw) => (tw
  ? T('在台灣，遇到可疑的事，可以請大人打 165 反詐騙諮詢專線問清楚。', 'In Taiwan, a grown-up can call 165, the anti-fraud hotline, to check anything that seems fishy.')
  : T('在美國，大人可以到美國聯邦貿易委員會（FTC）的網站 ReportFraud.ftc.gov 檢舉詐騙。', 'In the US, grown-ups can report scams to the FTC at ReportFraud.ftc.gov.'));

export default [
  // ============================================================ 1. count coins
  {
    id: 'count-coins',
    grades: [1, 2],
    area: 'spend',
    name: T('數一數有多少錢', 'Count the coins'),
    std: { us: 'Jump$tart · Spending', tw: '國小數學 · 錢幣' },
    lesson: T('數錢時，先從面額最大的開始數，再一個一個往上加。一樣的硬幣可以「跳著數」，例如 5、10、15。這樣比較快，也比較不會數錯。',
      'When you count money, start with the biggest coins, then count on with the smaller ones. Coins that are the same can be skip counted, like 5, 10, 15. It is faster and you make fewer mistakes.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us';
      const show = (c, lang) => (us ? fmCents(c, lang) : lang === 'zh' ? `${c / 100} 元` : `NT$${c / 100}`);
      const A = (c) => (us ? ansCents(c) : m.ans(c));
      const uz = us ? '分' : '元', inC = us ? ' (in cents)' : '';
      const who = r.pick(KIDS);
      const ds = us ? (g >= 2 ? [1, 5, 10, 25] : [1, 5, 10]) : g >= 2 ? [100, 500, 1000, 5000, 10000] : [100, 500, 1000];
      const t = r.int(0, 2);
      if (t === 1) {
        // skip counting one kind of coin
        const d = r.pick(us ? (g >= 2 ? [5, 10, 25] : [5, 10]) : g >= 2 ? [500, 1000, 5000] : [500, 1000]);
        let k = r.int(3, g >= 2 ? 8 : 6); if (us) k = Math.min(k, Math.floor(99 / d));
        const total = k * d, steps = Array.from({ length: k }, (_, i) => (i + 1) * d);
        const nm = us ? { 5: ['5 分硬幣（nickel）', 'nickels'], 10: ['10 分硬幣（dime）', 'dimes'], 25: ['25 分硬幣（quarter）', 'quarters'] }[d] : [`${d / 100} 元硬幣`, `NT$${d / 100} coins`];
        const dv = us ? d : d / 100, tv = us ? total : total / 100;
        return {
          q: T(`${who[0]}有 ${k} 個 ${nm[0]}。一共是多少${uz}？`, `${who[1]} has ${k} ${nm[1]}. How much money is that${inC}?`),
          fig: pile(Array(k).fill(d), cur),
          ans: A(total),
          sol: [
            T(`每一個都是 ${show(d, 'zh')}，所以每次加 ${show(d, 'zh')}，跳著數。`, `Each coin is ${show(d, 'en')}, so skip count by ${show(d, 'en')}.`),
            T(`${steps.map((c) => show(c, 'zh')).join('、')}。`, `${steps.map((c) => show(c, 'en')).join(', ')}.`),
            T(`跳了 ${k} 次，一共是 ${show(total, 'zh')}（${k} × ${dv} = ${tv}）。`, `${k} jumps: ${show(total, 'en')} in all (${k} × ${dv} = ${tv}).`),
          ],
          hint: T(`每次加 ${show(d, 'zh')}。`, `Count by ${show(d, 'en')} each time.`),
        };
      }
      if (t === 2) {
        // how much more is needed
        const items = [['一枝鉛筆', 'a pencil'], ['一塊橡皮擦', 'an eraser'], ['一張貼紙', 'a sticker'], ['一包餅乾', 'a bag of crackers'], ['一顆蘋果', 'an apple']];
        const it = r.pick(items);
        let list, total;
        do { list = Array.from({ length: r.int(2, g >= 2 ? 5 : 4) }, () => r.pick(ds.filter((d) => us || d < 10000))); total = sum(list); } while (us && total > 90);
        const need = us ? r.int(1, 99 - total) : r.int(1, g >= 2 ? 40 : 20) * 100;
        const price = total + need, steps = countOn(list);
        return {
          q: T(`${who[0]}想買${it[0]}，要 ${show(price, 'zh')}。${who[0]}有下面這些錢，還差多少${uz}？`,
            `${who[1]} wants to buy ${it[1]} for ${show(price, 'en')}. ${who[1]} has the money below. How much more is needed${inC}?`),
          fig: pile(list, cur),
          ans: A(need),
          sol: [
            T(`先數有多少錢：${steps.map((c) => show(c, 'zh')).join('、')}，一共 ${show(total, 'zh')}。`, `First count the money: ${steps.map((c) => show(c, 'en')).join(', ')}. That is ${show(total, 'en')}.`),
            T(`還差的錢＝價錢 − 有的錢：${show(price, 'zh')} − ${show(total, 'zh')} = ${show(need, 'zh')}。`, `Still needed = price − money you have: ${show(price, 'en')} − ${show(total, 'en')} = ${show(need, 'en')}.`),
            T(`驗算：${show(total, 'zh')} + ${show(need, 'zh')} = ${show(price, 'zh')} ✔。`, `Check: ${show(total, 'en')} + ${show(need, 'en')} = ${show(price, 'en')} ✔.`),
          ],
          hint: T('先數一數有多少錢，再和價錢比。', 'Count the money first, then compare it with the price.'),
        };
      }
      let list, total;
      do {
        const k = r.int(3, g >= 2 ? 8 : 6);
        list = Array.from({ length: k }, () => r.pick(ds));
        total = sum(list);
      } while (us && total >= 100);
      const steps = countOn(list);
      return {
        q: r.chance(0.5)
          ? T(`${who[0]}的存錢筒裡有這些錢。一共是多少${uz}？`, `${who[1]}'s piggy bank has this money. How much is it in all${us ? ', in cents' : ''}?`)
          : T(`下面一共有多少${uz}？`, `How much money is shown${inC}?`),
        fig: pile(list, cur),
        ans: A(total),
        sol: [
          T(`先把錢從大排到小：${tallyText(list, cur).zh}。`, `Sort from biggest to smallest: ${tallyText(list, cur).en}.`),
          T(`從最大的開始往上數：${steps.map((c) => show(c, 'zh')).join('、')}。`, `Count on from the biggest: ${steps.map((c) => show(c, 'en')).join(', ')}.`),
          T(`一共是 ${show(total, 'zh')}。`, `In all: ${show(total, 'en')}.`),
        ],
        hint: T('先數最大的錢，再往上加。', 'Start with the biggest one and count on.'),
      };
    },
  },

  // ============================================================ 2. count bills and coins
  {
    id: 'count-bills',
    grades: [2, 3],
    area: 'spend',
    name: T('鈔票和硬幣一起數', 'Count bills and coins'),
    std: { us: 'Jump$tart · Spending', tw: '國小數學 · 錢幣' },
    lesson: T('先數鈔票，再數硬幣，從最大的開始往上加。要買東西前，先數清楚自己有多少錢，再和價錢比一比：錢比價錢多或一樣，才買得起。',
      'Count the bills first, then the coins, starting with the biggest. Before you buy something, count your money and compare it with the price: you can buy it only if your money is the same as the price or more.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us';
      const bills = us ? (g >= 3 ? [100, 500, 1000, 2000] : [100, 500]) : g >= 3 ? [10000, 50000, 100000] : [10000, 50000];
      const coins = CUR[cur].coins;
      const list = [...Array.from({ length: r.int(1, g >= 3 ? 4 : 3) }, () => r.pick(bills)), ...Array.from({ length: r.int(2, g >= 3 ? 5 : 4) }, () => r.pick(coins))];
      const total = sum(list), steps = countOn(list);
      const who = r.pick(KIDS);
      const count = [
        T(`先從最大的開始排：${tallyText(list, cur).zh}。`, `Sort from biggest to smallest: ${tallyText(list, cur).en}.`),
        T(`一個一個往上加：${steps.map(m.z).join('、')}。`, `Count on: ${steps.map(m.e).join(', ')}.`),
      ];
      const it = r.pick([['一本書', 'a book'], ['一個玩具', 'a toy'], ['一盒桌遊', 'a board game'], ['送媽媽的禮物', 'a gift for Mom'], ['一件 T 恤', 'a T-shirt']]);
      const st = us ? (g >= 3 ? 1 : 25) : 500;
      const d = r.int(1, Math.max(1, Math.floor(total / 2 / st))) * st;
      const t = r.int(0, 2);
      if (t === 1) {
        const enough = r.chance(0.5), price = enough ? total - d : total + d;
        const yes = T(`可以，買完還剩 ${m.z(d)}`, `Yes, with ${m.e(d)} left over`);
        const no = T(`不行，還差 ${m.z(d)}`, `No, it is ${m.e(d)} short`);
        const exact = T('剛好夠，一點都不剩', 'Exactly enough, with nothing left');
        return {
          q: T(`${who[0]}有下面這些錢，想買${it[0]}，價錢是 ${m.z(price)}。買得起嗎？`, `${who[1]} has the money below and wants to buy ${it[1]} that costs ${m.e(price)}. Can ${who[1]} buy it?`),
          fig: pile(list, cur),
          ans: ansChoice(enough ? [yes, no, exact] : [no, yes, exact]),
          sol: [...count,
            T(`一共有 ${m.z(total)}，價錢是 ${m.z(price)}。`, `${who[1]} has ${m.e(total)}; the price is ${m.e(price)}.`),
            enough ? T(`${m.z(total)} 比 ${m.z(price)} 多，買得起：${m.z(total)} − ${m.z(price)} = ${m.z(d)}，還剩 ${m.z(d)}。`, `${m.e(total)} is more than ${m.e(price)}, so yes: ${m.e(total)} − ${m.e(price)} = ${m.e(d)} left.`)
              : T(`${m.z(total)} 比 ${m.z(price)} 少，買不起：${m.z(price)} − ${m.z(total)} = ${m.z(d)}，還差 ${m.z(d)}。`, `${m.e(total)} is less than ${m.e(price)}, so no: ${m.e(price)} − ${m.e(total)} = ${m.e(d)} short.`)],
          hint: T('先數一共有多少錢，再和價錢比大小。', 'Count all the money, then compare it with the price.'),
        };
      }
      if (t === 2) {
        const price = total + d;
        return {
          q: T(`${who[0]}想買${it[0]}，價錢是 ${m.z(price)}。${who[0]}有下面這些錢，還差多少錢？${m.typeHint.zh}`, `${who[1]} wants ${it[1]} that costs ${m.e(price)}. ${who[1]} has the money below. How much more does ${who[1]} need? ${m.typeHint.en}`),
          fig: pile(list, cur),
          ans: m.ans(d),
          sol: [...count,
            T(`一共有 ${m.z(total)}。還差：${m.z(price)} − ${m.z(total)} = ${m.z(d)}。`, `${who[1]} has ${m.e(total)}. Still needed: ${m.e(price)} − ${m.e(total)} = ${m.e(d)}.`),
            T(`驗算：${m.z(total)} + ${m.z(d)} = ${m.z(price)} ✔。`, `Check: ${m.e(total)} + ${m.e(d)} = ${m.e(price)} ✔.`)],
          hint: T('價錢減掉有的錢。', 'Subtract the money you have from the price.'),
        };
      }
      return {
        q: T(`${who[0]}的錢包裡有這些錢。一共是多少錢？${m.typeHint.zh}`, `${who[1]}'s wallet has this money. How much is it in all? ${m.typeHint.en}`),
        fig: pile(list, cur),
        ans: m.ans(total),
        sol: [...count,
          T(`一共是 ${m.z(total)}。`, `In all: ${m.e(total)}.`),
          T('先數鈔票再數硬幣，比較不會漏掉。', 'Counting the bills first and then the coins helps you not miss any.')],
        hint: T('從最大的鈔票開始往上數。', 'Start with the biggest bill and count on.'),
      };
    },
  },

  // ============================================================ 3. compare two piles
  {
    id: 'compare-money',
    grades: [1, 3],
    area: 'spend',
    name: T('誰的錢比較多？', 'Who has more money?'),
    std: { us: 'Jump$tart · Spending', tw: '國小數學 · 錢幣' },
    lesson: T('比較誰的錢多，不能只看有幾個硬幣，要先把每一堆數出「一共多少錢」再比。比多少＝多的 − 少的。',
      'To see who has more money, do not just count how many coins there are. First find how much money each pile is worth, then compare. How much more = bigger amount − smaller amount.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us', cents = us && g < 3;
      const ds = us ? (g >= 3 ? [5, 10, 25, 100] : g >= 2 ? [1, 5, 10, 25] : [1, 5, 10]) : g >= 3 ? [100, 500, 1000, 5000, 10000] : g >= 2 ? [100, 500, 1000, 5000] : [100, 500, 1000];
      const S = cents ? (c) => T(fmCents(c, 'zh'), fmCents(c, 'en')) : m.T;
      const A = (c) => (cents ? ansCents(c) : m.ans(c));
      const hintT = cents ? T('（寫幾分就好）', '(in cents)') : m.typeHint;
      const mk = () => Array.from({ length: r.int(2, g + 3) }, () => r.pick(ds));
      const [p, q] = r.sample(KIDS, 2);
      const t = r.int(0, 2);
      const same = t === 0 && r.chance(0.25);
      let a, b;
      do { a = mk(); b = same ? splitOne(r, a, cur) : mk(); }
      while (!b || (!same && sum(a) === sum(b)) || (cents && (sum(a) >= 100 || sum(b) >= 100)));
      const ta = sum(a), tb = sum(b);
      const who = T(`${p[0]}的錢是 A，${q[0]}的錢是 B。`, `${p[1]} has pile A and ${q[1]} has pile B.`);
      const counts = [
        T(`A：${tallyText(a, cur).zh}，一共 ${S(ta).zh}。`, `A: ${tallyText(a, cur).en}, ${S(ta).en} in all.`),
        T(`B：${tallyText(b, cur).zh}，一共 ${S(tb).zh}。`, `B: ${tallyText(b, cur).en}, ${S(tb).en} in all.`),
      ];
      const big = ta > tb ? p : q, small = ta > tb ? q : p, hi = Math.max(ta, tb), lo = Math.min(ta, tb);
      if (t === 0) {
        const sameT = T('一樣多', 'They have the same amount');
        const opts = same ? [sameT, T(p[0], p[1]), T(q[0], q[1])] : [T(big[0], big[1]), T(small[0], small[1]), sameT];
        return {
          q: T(`${who.zh}誰的錢比較多？`, `${who.en} Who has more money?`),
          fig: twoPiles(a, b, cur),
          ans: ansChoice(opts),
          sol: [...counts,
            same ? T(`${S(ta).zh} 和 ${S(tb).zh} 一樣，所以兩個人的錢一樣多。`, `${S(ta).en} and ${S(tb).en} are equal, so they have the same amount.`)
              : T(`${S(hi).zh} 比 ${S(lo).zh} 多，所以${big[0]}的錢比較多。`, `${S(hi).en} is more than ${S(lo).en}, so ${big[1]} has more.`),
            same ? T(`硬幣的個數不一樣，錢卻一樣多。要比「一共多少錢」，不是比有幾個硬幣。`, `The number of coins is different, but the money is the same. Compare the amounts, not how many coins.`)
              : T('比錢的多少，要比「一共多少錢」，不是比有幾個硬幣。', 'Compare how much money there is, not how many coins.')],
          hint: T('把兩堆錢分別數出來再比。', 'Count each pile, then compare.'),
        };
      }
      if (t === 1) {
        return {
          q: T(`${who.zh}${big[0]}比${small[0]}多多少錢？${hintT.zh}`, `${who.en} How much more money does ${big[1]} have than ${small[1]}? ${hintT.en}`),
          fig: twoPiles(a, b, cur),
          ans: A(hi - lo),
          sol: [...counts,
            T(`多多少＝多的 − 少的：${S(hi).zh} − ${S(lo).zh} = ${S(hi - lo).zh}。`, `How much more = bigger − smaller: ${S(hi).en} − ${S(lo).en} = ${S(hi - lo).en}.`),
            T(`驗算：${S(lo).zh} + ${S(hi - lo).zh} = ${S(hi).zh} ✔。`, `Check: ${S(lo).en} + ${S(hi - lo).en} = ${S(hi).en} ✔.`)],
          hint: T('先數兩堆，再用多的減少的。', 'Count both piles, then subtract the smaller from the bigger.'),
        };
      }
      return {
        q: T(`${who.zh}兩個人的錢合起來一共多少？${hintT.zh}`, `${who.en} How much money do they have together? ${hintT.en}`),
        fig: twoPiles(a, b, cur),
        ans: A(ta + tb),
        sol: [...counts,
          T(`合起來：${S(ta).zh} + ${S(tb).zh} = ${S(ta + tb).zh}。`, `Together: ${S(ta).en} + ${S(tb).en} = ${S(ta + tb).en}.`)],
        hint: T('先數兩堆，再加起來。', 'Count both piles, then add.'),
      };
    },
  },

  // ============================================================ 4. fewest coins
  {
    id: 'fewest-coins',
    grades: [2, 4],
    area: 'spend',
    name: T('用最少的錢幣付錢', 'Pay with the fewest coins'),
    std: { us: 'Jump$tart · Spending', tw: '國小數學 · 錢幣' },
    lesson: T('想用最少的錢幣湊出一個金額，就「先用最大的」：能用大的就用大的，剩下的再用比較小的。一個大面額可以代替好幾個小的，所以個數最少。',
      'To make an amount with the fewest coins, use the biggest one first: use the biggest piece that fits, then make the rest with smaller ones. One big piece replaces several small ones, so you need the fewest pieces.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us', bills = g >= 3;
      let c;
      if (!bills) c = us ? r.int(6, 99) : r.int(6, 99) * 100;
      else if (g === 3) c = us ? r.int(105, 999) : r.int(106, 999) * 100;
      else c = us ? r.int(1005, 3999) : r.int(1006, 2999) * 100;
      const cents = us && !bills;
      const S = cents ? (x) => T(fmCents(x, 'zh'), fmCents(x, 'en')) : m.T;
      const w = bills ? T('硬幣和鈔票', 'coins and bills') : T('硬幣', 'coins');
      const best = fewest(c, cur, bills), tl = tally(best);
      let rem = c;
      const chain = tl.map(([d, k]) => { rem -= d * k; return [d, k, rem]; });
      const chainT = T(chain.map(([d, k, x]) => `${k} ${isCoin(d, cur) ? '個' : '張'} ${m.name(d).zh}，剩 ${S(x).zh}`).join(' → '),
        chain.map(([d, k, x]) => `${k} × ${m.name(d).en}, ${S(x).en} left`).join(' → '));
      const greedy = [
        T(`從最大的開始：每次用「放得下的最大面額」。`, `Start with the biggest: each time use the biggest piece that still fits.`),
        T(`${S(c).zh}：${chainT.zh}。`, `${S(c).en}: ${chainT.en}.`),
        T(`一共用了 ${tallyText(best, cur).zh}，共 ${best.length} 個。`, `That is ${tallyText(best, cur).en}: ${best.length} pieces in all.`),
      ];
      const t = r.int(0, 2);
      if (t === 1) {
        const alt1 = splitOne(r, best, cur), alt2 = alt1 && splitOne(r, alt1, cur);
        if (alt1 && alt2) {
          return {
            q: T(`這三種方法都剛好湊出 ${S(c).zh}。哪一種用的${w.zh}最少？`, `All three ways make exactly ${S(c).en}. Which way uses the fewest ${w.en}?`),
            ans: ansChoice([tallyText(best, cur), tallyText(alt1, cur), tallyText(alt2, cur)]),
            sol: [
              T(`數數看每一種有幾個：${best.length} 個、${alt1.length} 個、${alt2.length} 個。`, `Count the pieces in each way: ${best.length}, ${alt1.length} and ${alt2.length}.`),
              greedy[1],
              T(`最少的是 ${tallyText(best, cur).zh}，共 ${best.length} 個。`, `The fewest is ${tallyText(best, cur).en}: ${best.length} pieces.`),
              T('另外兩種把大的錢換成好幾個小的，所以個數變多了。', 'The other two ways break a big piece into several small ones, so they need more pieces.'),
            ],
            hint: T('大面額用得越多，個數越少。', 'The more big pieces you use, the fewer pieces in all.'),
          };
        }
      }
      if (t === 2) {
        const [d, k] = r.pick(tl);
        const dn = m.name(d);
        const many = us ? { 1: 'pennies', 5: 'nickels', 10: 'dimes', 25: 'quarters', 100: '$1 bills', 500: '$5 bills', 1000: '$10 bills', 2000: '$20 bills' }[d] : `NT$${d / 100} ${isCoin(d, cur) ? 'coins' : 'bills'}`;
        return {
          q: T(`用最少的${w.zh}湊出剛好 ${S(c).zh}，要用幾${isCoin(d, cur) ? '個' : '張'} ${dn.zh}？`, `You make exactly ${S(c).en} with the fewest ${w.en}. How many ${many} do you use?`),
          ans: ansNum(k),
          sol: [...greedy, T(`其中 ${dn.zh} 有 ${k} 個。`, `It uses ${k} × ${dn.en}.`)],
          hint: T('從最大的面額開始用。', 'Use the biggest pieces first.'),
        };
      }
      return {
        q: T(`要湊出剛好 ${S(c).zh}，最少要用幾個${w.zh}？（每種要用幾個都可以）`, `What is the fewest number of ${w.en} that make exactly ${S(c).en}? (You may use as many of each kind as you like.)`),
        ans: ansNum(best.length),
        sol: [...greedy, T('一個大的可以代替好幾個小的，所以先用大的，個數最少。', 'One big piece replaces several small ones, so using the big ones first gives the fewest pieces.')],
        hint: T('先用最大的，再用小的補。', 'Use the biggest first, then fill in with smaller ones.'),
      };
    },
  },

  // ============================================================ 5. make change
  {
    id: 'make-change',
    grades: [2, 4],
    area: 'spend',
    name: T('找錢', 'Making change'),
    std: { us: 'Jump$tart · Spending', tw: '國小數學 · 錢幣的加減' },
    lesson: T('找錢＝付的錢 − 價錢。店員常用「往上數」的方法：從價錢開始，一直加到付的錢，加了多少就找多少。拿到找的錢，要自己數一數對不對。',
      'Change = money paid − price. Cashiers often "count up": start at the price and add coins until they reach the amount paid. What they added is the change. Always count your change to check it.'),
    gen(r, cur, g) {
      const m = mon(cur);
      let price, paid;
      if (cur === 'tw') {
        price = r.int(g <= 2 ? 5 : 12, g <= 2 ? 95 : 480) * 100;
        paid = [10000, 50000, 100000].find((b) => b > price);
      } else {
        price = g <= 2 ? r.int(5, 95) : r.int(105, 1895);
        paid = [100, 500, 1000, 2000].find((b) => b > price);
      }
      const change = paid - price, giveBack = fewest(change, cur);
      const item = r.pick([['一個鉛筆盒', 'a pencil case'], ['一本故事書', 'a storybook'], ['一盒蠟筆', 'a box of crayons'], ['一顆球', 'a ball'], ['一個便當', 'a boxed lunch']]);
      const head = T(`${item[0]}賣 ${m.zf(price)}。你付了 ${m.zf(paid)}。`, `${cap(item[1])} costs ${m.ef(price)}. You pay ${m.ef(paid)}.`);
      const sub = T(`找錢＝付的錢 − 價錢：${m.zf(paid)} − ${m.zf(price)} = ${m.zf(change)}。`, `Change = money paid − price: ${m.ef(paid)} − ${m.ef(price)} = ${m.ef(change)}.`);
      const t = r.int(0, 2);
      if (t === 1) {
        // count up
        const ds = denoms(cur).filter((d) => d < paid);
        let cu = price; const given = [], chain = [price];
        for (let i = 0; i < ds.length; i++) {
          const d = ds[i], nx = ds[i + 1];
          while (cu < paid && (nx === undefined || cu % nx !== 0) && cu + d <= paid) { cu += d; given.push(d); chain.push(cu); }
        }
        if (cu !== paid) throw new Error('count up failed');
        return {
          q: T(`${head.zh}店員用「往上數」找錢，一邊給你錢一邊數：${chain.map(m.zf).join(' → ')}。店員一共找你多少錢？${m.typeHint.zh}`,
            `${head.en} The cashier counts up, handing you money as she counts: ${chain.map(m.ef).join(' → ')}. How much change did she give you? ${m.typeHint.en}`),
          fig: pile(given, cur),
          ans: m.ans(change),
          sol: [
            T(`往上數時，店員每多數一步，就給你一個錢幣或一張鈔票。`, `Each step of counting up is one coin or bill handed to you.`),
            T(`她給你的是：${tallyText(given, cur).zh}，加起來是 ${m.zf(change)}。`, `She gave you ${tallyText(given, cur).en}, which adds up to ${m.ef(change)}.`),
            sub,
            T(`兩種算法答案一樣，都是 ${m.zf(change)} ✔。`, `Both ways give ${m.ef(change)} ✔.`),
          ],
          hint: T('把店員給你的錢加起來。', 'Add up the money the cashier hands you.'),
        };
      }
      if (t === 2) {
        // which handful is the right change
        const deltas = cur === 'tw' ? [100, 500, 1000] : [1, 5, 10, 25];
        const cand = [...new Set(deltas.flatMap((d) => [change + d, change - d]).filter((x) => x > 0 && x < paid && x !== change))];
        const [w1, w2] = r.sample(cand, 2);
        const opt = (x) => tallyText(fewest(x, cur), cur);
        return {
          q: T(`${head.zh}店員應該找你哪一組錢？`, `${head.en} Which handful of money is the right change?`),
          fig: pile([paid], cur),
          ans: ansChoice([opt(change), opt(w1), opt(w2)]),
          sol: [
            sub,
            T(`「${opt(change).zh}」加起來是 ${m.zf(change)}，剛好對 ✔。`, `"${opt(change).en}" adds up to ${m.ef(change)}, which is right ✔.`),
            T(`另外兩組是 ${m.zf(w1)} 和 ${m.zf(w2)}，不對。`, `The other two are ${m.ef(w1)} and ${m.ef(w2)}, which are wrong.`),
            T('拿到找的錢時，要自己數一數，確定沒有找錯。', 'When you get change, count it yourself to make sure it is right.'),
          ],
          hint: T('先算應該找多少，再看哪一組剛好是這麼多。', 'Work out the change first, then find the handful worth exactly that.'),
        };
      }
      return {
        q: T(`${head.zh}應該找回多少錢？${m.typeHint.zh}`, `${head.en} How much change should you get? ${m.typeHint.en}`),
        fig: pile([paid], cur),
        ans: m.ans(change),
        sol: [
          T(`找錢＝付的錢 − 價錢。`, `Change = money paid − price.`),
          T(`${m.zf(paid)} − ${m.zf(price)} = ${m.zf(change)}。`, `${m.ef(paid)} − ${m.ef(price)} = ${m.ef(change)}.`),
          T(`驗算：${m.zf(price)} + ${m.zf(change)} = ${m.zf(paid)} ✔。`, `Check: ${m.ef(price)} + ${m.ef(change)} = ${m.ef(paid)} ✔.`),
          T(`店員可以用最少的錢找給你：${tallyText(giveBack, cur).zh}。`, `The cashier can give it with the fewest pieces: ${tallyText(giveBack, cur).en}.`),
        ],
        hint: T('付的錢減掉價錢。', 'Subtract the price from what you paid.'),
      };
    },
  },

  // ============================================================ 6. needs and wants
  {
    id: 'needs-wants',
    grades: [1, 3],
    area: 'spend',
    name: T('需要還是想要？', 'Needs and wants'),
    std: { us: 'Jump$tart · Spending', tw: '金融教育 · 聰明消費' },
    lesson: T('「需要」是生活、健康和上學一定要有的東西，例如食物、水、保暖的衣服。「想要」是有了很開心、沒有也能好好生活的東西，例如玩具和糖果。錢不夠時，先買需要的，再存錢買想要的。',
      'A need is something you must have to live, stay healthy and go to school, like food, water and warm clothes. A want is something nice to have that you can live without, like toys and candy. When money is short, buy needs first, then save for wants.'),
    gen(r, cur, g) {
      const m = mon(cur);
      // [zh, en, price tier or 0, tw lo, tw hi, us lo, us hi (cents)]
      const NEEDS = [
        ['乾淨的飲用水', 'clean drinking water', 0],
        ['冬天保暖的外套', 'a warm coat for winter', 2, 800, 1200, 4000, 6000],
        ['生病時醫生開的藥', 'medicine from the doctor when you are sick', 0],
        ['健康的午餐', 'a healthy lunch', 1, 70, 100, 500, 800],
        ['一支新牙刷（舊的已經壞了）', 'a new toothbrush (your old one is worn out)', 1, 30, 60, 200, 400],
        ['一雙上學穿的鞋（舊鞋已經太小了）', 'school shoes (your old ones are too small)', 2, 600, 900, 3000, 4500],
        ['洗手用的肥皂', 'soap for washing your hands', 1, 30, 60, 200, 400],
        ['晚餐的米飯和青菜', 'rice and vegetables for dinner', 0],
        ['上課要用的鉛筆和簿子', 'pencils and notebooks for school', 1, 50, 90, 300, 600],
        ['晚上睡覺保暖的被子', 'a blanket to keep warm at night', 0],
      ];
      const WANTS = [
        ['一台新的玩具車', 'a new toy car', 2, 400, 700, 2000, 3500],
        ['一包糖果', 'a bag of candy', 1, 30, 60, 200, 400],
        ['一款新的電玩遊戲', 'a new video game', 2, 900, 1500, 4000, 6000],
        ['一包收集卡', 'a pack of trading cards', 1, 50, 90, 300, 500],
        ['第二台滑板車', 'a second scooter', 2, 800, 1500, 3000, 6000],
        ['一張亮晶晶的貼紙', 'a sheet of sparkly stickers', 1, 30, 60, 200, 400],
        ['一罐汽水', 'a can of soda', 1, 25, 40, 150, 250],
        ['又一隻絨毛娃娃（家裡已經有很多隻）', 'another stuffed animal (you already have lots)', 2, 400, 800, 2000, 3500],
        ['遊戲角色的新衣服', 'a new outfit for your character in a game', 1, 60, 90, 300, 600],
        ['一顆扭蛋', 'a toy from a capsule machine', 1, 30, 60, 100, 300],
        ['一個新鉛筆盒（舊的還很好用）', 'a new pencil case (your old one still works fine)', 1, 60, 90, 300, 600],
        ['一支冰淇淋', 'an ice cream cone', 1, 30, 50, 200, 400],
      ];
      const NEED = T('需要', 'A need'), WANT = T('想要', 'A want');
      const It = (x) => T(x[0], cap(x[1]));
      const defs = [
        T('需要：生活、健康、上學一定要有的東西。想要：有了很開心，但沒有也能好好生活的東西。', 'A need is something you must have to live, stay healthy and go to school. A want is nice to have, but you can live well without it.'),
      ];
      const t = r.int(0, 3);
      if (t === 0) {
        const isNeed = r.chance(0.5), x = r.pick(isNeed ? NEEDS : WANTS);
        return {
          q: T(`「${x[0]}」是需要，還是想要？`, `Is "${x[1]}" a need or a want?`),
          ans: ansChoice(isNeed ? [NEED, WANT] : [WANT, NEED]),
          sol: [...defs,
            isNeed ? T(`沒有「${x[0]}」，會影響健康、生活或上學，所以是需要。`, `Without ${x[1]}, your health, daily life or school would suffer, so it is a need.`)
              : T(`沒有「${x[0]}」，還是可以健康地生活和上學，所以是想要。`, `Without ${x[1]}, you can still live healthily and go to school, so it is a want.`),
            T('想要的東西不是不能買，而是先顧好需要，再用剩下或存下來的錢買。', 'Wants are fine to buy, but take care of needs first and pay for wants with money left over or saved.')],
          hint: T('問自己：沒有它，還能健康地生活嗎？', 'Ask yourself: could I live healthily without it?'),
        };
      }
      if (t === 1 || t === 2) {
        const pickNeed = t === 1, k = g >= 2 ? 3 : 2;
        const right = r.pick(pickNeed ? NEEDS : WANTS), others = r.sample(pickNeed ? WANTS : NEEDS, k);
        return {
          q: pickNeed ? T('下面哪一個是「需要」？', 'Which one is a need?') : T('下面哪一個是「想要」？', 'Which one is a want?'),
          ans: ansChoice([It(right), ...others.map(It)]),
          sol: [...defs,
            pickNeed ? T(`「${right[0]}」是生活或健康一定要有的，所以是需要。`, `${cap(right[1])} is something you must have to live or stay healthy, so it is a need.`)
              : T(`「${right[0]}」沒有也能好好生活，所以是想要。`, `You can live well without ${right[1]}, so it is a want.`),
            pickNeed ? T(`其他的（${others.map((x) => x[0]).join('、')}）都是想要。`, `The others (${others.map((x) => x[1]).join('; ')}) are wants.`)
              : T(`其他的（${others.map((x) => x[0]).join('、')}）都是需要。`, `The others (${others.map((x) => x[1]).join('; ')}) are needs.`)],
          hint: T('沒有它，會不會影響健康或上學？', 'Would going without it hurt your health or schooling?'),
        };
      }
      // only enough money for one: which first?
      const tier = r.pick([1, 2]);
      const nd = r.pick(NEEDS.filter((x) => x[2] === tier)), wt = r.pick(WANTS.filter((x) => x[2] === tier));
      const tw = m.tw, step = tw ? (tier === 1 ? 500 : 5000) : tier === 1 ? 50 : 500;
      const price = (x) => { const lo = tw ? x[3] * 100 : x[5], hi = tw ? x[4] * 100 : x[6]; return r.int(Math.ceil(lo / step), Math.floor(hi / step)) * step; };
      const pn = price(nd), pw = price(wt);
      const lo = Math.max(pn, pw), hi = pn + pw - step;
      const X = r.int(lo / step, hi / step) * step;
      return {
        q: T(`你只有 ${m.z(X)}。你需要「${nd[0]}」，要 ${m.z(pn)}；你也很想要「${wt[0]}」，要 ${m.z(pw)}。應該先買哪一個？`,
          `You have only ${m.e(X)}. You need ${nd[1]}; the price is ${m.e(pn)}. You also really want ${wt[1]}; the price is ${m.e(pw)}. Which should you buy first?`),
        ans: ansChoice([It(nd), It(wt)]),
        sol: [
          T(`兩個都買要 ${m.z(pn)} + ${m.z(pw)} = ${m.z(pn + pw)}，比 ${m.z(X)} 多，只能先買一個。`, `Both together cost ${m.e(pn)} + ${m.e(pw)} = ${m.e(pn + pw)}, more than ${m.e(X)}, so you can buy only one now.`),
          T(`「${nd[0]}」是需要，「${wt[0]}」是想要。需要的要先買。`, `${cap(nd[1])}: a need. ${cap(wt[1])}: a want. Needs come first.`),
          T(`買完後還剩 ${m.z(X)} − ${m.z(pn)} = ${m.z(X - pn)}，可以存起來，以後再買想要的。`, `After buying it you have ${m.e(X)} − ${m.e(pn)} = ${m.e(X - pn)} left, which you can save toward the want.`),
        ],
        hint: T('先顧好需要，再想想要的。', 'Take care of needs before wants.'),
      };
    },
  },

  // ============================================================ 7. shopping budget
  {
    id: 'shopping-budget',
    grades: [2, 5],
    area: 'spend',
    name: T('帶多少錢去買東西', 'Shopping on a budget'),
    std: { us: 'Jump$tart · Spending', tw: '金融教育 · 聰明消費' },
    lesson: T('預算就是「最多能花多少錢」。買東西前先把要買的價錢加起來，和預算比一比；剩下的錢＝預算 − 花掉的錢。',
      'A budget is the most money you can spend. Before you buy, add up the prices and compare the total with your budget. Money left = budget − money spent.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us';
      // [emoji, zh, measure word, en, en plural, tw lo, tw hi (NT$), us lo, us hi (cents)]
      const SHOP = [
        ['✏️', '鉛筆', '枝', 'pencil', 'pencils', 10, 20, 50, 150],
        ['📒', '筆記本', '本', 'notebook', 'notebooks', 25, 45, 150, 400],
        ['🧃', '果汁', '盒', 'juice box', 'juice boxes', 20, 35, 100, 250],
        ['🍎', '蘋果', '顆', 'apple', 'apples', 15, 35, 50, 150],
        ['🍪', '餅乾', '包', 'pack of cookies', 'packs of cookies', 15, 30, 100, 300],
        ['🥪', '三明治', '個', 'sandwich', 'sandwiches', 40, 65, 350, 650],
        ['🍦', '冰淇淋', '支', 'ice cream bar', 'ice cream bars', 25, 45, 150, 350],
        ['🖍️', '蠟筆', '盒', 'box of crayons', 'boxes of crayons', 40, 80, 200, 500],
        ['⚽', '足球', '顆', 'soccer ball', 'soccer balls', 250, 450, 1000, 2000],
        ['📖', '故事書', '本', 'storybook', 'storybooks', 150, 300, 600, 1200],
        ['🚗', '玩具車', '台', 'toy car', 'toy cars', 100, 250, 500, 1000],
        ['🪁', '風箏', '個', 'kite', 'kites', 120, 250, 800, 1500],
      ];
      const stp = us ? (g <= 3 ? 25 : 5) : g <= 3 ? 500 : 100;
      const price = (x) => { const lo = us ? x[7] : x[5] * 100, hi = us ? x[8] : x[6] * 100; return r.int(Math.ceil(lo / stp), Math.floor(hi / stp)) * stp; };
      const items = r.sample(SHOP, 4).map((x) => ({ em: x[0], z: x[1], mw: x[2], e: x[3], es: x[4], p: price(x) }));
      const fig = tbl(['', '💰'], items.map((it) => [it.em, m.e(it.p)]));
      const intro = T(`價目表：${items.map((it) => `${it.em} ${it.z}`).join('、')}。`, `Price list: ${items.map((it) => `${it.em} ${it.e}`).join(', ')}.`);
      const who = r.pick(KIDS);
      const budgets = us ? [500, 1000, 2000, 5000, 10000, 20000] : [10000, 20000, 50000, 100000, 200000, 300000];
      const t = r.int(0, 2);
      if (t === 1) {
        const pairs = [];
        for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) pairs.push([items[i], items[j]]);
        const opts = r.sample(pairs, 3).map(([a, b]) => ({ a, b, s: a.p + b.p })).sort((x, y) => x.s - y.s);
        if (opts[0].s < opts[1].s) {
          const s1 = opts[0].s, s2 = opts[1].s, nice = us ? cdiv(s1, 100) * 100 : cdiv(s1, 1000) * 1000;
          const X = nice < s2 ? nice : s1;
          const PT = (o) => T(`${o.a.em} ${o.a.z}和 ${o.b.em} ${o.b.z}`, `${o.a.em} ${o.a.e} and ${o.b.em} ${o.b.e}`);
          return {
            q: T(`${intro.zh}${who[0]}有 ${m.z(X)}，想買兩樣不一樣的東西。下面哪兩樣買得起？`, `${intro.en} ${who[1]} has ${m.e(X)} and wants two different things. Which two can ${who[1]} afford?`),
            fig,
            ans: ansChoice(opts.map(PT).map((x) => T(x.zh, cap(x.en)))),
            sol: [
              ...opts.map((o, i) => T(`${PT(o).zh}：${m.z(o.a.p)} + ${m.z(o.b.p)} = ${m.z(o.s)}${i === 0 ? `，不超過 ${m.z(X)} ✔` : `，比 ${m.z(X)} 多 ✘`}。`,
                `${cap(PT(o).en)}: ${m.e(o.a.p)} + ${m.e(o.b.p)} = ${m.e(o.s)}${i === 0 ? `, not more than ${m.e(X)} ✔` : `, more than ${m.e(X)} ✘`}.`)),
              T(`所以買得起的是 ${PT(opts[0]).zh}，還剩 ${m.z(X - opts[0].s)}。`, `So ${who[1]} can afford ${PT(opts[0]).en}, with ${m.e(X - opts[0].s)} left.`),
            ],
            hint: T('把每一組的價錢加起來，和帶的錢比。', 'Add each pair of prices and compare with the money.'),
          };
        }
      }
      if (t === 2 && g >= 3) {
        const it = r.pick(items), p = it.p, maxN = g <= 3 ? 6 : 12;
        let B = budgets.find((b) => b >= 2 * p && b <= maxN * p && b % p !== 0) ?? budgets.find((b) => b >= 2 * p && b <= maxN * p);
        if (!B) B = p * r.int(2, maxN) + r.int(0, p / stp - 1) * stp;
        const n = Math.floor(B / p), left = B - n * p;
        return {
          q: T(`${intro.zh}${who[0]}有 ${m.z(B)}，全部只買${it.em} ${it.z}，最多可以買幾${it.mw}？`, `${intro.en} ${who[1]} has ${m.e(B)} and buys only ${it.em} ${it.es}. What is the greatest number ${who[1]} can buy?`),
          fig,
          ans: ansNum(n),
          sol: [
            T(`一${it.mw}${it.z} ${m.z(p)}。買 ${n} ${it.mw}：${n} × ${m.z(p)} = ${m.z(n * p)}，不超過 ${m.z(B)} ✔。`, `One ${it.e} costs ${m.e(p)}. ${n} of them: ${n} × ${m.e(p)} = ${m.e(n * p)}, not more than ${m.e(B)} ✔.`),
            T(`再多買 1 ${it.mw}：${n + 1} × ${m.z(p)} = ${m.z((n + 1) * p)}，比 ${m.z(B)} 多，買不起 ✘。`, `One more: ${n + 1} × ${m.e(p)} = ${m.e((n + 1) * p)}, more than ${m.e(B)}, so that is too many ✘.`),
            T(`所以最多買 ${n} ${it.mw}，${left ? `還剩 ${m.z(B)} − ${m.z(n * p)} = ${m.z(left)}` : '錢剛好用完'}。`, `So the most is ${n}, ${left ? `with ${m.e(B)} − ${m.e(n * p)} = ${m.e(left)} left` : 'with nothing left'}.`),
          ],
          hint: T('試試看買幾個會超過預算。', 'Find how many you can buy before you go over.'),
        };
      }
      const k = g >= 4 ? r.int(2, 3) : 2;
      const buy = r.sample(items, k).map((it, i) => ({ ...it, n: g >= 4 && i === 0 ? r.int(2, 4) : 1 }));
      const cost = sum(buy.map((b) => b.n * b.p));
      const B = budgets.find((b) => b > cost) ?? cdiv(cost + 1, us ? 1000 : 10000) * (us ? 1000 : 10000);
      const buyZ = buy.map((b) => `${b.n === 1 ? '一' : ` ${b.n} `}${b.mw} ${b.em} ${b.z}`).join('、');
      const buyE = buy.map((b) => (b.n === 1 ? `${an(b.e)} ${b.em}` : `${b.n} ${b.es} ${b.em}`)).join(', ').replace(/, ([^,]*)$/, ' and $1');
      const partsZ = buy.map((b) => (b.n > 1 ? `${b.n} × ${m.z(b.p)}` : m.z(b.p))).join(' + '), partsE = buy.map((b) => (b.n > 1 ? `${b.n} × ${m.e(b.p)}` : m.e(b.p))).join(' + ');
      return {
        q: T(`${intro.zh}${who[0]}帶了 ${m.z(B)}，買了${buyZ}。還剩多少錢？${m.typeHint.zh}`, `${intro.en} ${who[1]} has ${m.e(B)} and buys ${buyE}. How much money is left? ${m.typeHint.en}`),
        fig,
        ans: m.ans(B - cost),
        sol: [
          T(`先算一共花多少：${partsZ} = ${m.z(cost)}。`, `First add up the cost: ${partsE} = ${m.e(cost)}.`),
          T(`剩下的錢＝帶的錢 − 花的錢：${m.z(B)} − ${m.z(cost)} = ${m.z(B - cost)}。`, `Money left = money you had − money spent: ${m.e(B)} − ${m.e(cost)} = ${m.e(B - cost)}.`),
          T(`驗算：${m.z(cost)} + ${m.z(B - cost)} = ${m.z(B)} ✔。`, `Check: ${m.e(cost)} + ${m.e(B - cost)} = ${m.e(B)} ✔.`),
          T('買東西前先算總價，就不會超出預算。', 'Adding up the total before you pay keeps you within your budget.'),
        ],
        hint: T('先算總共花多少，再從帶的錢減掉。', 'Add up the spending, then subtract it from the money you had.'),
      };
    },
  },

  // ============================================================ 8. saving goal
  {
    id: 'saving-goal',
    grades: [2, 6],
    area: 'save',
    name: T('存錢達成目標', 'Saving for a goal'),
    std: { us: 'Jump$tart · Saving', tw: '金融教育 · 儲蓄' },
    lesson: T('想買比較貴的東西，可以訂一個存錢目標，每週存一樣多的錢。要存幾週＝目標 ÷ 每週存的錢；如果除不盡，就要「無條件進位」，因為差一點點也還買不起，必須再存一週。',
      'To buy something that costs a lot, set a saving goal and save the same amount every week. Weeks needed = goal ÷ amount saved each week. If it does not divide evenly, round UP: even a little short means you cannot buy it yet, so you need one more week.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us';
      const GOALS = [['一台腳踏車', 'a bike', 2000, 4000, 100, 200], ['一盒桌遊', 'a board game', 500, 1200, 20, 45], ['送媽媽的生日禮物', 'a birthday gift for Mom', 300, 800, 15, 40],
        ['一副耳機', 'a pair of headphones', 600, 1500, 25, 60], ['一套漫畫書', 'a set of comic books', 400, 1000, 20, 50], ['一顆籃球', 'a basketball', 300, 700, 15, 35]];
      const who = r.pick(KIDS);
      const goalOf = (x) => (us ? r.int(x[4], x[5]) * 100 + (g >= 5 && r.chance(0.4) ? 50 : 0) : r.int(x[2] / 10, x[3] / 10) * 1000);
      const weekly = () => (us ? r.pick(g >= 5 ? [200, 250, 300, 350, 400, 500, 600, 750, 800, 1000, 1200, 1500] : [200, 300, 400, 500, 600, 800, 1000, 1200, 1500]) : r.pick([30, 40, 50, 60, 80, 100, 120, 150, 200]) * 100);
      const maxW = g >= 4 ? 40 : 20;
      const t = r.int(0, 2);
      if (t === 2) {
        let x, n, G, goal;
        do {
          goal = r.pick(GOALS); n = r.int(4, g >= 4 ? 20 : 10);
          x = us ? r.int(2, 20) * 100 + (g >= 5 && r.chance(0.3) ? 50 : 0) : r.int(2, 30) * 1000;
          G = n * x;
        } while (us ? G > goal[5] * 100 * 1.5 || G < goal[4] * 50 : G > goal[3] * 150 || G < goal[2] * 50);
        return {
          q: T(`${who[0]}想在 ${n} 週後買${goal[0]}，要 ${m.z(G)}。每週要存一樣多的錢，每週要存多少？${m.typeHint.zh}`, `${who[1]} wants to buy ${goal[1]} for ${m.e(G)} in ${n} weeks, saving the same amount each week. How much must ${who[1]} save each week? ${m.typeHint.en}`),
          ans: m.ans(x),
          sol: [
            T(`把目標平均分到 ${n} 週：每週存的錢＝目標 ÷ 週數。`, `Split the goal evenly over ${n} weeks: weekly saving = goal ÷ number of weeks.`),
            T(`${m.z(G)} ÷ ${n} = ${m.z(x)}。`, `${m.e(G)} ÷ ${n} = ${m.e(x)}.`),
            T(`驗算：${n} × ${m.z(x)} = ${m.z(G)} ✔。`, `Check: ${n} × ${m.e(x)} = ${m.e(G)} ✔.`),
            T('先訂好「每週存多少」，就比較容易做到。', 'A fixed weekly amount makes a goal easier to reach.'),
          ],
          hint: T('目標 ÷ 週數。', 'Goal ÷ number of weeks.'),
        };
      }
      let goal, G, a, S = 0, A = 0, s = 0, need, w;
      do {
        goal = r.pick(GOALS); G = goalOf(goal);
        if (t === 1 && g >= 3) {
          A = us ? r.int(5, 15) * 100 : r.int(10, 30) * 1000;
          s = us ? r.int(1, A / 100 - 2) * 100 : r.int(2, A / 1000 - 3) * 1000;
          a = A - s;
        } else a = weekly();
        S = t === 0 && g >= 4 && r.chance(0.5) ? (us ? r.int(1, Math.floor(G / 200)) * 100 : r.int(1, Math.floor(G / 2000)) * 1000) : 0;
        need = G - S; w = cdiv(need, a);
      } while (w < 2 || w > maxW || need <= a);
      const q0 = Math.floor(need / a), rem = need - q0 * a;
      const lead = A ? T(`${who[0]}每週有 ${m.z(A)} 零用錢，每週花 ${m.z(s)}，剩下的都存起來。`, `${who[1]} gets ${m.e(A)} allowance each week, spends ${m.e(s)}, and saves the rest.`)
        : T(`${who[0]}每週存 ${m.z(a)}${S ? `，現在已經存了 ${m.z(S)}` : ''}。`, `${who[1]} saves ${m.e(a)} each week${S ? ` and already has ${m.e(S)} saved` : ''}.`);
      const sol = [];
      if (A) sol.push(T(`每週存的錢：${m.z(A)} − ${m.z(s)} = ${m.z(a)}。`, `Saved each week: ${m.e(A)} − ${m.e(s)} = ${m.e(a)}.`));
      if (S) sol.push(T(`還要存：${m.z(G)} − ${m.z(S)} = ${m.z(need)}。`, `Still to save: ${m.e(G)} − ${m.e(S)} = ${m.e(need)}.`));
      sol.push(T(`存 ${q0} 週：${q0} × ${m.z(a)} = ${m.z(q0 * a)}${rem ? `，還差 ${m.z(rem)}` : '，剛好存到'}。`, `After ${q0} weeks: ${q0} × ${m.e(a)} = ${m.e(q0 * a)}${rem ? `, still ${m.e(rem)} short` : ', exactly enough'}.`));
      if (rem) {
        sol.push(T(`所以還要再存 1 週：${q0 + 1} × ${m.z(a)} = ${m.z((q0 + 1) * a)}，夠了 ✔。`, `So one more week is needed: ${q0 + 1} × ${m.e(a)} = ${m.e((q0 + 1) * a)}, enough ✔.`));
        sol.push(T(`週數要「無條件進位」：就算只差 ${m.z(rem)}，也還買不起，所以答案是 ${w} 週，不是 ${q0} 週。`, `Round the weeks UP: even ${m.e(rem)} short means you cannot buy it yet, so the answer is ${w} weeks, not ${q0}.`));
      } else sol.push(T(`剛好 ${w} 週就存到了，不用多存。`, `Exactly ${w} weeks; no extra week is needed.`), T(`也可以用除法：${m.z(need)} ÷ ${m.z(a)} = ${w}。如果除不盡，就要無條件進位。`, `Or divide: ${m.e(need)} ÷ ${m.e(a)} = ${w}. If it does not divide evenly, round up.`));
      return {
        q: T(`${lead.zh}${who[0]}想買${goal[0]}，要 ${m.z(G)}。至少要存幾週？`, `${lead.en} ${who[1]} wants ${goal[1]} that costs ${m.e(G)}. How many weeks must ${who[1]} save, at least?`),
        ans: ansNum(w),
        sol,
        hint: T('如果最後差一點點，還要再存一週。', 'If you are a little short at the end, you need one more week.'),
      };
    },
  },

  // ============================================================ 9. earning income
  {
    id: 'earning-income',
    grades: [1, 4],
    area: 'earn',
    name: T('工作賺錢', 'Earning income'),
    std: { us: 'Jump$tart · Earning Income', tw: '金融教育 · 收入與工作' },
    lesson: T('收入是靠工作或賣東西賺到的錢。大人上班領薪水，小朋友也可以幫忙做事賺一點錢。賺的錢＝每次賺多少 × 做了幾次。買東西、借錢和存錢都不是賺錢。',
      'Income is money you get for working or selling things. Grown-ups earn a paycheck at their jobs; kids can earn a little by doing jobs for others. Money earned = pay each time × number of times. Buying, borrowing and saving are not earning.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us';
      const who = r.pick(KIDS);
      const CHORES = [['洗一次車', '洗車', 'washes a car', 'car washes'], ['遛一次狗', '遛狗', 'walks a dog', 'dog walks'], ['幫鄰居澆一次花', '澆花', 'waters a neighbor\'s plants', 'watering jobs'],
        ['掃一次落葉', '掃落葉', 'rakes leaves', 'leaf-raking jobs'], ['幫忙照顧一次寵物', '照顧寵物', 'feeds a neighbor\'s pet', 'pet-feeding jobs']];
      const payOf = () => (us ? (g <= 2 ? r.int(1, 5) * 100 : r.int(2, 10) * 100 + (g >= 4 && r.chance(0.4) ? 50 : 0)) : (g <= 2 ? r.pick([10, 20, 30, 50]) : r.pick([30, 40, 50, 60, 80, 100, 120, 150])) * 100);
      const t = r.int(0, g >= 3 ? 3 : 2);
      if (t === 0) {
        const EARN = [['麵包師傅把烤好的麵包賣給客人', 'A baker sells the bread she bakes'], ['護理師在醫院上班，每個月領薪水', 'A nurse works at a hospital and gets a paycheck'],
          [`${who[0]}幫鄰居遛狗，鄰居付錢給${who[0]}`, `${who[1]} walks a neighbor's dog and the neighbor pays ${who[1]}`], ['公車司機開公車，領薪水', 'A bus driver drives a bus and gets paid for it'],
          [`${who[0]}在園遊會賣自己做的手環`, `${who[1]} sells bracelets ${who[1]} made at a school fair`], ['農夫把自己種的菜拿到市場賣', 'A farmer sells the vegetables he grew at the market']];
        const NOT = [['去商店買一個玩具', 'Buying a toy at a store'], ['向朋友借錢', 'Borrowing money from a friend'], ['把零用錢放進存錢筒', 'Putting your allowance in a piggy bank'],
          ['花錢買一杯飲料', 'Paying for a drink'], ['付錢搭公車', 'Paying the bus fare'], ['把錢借給弟弟', 'Lending money to your little brother']];
        const right = r.pick(EARN), wrong = r.sample(NOT, 3);
        return {
          q: T('下面哪一個是「靠工作賺到收入」？', 'Which one is earning income (getting paid for work)?'),
          ans: ansChoice([T(...right), ...wrong.map((x) => T(...x))]),
          sol: [
            T('賺收入＝做工作、提供服務或賣東西，別人付錢給你。', 'Earning income = doing work, giving a service or selling something, and being paid for it.'),
            T(`「${right[0]}」是用工作換來錢，所以是賺收入。`, `"${right[1]}" is getting money for work, so it is earning income.`),
            T('買東西和付錢是花錢；借來的錢要還；存錢是把自己的錢留下來——這些都不是賺錢。', 'Buying and paying are spending; borrowed money must be paid back; saving keeps money you already have. None of these is earning.'),
          ],
          hint: T('誰做了工作，然後拿到錢？', 'Who did some work and got paid?'),
        };
      }
      const ch = r.pick(CHORES);
      if (t === 1) {
        const hourly = g >= 3 && r.chance(0.4);
        const x = hourly ? (us ? r.int(12, 16) * 100 : r.pick([190, 200, 210, 220]) * 100) : payOf();
        const n = r.int(2, g <= 2 ? 5 : 9);
        const q = hourly
          ? T(`${who[0]}的大姊打工，假設時薪是 ${m.z(x)}（每工作 1 小時賺 ${m.z(x)}）。這週她工作了 ${n} 小時，一共賺多少？${m.typeHint.zh}`, `${who[1]}'s big sister has a part-time job that pays ${m.e(x)} per hour. This week she works ${n} hours. How much does she earn? ${m.typeHint.en}`)
          : T(`${who[0]}每${ch[0]}，可以賺 ${m.z(x)}。這個月${who[0]}${ch[1]} ${n} 次，一共賺多少？${m.typeHint.zh}`, `${who[1]} earns ${m.e(x)} each time ${who[1]} ${ch[2]}. This month ${who[1]} does it ${n} times. How much does ${who[1]} earn? ${m.typeHint.en}`);
        return {
          q,
          ans: m.ans(n * x),
          sol: [
            hourly ? T('賺的錢＝時薪 × 工作幾小時。', 'Money earned = hourly pay × hours worked.') : T('賺的錢＝每次賺的錢 × 做了幾次。', 'Money earned = pay each time × number of times.'),
            T(`${n} × ${m.z(x)} = ${m.z(n * x)}。`, `${n} × ${m.e(x)} = ${m.e(n * x)}.`),
            T(`也可以一次一次加：${Array.from({ length: n }, () => m.z(x)).join(' + ')} = ${m.z(n * x)}。`, `Or add it up: ${Array.from({ length: n }, () => m.e(x)).join(' + ')} = ${m.e(n * x)}.`),
            T('做得越多、每次賺得越多，收入就越多。', 'More work, or higher pay each time, means more income.'),
          ],
          hint: T('每次賺的 × 次數。', 'Pay each time × number of times.'),
        };
      }
      if (t === 2) {
        let x, Y, n;
        do { x = payOf(); n = r.int(2, g <= 2 ? 6 : 12); Y = n * x - (r.chance(0.6) ? r.int(1, Math.max(1, x / (us ? 50 : 1000) - 1)) * (us ? 50 : 1000) : 0); } while (Y <= x || Y % (us ? 1 : 100));
        const k = cdiv(Y, x), q0 = Math.floor(Y / x), rem = Y - q0 * x;
        const sol = [
          T(`${who[0]}每次賺 ${m.z(x)}，看看做幾次才夠 ${m.z(Y)}。`, `${who[1]} earns ${m.e(x)} each time. How many times to reach ${m.e(Y)}?`),
          T(`${q0} 次：${q0} × ${m.z(x)} = ${m.z(q0 * x)}${rem ? `，還差 ${m.z(rem)}` : '，剛好'}。`, `${pl(q0, 'time', 'times')}: ${q0} × ${m.e(x)} = ${m.e(q0 * x)}${rem ? `, still ${m.e(rem)} short` : ', exactly enough'}.`),
        ];
        if (rem) sol.push(T(`再做 1 次：${k} × ${m.z(x)} = ${m.z(k * x)}，夠了 ✔。所以要做 ${k} 次（要無條件進位）。`, `One more time: ${k} × ${m.e(x)} = ${m.e(k * x)}, enough ✔. So ${k} times (round up).`));
        else sol.push(T(`所以剛好要做 ${k} 次。`, `So exactly ${k} times.`));
        return {
          q: T(`${who[0]}每${ch[0]}賺 ${m.z(x)}，想賺到 ${m.z(Y)} 買一份禮物。至少要做幾次？`, `${who[1]} earns ${m.e(x)} each time ${who[1]} ${ch[2]} and wants to earn ${m.e(Y)} for a present. At least how many times must ${who[1]} do it?`),
          ans: ansNum(k),
          sol,
          hint: T('差一點點也要再做一次。', 'If you are a little short, you need one more time.'),
        };
      }
      // who earns more
      const [p, q] = r.sample(KIDS, 2), [c1, c2] = r.sample(CHORES, 2);
      let x1, x2, n1, n2;
      do { x1 = payOf(); x2 = payOf(); n1 = r.int(2, 8); n2 = r.int(2, 8); } while (x1 * n1 === x2 * n2 || x1 === x2);
      const e1 = x1 * n1, e2 = x2 * n2, win = e1 > e2 ? p : q, lose = e1 > e2 ? q : p;
      return {
        q: T(`${p[0]}每${c1[0]}賺 ${m.z(x1)}，做了 ${n1} 次；${q[0]}每${c2[0]}賺 ${m.z(x2)}，做了 ${n2} 次。誰賺得比較多？`,
          `${p[1]} earns ${m.e(x1)} each time ${p[1]} ${c1[2]} and does it ${n1} times. ${q[1]} earns ${m.e(x2)} each time ${q[1]} ${c2[2]} and does it ${n2} times. Who earns more?`),
        ans: ansChoice([T(win[0], win[1]), T(lose[0], lose[1]), T('兩個人一樣多', 'They earn the same')]),
        sol: [
          T(`${p[0]}：${n1} × ${m.z(x1)} = ${m.z(e1)}。`, `${p[1]}: ${n1} × ${m.e(x1)} = ${m.e(e1)}.`),
          T(`${q[0]}：${n2} × ${m.z(x2)} = ${m.z(e2)}。`, `${q[1]}: ${n2} × ${m.e(x2)} = ${m.e(e2)}.`),
          T(`${win[0]}比較多，多了 ${m.z(Math.abs(e1 - e2))}。`, `${win[1]} earns more, by ${m.e(Math.abs(e1 - e2))}.`),
          T('每次賺得多不一定總收入多，還要看做了幾次。', 'Higher pay each time does not always mean more in total; the number of times matters too.'),
        ],
        hint: T('分別算出兩個人一共賺多少。', 'Work out each total, then compare.'),
      };
    },
  },

  // ============================================================ 10. stay safe online
  {
    id: 'stay-safe',
    grades: [3, 6],
    area: 'risk',
    name: T('小心詐騙，保護自己', 'Stay safe from scams'),
    std: { us: 'Jump$tart · Managing Risk', tw: '金融教育 · 防詐騙' },
    lesson: T('詐騙常常會：叫你先付錢、要你的密碼或驗證碼、催你「趕快」、說「不要告訴大人」。遇到這些情形，先停下來，不要付錢、不要給資料，馬上告訴爸媽或老師。',
      'Scams often ask you to pay first, ask for your password or a code, rush you to act fast, or say "don\'t tell your parents." When that happens, stop: do not pay, do not share anything, and tell a parent or teacher right away.'),
    gen(r, cur, g) {
      const m = mon(cur), tw = m.tw, who = r.pick(KIDS), N = who[0], E = who[1];
      const fee = tw ? r.int(3, 20) * 10000 : r.int(2, 10) * 1000;
      const amt = tw ? r.int(5, 30) * 10000 : r.int(2, 10) * 1000;
      const card = tw ? T('遊戲點數卡', 'game gift cards') : T('禮物卡（gift card）', 'gift cards');
      const S = [
        () => ({
          q: T(`${N}收到一則訊息：「恭喜你抽中一支新手機！只要先付 ${m.z(fee)} 運費，馬上寄給你。」${N}應該怎麼做？`, `${E} gets a message: "Congratulations, you won a new phone! Just pay ${m.e(fee)} for shipping and we will send it." What should ${E} do?`),
          right: T('不付錢、不回覆，告訴爸媽或老師', 'Do not pay or reply, and tell a parent or teacher'),
          wrong: [T('趕快付運費，免得獎品被別人拿走', 'Pay the fee quickly before someone else gets the prize'), T('先付一半的運費試試看', 'Pay half the fee to test if it is real'), T('把家裡地址傳給對方，請他們先寄', 'Send your home address so they can ship it first')],
          why: T('真的中獎不會要你先付錢。「先付費才能領獎」是很常見的詐騙。', 'A real prize never makes you pay first. "Pay a fee to get your prize" is a very common scam.'),
        }),
        () => ({
          q: T(`在線上遊戲裡，一個不認識的玩家說：「把你的帳號密碼給我，我免費幫你加 1000 顆鑽石。」${N}應該怎麼做？`, `In an online game, a player ${E} does not know says: "Give me your password and I will add 1,000 free gems to your account." What should ${E} do?`),
          right: T('絕對不給密碼，封鎖並檢舉這個玩家', 'Never give the password; block and report the player'),
          wrong: [T('給密碼，只給這一次沒關係', 'Give the password just this once'), T('先給密碼，明天再改掉', 'Give the password and change it tomorrow'), T('請他先送鑽石，再給密碼', 'Ask for the gems first, then give the password')],
          why: T('有了密碼，別人就能把你的帳號和寶物全部拿走。免費送東西換密碼，一定是騙局。', 'With your password, someone can take your whole account and everything in it. "Free stuff for your password" is always a trick.'),
        }),
        () => ({
          q: T(`${N}的好朋友的帳號傳來訊息：「我急需 ${m.z(amt)}，可以先借我嗎？明天還你，不要打電話給我。」${N}應該怎麼做？`, `${E}'s best friend's account sends a message: "I need ${m.e(amt)} right now, can you lend it to me? I'll pay you back tomorrow. Don't call me." What should ${E} do?`),
          right: T('先打電話或當面問朋友，確認真的是他本人', 'First call the friend or ask in person to check it is really them'),
          wrong: [T('馬上轉錢，因為是好朋友的帳號', 'Send the money right away because it is the friend\'s account'), T('先轉一半的錢', 'Send half the money first'), T('照他說的，不打電話，直接轉錢', 'Do as asked: don\'t call, just send it')],
          why: T('帳號可能被盜用，傳訊息的人不一定是朋友本人。「不要打電話」更是可疑的地方。', 'Accounts can be stolen, so the sender may not be your friend. "Don\'t call me" is a big warning sign.'),
        }),
        () => ({
          q: T(`${N}的同學的帳號傳來訊息：「幫我買 ${m.z(amt)} 的${card.zh}，把卡片背面的號碼拍照傳給我，我之後還你。」${N}應該怎麼做？`, `A classmate's account messages ${E}: "Buy ${m.e(amt)} of ${card.en} for me and send me a photo of the codes on the back. I'll pay you back later." What should ${E} do?`),
          right: T('不要買，先打電話或當面問同學，並告訴大人', 'Do not buy them; check with the classmate by phone or in person, and tell a grown-up'),
          wrong: [T('買了再傳號碼，同學會還錢', 'Buy them and send the codes; the classmate will pay back'), T('只傳號碼，不傳照片就安全', 'Send only the numbers, not a photo, to be safe'), T('先買一張試試看', 'Buy just one card to test it')],
          why: T('卡片上的號碼就像現金，傳出去就被用掉，拿不回來。要你買點數卡傳號碼，是常見的詐騙手法。', 'The codes on the cards work like cash: once sent, they are spent and cannot be taken back. Asking you to buy cards and send codes is a common scam.'),
        }),
        () => ({
          q: T(`${N}在玩手機遊戲，畫面跳出：「限時特價！${m.z(amt)} 買 500 枚金幣」。手機裡存有爸媽的信用卡。${N}應該怎麼做？`, `${E} is playing a phone game and a pop-up says: "Today only! 500 coins for ${m.e(amt)}." A parent's credit card is saved on the phone. What should ${E} do?`),
          right: T('先問爸媽，得到同意才可以買', 'Ask a parent first and buy only if they say yes'),
          wrong: [T('趕快按購買，特價快結束了', 'Tap buy fast before the sale ends'), T('買吧，遊戲裡的金幣不是真的錢', 'Buy it; game coins are not real money'), T('先買，下個月再跟爸媽說', 'Buy it now and tell a parent next month')],
          why: T(`遊戲裡的金幣要用真的錢買，按下去就會從爸媽的信用卡扣 ${m.z(amt)}。`, `Game coins cost real money: one tap charges ${m.e(amt)} to the parent's credit card.`),
        }),
        () => ({
          q: T(`有人打電話到${N}家，說：「你們上次網購設定錯了，會被重複扣款，現在要去 ATM 操作才能取消。」接電話的${N}應該怎麼做？`, `Someone calls ${E}'s home: "Your last online order was set up wrong and you will be charged again. You must go to an ATM now to cancel it." ${E} answered the phone. What should ${E} do?`),
          right: T('掛掉電話，告訴爸媽：ATM 不能取消付款', 'Hang up and tell a parent: an ATM cannot cancel a payment'),
          wrong: [T('趕快跟爸媽去 ATM 照著做', 'Hurry to an ATM with a parent and follow the steps'), T('把爸媽的帳號告訴對方，請他幫忙取消', 'Give the caller your parent\'s account number so they can cancel it'), T('照對方說的，不要讓爸媽知道', 'Do what the caller says and keep it from your parents')],
          why: T('ATM 只能存錢、領錢、轉帳，不能「取消扣款」。叫你去 ATM 操作的，一定是詐騙。', 'An ATM can only deposit, withdraw and transfer money; it cannot "cancel a charge." Anyone telling you to go to an ATM to fix something is a scammer.'),
        }),
        () => ({
          q: T(`${N}收到一封很像學校寄來的信：「你的帳號快被停用了！請點下面的連結，輸入帳號和密碼。」${N}應該怎麼做？`, `${E} gets an email that looks like it is from school: "Your account will be closed! Click the link below and type your username and password." What should ${E} do?`),
          right: T('不要點連結，請爸媽或老師幫忙確認', 'Do not click; ask a parent or teacher to check it'),
          wrong: [T('趕快點連結，免得帳號被停用', 'Click quickly so the account is not closed'), T('只輸入密碼，不輸入帳號', 'Type only the password, not the username'), T('轉寄給同學，叫大家一起登入', 'Forward it to classmates so they log in too')],
          why: T('假冒學校或銀行的信，連結會帶你到假網站偷密碼。真的通知可以問老師，或自己打開正式網站確認。', 'Fake school or bank emails link to fake websites that steal passwords. Check real notices with a teacher or by going to the real website yourself.'),
        }),
        () => ({
          q: T(`網路影片說：「今天投入 ${m.z(amt)}，明天保證變成 ${m.z(amt * 10)}！」${N}應該怎麼想？`, `An online video says: "Put in ${m.e(amt)} today and we guarantee you get ${m.e(amt * 10)} tomorrow!" What should ${E} think?`),
          right: T('這是詐騙，沒有人能保證錢一天變 10 倍', 'It is a scam; no one can promise to turn money into 10 times as much in a day'),
          wrong: [T('先投一點點試試看', 'Put in a little to try it'), T('找朋友一起投，可以賺更多', 'Get friends to join so everyone earns more'), T('用爸媽的卡多投一點', 'Use a parent\'s card to put in more')],
          why: T('「保證賺大錢」「很快翻倍」都是詐騙的說法。真正的投資有風險，不可能保證。', '"Guaranteed big money" and "double it fast" are scam words. Real investing has risk and no one can guarantee it.'),
        }),
        () => ({
          q: T(`一個在遊戲裡認識的網友問${N}住在哪裡、讀哪一所學校，還說：「這是我們的秘密，不要告訴爸媽。」${N}應該怎麼做？`, `Someone ${E} met in a game asks where ${E} lives and which school ${E} goes to, and says: "This is our secret. Don't tell your parents." What should ${E} do?`),
          right: T('不要說，並且告訴爸媽或老師', 'Do not tell them, and tell a parent or teacher'),
          wrong: [T('只告訴他學校的名字', 'Tell only the name of the school'), T('已經聊很久了，告訴他沒關係', 'You have chatted a lot, so it is fine to tell'), T('照他說的，保守秘密', 'Keep it a secret as asked')],
          why: T('住址、學校、電話都是個人資料，不能告訴網路上的陌生人。叫你「不要告訴大人」的人，更要小心。', 'Your address, school and phone number are personal information; never give them to strangers online. Be extra careful with anyone who says "don\'t tell your parents."'),
        }),
        () => ({
          q: T(`同學跟${N}說：「把你的遊戲密碼給我，我幫你練等級。」${N}應該怎麼做？`, `A classmate tells ${E}: "Give me your game password and I'll level up your character for you." What should ${E} do?`),
          right: T('不給，密碼連好朋友都不能說', 'Say no; keep passwords secret even from good friends'),
          wrong: [T('好朋友就可以給', 'It is fine to give it to a good friend'), T('給他，練完再改密碼', 'Give it and change it after'), T('把密碼寫在紙上給他', 'Write it on paper for them')],
          why: T('密碼只有自己和爸媽可以知道。給了別人，帳號就不再只屬於你。', 'Only you and your parents should know your passwords. Once someone else has it, your account is no longer just yours.'),
        }),
        () => ({
          q: T(`有人打電話來說是銀行：「你爸媽的帳戶出了問題，請把手機剛收到的簡訊驗證碼唸給我聽。」${N}應該怎麼做？`, `A caller says they are from the bank: "Your parent's account has a problem. Read me the code that was just texted to the phone." What should ${E} do?`),
          right: T('絕對不唸驗證碼，掛掉電話告訴爸媽', 'Never read the code; hang up and tell a parent'),
          wrong: [T('是銀行打來的，就唸給他聽', 'It is the bank, so read the code'), T('只唸前三個數字', 'Read only the first three digits'), T('請他等一下，看完再唸', 'Ask them to wait, then read it')],
          why: T('真的銀行不會打電話要你唸驗證碼。驗證碼就像鑰匙，給了別人就能動用帳戶的錢。', 'A real bank never calls to ask for a code. The code is like a key: whoever has it can get into the account.'),
        }),
        () => ({
          q: T(`網路上有人賣最新的遊戲機，只要 ${m.z(tw ? 250000 : 10000)}（店裡大約要 ${m.z(tw ? 1000000 : 40000)}），但要求${N}的爸媽不要用購物網站付款，而是私下匯款到他的帳戶。這樣安全嗎？`, `Someone online sells the newest game console for only ${m.e(tw ? 250000 : 10000)} (it costs about ${m.e(tw ? 1000000 : 40000)} in stores), but asks ${E}'s parents to skip the shopping site and send money straight to his bank account. Is that safe?`),
          right: T('不安全：便宜得太誇張又要私下匯款，很可能是詐騙', 'Not safe: far too cheap plus paying outside the site is a likely scam'),
          wrong: [T('安全，趕快付錢免得被買走', 'Safe; pay fast before someone else buys it'), T('安全，因為照片看起來是真的', 'Safe, because the photos look real'), T('先匯一半就安全了', 'Safe if you send only half first')],
          why: T('好得不像真的，通常就不是真的。離開購物平台私下付款，錢被騙走很難拿回來。', 'If a deal looks too good to be true, it usually is. Paying outside the shopping site means you probably cannot get the money back.'),
        }),
        () => ({
          q: T(`一個不認識的網站說可以免費下載熱門遊戲，但要先輸入爸媽的信用卡號碼「確認年齡」。${N}應該怎麼做？`, `A website ${E} does not know offers a popular game for free, but asks for a parent's credit card number "to check your age." What should ${E} do?`),
          right: T('關掉網站，問爸媽，只和爸媽一起從正式的商店下載', 'Close the site, ask a parent, and download only from an official store together'),
          wrong: [T('輸入卡號，反正說是免費的', 'Type the card number since it says free'), T('只輸入卡號的前幾碼', 'Type only part of the card number'), T('先下載，之後再跟爸媽說', 'Download first and tell a parent later')],
          why: T('「免費」卻要信用卡號，是想偷卡號或騙錢。來路不明的下載也可能有病毒。', 'A "free" offer that wants a card number is trying to steal it. Downloads from unknown sites can also carry viruses.'),
        }),
        () => ({
          q: T(`一個網友說要用 ${m.z(amt)} 買${N}的遊戲寶物，但要${N}先付 ${m.z(fee)}「手續費」才能收款。${N}應該怎麼做？`, `An online player offers ${m.e(amt)} for ${E}'s game item, but says ${E} must first pay a ${m.e(fee)} "processing fee" to receive the money. What should ${E} do?`),
          right: T('拒絕：要你先付手續費才能收錢，就是詐騙', 'Say no: having to pay a fee to receive money is a scam'),
          wrong: [T('付手續費，反正會拿回更多錢', 'Pay the fee since more money is coming'), T('先付一半的手續費', 'Pay half the fee first'), T('用爸媽的卡付手續費', 'Pay the fee with a parent\'s card')],
          why: T('真正的買家付錢給你，不會要你先付錢。付了「手續費」之後，對方通常就消失了。', 'A real buyer pays you; they never ask you to pay first. After the "fee" is paid, the scammer usually disappears.'),
        }),
      ];
      const pw = () => {
        const opts = ['Blue-Tiger-jumps-42!', '123456', 'password', `${E}2015`];
        return {
          q: T('設定新密碼時，下面哪一個最安全？', 'Which password is the safest?'),
          ans: ansChoice(opts),
          sol: [
            T('安全的密碼要夠長，混合大小寫字母、數字和符號，而且不要用名字或生日。', 'A safe password is long, mixes upper- and lowercase letters, numbers and symbols, and does not use your name or birthday.'),
            T(`「123456」和「password」是最常被猜到的密碼；「${E}2015」用了名字和年份，也很好猜。`, `"123456" and "password" are among the most guessed passwords; "${E}2015" uses a name and a year, so it is easy to guess too.`),
            T('「Blue-Tiger-jumps-42!」又長又混合，最難猜。密碼也不要告訴別人。', '"Blue-Tiger-jumps-42!" is long and mixed, so it is the hardest to guess. And never share your password.'),
            safeTip(tw),
          ],
          hint: T('越長、越混合，越難猜。', 'Longer and more mixed is harder to guess.'),
        };
      };
      const k = r.int(0, S.length);
      if (k === S.length) return pw();
      const s = S[k]();
      return {
        q: s.q,
        ans: ansChoice([s.right, ...s.wrong]),
        sol: [
          s.why,
          T('記住：不先付錢、不給密碼和驗證碼、不被「趕快」催著做決定、不對大人保密。', 'Remember: never pay first, never share passwords or codes, never let anyone rush you, and never keep secrets from your parents.'),
          T(`所以答案是「${s.right.zh}」。`, `So the answer is "${s.right.en}."`),
          safeTip(tw),
        ],
        hint: T('如果對方要錢、要密碼、或叫你保密，就要停下來。', 'Stop if someone wants money, a password, or a secret.'),
      };
    },
  },

  // ============================================================ 11. unit price
  {
    id: 'unit-price',
    grades: [4, 7],
    area: 'spend',
    name: T('哪個比較划算？', 'Which is the better deal?'),
    std: { us: 'Jump$tart · Spending', tw: '金融教育 · 聰明消費' },
    lesson: T('包裝大小不同時，要比「單價」：價錢 ÷ 數量 = 每 1 個多少錢，單價越低越划算。大包裝不一定比較便宜；而且只有用得完，大包裝才真的划算。',
      'When package sizes differ, compare the unit price: price ÷ number of items = cost of one item. The lower unit price is the better deal. A bigger pack is not always cheaper, and it is only a deal if you will really use it all.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us';
      const who = r.pick(KIDS);
      // [emoji, measure word, zh noun, en one, en many, tw unit lo/hi (NT$), us unit lo/hi (cents)]
      const PACK = [['🧃', '盒', '果汁', 'juice box', 'juice boxes', 8, 20, 40, 100], ['🥚', '顆', '雞蛋', 'egg', 'eggs', 5, 10, 20, 50], ['✏️', '枝', '鉛筆', 'pencil', 'pencils', 5, 15, 15, 60],
        ['🎾', '顆', '網球', 'tennis ball', 'tennis balls', 30, 60, 100, 250], ['🔋', '顆', '電池', 'battery', 'batteries', 10, 30, 50, 150], ['🧦', '雙', '襪子', 'pair of socks', 'pairs of socks', 30, 80, 150, 400],
        ['💧', '瓶', '礦泉水', 'bottle of water', 'bottles of water', 8, 20, 25, 100], ['🍪', '片', '餅乾', 'cookie', 'cookies', 3, 10, 20, 60]];
      const t = r.int(0, 3);
      if (t === 3) {
        // a bigger pack is only a deal if you use it
        const FOOD = [['🍌', '根', '香蕉', 'banana', 'bananas', 5, 12, 20, 40], ['🥐', '個', '麵包', 'bread roll', 'bread rolls', 15, 30, 50, 100], ['🥛', '杯', '優格', 'cup of yogurt', 'cups of yogurt', 15, 30, 60, 120]];
        const f = r.pick(FOOD), stp = us ? 5 : 100;
        let nS, nB, uS, uB;
        do {
          nS = r.int(3, 6); nB = r.pick([10, 12, 15, 20]);
          const lo = us ? f[7] : f[5] * 100, hi = us ? f[8] : f[6] * 100;
          [uS, uB] = r.sample(Array.from({ length: (hi - lo) / stp + 1 }, (_, i) => lo + i * stp), 2).sort((a, b) => b - a);
        } while (nB * uB <= nS * uS);
        const PS = nS * uS, PB = nB * uB;
        return {
          q: T(`${who[0]}家在${f[2]}壞掉以前，只吃得完 ${nS} ${f[1]}。小包裝 ${nS} ${f[1]} ${m.z(PS)}；大包裝 ${nB} ${f[1]} ${m.z(PB)}，每${f[1]}比較便宜。哪個選擇比較聰明？`,
            `${who[1]}'s family can eat only ${nS} ${f[4]} before they go bad. A small pack of ${nS} costs ${m.e(PS)}. A big pack of ${nB} costs ${m.e(PB)} and is cheaper per ${f[3]}. Which is the smarter choice?`),
          ans: ansChoice([T('買小包裝', 'Buy the small pack'), T('買大包裝，因為每一個比較便宜', 'Buy the big pack because each one is cheaper'), T('兩個一樣划算', 'They are equally good deals')]),
          sol: [
            T(`單價：小包 ${m.z(PS)} ÷ ${nS} = ${m.z(uS)}，大包 ${m.z(PB)} ÷ ${nB} = ${m.z(uB)}。大包的單價比較低。`, `Unit prices: small ${m.e(PS)} ÷ ${nS} = ${m.e(uS)}, big ${m.e(PB)} ÷ ${nB} = ${m.e(uB)}. The big pack is cheaper per ${f[3]}.`),
            T(`但只吃得完 ${nS} ${f[1]}：買大包要付 ${m.z(PB)}，買小包只要 ${m.z(PS)}，大包多花 ${m.z(PB - PS)}。`, `But only ${nS} get eaten: the big pack costs ${m.e(PB)} and the small pack ${m.e(PS)}, so the big pack costs ${m.e(PB - PS)} more.`),
            T(`而且大包會有 ${nB - nS} ${f[1]}壞掉丟掉，等於浪費錢。`, `And ${nB - nS} ${f[4]} from the big pack would go bad and be thrown away; that is wasted money.`),
            T('單價低的大包裝，只有用得完才真的划算。', 'A big pack with a lower unit price is only a deal if you will use it all.'),
          ],
          hint: T('想想看：真的用得完嗎？', 'Think: will you really use all of it?'),
        };
      }
      const it = r.pick(PACK), [em, mw, zn, e1, eN] = it;
      const k = g >= 6 && t === 0 ? r.pick([2, 3, 3]) : 2;
      const stp = us ? (g <= 5 ? 5 : 1) : 100;
      const lo = us ? it[7] : it[5] * 100, hi = us ? it[8] : it[6] * 100;
      const sizes = r.sample([2, 3, 4, 5, 6, 8, 10, 12, 20, 24], k).sort((a, b) => a - b);
      // unit prices: each bigger pack 3–25 % cheaper per item (sometimes shuffled: bigger is not always cheaper)
      let us_;
      for (;;) {
        us_ = [r.int(Math.ceil((lo + hi) / 2 / stp), hi / stp) * stp];
        while (us_.length < k) { const p = us_[us_.length - 1]; us_.push(p - Math.max(stp, Math.round((p * r.int(3, 25)) / 100 / stp) * stp)); }
        if (us_[k - 1] >= lo) break;
      }
      if (r.chance(0.3)) us_ = r.shuffle(us_);
      const packs = sizes.map((n, i) => ({ L: ABC[i], n, u: us_[i], P: n * us_[i] }));
      const fig = tbl(['', em, '💰'], packs.map((p) => [p.L, `× ${p.n}`, m.e(p.P)]));
      const desc = T(`${em} ${zn}有${k === 2 ? '兩' : '三'}種包裝：${packs.map((p) => `${p.L} 包 ${p.n} ${mw} ${m.z(p.P)}`).join('；')}。`,
        `${em} ${cap(eN)} come in ${k} packs: ${packs.map((p) => `pack ${p.L} has ${p.n} for ${m.e(p.P)}`).join('; ')}.`);
      const per = packs.map((p) => T(`${p.L} 包：${m.z(p.P)} ÷ ${p.n} = 每${mw} ${m.z(p.u)}。`, `Pack ${p.L}: ${m.e(p.P)} ÷ ${p.n} = ${m.e(p.u)} per ${e1}.`));
      const best = packs.reduce((a, b) => (b.u < a.u ? b : a));
      if (t === 0) {
        return {
          q: T(`${desc.zh}哪一包比較划算（每${mw}比較便宜）？`, `${desc.en} Which pack is the better deal (cheaper per ${e1})?`),
          fig,
          ans: ansChoice([best, ...packs.filter((p) => p !== best)].map((p) => T(`${p.L} 包`, `Pack ${p.L}`))),
          sol: [
            T(`比「單價」：價錢 ÷ 數量 = 每 1 ${mw}多少錢。`, `Compare unit prices: price ÷ number of items = the cost of 1 ${e1}.`),
            ...per,
            T(`${best.L} 包的單價${k === 2 ? '比較低' : '最低'}，所以最划算。${best === packs[packs.length - 1] ? '' : '（大包裝不一定比較便宜！）'}不過，要用得完才真的划算。`, `Pack ${best.L} has the ${k === 2 ? 'lower' : 'lowest'} unit price, so it is the better deal.${best === packs[packs.length - 1] ? '' : ' (The biggest pack is not always the cheapest!)'} Still, it is only a deal if you will use it all.`),
          ],
          hint: T('每一包都算出「1 個多少錢」。', 'Find the price of one item in each pack.'),
        };
      }
      if (t === 1) {
        const p = r.pick(packs);
        return {
          q: T(`${desc.zh}${p.L} 包的單價（每${mw}）是多少錢？${m.typeHint.zh}`, `${desc.en} What is the unit price (the price per ${e1}) of pack ${p.L}? ${m.typeHint.en}`),
          fig,
          ans: m.ans(p.u),
          sol: [
            T(`單價＝價錢 ÷ 數量。`, `Unit price = price ÷ number of items.`),
            T(`${m.z(p.P)} ÷ ${p.n} = ${m.z(p.u)}。`, `${m.e(p.P)} ÷ ${p.n} = ${m.e(p.u)}.`),
            T(`驗算：${p.n} × ${m.z(p.u)} = ${m.z(p.P)} ✔。`, `Check: ${p.n} × ${m.e(p.u)} = ${m.e(p.P)} ✔.`),
            T('算出每一包的單價，就能公平地比較哪一包划算。', 'With the unit price of each pack you can compare them fairly.'),
          ],
          hint: T('價錢 ÷ 數量。', 'Price ÷ number of items.'),
        };
      }
      const [A, B] = packs, cheap = A.u < B.u ? A : B, dear = A.u < B.u ? B : A, N = lcm(A.n, B.n);
      if (g >= 6 && N <= 60) {
        const cC = (N / cheap.n) * cheap.P, cD = (N / dear.n) * dear.P;
        return {
          q: T(`${desc.zh}${who[0]}剛好需要 ${N} ${mw}。全部買 ${cheap.L} 包，比全部買 ${dear.L} 包少花多少錢？${m.typeHint.zh}`, `${desc.en} ${who[1]} needs exactly ${N} ${eN}. How much less does ${who[1]} pay buying only pack ${cheap.L} instead of only pack ${dear.L}? ${m.typeHint.en}`),
          fig,
          ans: m.ans(cD - cC),
          sol: [
            T(`用同樣的數量 ${N} ${mw}來比。`, `Compare the same number of items: ${N}.`),
            T(`${cheap.L} 包：${N} ÷ ${cheap.n} = ${N / cheap.n} 包，${N / cheap.n} × ${m.z(cheap.P)} = ${m.z(cC)}。`, `Pack ${cheap.L}: ${N} ÷ ${cheap.n} = ${pl(N / cheap.n, 'pack', 'packs')}, ${N / cheap.n} × ${m.e(cheap.P)} = ${m.e(cC)}.`),
            T(`${dear.L} 包：${N} ÷ ${dear.n} = ${N / dear.n} 包，${N / dear.n} × ${m.z(dear.P)} = ${m.z(cD)}。`, `Pack ${dear.L}: ${N} ÷ ${dear.n} = ${pl(N / dear.n, 'pack', 'packs')}, ${N / dear.n} × ${m.e(dear.P)} = ${m.e(cD)}.`),
            T(`少花 ${m.z(cD)} − ${m.z(cC)} = ${m.z(cD - cC)}。（也就是每${mw}差 ${m.z(dear.u - cheap.u)}，${N} ${mw}差 ${N} × ${m.z(dear.u - cheap.u)}。）`, `You save ${m.e(cD)} − ${m.e(cC)} = ${m.e(cD - cC)}. (That is ${m.e(dear.u - cheap.u)} per ${e1}, times ${N}.)`),
          ],
          hint: T('算出兩種買法各要幾包、各花多少。', 'Work out how many packs and how much each way costs.'),
        };
      }
      return {
        q: T(`${desc.zh}${cheap.L} 包每${mw}比 ${dear.L} 包便宜多少錢？${m.typeHint.zh}`, `${desc.en} How much cheaper per ${e1} is pack ${cheap.L} than pack ${dear.L}? ${m.typeHint.en}`),
        fig,
        ans: m.ans(dear.u - cheap.u),
        sol: [
          ...per,
          T(`每${mw}便宜：${m.z(dear.u)} − ${m.z(cheap.u)} = ${m.z(dear.u - cheap.u)}。`, `Cheaper per ${e1}: ${m.e(dear.u)} − ${m.e(cheap.u)} = ${m.e(dear.u - cheap.u)}.`),
          T('單價比較低的那一包，只有在用得完的時候才真的省錢。', 'The pack with the lower unit price only saves money if you will use it all.'),
        ],
        hint: T('先算兩包的單價，再相減。', 'Find both unit prices, then subtract.'),
      };
    },
  },

  // ============================================================ 12. percent off
  {
    id: 'percent-off',
    grades: [5, 8],
    area: 'spend',
    name: T('打折後多少錢？', 'Percent off'),
    std: { us: 'Jump$tart · Spending', tw: '國小數學 · 百分率' },
    lesson: T('在台灣，「打 8 折」就是付原價的 80%，也就是便宜 20%（英文說 20% off）。特價＝原價 × 付的百分率。連續打兩次折，要一次一次算，不能把折扣直接相加。',
      'A sale that says "20% off" means you pay 80% of the price. Sale price = original price × the percent you pay. With two discounts in a row, take them one at a time; you cannot just add the percents.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us', tw = m.tw;
      const zhe = (p) => (p % 10 ? `${p}` : `${p / 10}`);
      const offT = (p) => (tw ? T(`打 ${zhe(p)} 折`, `${100 - p}% off`) : T(` ${100 - p}% off（便宜 ${100 - p}%）`, `${100 - p}% off`));
      const payT = (p) => (tw ? T(`打 ${zhe(p)} 折＝付原價的 ${p}%（便宜 ${100 - p}%）。`, `${100 - p}% off means you pay 100% − ${100 - p}% = ${p}% of the price.`)
        : T(`便宜 ${100 - p}%，就是付原價的 100% − ${100 - p}% = ${p}%（也就是打 ${zhe(p)} 折）。`, `${100 - p}% off means you pay 100% − ${100 - p}% = ${p}% of the price.`));
      const items = [['一件外套', 'a jacket'], ['一雙球鞋', 'a pair of sneakers'], ['一個背包', 'a backpack'], ['一盒積木', 'a box of building blocks'], ['一個保溫瓶', 'an insulated water bottle'], ['一副耳機', 'a pair of headphones']];
      const it = r.pick(items), who = r.pick(KIDS);
      const t = r.int(0, g >= 7 ? 4 : 2);
      if (t >= 3) {
        const p1 = r.pick([90, 80, 70, 60]), p2 = r.pick([90, 80]);
        const P = us ? r.int(20, 150) * 100 : r.int(5, 40) * 10000;
        const a1 = (P * p1) / 100, fin = (a1 * p2) / 100, both = p1 + p2 - 100, once = (P * both) / 100, payAll = (p1 * p2) / 100;
        const twoT = tw ? T(`全館打 ${zhe(p1)} 折，結帳時再打 ${zhe(p2)} 折`, `${100 - p1}% off everything, then an extra ${100 - p2}% off at the register`)
          : T(`全館 ${100 - p1}% off，結帳時再 ${100 - p2}% off`, `${100 - p1}% off everything, then an extra ${100 - p2}% off at the register`);
        const onceT = tw ? T(`直接打 ${zhe(both)} 折`, `${100 - both}% off at once`) : T(`直接 ${100 - both}% off`, `${100 - both}% off at once`);
        const steps = [
          T(`第一次：${m.z(P)} × ${p1}% = ${m.z(a1)}。`, `First discount: ${m.e(P)} × ${p1}% = ${m.e(a1)}.`),
          T(`第二次是從 ${m.z(a1)} 再打折：${m.z(a1)} × ${p2}% = ${m.z(fin)}。`, `The second discount is taken from ${m.e(a1)}: ${m.e(a1)} × ${p2}% = ${m.e(fin)}.`),
          T(`兩次合起來是付 ${p1}% × ${p2}% = ${payAll}%，便宜 ${100 - payAll}%，不是 ${(100 - p1) + (100 - p2)}%。`, `Together you pay ${p1}% × ${p2}% = ${payAll}% of the price: that is ${100 - payAll}% off, not ${(100 - p1) + (100 - p2)}%.`),
        ];
        if (t === 3) {
          return {
            q: T(`${it[0]}原價 ${m.z(P)}，商店${twoT.zh}。最後要付多少錢？${m.typeHint.zh}`, `${cap(it[1])} costs ${m.e(P)}. The store has ${twoT.en}. What is the final price? ${m.typeHint.en}`),
            ans: m.ans(fin),
            sol: [...steps, T(`如果把折扣直接相加，會算成 ${m.z(once)}，那是錯的。`, `Adding the discounts would give ${m.e(once)}, which is wrong.`)],
            hint: T('先算第一次的折扣，再從新的價錢打第二次。', 'Take the first discount, then take the second from the new price.'),
          };
        }
        return {
          q: T(`${it[0]}原價 ${m.z(P)}。甲店：${twoT.zh}；乙店：${onceT.zh}。哪一家比較便宜？`, `${cap(it[1])} costs ${m.e(P)}. Store A: ${twoT.en}. Store B: ${onceT.en}. Which store is cheaper?`),
          ans: ansChoice([T('乙店', 'Store B'), T('甲店', 'Store A'), T('兩家一樣', 'They cost the same')]),
          sol: [...steps.slice(0, 2), T(`乙店：${m.z(P)} × ${both}% = ${m.z(once)}。`, `Store B: ${m.e(P)} × ${both}% = ${m.e(once)}.`),
            T(`${m.z(once)} < ${m.z(fin)}，乙店便宜 ${m.z(fin - once)}。第二次折扣是從已經打折的價錢再打，所以省得比較少。`, `${m.e(once)} < ${m.e(fin)}, so Store B is ${m.e(fin - once)} cheaper. The second discount is taken from a smaller price, so it saves less.`)],
          hint: T('兩家都算出最後的價錢。', 'Work out the final price at each store.'),
        };
      }
      const ps = tw ? (g >= 6 ? [90, 85, 80, 75, 70, 65, 60, 50] : [90, 80, 70, 60, 50]) : g >= 6 ? [90, 85, 80, 75, 70, 65, 60, 50] : [90, 80, 75, 70, 60, 50];
      const p = r.pick(ps);
      const P = us ? (g >= 6 ? r.int(50, 750) * 20 : r.int(10, 120) * 100) : g >= 6 ? r.int(6, 150) * 2000 : r.int(2, 20) * 10000;
      const S = (P * p) / 100, d = P - S;
      if (t === 0) {
        return {
          q: T(`${it[0]}原價 ${m.z(P)}，現在${offT(p).zh}。特價是多少錢？${m.typeHint.zh}`, `${cap(it[1])} costs ${m.e(P)}. It is on sale at ${offT(p).en}. What is the sale price? ${m.typeHint.en}`),
          ans: m.ans(S),
          sol: [
            payT(p),
            T(`特價：${m.z(P)} × ${p}% = ${m.z(S)}。`, `Sale price: ${m.e(P)} × ${p}% = ${m.e(S)}.`),
            T(`驗算：便宜的錢 ${m.z(P)} × ${100 - p}% = ${m.z(d)}，${m.z(P)} − ${m.z(d)} = ${m.z(S)} ✔。`, `Check: the discount is ${m.e(P)} × ${100 - p}% = ${m.e(d)}, and ${m.e(P)} − ${m.e(d)} = ${m.e(S)} ✔.`),
          ],
          hint: tw ? T(`打 ${zhe(p)} 折就是乘以 ${p}%。`, `Multiply by ${p}%.`) : T(`付的是 ${p}%。`, `You pay ${p}%.`),
        };
      }
      if (t === 1) {
        return {
          q: T(`${it[0]}原價 ${m.z(P)}，現在${offT(p).zh}。${who[0]}買了一個，比原價省了多少錢？${m.typeHint.zh}`, `${cap(it[1])} costs ${m.e(P)}. It is on sale at ${offT(p).en}. How much does ${who[1]} save by buying it on sale? ${m.typeHint.en}`),
          ans: m.ans(d),
          sol: [
            payT(p),
            T(`省下的錢＝原價 × ${100 - p}%：${m.z(P)} × ${100 - p}% = ${m.z(d)}。`, `Money saved = price × ${100 - p}%: ${m.e(P)} × ${100 - p}% = ${m.e(d)}.`),
            T(`驗算：特價 ${m.z(P)} × ${p}% = ${m.z(S)}，${m.z(P)} − ${m.z(S)} = ${m.z(d)} ✔。`, `Check: the sale price is ${m.e(P)} × ${p}% = ${m.e(S)}, and ${m.e(P)} − ${m.e(S)} = ${m.e(d)} ✔.`),
          ],
          hint: T(`省下的是 ${100 - p}%。`, `You save ${100 - p}%.`),
        };
      }
      return {
        q: T(`${it[0]}${offT(p).zh}之後賣 ${m.z(S)}。原價是多少錢？${m.typeHint.zh}`, `After ${offT(p).en}, ${it[1]} costs ${m.e(S)}. What was the original price? ${m.typeHint.en}`),
        ans: m.ans(P),
        sol: [
          payT(p),
          T(`所以 原價 × ${p}% = ${m.z(S)}，原價 = ${m.z(S)} ÷ ${p}% = ${m.z(S)} × 100 ÷ ${p} = ${m.z(P)}。`, `So original × ${p}% = ${m.e(S)}, and original = ${m.e(S)} ÷ ${p}% = ${m.e(S)} × 100 ÷ ${p} = ${m.e(P)}.`),
          T(`驗算：${m.z(P)} × ${p}% = ${m.z(S)} ✔。`, `Check: ${m.e(P)} × ${p}% = ${m.e(S)} ✔.`),
          T(`注意：不能把 ${m.z(S)} 再加上它的 ${100 - p}%，因為折扣是用原價算的。`, `Careful: adding ${100 - p}% of ${m.e(S)} back does not work, because the discount was taken from the original price.`),
        ],
        hint: T(`特價是原價的 ${p}%。`, `The sale price is ${p}% of the original.`),
      };
    },
  },

  // ============================================================ 13. sales tax / VAT
  {
    id: 'sales-tax',
    grades: [6, 9],
    area: 'spend',
    name: T('買東西的稅', 'Tax on what you buy'),
    std: { us: 'Jump$tart · Spending', tw: '金融教育 · 聰明消費' },
    lesson: T('在台灣，商品標價已經包含 5% 營業稅，標多少就付多少；稅金＝標價 × 5/105。在美國，標價通常不含稅，結帳時才加上銷售稅（sales tax），稅率依各州、各城市不同。',
      'In Taiwan the tag price already includes the 5% business tax, so you pay what the tag says; the tax inside is price × 5/105. In the US the tag usually does not include tax: sales tax is added at the register, and the rate depends on the state and city.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us', who = r.pick(KIDS);
      const fact = () => ({
        q: T('關於買東西的稅，下面哪一個正確？', 'Which statement about tax on purchases is true?'),
        ans: ansChoice([
          T('在台灣，標價已經含 5% 營業稅；在美國，銷售稅通常是結帳時才加上去，稅率依地區不同', 'In Taiwan the tag price already includes the 5% business tax; in the US sales tax is usually added at the register, and the rate depends on where you are'),
          T('台灣和美國都是結帳時才另外加稅', 'In both Taiwan and the US, tax is added at the register'),
          T('在台灣結帳時才加 5% 稅；美國的標價已經含稅', 'In Taiwan 5% tax is added at the register, while US tags already include tax'),
          T('在台灣和美國買東西都不用繳稅', 'You pay no tax on things you buy in Taiwan or the US'),
        ]),
        sol: [
          T('台灣：法律規定賣給消費者的標價要含營業稅（5%），所以標價就是你要付的錢。', 'Taiwan: prices for shoppers must include the 5% business tax, so the tag price is what you pay.'),
          T('美國：大多數州和城市有銷售稅，例如 6%、7.25%、8.875%，通常是結帳時才加在標價上。', 'US: most states and cities have a sales tax, such as 6%, 7.25% or 8.875%, usually added to the tag price at the register.'),
          T('所以在美國要多準備一點錢，在台灣看標價就好。', 'So in the US, bring a little more than the tag price; in Taiwan, the tag tells you the total.'),
        ],
        hint: T('想一想：哪裡的標價就是要付的錢？', 'Where is the tag price the amount you pay?'),
      });
      if (us) {
        const t = r.int(0, g >= 8 ? 5 : g >= 7 ? 4 : 3);
        const bp = r.pick([500, 600, 625, 700, 725, 750, 800, 825, 850, 875, 900]), pct = num(bp / 100);
        const say = T(`假設這裡的銷售稅（sales tax）是 ${pct}%，結帳時才加上去，稅金四捨五入到 1 分（cent）。`, `Suppose the sales tax here is ${pct}%, added at the register, with the tax rounded to the nearest cent.`);
        const taxSteps = (P) => {
          const tax = pctOfBp(P, bp);
          return [tax, T(`稅金：${m.zf(P)} × ${pct}% = ${num((P * bp) / 10000)} 分，四捨五入是 ${tax} 分 = ${m.zf(tax)}。`, `Tax: ${m.ef(P)} × ${pct}% = ${num((P * bp) / 10000)}¢, which rounds to ${tax}¢ = ${m.ef(tax)}.`)];
        };
        const priceOK = (P) => (P * bp) % 10000 !== 5000;
        if (t === 3) {
          let P; do P = r.int(10, 40) * 100; while (!priceOK(P));
          const tax = pctOfBp(P, bp);
          return {
            q: T(`${who[0]}在美國的商店看到一個玩具標價 ${m.zf(P)}，身上剛好有 ${m.zf(P)}。${say.zh}${who[0]}買得起嗎？`, `In a US store, ${who[1]} sees a toy tagged ${m.ef(P)} and has exactly ${m.ef(P)}. ${say.en} Can ${who[1]} buy it?`),
            ans: ansChoice([T(`不行，結帳會加稅，要付 ${m.zf(P + tax)}`, `No; tax is added at the register, so it costs ${m.ef(P + tax)}`), T('可以，標價就是要付的錢', 'Yes; the tag price is what you pay'), T(`可以，還會找回 ${m.zf(tax)}`, `Yes, and ${who[1]} gets ${m.ef(tax)} back`)]),
            sol: [
              T('在美國，標價通常不含銷售稅，結帳時才加上去。', 'In the US, the tag price usually does not include sales tax; it is added at the register.'),
              T(`稅金：${m.zf(P)} × ${pct}% = ${m.zf(tax)}（四捨五入到 1 分）。`, `Tax: ${m.ef(P)} × ${pct}% = ${m.ef(tax)} (to the nearest cent).`),
              T(`要付 ${m.zf(P)} + ${m.zf(tax)} = ${m.zf(P + tax)}，比 ${m.zf(P)} 多，所以錢不夠。`, `Total: ${m.ef(P)} + ${m.ef(tax)} = ${m.ef(P + tax)}, more than ${m.ef(P)}, so it is not enough.`),
              T('（在台灣就不一樣：標價已經含稅。）', '(Taiwan is different: the tag price already includes tax.)'),
            ],
            hint: T('美國的稅是結帳時才加。', 'US sales tax is added at the register.'),
          };
        }
        if (t === 5) {
          const rr = r.pick([5, 6, 7, 8]), unit = { 5: 20, 6: 50, 7: 100, 8: 25 }[rr];
          const P = unit * r.int(Math.ceil(500 / unit), Math.floor(6000 / unit)), tot = P + (P * rr) / 100;
          return {
            q: T(`假設銷售稅是 ${rr}%，結帳時加在標價上。${who[0]}含稅一共付了 ${m.zf(tot)}（剛好，不用四捨五入）。商品的標價（稅前）是多少？${m.typeHint.zh}`, `Suppose the sales tax is ${rr}%, added to the tag price at the register. ${who[1]} paid ${m.ef(tot)} in all, with tax (no rounding needed). What was the price before tax? ${m.typeHint.en}`),
            ans: m.ans(P),
            sol: [
              T(`含稅總額＝標價 × (100% + ${rr}%) = 標價 × ${100 + rr}%。`, `Total with tax = price × (100% + ${rr}%) = price × ${100 + rr}%.`),
              T(`標價＝${m.zf(tot)} ÷ ${100 + rr}% = ${m.zf(tot)} × 100 ÷ ${100 + rr} = ${m.zf(P)}。`, `Price = ${m.ef(tot)} ÷ ${100 + rr}% = ${m.ef(tot)} × 100 ÷ ${100 + rr} = ${m.ef(P)}.`),
              T(`驗算：稅 ${m.zf(P)} × ${rr}% = ${m.zf((P * rr) / 100)}，${m.zf(P)} + ${m.zf((P * rr) / 100)} = ${m.zf(tot)} ✔。`, `Check: tax ${m.ef(P)} × ${rr}% = ${m.ef((P * rr) / 100)}, and ${m.ef(P)} + ${m.ef((P * rr) / 100)} = ${m.ef(tot)} ✔.`),
              T(`注意：不能用總額減掉總額的 ${rr}%，因為稅是用標價算的。`, `Careful: subtracting ${rr}% of the total does not work, because the tax was figured on the price.`),
            ],
            hint: T(`總額是標價的 ${100 + rr}%。`, `The total is ${100 + rr}% of the price.`),
          };
        }
        if (t === 4) {
          const PR = [['一件 T 恤', 'a T-shirt', 800, 2500], ['一本書', 'a book', 700, 2000], ['一雙襪子', 'a pair of socks', 300, 1000], ['一頂帽子', 'a cap', 1000, 2500]];
          let buy, sub;
          do { buy = r.sample(PR, r.int(2, 3)).map((x) => [x, r.int(x[2], x[3])]); sub = sum(buy.map((b) => b[1])); } while (!priceOK(sub));
          const [tax, st] = taxSteps(sub);
          return {
            q: T(`${say.zh}${who[0]}買了${buy.map((b) => `${b[0][0]}（${m.zf(b[1])}）`).join('、')}。含稅一共要付多少？${m.typeHint.zh}`, `${say.en} ${who[1]} buys ${buy.map((b) => `${b[0][1]} (${m.ef(b[1])})`).join(', ').replace(/, ([^,]*)$/, ' and $1')}. What is the total with tax? ${m.typeHint.en}`),
            ans: m.ans(sub + tax),
            sol: [
              T(`先加起來（稅前小計）：${buy.map((b) => m.zf(b[1])).join(' + ')} = ${m.zf(sub)}。`, `Subtotal before tax: ${buy.map((b) => m.ef(b[1])).join(' + ')} = ${m.ef(sub)}.`),
              st,
              T(`總額：${m.zf(sub)} + ${m.zf(tax)} = ${m.zf(sub + tax)}。`, `Total: ${m.ef(sub)} + ${m.ef(tax)} = ${m.ef(sub + tax)}.`),
              T('在美國，帶的錢要比標價加起來多一點，才付得起稅。', 'In the US, bring a bit more than the tag prices add up to, so you can pay the tax.'),
            ],
            hint: T('先算小計，再算稅。', 'Find the subtotal, then the tax.'),
          };
        }
        if (t === 2) return fact();
        const it = r.pick([['一雙球鞋', 'a pair of sneakers', 3000, 9000], ['一個背包', 'a backpack', 2000, 6000], ['一盒桌遊', 'a board game', 1500, 5000], ['一副耳機', 'a pair of headphones', 1500, 9000], ['一件外套', 'a jacket', 3000, 9000]]);
        let P; do P = r.int(it[2], it[3]); while (!priceOK(P));
        const [tax, st] = taxSteps(P);
        if (t === 1) {
          return {
            q: T(`${say.zh}${it[0]}標價 ${m.zf(P)}。稅金是多少？${m.typeHint.zh}`, `${say.en} ${cap(it[1])} is tagged ${m.ef(P)}. How much is the tax? ${m.typeHint.en}`),
            ans: m.ans(tax),
            sol: [T(`稅金＝標價 × 稅率。`, `Tax = price × tax rate.`), st, T(`所以稅金是 ${m.zf(tax)}，結帳時加在 ${m.zf(P)} 上面。`, `So the tax is ${m.ef(tax)}, added to ${m.ef(P)} at the register.`)],
            hint: T(`${pct}% 就是 ${num(bp / 10000)}。`, `${pct}% is ${num(bp / 10000)}.`),
          };
        }
        return {
          q: T(`${say.zh}${it[0]}標價 ${m.zf(P)}。結帳時一共要付多少？${m.typeHint.zh}`, `${say.en} ${cap(it[1])} is tagged ${m.ef(P)}. What is the total at the register? ${m.typeHint.en}`),
          ans: m.ans(P + tax),
          sol: [
            T('美國的標價通常不含稅，結帳時才加上銷售稅。', 'US tag prices usually do not include tax; sales tax is added at the register.'),
            st,
            T(`總額：${m.zf(P)} + ${m.zf(tax)} = ${m.zf(P + tax)}。`, `Total: ${m.ef(P)} + ${m.ef(tax)} = ${m.ef(P + tax)}.`),
          ],
          hint: T('先算稅，再加上標價。', 'Find the tax, then add it to the price.'),
        };
      }
      // ---- Taiwan: 5% business tax is inside the tag price
      const t = r.int(0, 4);
      if (t === 4) return fact();
      const it = r.pick([['一雙球鞋', 'a pair of sneakers', 50, 200], ['一個背包', 'a backpack', 20, 100], ['一盒桌遊', 'a board game', 20, 80], ['一副耳機', 'a pair of headphones', 20, 150], ['一台電風扇', 'an electric fan', 30, 100]]);
      if (t === 3) {
        const P = r.int(3, 12) * 2000;
        const food = r.pick([['一個便當', 'a boxed lunch'], ['一份早餐', 'a breakfast set'], ['一碗牛肉麵', 'a bowl of beef noodles']]);
        return {
          q: T(`在台灣，${food[0]}標價 ${m.z(P)}。結帳時要付多少錢？`, `In Taiwan, ${food[1]} is tagged ${m.e(P)}. How much do you pay at the register?`),
          ans: ansChoice([T(`${m.z(P)}，稅已經含在標價裡`, `${m.e(P)}; the tax is already in the tag price`), T(`${m.z((P * 105) / 100)}，結帳時再加 5% 稅`, `${m.e((P * 105) / 100)}; 5% tax is added at the register`), T(`${m.z((P * 95) / 100)}，要先扣掉 5% 稅`, `${m.e((P * 95) / 100)}; 5% tax is taken off first`)]),
          sol: [
            T('台灣的標價已經包含 5% 營業稅，標多少就付多少。', 'In Taiwan the tag price already includes the 5% business tax, so you pay what the tag says.'),
            T(`所以要付 ${m.z(P)}。這個價錢裡已經含了稅（標價 × 5/105）。`, `So you pay ${m.e(P)}. The tax is already inside that price (tag price × 5/105).`),
            T('在美國就不一樣：標價通常不含稅，結帳時才加銷售稅。', 'The US is different: tags usually leave out tax, and sales tax is added at the register.'),
          ],
          hint: T('台灣的標價含稅嗎？', 'Does a Taiwan price tag include tax?'),
        };
      }
      if (t === 2) {
        const j = r.int(5, 200), X = 20 * j * 100, tag = 21 * j * 100;
        return {
          q: T(`一家台灣的店算出某商品的未稅價格是 ${m.z(X)}。加上 5% 營業稅之後，標價應該是多少？${m.typeHint.zh}`, `A shop in Taiwan works out that an item's price before tax is ${m.e(X)}. With the 5% business tax added in, what should the tag price be? ${m.typeHint.en}`),
          ans: m.ans(tag),
          sol: [
            T('標價＝未稅價格 × (100% + 5%) = 未稅價格 × 105%。', 'Tag price = price before tax × (100% + 5%) = price before tax × 105%.'),
            T(`稅金：${m.z(X)} × 5% = ${m.z(j * 100)}。`, `Tax: ${m.e(X)} × 5% = ${m.e(j * 100)}.`),
            T(`標價：${m.z(X)} + ${m.z(j * 100)} = ${m.z(tag)}。`, `Tag price: ${m.e(X)} + ${m.e(j * 100)} = ${m.e(tag)}.`),
            T('台灣的標價要含稅，所以客人看到的就是要付的錢。', 'Taiwan tags must include the tax, so shoppers see exactly what they will pay.'),
          ],
          hint: T('未稅價格再加 5%。', 'Add 5% to the price before tax.'),
        };
      }
      const k = r.int(it[2], it[3]), P = 21 * k * 100, tax = k * 100, pre = 20 * k * 100;
      const head = T(`在台灣，標價已經包含 5% 營業稅。${it[0]}標價 ${m.z(P)}。`, `In Taiwan, the tag price already includes the 5% business tax. ${cap(it[1])} is tagged ${m.e(P)}.`);
      const core = [
        T('標價＝未稅價格 × 105%，所以稅金占標價的 5/105 = 1/21。', 'Tag price = price before tax × 105%, so the tax is 5/105 = 1/21 of the tag price.'),
        T(`稅金：${m.z(P)} × 5/105 = ${m.z(P)} ÷ 21 = ${m.z(tax)}。`, `Tax: ${m.e(P)} × 5/105 = ${m.e(P)} ÷ 21 = ${m.e(tax)}.`),
        T(`未稅價格：${m.z(P)} − ${m.z(tax)} = ${m.z(pre)}。`, `Price before tax: ${m.e(P)} − ${m.e(tax)} = ${m.e(pre)}.`),
        T(`驗算：${m.z(pre)} × 5% = ${m.z(tax)} ✔。注意不能直接用 ${m.z(P)} × 5%，因為 5% 是用未稅價格算的。`, `Check: ${m.e(pre)} × 5% = ${m.e(tax)} ✔. Note that ${m.e(P)} × 5% is wrong, because the 5% is figured on the price before tax.`),
      ];
      if (t === 0) {
        return { q: T(`${head.zh}這個價錢裡有多少是營業稅？${m.typeHint.zh}`, `${head.en} How much of that price is tax? ${m.typeHint.en}`), ans: m.ans(tax), sol: core, hint: T('稅金＝標價 × 5/105。', 'Tax = tag price × 5/105.') };
      }
      return { q: T(`${head.zh}未稅價格（不含稅）是多少？${m.typeHint.zh}`, `${head.en} What is the price before tax? ${m.typeHint.en}`), ans: m.ans(pre), sol: core, hint: T('未稅價格＝標價 ÷ 1.05。', 'Price before tax = tag price ÷ 1.05.') };
    },
  },

  // ============================================================ 14. bank ledger
  {
    id: 'bank-ledger',
    grades: [4, 7],
    area: 'save',
    name: T('看懂存摺', 'Reading a bank ledger'),
    std: { us: 'Jump$tart · Saving', tw: '金融教育 · 儲蓄' },
    lesson: T('存摺（帳戶紀錄）會寫下每一次存入和提領。存入要加，提領要減，算出來的就是「餘額」，也就是帳戶裡現在有多少錢。餘額不夠時，就不能提領比餘額多的錢。',
      'A bank ledger lists every deposit and withdrawal. Add deposits and subtract withdrawals to get the balance: the money in the account right now. You cannot take out more than the balance.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us', who = r.pick(KIDS);
      const n = r.int(3, g >= 6 ? 5 : 4);
      const amt = (lo, hi) => (us ? r.int(lo, hi) * 100 + (g >= 5 ? r.int(0, 19) * 5 : 0) : r.int(lo, hi) * (g >= 5 ? 100 : 1000));
      const t = r.int(0, 2);
      let start, rows, bal, miss, X;
      for (;;) {
        start = us ? r.int(20, 200) * 100 + (g >= 5 ? r.int(0, 19) * 5 : 0) : r.int(50, 300) * 1000;
        bal = start; rows = [];
        for (let i = 0; i < n; i++) {
          const depAmt = () => (us ? amt(5, 60) : amt(g >= 5 ? 50 : 5, g >= 5 ? 1500 : 80));
          let dep = r.chance(0.55), a = dep ? depAmt() : us ? amt(5, 50) : amt(g >= 5 ? 50 : 5, g >= 5 ? 1000 : 60);
          if (!dep && a * 10 > bal * 8) { dep = true; a = depAmt(); }   // never empty the account: make it a deposit
          bal += dep ? a : -a; rows.push({ dep, a, bal });
        }
        if (!rows) continue;
        miss = r.int(0, n - 1);
        X = start + sum(rows.map((x, i) => (i === miss ? 0 : x.dep ? x.a : -x.a)));
        if (t === 1 && X < 0) continue;
        break;
      }
      const mo = r.int(1, 12), days = r.sample(Array.from({ length: 28 }, (_, i) => i + 1), n + 1).sort((a, b) => a - b);
      const date = (i) => `${mo}/${days[i]}`;
      const cells = (x, i) => [date(i + 1), x.dep ? (t === 1 && i === miss ? '?' : m.e(x.a)) : '', x.dep ? '' : t === 1 && i === miss ? '?' : m.e(x.a)];
      const fig = tbl(['📅', '+', '−', '💰'], [[date(0), '', '', m.e(start)], ...rows.map((x, i) => [...cells(x, i), i === n - 1 ? (t === 0 ? '?' : t === 1 ? m.e(bal) : '') : ''])]);
      const book = us ? T('存款帳戶紀錄', 'savings account register') : T('存摺', 'bank passbook');
      const intro = T(`下面是${who[0]}的${book.zh}：「+」是存入，「−」是提領，💰 是餘額（帳戶裡有多少錢）。`, `This is ${who[1]}'s ${book.en}. "+" is a deposit, "−" is a withdrawal, and 💰 is the balance (the money in the account).`);
      const runZ = `${m.z(start)}${rows.map((x) => ` ${x.dep ? '+' : '−'} ${m.z(x.a)}`).join('')} = ${m.z(bal)}`;
      const runE = `${m.e(start)}${rows.map((x) => ` ${x.dep ? '+' : '−'} ${m.e(x.a)}`).join('')} = ${m.e(bal)}`;
      const steps = T(rows.map((x) => `${x.dep ? '+' : '−'} ${m.z(x.a)} → ${m.z(x.bal)}`).join('；'), rows.map((x) => `${x.dep ? '+' : '−'} ${m.e(x.a)} → ${m.e(x.bal)}`).join('; '));
      if (t === 1) {
        const x = rows[miss], v = x.a;
        return {
          q: T(`${intro.zh}${date(miss + 1)} 那一筆的金額被擦掉了。那一筆是多少錢？${m.typeHint.zh}`, `${intro.en} The amount on ${date(miss + 1)} was rubbed out. How much was it? ${m.typeHint.en}`),
          fig,
          ans: m.ans(v),
          sol: [
            T('存入要加，提領要減。先把看得到的都算進去。', 'Deposits add and withdrawals subtract. First use every amount you can see.'),
            T(`${m.z(start)}${rows.map((y, i) => (i === miss ? '' : ` ${y.dep ? '+' : '−'} ${m.z(y.a)}`)).join('')} = ${m.z(X)}。`, `${m.e(start)}${rows.map((y, i) => (i === miss ? '' : ` ${y.dep ? '+' : '−'} ${m.e(y.a)}`)).join('')} = ${m.e(X)}.`),
            x.dep ? T(`最後餘額是 ${m.z(bal)}，比 ${m.z(X)} 多，多出來的就是那筆存入：${m.z(bal)} − ${m.z(X)} = ${m.z(v)}。`, `The final balance is ${m.e(bal)}, more than ${m.e(X)}; the difference is the deposit: ${m.e(bal)} − ${m.e(X)} = ${m.e(v)}.`)
              : T(`最後餘額是 ${m.z(bal)}，比 ${m.z(X)} 少，少掉的就是那筆提領：${m.z(X)} − ${m.z(bal)} = ${m.z(v)}。`, `The final balance is ${m.e(bal)}, less than ${m.e(X)}; the difference is the withdrawal: ${m.e(X)} − ${m.e(bal)} = ${m.e(v)}.`),
            T(`驗算：${runZ} ✔。`, `Check: ${runE} ✔.`),
          ],
          hint: T('先算其他每一筆，再看最後差多少。', 'Use all the other entries, then see what is missing.'),
        };
      }
      if (t === 2) {
        const W = bal + (us ? r.int(1, 30) * 100 : r.int(1, 30) * 1000);
        return {
          q: T(`${intro.zh}${mo}/${Math.min(28, days[n] + 1)} ${who[0]}想從帳戶提領 ${m.z(W)}。會怎麼樣？`, `${intro.en} On ${mo}/${Math.min(28, days[n] + 1)}, ${who[1]} wants to withdraw ${m.e(W)}. What happens?`),
          fig,
          ans: ansChoice([T(`不夠，帳戶裡只有 ${m.z(bal)}，不能領 ${m.z(W)}`, `Not enough money: the balance is only ${m.e(bal)}, so ${m.e(W)} cannot be taken out`),
            T(`可以，領完餘額是 ${m.z(bal - W)}`, `It works, and the new balance is ${m.e(bal - W)}`), T(`可以，領完還剩 ${m.z(W - bal)}`, `It works, and ${m.e(W - bal)} is left`)]),
          sol: [
            T(`先算餘額：${steps.zh}。`, `First find the balance: ${steps.en}.`),
            T(`餘額是 ${m.z(bal)}，比想領的 ${m.z(W)} 少 ${m.z(W - bal)}。`, `The balance is ${m.e(bal)}, which is ${m.e(W - bal)} less than ${m.e(W)}.`),
            T(`帳戶裡沒有那麼多錢，所以不能領 ${m.z(W)}；最多只能領 ${m.z(bal)}。`, `The account does not have that much, so ${m.e(W)} cannot be taken out; the most is ${m.e(bal)}.`),
            T('花錢以前先看餘額，就不會領不到錢或付不出來。', 'Check your balance before you spend so you are not caught short.'),
          ],
          hint: T('先算出最後的餘額。', 'Find the final balance first.'),
        };
      }
      return {
        q: T(`${intro.zh}最後的餘額是多少？${m.typeHint.zh}`, `${intro.en} What is the final balance? ${m.typeHint.en}`),
        fig,
        ans: m.ans(bal),
        sol: [
          T(`從一開始的 ${m.z(start)} 算起，存入就加，提領就減。`, `Start from ${m.e(start)}; add deposits and subtract withdrawals.`),
          T(`${steps.zh}。`, `${steps.en}.`),
          T(`所以最後餘額是 ${m.z(bal)}。`, `So the final balance is ${m.e(bal)}.`),
          T('常常對一下存摺，就知道錢花到哪裡、還剩多少。', 'Checking your ledger often shows where your money went and how much is left.'),
        ],
        hint: T('存入加、提領減，一筆一筆來。', 'Add deposits, subtract withdrawals, one line at a time.'),
      };
    },
  },

  // ============================================================ 15. opportunity cost
  {
    id: 'opportunity-cost',
    grades: [4, 8],
    area: 'spend',
    name: T('機會成本', 'Opportunity cost'),
    std: { us: 'Jump$tart · Spending', tw: '金融教育 · 聰明消費' },
    lesson: T('錢和時間都有限，選了一樣，就要放棄其他的。「機會成本」是你放棄的選擇裡「最好的那一個」（第二好的選擇），不是全部放棄的加起來，也不是你選的那一個。',
      'Money and time are limited, so choosing one thing means giving up others. The opportunity cost is the best thing you gave up (your second-best choice). It is not everything you gave up added together, and it is not the thing you chose.'),
    gen(r, cur, g) {
      const m = mon(cur), who = r.pick(KIDS), N = who[0], E = who[1];
      const ord = ['第 1 名', '第 2 名', '第 3 名', '第 4 名'], ordE = ['1st', '2nd', '3rd', '4th'];
      const t = r.int(0, 5);
      if (t === 4) {
        const JOBS = [['📄', '發傳單', 'hand out flyers', 300, 600, 20, 45], ['🐶', '幫鄰居遛狗', 'walk neighbors\' dogs', 200, 500, 15, 40], ['🚗', '幫忙洗車', 'wash cars', 300, 700, 20, 50],
          ['📖', '教小朋友寫功課', 'tutor a younger kid', 400, 800, 25, 60], ['🌿', '幫忙整理花園', 'help out in a garden', 300, 600, 20, 50]];
        let js;
        do js = r.sample(JOBS, 3).map((j) => ({ em: j[0], z: j[1], e: j[2], v: m.tw ? r.int(j[3] / 10, j[4] / 10) * 1000 : r.int(j[5], j[6]) * 100 })); while (new Set(js.map((j) => j.v)).size < 3);
        const s = js.slice().sort((a, b) => b.v - a.v);
        return {
          q: T(`星期六上午，${N}只能做一份工作：${js.map((j) => `${j.em} ${j.z}賺 ${m.z(j.v)}`).join('、')}。${N}選了賺最多的那一份。用金額來看，這個選擇的機會成本是多少？${m.typeHint.zh}`,
            `On Saturday morning, ${E} can do only one job: ${js.map((j) => `${j.em} ${j.e} for ${m.e(j.v)}`).join(', ')}. ${E} picks the job that pays the most. In money, what is the opportunity cost of that choice? ${m.typeHint.en}`),
          ans: m.ans(s[1].v),
          sol: [
            T(`由高到低：${s.map((j) => `${j.z} ${m.z(j.v)}`).join(' > ')}。${N}選了${s[0].z}。`, `From most to least: ${s.map((j) => `${j.e} ${m.e(j.v)}`).join(' > ')}. ${E} picks: ${s[0].e}.`),
            T(`機會成本是放棄的選擇裡最好的那一個：${s[1].z}，價值 ${m.z(s[1].v)}。`, `The opportunity cost is the best choice given up: ${s[1].e}, worth ${m.e(s[1].v)}.`),
            T(`不是把放棄的加起來（${m.z(s[1].v + s[2].v)}），因為就算不選${s[0].z}，${N}也只能做其中一份。`, `It is not the two given-up jobs added together (${m.e(s[1].v + s[2].v)}), because ${E} could only have done one of them anyway.`),
            T(`${N}選得好：賺 ${m.z(s[0].v)}，比機會成本 ${m.z(s[1].v)} 多。`, `A good choice: ${E} earns ${m.e(s[0].v)}, more than the opportunity cost of ${m.e(s[1].v)}.`),
          ],
          hint: T('找第二好的選擇。', 'Find the second-best choice.'),
        };
      }
      if (t === 5) {
        return {
          q: T('「機會成本」是什麼意思？', 'What does "opportunity cost" mean?'),
          ans: ansChoice([T('做選擇時，放棄的選擇裡最好的那一個', 'The best choice you give up when you decide'), T('所有沒有選的東西加起來', 'Everything you did not choose, added together'),
            T('你選的那個東西的價錢', 'The price of the thing you chose'), T('你最後選的那一個', 'The thing you finally chose')]),
          sol: [
            T('時間和錢都有限，選了一樣就要放棄其他的。', 'Time and money are limited, so choosing one thing means giving up others.'),
            T('機會成本是「第二好的選擇」——如果沒選現在這個，你本來會選的那一個。', 'The opportunity cost is your second-best choice: the one you would have picked instead.'),
            T('只算一個，因為就算沒選現在這個，你也只能選另外一個，不能全部都要。', 'Count only one, because even without your choice you could have had only one other thing, not all of them.'),
          ],
          hint: T('想想「本來會選的下一個」。', 'Think of what you would have picked next.'),
        };
      }
      const STORIES = [
        { z: `星期六下午，${N}只有時間做一件事。${N}把想做的事排了順序：`, e: `On Saturday afternoon, ${E} has time for only one thing. ${E} ranks the choices:`, pickZ: `${N}選了第 1 名`, pickE: `${E} chooses the 1st choice`,
          items: [['⚽', '和朋友踢足球', 'play soccer with friends'], ['🎬', '看電影', 'watch a movie'], ['📚', '看漫畫', 'read comics'], ['🏊', '去游泳', 'go swimming'], ['🎨', '上畫畫課', 'go to an art class'], ['🚲', '去公園騎腳踏車', 'ride a bike in the park']] },
        { z: `${N}收到 ${m.z(m.tw ? 100000 : 5000)} 生日禮金，每一個選擇都剛好要花掉全部的錢。${N}排了順序：`, e: `${E} got ${m.e(m.tw ? 100000 : 5000)} for a birthday, and each choice uses up all of it. ${E} ranks the choices:`, pickZ: `${N}選了第 1 名`, pickE: `${E} chooses the 1st choice`,
          items: [['🎲', '買一盒桌遊', 'buy a board game'], ['🛼', '買一雙直排輪', 'buy inline skates'], ['🐷', '存起來買腳踏車', 'save it for a bike'], ['📚', '買一套漫畫', 'buy a set of comic books'], ['🎧', '買一副耳機', 'buy headphones']] },
        { z: '市政府今年的預算只夠蓋一項設施。市議會投票排出順序：', e: 'This year the city budget has room for only one project. The city council votes and ranks them:', pickZ: '市政府蓋了第 1 名', pickE: 'The city builds the 1st choice',
          items: [['🌳', '一座公園', 'a park'], ['📚', '一座圖書館', 'a library'], ['🏊', '一座游泳池', 'a swimming pool'], ['🚲', '自行車道', 'bike lanes'], ['🏀', '籃球場', 'basketball courts']] },
        { z: `放學後，${N}的零用錢只夠買一樣點心。${N}排了順序：`, e: `After school, ${E}'s pocket money buys only one snack. ${E} ranks them:`, pickZ: `${N}買了第 1 名`, pickE: `${E} buys the 1st choice`,
          items: [['🧋', '一杯珍珠奶茶', 'a bubble tea'], ['🍦', '一支冰淇淋', 'an ice cream cone'], ['🍩', '一個甜甜圈', 'a donut'], ['🍓', '一盒水果', 'a cup of fruit']] },
      ];
      const st = STORIES[t], k = g >= 6 ? 4 : 3;
      const its = r.sample(st.items, k);
      const L = (x) => T(`${x[0]} ${x[1]}`, `${x[0]} ${cap(x[2])}`);
      const rank = T(its.map((x, i) => `${ord[i]}：${x[0]} ${x[1]}`).join('；'), its.map((x, i) => `${ordE[i]}: ${x[0]} ${x[2]}`).join('; '));
      return {
        q: T(`${st.z}${rank.zh}。${st.pickZ}，這個選擇的機會成本是什麼？`, `${st.e} ${rank.en}. ${st.pickE}. What is the opportunity cost of this choice?`),
        fig: tbl(['🏅', ''], its.map((x, i) => [String(i + 1), x[0]])),
        ans: ansChoice([L(its[1]), L(its[k - 1]), L(its[0]), T('沒選的全部加起來', 'All the choices not picked, together')]),
        sol: [
          T('機會成本＝放棄的選擇裡最好的那一個，也就是第二好的選擇。', 'Opportunity cost = the best choice given up, which is the second-best choice.'),
          T(`選了第 1 名「${its[0][1]}」，放棄的是${its.slice(1).map((x) => `「${x[1]}」`).join('、')}。`, `Choosing #1 (${its[0][2]}) gives up ${its.slice(1).map((x) => `"${x[2]}"`).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`),
          T(`放棄的裡面最好的是第 2 名「${its[1][1]}」，所以它就是機會成本。`, `The best of those is #2 (${its[1][2]}), so that is the opportunity cost.`),
          T('不是全部加起來，因為就算不選第 1 名，也只能選另外一個。', 'It is not all of them together, because without #1 there would still be room for only one other choice.'),
        ],
        hint: T('如果不能選第 1 名，你會選哪一個？', 'If #1 were not possible, what would be picked?'),
      };
    },
  },

  // ============================================================ 16. profit
  {
    id: 'profit',
    grades: [4, 8],
    area: 'earn',
    name: T('賺了還是賠了？', 'Profit and loss'),
    std: { us: 'Jump$tart · Earning Income', tw: '金融教育 · 收入與工作' },
    lesson: T('收入（營收）＝售價 × 賣出的數量。利潤＝收入 − 成本。如果成本比收入多，就是「虧損」。損益兩平是收入剛好等於成本：至少要賣幾個才不會虧錢。',
      'Revenue = price × number sold. Profit = revenue − cost. If the cost is more than the revenue, it is a loss. Break-even is when revenue just covers the cost: the fewest sales so that you do not lose money.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us', who = r.pick(KIDS);
      const BIZ = [
        { em: '🍋', z: '檸檬汁攤', e: 'lemonade stand', mw: '杯', one: 'cup', many: 'cups', tw: [20, 40], us: [50, 200], sup: [['🍋', '檸檬', 'lemons'], ['🍬', '糖', 'sugar'], ['🥤', '杯子', 'cups']] },
        { em: '🍪', z: '餅乾義賣攤', e: 'cookie sale', mw: '包', one: 'bag', many: 'bags', tw: [30, 60], us: [100, 300], sup: [['🧈', '奶油', 'butter'], ['🌾', '麵粉', 'flour'], ['🛍️', '包裝袋', 'bags']] },
        { em: '📿', z: '手環攤', e: 'bracelet stand', mw: '條', one: 'bracelet', many: 'bracelets', tw: [30, 80], us: [100, 400], sup: [['📿', '珠子', 'beads'], ['🧵', '繩子', 'string'], ['🏷️', '小卡片', 'tags']] },
        { em: '🌱', z: '盆栽攤', e: 'plant stand', mw: '盆', one: 'plant', many: 'plants', tw: [40, 100], us: [200, 500], sup: [['🪴', '花盆', 'pots'], ['🟫', '土', 'soil'], ['🌱', '種子', 'seeds']] },
      ];
      const b = r.pick(BIZ);
      const pr = () => (us ? r.int(b.us[0] / 25, b.us[1] / 25) * 25 : r.int(b.tw[0] / 5, b.tw[1] / 5) * 500);
      const costOf = () => (us ? r.int(4, 30) * 100 + (g >= 6 ? r.pick([0, 25, 50, 75]) : 0) : r.int(5, 40) * 1000);
      const t = r.int(0, g >= 6 ? 3 : 2);
      if (t === 3) {
        let p, v, F, n;
        do {
          p = pr(); v = us ? r.int(1, Math.floor(p / 25) - 1) * 25 : r.int(1, p / 500 - 1) * 500;
          F = us ? r.int(10, 60) * 100 : r.int(20, 100) * 1000; n = cdiv(F, p - v);
        } while (n < 5 || n > 60 || p - v <= 0);
        const mg = p - v;
        const sol = [
          T(`每賣 1 ${b.mw}，扣掉材料費後賺：${m.z(p)} − ${m.z(v)} = ${m.z(mg)}。`, `Each ${b.one} sold earns, after its supplies: ${m.e(p)} − ${m.e(v)} = ${m.e(mg)}.`),
          T(`要賺回攤位費 ${m.z(F)}：${m.z(F)} ÷ ${m.z(mg)} = ${F % mg ? `${Math.floor(F / mg)} 多一點` : n}。`, `To earn back the ${m.e(F)} booth fee: ${m.e(F)} ÷ ${m.e(mg)} = ${F % mg ? `a bit more than ${Math.floor(F / mg)}` : n}.`),
        ];
        if (F % mg) sol.push(T(`賣 ${n - 1} ${b.mw}只賺回 ${m.z((n - 1) * mg)}，還不夠；要無條件進位成 ${n} ${b.mw}：${n} × ${m.z(mg)} = ${m.z(n * mg)} ≥ ${m.z(F)} ✔。`, `Selling ${n - 1} earns back only ${m.e((n - 1) * mg)}, not enough; round up to ${n}: ${n} × ${m.e(mg)} = ${m.e(n * mg)} ≥ ${m.e(F)} ✔.`));
        else sol.push(T(`${n} × ${m.z(mg)} = ${m.z(F)}，剛好打平 ✔。`, `${n} × ${m.e(mg)} = ${m.e(F)}, exactly break-even ✔.`));
        sol.push(T('賣超過這個數量，多賣的才是真正的利潤。', 'Every sale beyond this number is real profit.'));
        return {
          q: T(`${who[0]}在園遊會擺 ${b.em} ${b.z}，攤位費 ${m.z(F)}。每${b.mw}賣 ${m.z(p)}，每${b.mw}的材料費是 ${m.z(v)}。至少要賣幾${b.mw}才不會虧錢？`,
            `${who[1]} runs a ${b.em} ${b.e} at a fair. The booth costs ${m.e(F)}. Each ${b.one} sells for ${m.e(p)}, and the supplies for each one cost ${m.e(v)}. What is the fewest number of ${b.many} ${who[1]} must sell to not lose money?`),
          ans: ansNum(n),
          sol,
          hint: T('每賣一個真正賺多少？要賺回攤位費需要幾個？', 'How much does each sale really earn? How many to cover the booth?'),
        };
      }
      let p, q, R, sup, C, loss;
      const wantLoss = t === 2 && r.chance(0.5);
      do {
        p = pr(); q = r.int(10, 40); R = p * q;
        sup = b.sup.map((s) => [s, costOf()]); C = sum(sup.map((s) => s[1]));
        loss = C > R;
      } while ((t === 2 ? loss !== wantLoss : loss) || C === R || 2 * C === R || C === 2 * R);
      const fig = tbl(['', '💰'], sup.map((s) => [s[0][0], m.e(s[1])]));
      const supZ = sup.map((s) => `${s[0][0]} ${s[0][1]}`).join('、'), supE = sup.map((s) => `${s[0][0]} ${s[0][2]}`).join(', ');
      const story = T(`${who[0]}擺了一個 ${b.em} ${b.z}，材料（${supZ}）的花費如表。每${b.mw}賣 ${m.z(p)}，一共賣出 ${q} ${b.mw}。`,
        `${who[1]} runs a ${b.em} ${b.e}. The supplies (${supE}) cost what the table shows. Each ${b.one} sells for ${m.e(p)}, and ${who[1]} sells ${q} ${b.many}.`);
      const s1 = T(`收入＝售價 × 數量：${m.z(p)} × ${q} = ${m.z(R)}。`, `Revenue = price × quantity: ${m.e(p)} × ${q} = ${m.e(R)}.`);
      const s2 = T(`成本：${sup.map((s) => m.z(s[1])).join(' + ')} = ${m.z(C)}。`, `Cost: ${sup.map((s) => m.e(s[1])).join(' + ')} = ${m.e(C)}.`);
      if (t === 1) {
        if (g >= 5 && r.chance(0.5)) {
          return {
            q: T(`${who[0]}的${b.em} ${b.z}每${b.mw}賣 ${m.z(p)}，今天收入一共 ${m.z(R)}。賣出了幾${b.mw}？`, `${who[1]}'s ${b.em} ${b.e} sells each ${b.one} for ${m.e(p)}. Today's revenue is ${m.e(R)}. How many ${b.many} were sold?`),
            ans: ansNum(q),
            sol: [T('收入＝售價 × 數量，所以 數量＝收入 ÷ 售價。', 'Revenue = price × quantity, so quantity = revenue ÷ price.'), T(`${m.z(R)} ÷ ${m.z(p)} = ${q}。`, `${m.e(R)} ÷ ${m.e(p)} = ${q}.`), T(`驗算：${m.z(p)} × ${q} = ${m.z(R)} ✔。`, `Check: ${m.e(p)} × ${q} = ${m.e(R)} ✔.`)],
            hint: T('收入 ÷ 售價。', 'Revenue ÷ price.'),
          };
        }
        return {
          q: T(`${story.zh}收入（賣東西收到的錢）是多少？${m.typeHint.zh}`, `${story.en} What is the revenue (the money taken in from sales)? ${m.typeHint.en}`),
          fig,
          ans: m.ans(R),
          sol: [s1, T(`收入是收到的錢，還沒扣掉成本。`, `Revenue is the money taken in, before costs are taken out.`), T(`要知道真的賺多少，還要減掉成本 ${m.z(C)}${C < R ? `：利潤 ${m.z(R - C)}` : ''}。`, `To see what was really earned, subtract the cost of ${m.e(C)}${C < R ? `: profit ${m.e(R - C)}` : ''}.`)],
          hint: T('售價 × 數量。', 'Price × quantity.'),
        };
      }
      if (t === 2) {
        const d = R - C, ad = Math.abs(d);
        const P = T(`賺了 ${m.z(ad)}（利潤）`, `A profit of ${m.e(ad)}`), Lo = T(`虧了 ${m.z(ad)}（虧損）`, `A loss of ${m.e(ad)}`);
        return {
          q: T(`${story.zh}${who[0]}是賺錢還是虧錢？多少？`, `${story.en} Did ${who[1]} make a profit or a loss, and how much?`),
          fig,
          ans: ansChoice([d > 0 ? P : Lo, d > 0 ? Lo : P, T(`賺了 ${m.z(R)}`, `A profit of ${m.e(R)}`)]),
          sol: [s1, s2,
            T(`收入 − 成本：${m.z(R)} − ${m.z(C)} = ${m.z(d)}。`, `Revenue − cost: ${m.e(R)} − ${m.e(C)} = ${m.e(d)}.`),
            d > 0 ? T(`結果是正的，所以是賺了 ${m.z(ad)}。`, `It is positive, so it is a profit of ${m.e(ad)}.`) : T(`結果是負的，成本比收入多，所以是虧了 ${m.z(ad)}。`, `It is negative (cost is more than revenue), so it is a loss of ${m.e(ad)}.`),
            T(`收到 ${m.z(R)} 不等於賺 ${m.z(R)}，一定要扣掉成本。`, `Taking in ${m.e(R)} is not the same as earning ${m.e(R)}; always subtract the cost.`)],
          hint: T('收入 − 成本，看是正的還是負的。', 'Revenue − cost: is it positive or negative?'),
        };
      }
      return {
        q: T(`${story.zh}利潤是多少？${m.typeHint.zh}`, `${story.en} What is the profit? ${m.typeHint.en}`),
        fig,
        ans: m.ans(R - C),
        sol: [s1, s2, T(`利潤＝收入 − 成本：${m.z(R)} − ${m.z(C)} = ${m.z(R - C)}。`, `Profit = revenue − cost: ${m.e(R)} − ${m.e(C)} = ${m.e(R - C)}.`), T('只看收入會以為賺很多，扣掉成本才是真正賺到的。', 'Revenue alone looks big; profit is what is left after costs.')],
        hint: T('先算收入，再減成本。', 'Find the revenue, then subtract the cost.'),
      };
    },
  },

  // ============================================================ 17. simple interest
  {
    id: 'simple-interest',
    grades: [6, 9],
    area: 'save',
    name: T('單利計算', 'Simple interest'),
    std: { us: 'Jump$tart · Saving', tw: '金融教育 · 儲蓄' },
    lesson: T('把錢存在銀行，銀行會付你利息。單利只用「本金」算利息：利息 I = 本金 P × 年利率 r × 年數 t。本利和＝本金 + 利息。',
      'When you keep money in a bank, the bank pays you interest. Simple interest is figured only on the starting amount (the principal): I = P × r × t, where r is the yearly rate and t is the number of years. Total = principal + interest.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us', who = r.pick(KIDS);
      const rates = m.tw ? (g >= 7 ? [100, 150, 200, 250, 300] : [100, 200, 300]) : g >= 7 ? [100, 150, 200, 250, 300, 350, 400, 450, 500] : [100, 200, 300, 400, 500];
      const Ps = us ? [200, 250, 400, 500, 800, 1000, 1200, 1500, 2000, 2500, 4000, 5000].map((x) => x * 100) : [10000, 20000, 30000, 40000, 50000, 60000, 80000, 100000, 120000, 150000, 200000].map((x) => x * 100);
      const ok = (c) => Number.isInteger(c) && (!m.tw || c % 100 === 0);
      const t = r.int(0, g >= 8 ? 4 : 3);
      let P, bp, yrs, mo = 0, I;
      do {
        P = r.pick(Ps); bp = r.pick(rates);
        if (t === 4) { mo = r.pick([3, 6, 9, 18]); I = (P * bp * mo) / 120000; } else { yrs = r.int(t === 3 ? 2 : 1, g >= 7 ? 5 : 3); I = (P * bp * yrs) / 10000; }
      } while (!ok(I));
      const pct = num(bp / 100);
      const acct = m.tw ? T('銀行定存', 'a bank time deposit') : T('儲蓄帳戶', 'a savings account');
      const say = (yy) => T(`${who[0]}把 ${m.z(P)} 存進${acct.zh}，假設年利率 ${pct}%，用單利計算，存 ${yy.zh}。`, `${who[1]} puts ${m.e(P)} into ${acct.en} that pays ${pct}% simple interest per year, for ${yy.en}.`);
      const Y = (y) => T(`${y} 年`, pl(y, 'year', 'years'));
      const core = (yy, tt) => [
        T('單利：利息 I = 本金 P × 年利率 r × 時間 t（年）。', 'Simple interest: I = P × r × t (t in years).'),
        T(`I = ${m.z(P)} × ${pct}% × ${tt} = ${m.z(I)}。`, `I = ${m.e(P)} × ${pct}% × ${tt} = ${m.e(I)}.`),
      ];
      if (t === 4) {
        const yy = T(`${mo} 個月`, `${mo} months`), tt = mo === 6 ? '0.5' : `${mo}/12`;
        return {
          q: T(`${say(yy).zh}可以拿到多少利息？${m.typeHint.zh}`, `${say(yy).en} How much interest does ${who[1]} earn? ${m.typeHint.en}`),
          ans: m.ans(I),
          sol: [T(`時間要換成年：${mo} 個月 = ${mo}/12 年${mo === 6 ? ' = 0.5 年' : ''}。`, `Change the time to years: ${mo} months = ${mo}/12 of a year${mo === 6 ? ' = 0.5 year' : ''}.`), ...core(yy, tt),
            T(`一年的利息是 ${m.z((P * bp) / 10000)}，${mo} 個月是它的 ${mo}/12。`, `One year's interest is ${m.e((P * bp) / 10000)}; ${mo} months is ${mo}/12 of that.`)],
          hint: T('利率是「每年」的，月數要先除以 12。', 'The rate is per year, so divide the months by 12.'),
        };
      }
      const yy = Y(yrs);
      if (t === 2) {
        return {
          q: T(`${who[0]}把 ${m.z(P)} 存進${acct.zh}，用單利計算，${yrs} 年後拿到利息 ${m.z(I)}。年利率是多少 %？`, `${who[1]} puts ${m.e(P)} into ${acct.en} with simple interest and earns ${m.e(I)} of interest in ${yy.en}. What is the yearly interest rate, in percent?`),
          ans: ansNum(bp / 100),
          sol: [
            T('I = P × r × t，所以 r = I ÷ (P × t)。', 'I = P × r × t, so r = I ÷ (P × t).'),
            T(`每年的利息：${m.z(I)} ÷ ${yrs} = ${m.z(I / yrs)}。`, `Interest per year: ${m.e(I)} ÷ ${yrs} = ${m.e(I / yrs)}.`),
            T(`r = ${m.z(I / yrs)} ÷ ${m.z(P)} = ${num(bp / 10000)} = ${pct}%。`, `r = ${m.e(I / yrs)} ÷ ${m.e(P)} = ${num(bp / 10000)} = ${pct}%.`),
            T(`驗算：${m.z(P)} × ${pct}% × ${yrs} = ${m.z(I)} ✔。`, `Check: ${m.e(P)} × ${pct}% × ${yrs} = ${m.e(I)} ✔.`),
          ],
          hint: T('先算一年拿多少利息。', 'Find one year\'s interest first.'),
        };
      }
      if (t === 3) {
        const one = (P * bp) / 10000;
        if (!ok(one)) return this.gen(r, cur, g);
        return {
          q: T(`${who[0]}把 ${m.z(P)} 存進${acct.zh}，假設年利率 ${pct}%，用單利計算。要存幾年，利息才會剛好是 ${m.z(I)}？`, `${who[1]} puts ${m.e(P)} into ${acct.en} that pays ${pct}% simple interest per year. How many years until the interest is exactly ${m.e(I)}?`),
          ans: ansNum(yrs),
          sol: [
            T('I = P × r × t，所以 t = I ÷ (P × r)。', 'I = P × r × t, so t = I ÷ (P × r).'),
            T(`一年的利息：${m.z(P)} × ${pct}% = ${m.z(one)}。`, `One year's interest: ${m.e(P)} × ${pct}% = ${m.e(one)}.`),
            T(`t = ${m.z(I)} ÷ ${m.z(one)} = ${yrs} 年。`, `t = ${m.e(I)} ÷ ${m.e(one)} = ${pl(yrs, 'year', 'years')}.`),
            T('單利每年拿到的利息都一樣，因為只用本金算。', 'With simple interest, each year pays the same amount, because only the principal earns interest.'),
          ],
          hint: T('先算一年的利息。', 'Find one year\'s interest.'),
        };
      }
      if (t === 1) {
        return {
          q: T(`${say(yy).zh}到期時一共可以拿回多少錢（本金加利息）？${m.typeHint.zh}`, `${say(yy).en} How much will ${who[1]} have at the end (principal plus interest)? ${m.typeHint.en}`),
          ans: m.ans(P + I),
          sol: [...core(yy, yrs), T(`本利和＝本金 + 利息：${m.z(P)} + ${m.z(I)} = ${m.z(P + I)}。`, `Total = principal + interest: ${m.e(P)} + ${m.e(I)} = ${m.e(P + I)}.`), T('存得越久、利率越高，利息就越多。', 'The longer you save and the higher the rate, the more interest you earn.')],
          hint: T('先算利息，再加上本金。', 'Find the interest, then add the principal.'),
        };
      }
      return {
        q: T(`${say(yy).zh}可以拿到多少利息？${m.typeHint.zh}`, `${say(yy).en} How much interest does ${who[1]} earn? ${m.typeHint.en}`),
        ans: m.ans(I),
        sol: [...core(yy, yrs), T(`也就是每年 ${m.z(I / yrs)}，${yrs} 年一共 ${m.z(I)}。`, `That is ${m.e(I / yrs)} each year, ${m.e(I)} over ${yy.en}.`), T('單利只用本金算利息，利息不會再生利息。', 'Simple interest is paid only on the principal; interest does not earn more interest.')],
        hint: T('本金 × 年利率 × 年數。', 'Principal × rate × years.'),
      };
    },
  },

  // ============================================================ 18. bundle deals
  {
    id: 'bundle-deals',
    grades: [5, 8],
    area: 'spend',
    name: T('哪個優惠最省？', 'Which deal saves more?'),
    std: { us: 'Jump$tart · Spending', tw: '金融教育 · 聰明消費' },
    lesson: T('商店常用不同的優惠：第二件半價、買二送一、打折。哪一個最省，要看你買幾件——把每一種優惠實際要付的錢算出來再比，不要只看廣告。',
      'Stores use different deals: buy one get one 50% off, buy 2 get 1 free, a percent off. Which saves most depends on how many you buy, so work out what you would really pay with each deal before you decide.'),
    gen(r, cur, g) {
      const m = mon(cur), us = cur === 'us', tw = m.tw, who = r.pick(KIDS);
      const items = tw ? [['飲料', '瓶', 'drink', 'drinks', 20, 40], ['雙襪子', '雙', 'pair of socks', 'pairs of socks', 50, 150], ['本筆記本', '本', 'notebook', 'notebooks', 30, 80], ['瓶洗髮精', '瓶', 'bottle of shampoo', 'bottles of shampoo', 100, 250], ['盒冰淇淋', '盒', 'tub of ice cream', 'tubs of ice cream', 60, 150]]
        : [['盒穀片', '盒', 'box of cereal', 'boxes of cereal', 200, 600], ['雙襪子', '雙', 'pair of socks', 'pairs of socks', 300, 900], ['本筆記本', '本', 'notebook', 'notebooks', 200, 500], ['瓶洗髮精', '瓶', 'bottle of shampoo', 'bottles of shampoo', 400, 1000], ['盒冰淇淋', '盒', 'tub of ice cream', 'tubs of ice cream', 300, 800]];
      const it = r.pick(items);
      const D = {
        half: { z: tw ? '第二件半價' : '買一件，第二件半價（buy one, get one 50% off）', e: tw ? 'second item half price' : 'buy one, get one 50% off',
          cost: (n, u) => n * u - Math.floor(n / 2) * (u / 2),
          how: (n, u) => T(`每 2 件裡第 2 件半價：${n} 件裡有 ${Math.floor(n / 2)} 件半價（${m.z(u / 2)}），${n - Math.floor(n / 2)} 件原價。`, `In every 2, the second is half price: of ${n} items, ${Math.floor(n / 2)} cost ${m.e(u / 2)} and ${n - Math.floor(n / 2)} cost full price.`),
          calc: (n, u) => [`${n - Math.floor(n / 2)} × ${m.z(u)} + ${Math.floor(n / 2)} × ${m.z(u / 2)}`, `${n - Math.floor(n / 2)} × ${m.e(u)} + ${Math.floor(n / 2)} × ${m.e(u / 2)}`] },
        b2g1: { z: tw ? '買二送一' : '買二送一（buy 2, get 1 free）', e: 'buy 2, get 1 free',
          cost: (n, u) => (n - Math.floor(n / 3)) * u,
          how: (n) => T(`每 3 件有 1 件免費：${n} 件裡 ${Math.floor(n / 3)} 件免費，要付 ${n - Math.floor(n / 3)} 件。`, `In every 3, one is free: of ${n} items, ${Math.floor(n / 3)} ${Math.floor(n / 3) === 1 ? 'is' : 'are'} free and you pay for ${n - Math.floor(n / 3)}.`),
          calc: (n, u) => [`${n - Math.floor(n / 3)} × ${m.z(u)}`, `${n - Math.floor(n / 3)} × ${m.e(u)}`] },
      };
      const pctDeal = (p) => ({ pct: true, z: tw ? `全部打 ${p % 10 ? p : p / 10} 折` : `全部 ${100 - p}% off（付 ${p}%）`, e: `${100 - p}% off everything`,
        cost: (n, u) => (n * u * p) / 100,
        how: (n, u) => T(`原價一共 ${n} × ${m.z(u)} = ${m.z(n * u)}，${tw ? `打 ${p % 10 ? p : p / 10} 折` : `便宜 ${100 - p}% `}就是付 ${p}%。`, `Full price is ${n} × ${m.e(u)} = ${m.e(n * u)}; ${100 - p}% off means paying ${p}%.`),
        calc: (n, u) => [`${m.z(n * u)} × ${p}%`, `${m.e(n * u)} × ${p}%`] });
      const k = g >= 7 ? 3 : 2;
      let deals, n, u, costs;
      for (let guard = 0; ; guard++) {
        n = r.int(2, g >= 6 ? 9 : 6);
        u = us ? r.int(it[4] / 20, it[5] / 20) * 20 : r.int(it[4] / 2, it[5] / 2) * 200;
        const p = r.pick([60, 65, 70, 75, 80]);
        const pool = [D.half, D.b2g1, pctDeal(p)];
        deals = k === 3 ? r.shuffle(pool) : r.sample(pool, 2);
        costs = deals.map((d) => d.cost(n, u));
        if (costs.every((c) => Number.isInteger(c) && (!tw || c % 100 === 0) && c < n * u) && new Set(costs).size === costs.length) break;
        if (guard > 500) throw new Error('no deal');
      }
      const stores = deals.map((d, i) => ({ d, c: costs[i], L: ABC[i], LZ: ['甲', '乙', '丙'][i] }));
      const head = T(`${who[0]}要買剛好 ${n} ${it[1]}${it[0].replace(/^[盒雙本瓶]/, '')}，每${it[1]}原價 ${m.z(u)}。`, `${who[1]} needs exactly ${n} ${it[3]}; the regular price is ${m.e(u)} each.`);
      const work = (s) => T(`${s.LZ}店（${s.d.z}）：${s.d.how(n, u).zh}${s.d.calc(n, u)[0]} = ${m.z(s.c)}。`, `Store ${s.L} (${s.d.e}): ${s.d.how(n, u).en} ${s.d.calc(n, u)[1]} = ${m.e(s.c)}.`);
      const best = stores.reduce((a, b) => (b.c < a.c ? b : a));
      const t = r.int(0, 2);
      if (t === 0) {
        return {
          q: T(`${head.zh}${stores.map((s) => `${s.LZ}店：${s.d.z}`).join('；')}。哪一家最便宜？`, `${head.en} ${stores.map((s) => `Store ${s.L}: ${s.d.e}`).join('. ')}. Which store costs the least?`),
          ans: ansChoice([best, ...stores.filter((s) => s !== best)].map((s) => T(`${s.LZ}店`, `Store ${s.L}`))),
          sol: [...stores.map(work), T(`${best.LZ}店${k === 2 ? '比較' : '最'}便宜，只要 ${m.z(best.c)}。買幾件會影響哪個優惠最划算，所以要實際算。`, `Store ${best.L} is ${k === 2 ? 'cheaper' : 'cheapest'} at ${m.e(best.c)}. The best deal depends on how many you buy, so always work it out.`)],
          hint: T('把每一家實際要付的錢都算出來。', 'Work out what you would pay at each store.'),
        };
      }
      const s = r.pick(stores);
      if (t === 1) {
        return {
          q: T(`${head.zh}商店的優惠是「${s.d.z}」。一共要付多少錢？${m.typeHint.zh}`, `${head.en} The store's deal is "${s.d.e}". How much does ${who[1]} pay in all? ${m.typeHint.en}`),
          ans: m.ans(s.c),
          sol: [s.d.how(n, u), T(`${s.d.calc(n, u)[0]} = ${m.z(s.c)}。`, `${s.d.calc(n, u)[1]} = ${m.e(s.c)}.`), T(`比原價 ${n} × ${m.z(u)} = ${m.z(n * u)} 省了 ${m.z(n * u - s.c)}。`, `That saves ${m.e(n * u - s.c)} compared with the full ${n} × ${m.e(u)} = ${m.e(n * u)}.`)],
          hint: T('想清楚哪幾件打折、哪幾件原價。', 'Work out which items are discounted and which are full price.'),
        };
      }
      return {
        q: T(`${head.zh}用「${s.d.z}」的優惠，比全部原價省多少錢？${m.typeHint.zh}`, `${head.en} With the deal "${s.d.e}", how much does ${who[1]} save compared with paying full price? ${m.typeHint.en}`),
        ans: m.ans(n * u - s.c),
        sol: [...(s.d.pct ? [] : [T(`全部原價：${n} × ${m.z(u)} = ${m.z(n * u)}。`, `Full price: ${n} × ${m.e(u)} = ${m.e(n * u)}.`)]), s.d.how(n, u), T(`用優惠：${s.d.calc(n, u)[0]} = ${m.z(s.c)}。`, `With the deal: ${s.d.calc(n, u)[1]} = ${m.e(s.c)}.`), T(`省下：${m.z(n * u)} − ${m.z(s.c)} = ${m.z(n * u - s.c)}。`, `Saved: ${m.e(n * u)} − ${m.e(s.c)} = ${m.e(n * u - s.c)}.`)],
        hint: T('原價總額 − 優惠後的價錢。', 'Full price − deal price.'),
      };
    },
  },
];
