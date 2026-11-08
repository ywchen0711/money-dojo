// Two complete example units showing the format (not loaded by the site). See SPEC.md.
import { T, num } from '../util.js';
import { mon, pile, fewest, tallyText, ansCents, denoms, fmCents } from '../money.js';

const KIDS = [['小明', 'Max'], ['小美', 'Mia'], ['阿傑', 'Jay'], ['欣怡', 'Emma'], ['志豪', 'Leo'], ['雅婷', 'Ava']];

export default [
  {
    id: 'count-coins',
    grades: [1, 2],
    area: 'spend',
    name: T('數一數有多少錢', 'Count the coins'),
    std: { us: 'Jump$tart · Spending', tw: '國小數學 · 認識錢幣' },
    lesson: T('數錢時，先從面額最大的開始數，再一個一個往上加。這樣比較快，也比較不會數錯。',
      'When you count money, start with the biggest coins, then count on with the smaller ones. It is faster and you make fewer mistakes.'),
    gen(r, cur, g) {
      const m = mon(cur);
      // TW: coins up to 50; grade 2 adds a 100 bill sometimes. US: coins only, total below a dollar in grade 1.
      const ds = cur === 'tw' ? (g >= 2 ? [100, 500, 1000, 5000, 10000] : [100, 500, 1000]) : g >= 2 ? [1, 5, 10, 25] : [1, 5, 10];
      let list, total;
      do {
        const k = r.int(3, g >= 2 ? 8 : 6);
        list = Array.from({ length: k }, () => r.pick(ds));
        total = list.reduce((s, x) => s + x, 0);
      } while (cur === 'us' && total >= 100);
      const sorted = list.slice().sort((a, b) => b - a);
      // running total "50, 60, 65, 66"
      let run = 0; const steps = sorted.map((d) => (run += d));
      const show = (c, lang) => (cur === 'us' ? fmCents(c, lang) : lang === 'zh' ? `${c / 100} 元` : `NT$${c / 100}`);
      const who = r.pick(KIDS);
      return {
        q: r.chance(0.5)
          ? T(`${who[0]}的存錢筒裡有這些錢。一共是多少${cur === 'us' ? '分' : '元'}？`, `${who[1]}'s piggy bank has this money. How much is it in all${cur === 'us' ? ', in cents' : ''}?`)
          : T(`下面一共有多少${cur === 'us' ? '分' : '元'}？`, `How much money is shown${cur === 'us' ? ' (in cents)' : ''}?`),
        fig: pile(list, cur),
        ans: cur === 'us' ? ansCents(total) : m.ans(total),
        sol: [
          T(`先把錢從大排到小：${tallyText(list, cur).zh}。`, `Sort from biggest to smallest: ${tallyText(list, cur).en}.`),
          T(`從最大的開始往上數：${steps.map((c) => show(c, 'zh')).join('、')}。`, `Count on from the biggest: ${steps.map((c) => show(c, 'en')).join(', ')}.`),
          T(`一共是 ${show(total, 'zh')}。`, `In all: ${show(total, 'en')}.`),
        ],
        hint: T('先數最大的錢，再往上加。', 'Start with the biggest one and count on.'),
      };
    },
  },
  {
    id: 'make-change',
    grades: [2, 4],
    area: 'spend',
    name: T('找錢', 'Making change'),
    std: { us: 'Jump$tart · Spending', tw: '國小數學 · 錢幣的加減' },
    lesson: T('找錢＝付的錢 − 價錢。店員常用「往上數」的方法：從價錢開始，一直加到付的錢，加了多少就找多少。',
      'Change = money paid − price. Cashiers often "count up": start at the price and add coins until they reach the amount paid. What they added is the change.'),
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
      const item = r.pick([['一個鉛筆盒', 'a pencil case'], ['一本故事書', 'a storybook'], ['一盒蠟筆', 'a box of crayons'], ['一顆球', 'a ball'], ['一個便當', 'a lunch box meal']]);
      return {
        q: T(`${item[0]}賣 ${m.zf(price)}。你付了 ${m.zf(paid)}，應該找回多少錢？${m.typeHint.zh}`,
          `${item[1][0].toUpperCase() + item[1].slice(1)} costs ${m.ef(price)}. You pay ${m.ef(paid)}. How much change should you get? ${m.typeHint.en}`),
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
];
export { num, denoms };
