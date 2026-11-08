// Grades 7–12: budgeting, interest, inflation, paychecks, credit, loans, investing, insurance, net worth, scams,
// emergency funds, installments and income tax. See SPEC.md.
// Inside the generators money is kept in "units": cents in US mode, whole NT dollars (元) in Taiwan mode, so every
// rounding (rdiv, pctOf, grow, loanPayment, monthInterest) lands on a whole cent / a whole 元. k.z(x) / k.e(x) format.
import { T, num, ansNum, ansChoice } from '../util.js';
import { mon, rdiv, pctOf, grow, loanPayment, monthInterest } from '../money.js';

const KIDS = [['小明', 'Max'], ['小美', 'Mia'], ['阿傑', 'Jay'], ['欣怡', 'Emma'], ['志豪', 'Leo'], ['雅婷', 'Ava'], ['家豪', 'Noah'], ['佳穎', 'Lily']];

// ---- private helpers ----
function kit(cur) {
  const m = mon(cur), tw = cur === 'tw', U = tw ? 100 : 1, D = tw ? 1 : 100;
  return {
    m, tw, U, D,
    z: (x) => m.z(x * U),
    e: (x) => m.e(x * U),
    ans: (x) => m.ans(x * U),
    d: (dollars) => dollars * D,               // whole dollars / 元 → units
    hint: m.typeHint,
    rnd: T(tw ? '四捨五入到整數元' : '四捨五入到美分', tw ? 'rounded to the nearest NT dollar' : 'rounded to the nearest cent'),
    rto: tw ? 'to the nearest NT dollar' : 'to the nearest cent',
  };
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const pc = (x) => `${num(x)}%`;
const bpP = (bp) => `${num(bp / 100)}%`;
// a/b as a percent rounded to one decimal place (half-up), exact integer math
function pct1(a, b) { const neg = a < 0 !== b < 0 && a !== 0; const v = rdiv(Math.abs(a) * 1000, Math.abs(b)) / 10; return neg ? -v : v; }
const ceilDiv = (a, b) => Math.floor((a + b - 1) / b);
// monthly compounding: c · (1 + apr/12)^months, rounded to the unit, exact
function growM(c, aprBp, months) { const A = BigInt(120000 + aprBp) ** BigInt(months), B = 120000n ** BigInt(months); return Number(rdiv(BigInt(c) * A, B)); }
const factorText = (bp, n) => (((10000 + bp) / 10000) ** n).toFixed(4);
function table(head, rows) {
  const h = head ? `<tr>${head.map((x) => `<th>${x}</th>`).join('')}</tr>` : '';
  return `<table class="tbl">${h}${rows.map((rw) => `<tr>${rw.map((x) => `<td>${x}</td>`).join('')}</tr>`).join('')}</table>`;
}
// pay off a card: each month interest (rounded) is added, then the payment (the last one is what is left)
function payoff(bal, aprBp, pay) {
  let b = bal, months = 0, interest = 0; const rows = [];
  while (b > 0) {
    const i = monthInterest(b, aprBp); b += i; interest += i;
    const p = Math.min(pay, b); b -= p; months++; rows.push({ i, p, b });
    if (months > 1000) return null;
  }
  return { months, interest, rows, paid: bal + interest };
}

const BUD = [T('需要', 'needs'), T('想要', 'wants'), T('儲蓄與還債', 'savings and debt payoff')];
const SHARE = [50, 30, 20];

export default [
  // 1 ──────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'budget-503020',
    grades: [7, 10],
    area: 'save',
    name: T('50/30/20 預算法', 'The 50/30/20 budget'),
    std: { us: 'Jump$tart · Saving', tw: '金融教育 · 儲蓄' },
    lesson: T('50/30/20 是一個常見的預算參考原則，不是法律：每月稅後收入的 50% 給「需要」（房租、伙食、水電），30% 給「想要」（外食、娛樂），20% 拿去儲蓄或多還債。比例可以依自己的情況調整，重點是先把儲蓄排進計畫。',
      'The 50/30/20 rule is a common budgeting guideline, not a law: 50% of your monthly after-tax income goes to needs (rent, groceries, utilities), 30% to wants (eating out, fun) and 20% to savings or extra debt payments. You can adjust the split to your situation; the key idea is to plan your saving first.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const inc = k.tw ? r.int(28, 60) * 1000 : k.d(r.int(24, 50) * 100);
      const kinds = ['part', 'part', 'classify', 'check'];
      if (g >= 8) kinds.push('reverse');
      if (g >= 9) kinds.push('left', 'left');
      const t = r.pick(kinds);
      const intro = T(`50/30/20 原則：稅後收入的 50% 給需要、30% 給想要、20% 給儲蓄與還債。`, `The 50/30/20 guideline: 50% of after-tax income for needs, 30% for wants, 20% for savings and debt payoff.`);
      if (t === 'part') {
        const i = r.int(0, 2), s = SHARE[i], a = (inc * s) / 100;
        return {
          q: T(`${wz}每月的稅後收入是 ${k.z(inc)}。按照 50/30/20 原則，每月應該放多少錢在「${BUD[i].zh}」？${k.hint.zh}`,
            `${we}'s monthly after-tax income is ${k.e(inc)}. Under the 50/30/20 guideline, how much should go to ${BUD[i].en} each month? ${k.hint.en}`),
          ans: k.ans(a),
          sol: [intro,
            T(`${BUD[i].zh}：${k.z(inc)} × ${s}% = ${k.z(a)}。`, `${cap(BUD[i].en)}: ${k.e(inc)} × ${s}% = ${k.e(a)}.`),
            T(`三份分別是 ${k.z(inc / 2)}、${k.z((inc * 3) / 10)}、${k.z(inc / 5)}，加起來正好 ${k.z(inc)} ✔。`, `The three parts are ${k.e(inc / 2)}, ${k.e((inc * 3) / 10)} and ${k.e(inc / 5)}; together exactly ${k.e(inc)} ✔.`),
            T('這是參考原則，不是規定：房租很貴的城市，需要可能超過 50%，就從想要那一份調整。', 'It is a guideline, not a law: where rent is high, needs may take more than 50%, so trim the wants instead.')],
          hint: T(`算出收入的 ${s}%。`, `Find ${s}% of the income.`),
        };
      }
      if (t === 'classify') {
        const ITEMS = [
          [[T('房租', 'rent'), T('買菜的錢（日常食物）', 'groceries'), T('水電費', 'the electricity and water bill'), T('上班的公車票錢', 'bus fare to get to work')]],
          [[T('影音串流訂閱', 'a streaming subscription'), T('和朋友去餐廳吃飯', 'eating out at a restaurant with friends'), T('演唱會門票', 'a concert ticket'), T('新出的電玩遊戲', 'a new video game')]],
          [[T('存進緊急預備金', 'money put into an emergency fund'), T('存進退休帳戶', 'a deposit into a retirement account'), T('比最低應繳金額多還的貸款', 'an extra loan payment above the minimum')]],
        ];
        const c = r.int(0, 2), item = r.pick(ITEMS[c][0]);
        const opts = [T('需要（50%）', 'Needs (50%)'), T('想要（30%）', 'Wants (30%)'), T('儲蓄與還債（20%）', 'Savings and debt payoff (20%)')];
        const why = [T('沒有它就無法正常生活或工作，所以是需要。', 'You cannot live or work normally without it, so it is a need.'),
          T('它讓生活更有趣，但沒有它也能過日子，所以是想要。', 'It makes life more fun, but you can live without it, so it is a want.'),
          T('這筆錢是為了未來的自己：存起來或提早還清債務，屬於 20% 那一份。', 'This money is for your future self: saving it or paying debt off early belongs in the 20% part.')];
        return {
          q: T(`${wz}用 50/30/20 原則做預算。「${item.zh}」應該放在哪一類？`, `${we} budgets with the 50/30/20 guideline. Which part does "${item.en}" belong to?`),
          ans: ansChoice([opts[c], ...opts.filter((_, j) => j !== c)]),
          sol: [intro, why[c], T(`所以「${item.zh}」屬於${opts[c].zh}。`, `So "${item.en}" goes under ${opts[c].en}.`),
            T('判斷方法：問自己「沒有它，我還能正常生活嗎？」以及「這筆錢是不是為了未來？」', 'A quick test: "Could I still live normally without it?" and "Is this money for my future?"')],
        };
      }
      if (t === 'check') {
        const s = SHARE.slice(); let over = -1;
        if (r.chance(0.75)) { over = r.int(0, 2); let under; do under = r.int(0, 2); while (under === over); const d = r.pick([5, 10, 15].filter((x) => x < s[under])); s[over] += d; s[under] -= d; }
        const a = s.map((x) => (inc * x) / 100);
        const opts = [T('需要', 'Needs'), T('想要', 'Wants'), T('儲蓄與還債', 'Savings and debt payoff'), T('都沒有超過，完全符合', 'None — it matches 50/30/20 exactly')];
        const right = over < 0 ? 3 : over;
        return {
          q: T(`${wz}每月稅後收入 ${k.z(inc)}，每月花在需要 ${k.z(a[0])}、想要 ${k.z(a[1])}、儲蓄與還債 ${k.z(a[2])}。和 50/30/20 原則比，哪一類超過了它的比例？`,
            `${we}'s monthly after-tax income is ${k.e(inc)}. Each month ${we} puts ${k.e(a[0])} toward needs, ${k.e(a[1])} toward wants and ${k.e(a[2])} toward savings and debt payoff. Compared with the 50/30/20 guideline, which part is above its share?`),
          ans: ansChoice([opts[right], ...opts.filter((_, j) => j !== right)]),
          sol: [intro,
            T(`換成百分比：需要 ${k.z(a[0])} ÷ ${k.z(inc)} = ${s[0]}%，想要 ${s[1]}%，儲蓄與還債 ${s[2]}%。`, `As percents: needs ${k.e(a[0])} ÷ ${k.e(inc)} = ${s[0]}%, wants ${s[1]}%, savings and debt payoff ${s[2]}%.`),
            over < 0 ? T('三個比例正好是 50%、30%、20%，完全符合。', 'The three shares are exactly 50%, 30% and 20%, so it matches.')
              : T(`${BUD[over].zh}是 ${s[over]}%，比建議的 ${SHARE[over]}% 多。`, `${cap(BUD[over].en)} take ${s[over]}%, more than the suggested ${SHARE[over]}%.`),
            over < 0 ? T('能照計畫存下 20%，未來就比較不怕突發狀況。', 'Saving 20% as planned makes surprises much less scary.')
              : T(over === 2 ? '多存錢不是壞事！原則只是參考，存得比 20% 多通常是好習慣。' : '如果想更接近原則，可以從超過的那一類省一點，挪去比例不夠的那一類。', over === 2 ? 'Saving more is not a bad thing! The guideline is only a guide, and saving more than 20% is usually a good habit.' : 'To get closer to the guideline, spend a little less in the part that is over and move it to the part that is short.')],
        };
      }
      if (t === 'reverse') {
        const i = r.int(0, 2), s = SHARE[i], a = (inc * s) / 100;
        return {
          q: T(`${wz}照 50/30/20 原則做預算，每月放 ${k.z(a)} 在「${BUD[i].zh}」，剛好是建議的比例。${wz}每月的稅後收入是多少？${k.hint.zh}`,
            `${we} follows the 50/30/20 guideline exactly and puts ${k.e(a)} toward ${BUD[i].en} each month. What is ${we}'s monthly after-tax income? ${k.hint.en}`),
          ans: k.ans(inc),
          sol: [intro,
            T(`${BUD[i].zh}是收入的 ${s}%，所以 收入 × ${s}% = ${k.z(a)}。`, `${cap(BUD[i].en)} are ${s}% of income, so income × ${s}% = ${k.e(a)}.`),
            T(`收入 = ${k.z(a)} ÷ ${s}% = ${k.z(a)} × 100 ÷ ${s} = ${k.z(inc)}。`, `Income = ${k.e(a)} ÷ ${s}% = ${k.e(a)} × 100 ÷ ${s} = ${k.e(inc)}.`),
            T(`驗算：${k.z(inc)} × ${s}% = ${k.z(a)} ✔。`, `Check: ${k.e(inc)} × ${s}% = ${k.e(a)} ✔.`)],
        };
      }
      // left: how much of the wants budget is left this month
      const wb = (inc * 3) / 10, step = k.tw ? 10 : 100;
      const [i1, i2] = r.sample([T('外食', 'eating out'), T('看電影和娛樂', 'movies and fun'), T('網購衣服', 'clothes bought online'), T('串流和遊戲', 'streaming and games'), T('和朋友出去玩', 'going out with friends')], 2);
      const x1 = Math.round((wb * r.int(15, 35)) / 100 / step) * step, x2 = Math.round((wb * r.int(10, 30)) / 100 / step) * step;
      const left = wb - x1 - x2;
      return {
        q: T(`${wz}每月稅後收入 ${k.z(inc)}，照 50/30/20 原則安排「想要」的預算。這個月已經花了${i1.zh} ${k.z(x1)}、${i2.zh} ${k.z(x2)}。這個月的「想要」預算還剩多少？${k.hint.zh}`,
          `${we}'s monthly after-tax income is ${k.e(inc)}, and ${we} sets the wants budget with the 50/30/20 guideline. This month ${we} has already spent ${k.e(x1)} on ${i1.en} and ${k.e(x2)} on ${i2.en}. How much of the wants budget is left this month? ${k.hint.en}`),
        ans: k.ans(left),
        sol: [T(`想要的預算 = 收入的 30%：${k.z(inc)} × 30% = ${k.z(wb)}。`, `Wants budget = 30% of income: ${k.e(inc)} × 30% = ${k.e(wb)}.`),
          T(`已經花了 ${k.z(x1)} + ${k.z(x2)} = ${k.z(x1 + x2)}。`, `Already spent: ${k.e(x1)} + ${k.e(x2)} = ${k.e(x1 + x2)}.`),
          T(`還剩 ${k.z(wb)} − ${k.z(x1 + x2)} = ${k.z(left)}。`, `Left: ${k.e(wb)} − ${k.e(x1 + x2)} = ${k.e(left)}.`),
          T('把每一類的預算分開記帳，花到上限就停，就不會動到該存的錢。', 'Track each part separately and stop when a part runs out, so you never dip into the money meant for saving.')],
      };
    },
  },

  // 2 ──────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'compound-interest',
    grades: [8, 12],
    area: 'save',
    name: T('複利：利息再生利息', 'Compound interest'),
    std: { us: 'Jump$tart · Saving', tw: '國中數學 · 等比數列' },
    lesson: T('單利只對本金算利息；複利則把賺到的利息留在帳戶裡，下一期連利息一起再生利息。一年複利一次時，n 年後的金額 = 本金 × (1 + 年利率)ⁿ。時間越長，複利和單利的差距越大，所以越早開始存越好。',
      'Simple interest is paid only on the money you put in. With compound interest the interest stays in the account and earns interest too. Compounded once a year, the amount after n years = principal × (1 + rate)ⁿ. The longer the time, the bigger the gap, so start early.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const kinds = ['annual', 'annual', 'earned', 'simple', 'table', 'table', 'why'];
      if (g >= 10) kinds.push('monthly', 'monthly', 'mvsa');
      const t = r.pick(kinds);
      const P0 = k.tw ? r.int(10, 200) * 1000 : k.d(r.int(10, 200) * 100);
      const bp = g < 10 ? r.pick([100, 200, 300, 400, 500]) : r.pick([150, 200, 250, 300, 350, 400, 450, 500, 600]);
      const n = g < 10 ? r.int(2, 5) : r.int(3, 15);
      if (t === 'annual' || t === 'earned' || t === 'simple') {
        const A = grow(P0, bp, n), I = A - P0, S = (P0 * bp * n) / 10000;
        const ask = t === 'annual' ? T(`${n} 年後帳戶裡一共有多少錢？`, `How much is in the account after ${n} years?`)
          : t === 'earned' ? T(`${n} 年一共賺到多少利息？`, `How much interest does ${we} earn in all over ${n} years?`)
            : T(`如果改成單利（每年只對 ${k.z(P0)} 算利息），${n} 年的利息會少多少？`, `If it were simple interest instead (interest only on the ${k.e(P0)} each year), how much less interest would ${we} earn over ${n} years?`);
        const ans = t === 'annual' ? A : t === 'earned' ? I : I - S;
        const sol = [T(`一年複利一次：${n} 年後的金額 = 本金 × (1 + ${bpP(bp)})^${n}。`, `Compounded yearly: amount after ${n} years = principal × (1 + ${bpP(bp)})^${n}.`),
          T(`(1 + ${num(bp / 10000)})^${n} ≈ ${factorText(bp, n)}，${k.z(P0)} × ${factorText(bp, n)}… ≈ ${k.z(A)}（${k.rnd.zh}）。`, `(1 + ${num(bp / 10000)})^${n} ≈ ${factorText(bp, n)}, so ${k.e(P0)} × ${factorText(bp, n)}… ≈ ${k.e(A)} (${k.rnd.en}).`),
          T(`複利利息 = ${k.z(A)} − ${k.z(P0)} = ${k.z(I)}。`, `Compound interest earned = ${k.e(A)} − ${k.e(P0)} = ${k.e(I)}.`)];
        if (t === 'simple') sol.push(T(`單利利息 = ${k.z(P0)} × ${bpP(bp)} × ${n} = ${k.z(S)}；少了 ${k.z(I)} − ${k.z(S)} = ${k.z(I - S)}。`, `Simple interest = ${k.e(P0)} × ${bpP(bp)} × ${n} = ${k.e(S)}; that is ${k.e(I)} − ${k.e(S)} = ${k.e(I - S)} less.`));
        sol.push(T('差別在於：複利的利息也會再生利息，所以時間越長多得越多。', 'The difference: with compounding, the interest itself earns interest, so the gap keeps growing over time.'));
        return {
          q: T(`${wz}把 ${k.z(P0)} 存進年利率 ${bpP(bp)}、每年複利一次的帳戶（利息留在帳戶裡繼續生利息），之後都不存也不領。${ask.zh}（只在最後${k.rnd.zh}）${k.hint.zh}`,
            `${we} puts ${k.e(P0)} in an account that pays ${bpP(bp)} a year, compounded once a year (the interest stays in and earns interest too), and adds or takes out nothing after that. ${ask.en} (Round only at the end, ${k.rto}.) ${k.hint.en}`),
          ans: k.ans(ans),
          sol,
          hint: T(`本金 × (1 + ${num(bp / 10000)})^${n}`, `principal × (1 + ${num(bp / 10000)})^${n}`),
        };
      }
      if (t === 'table') {
        const P1 = k.tw ? r.int(10, 50) * 1000 : k.d(r.int(10, 50) * 100), p = r.int(2, 8);
        const rows = []; let b = P1;
        for (let y = 1; y <= 3; y++) { const i = rdiv(b * p, 100); rows.push([y, b, i, b + i]); b += i; }
        const askInt = r.chance(0.4);
        const fig = table(['年 Year', '年初 Start', '利息 Interest', '年底 End'], rows.map(([y, s, i, e], j) => [y, k.e(s), j === 2 && askInt ? '?' : `+ ${k.e(i)}`, j === 2 ? '?' : k.e(e)]));
        const [, s3, i3, e3] = rows[2];
        return {
          q: T(`${wz}存了 ${k.z(P1)}，年利率 ${p}%，每年複利一次。下表是每年的變化（每年的利息${k.rnd.zh}）。第 3 年${askInt ? '的利息' : '年底的金額'}是多少？${k.hint.zh}`,
            `${we} saves ${k.e(P1)} at ${p}% a year, compounded once a year. The table shows each year (each year's interest is ${k.rnd.en}). What is ${askInt ? 'the interest in year 3' : 'the amount at the end of year 3'}? ${k.hint.en}`),
          fig,
          ans: k.ans(askInt ? i3 : e3),
          sol: [T('每年的利息都用「年初的金額」來算，年初的金額已經包含前幾年的利息。', 'Each year\'s interest is figured on the amount at the start of that year, which already includes earlier interest.'),
            T(`第 3 年年初是 ${k.z(s3)}，利息 = ${k.z(s3)} × ${p}% ≈ ${k.z(i3)}。`, `Year 3 starts at ${k.e(s3)}; interest = ${k.e(s3)} × ${p}% ≈ ${k.e(i3)}.`),
            T(`年底 = ${k.z(s3)} + ${k.z(i3)} = ${k.z(e3)}。`, `End of year 3 = ${k.e(s3)} + ${k.e(i3)} = ${k.e(e3)}.`),
            T(`比較：第 1 年利息 ${k.z(rows[0][2])}，第 3 年 ${k.z(i3)}。利息每年變多，因為利息也在生利息。`, `Compare: year 1 interest was ${k.e(rows[0][2])}, year 3 is ${k.e(i3)}. Interest grows every year because interest earns interest.`)],
        };
      }
      if (t === 'why') {
        return {
          q: T(`${wz}和${r.pick(KIDS.filter((x) => x[0] !== wz))[0]}都存了 ${k.z(P0)}，年利率都是 ${bpP(bp)}。一個是單利，一個是每年複利一次。為什麼幾年之後，複利的帳戶錢比較多？`,
            `Two friends each save ${k.e(P0)} at ${bpP(bp)} a year. One account pays simple interest; the other compounds once a year. Why does the compound account end up with more after several years?`),
          ans: ansChoice([T('因為複利帳戶連之前賺到的利息也會再生利息', 'Because the compound account also earns interest on the interest it already earned'),
            T('因為複利帳戶的利率每年都會自動提高', 'Because the compound account\'s rate goes up by itself every year'),
            T('因為複利帳戶每年會幫你多存一筆本金', 'Because the compound account adds more of your own money every year'),
            T('其實兩個帳戶永遠一樣多', 'Actually both accounts always have the same amount')]),
          sol: [T(`第 1 年兩個帳戶的利息一樣：${k.z(P0)} × ${bpP(bp)} = ${k.z(pctOf(P0, bp / 100))}。`, `In year 1 both earn the same: ${k.e(P0)} × ${bpP(bp)} = ${k.e(pctOf(P0, bp / 100))}.`),
            T(`第 2 年起，複利帳戶是用「本金 + 利息」來算利息，單利帳戶還是只用 ${k.z(P0)}。`, `From year 2 on, the compound account earns interest on principal + interest, while the simple account still uses only ${k.e(P0)}.`),
            T(`10 年後：單利 ${k.z(P0 + (P0 * bp * 10) / 10000)}，複利約 ${k.z(grow(P0, bp, 10))}（${k.rnd.zh}）。`, `After 10 years: simple ${k.e(P0 + (P0 * bp * 10) / 10000)}, compound about ${k.e(grow(P0, bp, 10))} (${k.rnd.en}).`)],
        };
      }
      // monthly compounding (g ≥ 10)
      const apr = r.pick([120, 240, 300, 360, 480, 600]), yrs = r.int(2, 10);
      const A = growM(P0, apr, 12 * yrs), Aa = grow(P0, apr, yrs);
      const more = t === 'mvsa';
      return {
        q: more
          ? T(`${wz}把 ${k.z(P0)} 存 ${yrs} 年，年利率 ${bpP(apr)}。甲帳戶每月複利一次（每月利率 = ${bpP(apr)} ÷ 12），乙帳戶每年複利一次。${yrs} 年後，甲帳戶比乙帳戶多多少錢？（兩個金額都${k.rnd.zh}後再相減）${k.hint.zh}`,
            `${we} saves ${k.e(P0)} for ${yrs} years at an annual rate of ${bpP(apr)}. Account A compounds monthly (monthly rate = ${bpP(apr)} ÷ 12); account B compounds once a year. After ${yrs} years, how much more is in account A? (Round each amount to the nearest ${k.tw ? 'NT dollar' : 'cent'}, then subtract.) ${k.hint.en}`)
          : T(`${wz}把 ${k.z(P0)} 存進年利率 ${bpP(apr)}、每月複利一次的帳戶（每月利率 = ${bpP(apr)} ÷ 12）。${yrs} 年後帳戶裡有多少錢？（只在最後${k.rnd.zh}）${k.hint.zh}`,
            `${we} puts ${k.e(P0)} in an account with an annual rate of ${bpP(apr)}, compounded monthly (monthly rate = ${bpP(apr)} ÷ 12). How much is in the account after ${yrs} years? (Round only at the end, ${k.rto}.) ${k.hint.en}`),
        ans: k.ans(more ? A - Aa : A),
        sol: [T(`每月利率 = ${bpP(apr)} ÷ 12 = ${num(apr / 1200)}%，${yrs} 年共複利 12 × ${yrs} = ${12 * yrs} 次。`, `Monthly rate = ${bpP(apr)} ÷ 12 = ${num(apr / 1200)}%, compounded 12 × ${yrs} = ${12 * yrs} times.`),
          T(`每月複利：${k.z(P0)} × (1 + ${num(apr / 120000)})^${12 * yrs} ≈ ${k.z(A)}。`, `Monthly: ${k.e(P0)} × (1 + ${num(apr / 120000)})^${12 * yrs} ≈ ${k.e(A)}.`),
          T(`每年複利：${k.z(P0)} × (1 + ${num(apr / 10000)})^${yrs} ≈ ${k.z(Aa)}。`, `Yearly: ${k.e(P0)} × (1 + ${num(apr / 10000)})^${yrs} ≈ ${k.e(Aa)}.`),
          more ? T(`差 ${k.z(A)} − ${k.z(Aa)} = ${k.z(A - Aa)}。`, `Difference: ${k.e(A)} − ${k.e(Aa)} = ${k.e(A - Aa)}.`) : T(`答案：${k.z(A)}（${k.rnd.zh}）。`, `Answer: ${k.e(A)} (${k.rnd.en}).`),
          T('複利越頻繁，利息越早開始生利息，所以金額會稍微多一點。', 'The more often interest compounds, the sooner interest starts earning interest, so the total is a little higher.')],
      };
    },
  },

  // 3 ──────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'inflation',
    grades: [7, 11],
    area: 'save',
    name: T('通貨膨脹：錢變薄了', 'Inflation'),
    std: { us: 'Jump$tart · Saving', tw: '金融教育 · 儲蓄' },
    lesson: T('通貨膨脹是物價一年一年上漲。物價漲了，同樣的錢能買的東西就變少，這叫「購買力」下降。存款利率如果比通膨率低，錢的數字雖然變多，實際能買的東西卻變少。實質報酬率約等於名目利率 − 通膨率（這是近似值）。',
      'Inflation means prices rise over time. When prices rise, the same money buys less: its purchasing power falls. If your savings rate is lower than inflation, your balance grows but buys less. Real return ≈ nominal rate − inflation rate (an approximation).'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const kinds = ['future', 'future', 'fewer', 'keepup'];
      if (g >= 8) kinds.push('real', 'keepup');
      if (g >= 9) kinds.push('power', 'power');
      const t = r.pick(kinds);
      const ITEMS = k.tw
        ? [[T('一杯珍珠奶茶', 'a cup of bubble tea'), 50, 75, 5], [T('一個便當', 'a boxed lunch'), 90, 130, 5], [T('一張電影票', 'a movie ticket'), 280, 360, 10], [T('一雙球鞋', 'a pair of sneakers'), 2000, 3500, 100], [T('一台筆電', 'a laptop'), 25000, 40000, 1000]]
        : [[T('一杯珍珠奶茶', 'a cup of bubble tea'), 5, 7, 1], [T('一份三明治', 'a sandwich'), 8, 12, 1], [T('一張電影票', 'a movie ticket'), 12, 16, 1], [T('一雙球鞋', 'a pair of sneakers'), 80, 140, 5], [T('一台筆電', 'a laptop'), 700, 1200, 50]];
      if (t === 'future') {
        const [it, lo, hi, st] = r.pick(ITEMS), price = k.d(r.int(lo / st, hi / st) * st);
        const bp = g <= 8 ? r.pick([200, 300, 400, 500]) : r.pick([150, 200, 250, 300, 350, 400, 500, 600]);
        const n = g <= 8 ? r.int(1, 3) : r.int(3, 10), F = grow(price, bp, n);
        return {
          q: T(`${it.zh}現在賣 ${k.z(price)}。假設每年通膨率都是 ${bpP(bp)}，${n} 年後它大約會賣多少錢？（只在最後${k.rnd.zh}）${k.hint.zh}`,
            `${cap(it.en)} costs ${k.e(price)} today. Suppose inflation is ${bpP(bp)} every year. About how much will it cost in ${n} years? (Round only at the end, ${k.rto}.) ${k.hint.en}`),
          ans: k.ans(F),
          sol: [T(`每年價格變成前一年的 (1 + ${bpP(bp)}) 倍，像複利一樣一年疊一年。`, `Each year the price is multiplied by (1 + ${bpP(bp)}), stacking like compound interest.`),
            T(`${n} 年後 = ${k.z(price)} × (1 + ${num(bp / 10000)})^${n} ≈ ${k.z(price)} × ${factorText(bp, n)}…`, `After ${n} years = ${k.e(price)} × (1 + ${num(bp / 10000)})^${n} ≈ ${k.e(price)} × ${factorText(bp, n)}…`),
            T(`≈ ${k.z(F)}（${k.rnd.zh}），比現在貴 ${k.z(F - price)}。`, `≈ ${k.e(F)} (${k.rnd.en}), which is ${k.e(F - price)} more than today.`),
            T('東西本身沒變，是錢的購買力變小了。', 'The item did not change; the money lost purchasing power.')],
        };
      }
      if (t === 'fewer') {
        let it, price, bp, S, n1, n2, F;
        do {
          [it] = r.pick(ITEMS.slice(0, 3)); const row = ITEMS.find((x) => x[0] === it);
          price = k.d(r.int(row[1] / row[3], row[2] / row[3]) * row[3]); bp = r.pick([400, 500, 600, 800, 1000]);
          S = k.tw ? r.int(20, 60) * 100 : k.d(r.int(20, 60) * 5);
          F = grow(price, bp, 1); n1 = Math.floor(S / price); n2 = Math.floor(S / F);
        } while (n1 - n2 < 1);
        return {
          q: T(`${wz}把 ${k.z(S)} 放在抽屜裡（不會生利息）。${it.zh}今年賣 ${k.z(price)}，明年漲價 ${bpP(bp)}（${k.rnd.zh}）。用這筆錢，明年能買的數量比今年少幾個？`,
            `${we} keeps ${k.e(S)} in a drawer (it earns no interest). ${cap(it.en)} costs ${k.e(price)} this year, and next year its price goes up ${bpP(bp)} (${k.rnd.en}). With this money, how many fewer can ${we} buy next year than this year?`),
          ans: ansNum(n1 - n2),
          sol: [T(`今年：${k.z(S)} ÷ ${k.z(price)}，最多買 ${n1} 個。`, `This year: ${k.e(S)} ÷ ${k.e(price)} → at most ${n1}.`),
            T(`明年價格：${k.z(price)} × (1 + ${bpP(bp)}) ≈ ${k.z(F)}。`, `Next year's price: ${k.e(price)} × (1 + ${bpP(bp)}) ≈ ${k.e(F)}.`),
            T(`明年：${k.z(S)} ÷ ${k.z(F)}，最多買 ${n2} 個。`, `Next year: ${k.e(S)} ÷ ${k.e(F)} → at most ${n2}.`),
            T(`少了 ${n1} − ${n2} = ${n1 - n2} 個。錢的數字沒變，能買的東西卻變少了。`, `That is ${n1} − ${n2} = ${n1 - n2} fewer. The number of dollars stayed the same, but it buys less.`)],
        };
      }
      if (t === 'real') {
        let n10, i10; do { n10 = r.int(5, 60); i10 = r.int(10, 50); } while (n10 === i10);
        const nom = n10 / 10, inf = i10 / 10, real = (n10 - i10) / 10;
        return {
          q: T(`${wz}的存款年利率是 ${pc(nom)}，假設今年的通膨率是 ${pc(inf)}。用「實質報酬率 ≈ 名目利率 − 通膨率」估算，實質報酬率大約是百分之幾？（只寫數字，可能是負數）`,
            `${we}'s savings earn ${pc(nom)} a year, and suppose inflation this year is ${pc(inf)}. Using "real return ≈ nominal rate − inflation", about what is the real return, as a percent? (Type just the number; it may be negative.)`),
          ans: ansNum(real),
          sol: [T('名目利率是帳戶給你的利率；實質報酬率是扣掉物價上漲後，購買力真正增加的比例。', 'The nominal rate is what the account pays; the real return is how much your buying power actually grows after prices rise.'),
            T(`實質報酬率 ≈ ${pc(nom)} − ${pc(inf)} = ${pc(real)}。`, `Real return ≈ ${pc(nom)} − ${pc(inf)} = ${pc(real)}.`),
            real < 0 ? T('是負的：錢的數字變多，但能買的東西反而變少。', 'It is negative: the balance grows, but it buys less.') : T('是正的：扣掉通膨後，購買力還是有增加。', 'It is positive: even after inflation, buying power grows.'),
            T('這是近似值；精確的算法是 (1 + 名目) ÷ (1 + 通膨) − 1，但利率不大時兩者很接近。', 'This is an approximation; the exact value is (1 + nominal) ÷ (1 + inflation) − 1, which is very close when rates are small.')],
        };
      }
      if (t === 'keepup') {
        let a = r.int(1, 6), b = r.int(1, 6); while (a === b) b = r.int(1, 6);
        if (r.chance(0.6) && a > b) [a, b] = [b, a];
        const behind = a < b;
        const opts = behind
          ? [T(`沒有跟上：物價漲得比存款快，購買力每年大約少 ${b - a}%`, `No: prices rise faster than the savings, so buying power falls about ${b - a}% a year`),
            T('有跟上：帳戶裡的錢每年都在變多，所以能買的東西也變多', 'Yes: the balance goes up every year, so it buys more too'),
            T('有跟上：只要有利息，就一定打敗通膨', 'Yes: any interest at all always beats inflation'),
            T('沒關係：通膨只會影響商店，不會影響存款', 'It does not matter: inflation affects stores, not savings')]
          : [T(`有跟上：存款成長比物價快，購買力每年大約多 ${a - b}%`, `Yes: the savings grow faster than prices, so buying power rises about ${a - b}% a year`),
            T('沒有跟上：只要有通膨，存款一定會變少', 'No: whenever there is inflation, savings always lose'),
            T(`沒有跟上：要比通膨多 ${b * 2}% 以上才算跟上`, `No: it must beat inflation by at least ${b * 2}% to keep up`),
            T('沒關係：通膨只會影響商店，不會影響存款', 'It does not matter: inflation affects stores, not savings')];
        return {
          q: T(`${wz}的存款年利率是 ${a}%，假設這幾年每年的通膨率都是 ${b}%。${wz}存款的購買力有跟上物價嗎？`,
            `${we}'s savings account pays ${a}% a year, and suppose inflation is ${b}% every year. Does the purchasing power of ${we}'s savings keep up with prices?`),
          ans: ansChoice(opts),
          sol: [T(`比較兩個比例：存款每年 +${a}%，物價每年 +${b}%。`, `Compare the two rates: savings grow ${a}% a year, prices grow ${b}% a year.`),
            T(`實質報酬率 ≈ ${a}% − ${b}% = ${num(a - b)}%（近似值）。`, `Real return ≈ ${a}% − ${b}% = ${num(a - b)}% (an approximation).`),
            behind ? T('雖然帳戶數字變大，但物價漲得更多，所以能買的東西變少了。', 'The balance gets bigger, but prices grow even more, so it buys less.') : T('存款成長比物價快，所以能買的東西變多了。', 'The savings grow faster than prices, so they buy more.'),
            T('長期要存的錢，要留意利率有沒有跟上通膨。', 'For long-term money, check whether the rate keeps up with inflation.')],
        };
      }
      // power: what savings in a box are worth in today's prices after n years
      const S = k.tw ? r.int(10, 100) * 1000 : k.d(r.int(10, 100) * 100), bp = r.pick([200, 250, 300, 400, 500]), n = r.int(2, 10);
      const V = Number(rdiv(BigInt(S) * 10000n ** BigInt(n), BigInt(10000 + bp) ** BigInt(n)));
      return {
        q: T(`${wz}把 ${k.z(S)} 現金放在家裡 ${n} 年（沒有利息）。假設這 ${n} 年每年通膨率都是 ${bpP(bp)}。${n} 年後這筆錢的購買力，只等於現在的多少錢？（${k.rnd.zh}）${k.hint.zh}`,
          `${we} keeps ${k.e(S)} in cash at home for ${n} years (no interest). Suppose inflation is ${bpP(bp)} every year. After ${n} years, how much is that money worth in today's prices, meaning how much money today would buy the same things? (Round ${k.rto}.) ${k.hint.en}`),
        ans: k.ans(V),
        sol: [T(`物價 ${n} 年後會變成現在的 (1 + ${num(bp / 10000)})^${n} ≈ ${factorText(bp, n)} 倍。`, `In ${n} years prices are (1 + ${num(bp / 10000)})^${n} ≈ ${factorText(bp, n)} times today's.`),
          T(`所以 ${k.z(S)} 的購買力 = ${k.z(S)} ÷ ${factorText(bp, n)}… ≈ ${k.z(V)}（以現在的物價計算）。`, `So ${k.e(S)} has the buying power of ${k.e(S)} ÷ ${factorText(bp, n)}… ≈ ${k.e(V)} in today's prices.`),
          T(`等於損失了大約 ${k.z(S - V)} 的購買力。`, `That is about ${k.e(S - V)} of buying power lost.`),
          T('現金放著不動，不會變少張，但會越來越「薄」。這就是為什麼長期的錢要找能跟上通膨的地方。', 'Cash in a drawer does not shrink in number, but it gets "thinner." That is why long-term money should go somewhere that keeps up with inflation.')],
      };
    },
  },

  // 4 ──────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'paycheck',
    grades: [8, 12],
    area: 'earn',
    name: T('薪水單：實領多少？', 'Reading a paycheck'),
    std: { us: 'Jump$tart · Earning Income', tw: '金融教育 · 收入與工作' },
    lesson: T('「應發薪資（總薪資）」是扣款前的金額；扣掉保險、稅金等之後，真正進到帳戶的叫「實領薪資」。找工作比較薪水時，要記得實領會比應發少。',
      'Gross pay is what you earn before deductions. After taxes and other deductions come out, what reaches your account is net pay (take-home pay). When you compare jobs, remember that take-home pay is less than gross pay.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const t = r.pick(g >= 9 ? ['gross', 'net', 'net', 'part', 'keep'] : ['gross', 'gross', 'net', 'part']);
      if (k.tw) {
        if (t === 'gross') {
          const w = r.int(40, 52) * 5, h = r.int(20, 120);
          return {
            q: T(`${wz}在餐廳打工，時薪 ${w} 元。這個月工作了 ${h} 小時，應發薪資（扣款前）是多少？${k.hint.zh}`,
              `${we} works part-time at a restaurant for NT$${w} an hour. This month ${we} worked ${h} hours. What is the gross pay (before deductions)? ${k.hint.en}`),
            ans: k.ans(w * h),
            sol: [T('應發薪資 = 時薪 × 工作時數。', 'Gross pay = hourly wage × hours worked.'),
              T(`${w} × ${h} = ${k.z(w * h)}。`, `${w} × ${h} = ${k.e(w * h)}.`),
              T('這是扣款前的金額；如果有扣勞保、健保，實領會比這個少。', 'This is before deductions; if insurance is taken out, take-home pay will be less.')],
          };
        }
        const S = r.int(30, 60) * 1000 + r.pick([0, 500]);
        const lp = r.pick([2.3, 2.4, 2.5]), hp = r.pick([1.5, 1.6]), vp = g >= 9 ? r.pick([0, 0, 1, 2, 3, 6]) : 0;
        const L = pctOf(S, lp), H = pctOf(S, hp), V = pctOf(S, vp), net = S - L - H - V;
        const lines = T(`假設勞保自付 ${lp}%、健保自付 ${hp}%${vp ? `，${wz}還選擇勞退自願提繳 ${vp}%` : ''}（每一項都${k.rnd.zh}）`,
          `suppose the Labor Insurance share is ${lp}% and the National Health Insurance share is ${hp}%${vp ? `, and ${we} also chooses a voluntary labor-pension contribution of ${vp}%` : ''} (each one ${k.rnd.en})`);
        const sol = [T('實領 = 應發薪資 − 各項扣款。', 'Net pay = gross pay − each deduction.'),
          T(`勞保：${k.z(S)} × ${lp}% ≈ ${k.z(L)}；健保：${k.z(S)} × ${hp}% ≈ ${k.z(H)}${vp ? `；勞退自提：${k.z(S)} × ${vp}% ≈ ${k.z(V)}` : ''}。`, `Labor Insurance: ${k.e(S)} × ${lp}% ≈ ${k.e(L)}; health insurance: ${k.e(S)} × ${hp}% ≈ ${k.e(H)}${vp ? `; pension: ${k.e(S)} × ${vp}% ≈ ${k.e(V)}` : ''}.`),
          T(`實領 = ${k.z(S)} − ${k.z(L + H + V)} = ${k.z(net)}。`, `Net pay = ${k.e(S)} − ${k.e(L + H + V)} = ${k.e(net)}.`)];
        if (vp) sol.push(T('勞退自提的錢存進自己的勞退個人專戶，還是自己的錢，只是要退休時才能領。', 'The voluntary pension money goes into your own labor-pension account; it is still yours, you just get it at retirement.'));
        sol.push(T('提醒：真正的勞保、健保是用「投保薪資」分級計算，這裡的比例是假設的。', 'Note: real Labor Insurance and health insurance amounts use insured-salary grades; the percents here are made up for practice.'));
        if (t === 'net') {
          return { q: T(`${wz}的月薪（應發）是 ${k.z(S)}。${lines.zh}。${wz}每月實領多少？${k.hint.zh}`, `${we}'s monthly gross salary is ${k.e(S)}. In this example, ${lines.en}. What is ${we}'s monthly net pay? ${k.hint.en}`), ans: k.ans(net), sol };
        }
        if (t === 'part') {
          return {
            q: T(`${wz}的月薪（應發）是 ${k.z(S)}。${lines.zh}。每月一共被扣掉多少錢？${k.hint.zh}`, `${we}'s monthly gross salary is ${k.e(S)}. In this example, ${lines.en}. How much is deducted in total each month? ${k.hint.en}`),
            ans: k.ans(L + H + V), sol: [...sol.slice(0, 2), T(`合計 = ${k.z(L)} + ${k.z(H)}${vp ? ` + ${k.z(V)}` : ''} = ${k.z(L + H + V)}。`, `Total = ${k.e(L)} + ${k.e(H)}${vp ? ` + ${k.e(V)}` : ''} = ${k.e(L + H + V)}.`), sol[sol.length - 1]],
          };
        }
        const kp = pct1(net, S);
        return {
          q: T(`${wz}的月薪（應發）是 ${k.z(S)}。${lines.zh}。實領是應發的百分之幾？（四捨五入到小數第一位，只寫數字）`, `${we}'s monthly gross salary is ${k.e(S)}. In this example, ${lines.en}. Net pay is what percent of gross pay? (Round to one decimal place; type just the number.)`),
          ans: ansNum(kp), sol: [...sol.slice(0, 3), T(`${k.z(net)} ÷ ${k.z(S)} × 100% ≈ ${pc(kp)}。`, `${k.e(net)} ÷ ${k.e(S)} × 100% ≈ ${pc(kp)}.`)],
        };
      }
      // ---- US ----
      if (t === 'gross') {
        const ot = g >= 9 && r.chance(0.6);
        const w = r.int(30, 50) * 50, h = ot ? r.int(41, 50) : r.int(12, 40);
        const G = ot ? 40 * w + (h - 40) * ((w * 3) / 2) : w * h;
        return {
          q: ot
            ? T(`${wz}是時薪 ${k.z(w)} 的員工，這週工作了 ${h} 小時。依美國聯邦法律，一般時薪員工一週超過 40 小時的部分，要付 1.5 倍時薪的加班費。這週的應發薪資是多少？${k.hint.zh}`,
              `${we} earns ${k.e(w)} an hour and worked ${h} hours this week. Under US federal law, most hourly workers get 1.5 times their wage for hours over 40 in a week. What is ${we}'s gross pay this week? ${k.hint.en}`)
            : T(`${wz}打工時薪 ${k.z(w)}，這週工作了 ${h} 小時。這週的應發薪資（扣款前）是多少？${k.hint.zh}`,
              `${we} earns ${k.e(w)} an hour at a part-time job and worked ${h} hours this week. What is the gross pay (before deductions)? ${k.hint.en}`),
          ans: k.ans(G),
          sol: ot ? [T(`前 40 小時：40 × ${k.z(w)} = ${k.z(40 * w)}。`, `First 40 hours: 40 × ${k.e(w)} = ${k.e(40 * w)}.`),
            T(`加班時薪 = ${k.z(w)} × 1.5 = ${k.z((w * 3) / 2)}；加班 ${h - 40} 小時：${h - 40} × ${k.z((w * 3) / 2)} = ${k.z((h - 40) * ((w * 3) / 2))}。`, `Overtime rate = ${k.e(w)} × 1.5 = ${k.e((w * 3) / 2)}; ${h - 40} overtime hours: ${h - 40} × ${k.e((w * 3) / 2)} = ${k.e((h - 40) * ((w * 3) / 2))}.`),
            T(`應發 = ${k.z(40 * w)} + ${k.z((h - 40) * ((w * 3) / 2))} = ${k.z(G)}。`, `Gross pay = ${k.e(40 * w)} + ${k.e((h - 40) * ((w * 3) / 2))} = ${k.e(G)}.`),
            T(`如果沒有加班費，只會拿到 ${h} × ${k.z(w)} = ${k.z(h * w)}。`, `Without overtime pay it would be only ${h} × ${k.e(w)} = ${k.e(h * w)}.`)]
            : [T('應發薪資 = 時薪 × 工作時數。', 'Gross pay = hourly wage × hours worked.'), T(`${k.z(w)} × ${h} = ${k.z(G)}。`, `${k.e(w)} × ${h} = ${k.e(G)}.`),
              T('這是扣款前的金額；扣掉稅金後，實領會比較少。', 'This is before deductions; take-home pay will be less after taxes.')],
        };
      }
      const G = r.int(60000, 260000), wp = r.pick([5, 8, 10, 12, 15]);
      const ss = pctOf(G, 6.2), md = pctOf(G, 1.45), tx = pctOf(G, wp), net = G - ss - md - tx;
      const setup = T(`${wz}這次的應發薪資是 ${k.z(G)}。要扣社會安全稅（Social Security）6.2%、聯邦醫療保險稅（Medicare）1.45%，假設所得稅預扣 ${wp}%（每一項分開算，各自${k.rnd.zh}）。`,
        `${we}'s gross pay this period is ${k.e(G)}. Deductions: Social Security 6.2%, Medicare 1.45%, and suppose income-tax withholding is ${wp}% (each one figured separately and ${k.rnd.en}).`);
      const base = [T(`社會安全稅：${k.z(G)} × 6.2% ≈ ${k.z(ss)}。`, `Social Security: ${k.e(G)} × 6.2% ≈ ${k.e(ss)}.`),
        T(`Medicare：${k.z(G)} × 1.45% ≈ ${k.z(md)}；所得稅：${k.z(G)} × ${wp}% ≈ ${k.z(tx)}。`, `Medicare: ${k.e(G)} × 1.45% ≈ ${k.e(md)}; income tax: ${k.e(G)} × ${wp}% ≈ ${k.e(tx)}.`)];
      if (t === 'net') {
        return {
          q: T(`${setup.zh}實領多少？${k.hint.zh}`, `${setup.en} What is the net pay? ${k.hint.en}`), ans: k.ans(net),
          sol: [T('實領 = 應發 − 所有扣款。', 'Net pay = gross pay − all deductions.'), ...base,
            T(`實領 = ${k.z(G)} − ${k.z(ss)} − ${k.z(md)} − ${k.z(tx)} = ${k.z(net)}。`, `Net pay = ${k.e(G)} − ${k.e(ss)} − ${k.e(md)} − ${k.e(tx)} = ${k.e(net)}.`),
            T('社會安全稅和 Medicare 合稱 FICA（共 7.65%），用來支付退休和老年醫療的福利。', 'Social Security and Medicare together are called FICA (7.65%); they fund retirement and senior health benefits.')],
        };
      }
      if (t === 'part') {
        return {
          q: T(`${setup.zh}社會安全稅和 Medicare（合稱 FICA）一共扣多少？${k.hint.zh}`, `${setup.en} How much is taken out for Social Security and Medicare together (FICA)? ${k.hint.en}`), ans: k.ans(ss + md),
          sol: [base[0], T(`Medicare：${k.z(G)} × 1.45% ≈ ${k.z(md)}。`, `Medicare: ${k.e(G)} × 1.45% ≈ ${k.e(md)}.`),
            T(`FICA = ${k.z(ss)} + ${k.z(md)} = ${k.z(ss + md)}。`, `FICA = ${k.e(ss)} + ${k.e(md)} = ${k.e(ss + md)}.`),
            T('FICA 的比例是固定的 7.65%，不像所得稅預扣會因人而異。', 'FICA is a fixed 7.65% here, unlike income-tax withholding, which differs from person to person.')],
        };
      }
      const kp = pct1(net, G);
      return {
        q: T(`${setup.zh}實領是應發的百分之幾？（四捨五入到小數第一位，只寫數字）`, `${setup.en} Net pay is what percent of gross pay? (Round to one decimal place; type just the number.)`), ans: ansNum(kp),
        sol: [...base, T(`實領 = ${k.z(G)} − ${k.z(ss + md + tx)} = ${k.z(net)}。`, `Net pay = ${k.e(G)} − ${k.e(ss + md + tx)} = ${k.e(net)}.`),
          T(`${k.z(net)} ÷ ${k.z(G)} × 100% ≈ ${pc(kp)}。`, `${k.e(net)} ÷ ${k.e(G)} × 100% ≈ ${pc(kp)}.`),
          T(`大約等於 100% − 7.65% − ${wp}% = ${num(100 - 7.65 - wp)}%（小差異來自每項的四捨五入）。`, `That is about 100% − 7.65% − ${wp}% = ${num(100 - 7.65 - wp)}% (tiny differences come from rounding each item).`)],
      };
    },
  },

  // 5 ──────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'credit-card',
    grades: [9, 12],
    area: 'credit',
    name: T('信用卡利息與最低應繳', 'Credit-card interest'),
    std: { us: 'Jump$tart · Managing Credit', tw: '金融教育 · 借貸與信用' },
    lesson: T('信用卡沒有在期限內繳清，剩下的金額就會被收利息：每月利息 ≈ 餘額 × 年利率 ÷ 12。如果每月只繳一點點，大部分的錢都拿去付利息，要很久才還得完。最好的做法是每期全額繳清。',
      'If you do not pay your card in full by the due date, the rest is charged interest: monthly interest ≈ balance × APR ÷ 12. If you pay only a small amount each month, much of it goes to interest and the debt takes a long time to clear. The best habit is to pay the full balance every month.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const apr = k.tw ? r.pick([1000, 1200, 1500]) : r.pick([1800, 1999, 2199, 2400, 2499, 2699, 2999]);
      const twFact = T('（台灣法律規定信用卡循環利率上限是年利率 15%。）', '(In Taiwan, the law caps credit-card revolving interest at 15% a year.)');
      const kinds = ['interest', 'newbal', 'three', 'why'];
      if (g >= 10) kinds.push('months', 'months');
      if (g >= 11) kinds.push('total', 'compare');
      const t = r.pick(kinds);
      const rule = T(`每月：先加上利息（餘額 × ${bpP(apr)} ÷ 12，${k.rnd.zh}），再扣掉繳款`, `each month, first interest is added (balance × ${bpP(apr)} ÷ 12, ${k.rnd.en}), then the payment is subtracted`);
      if (t === 'interest' || t === 'newbal') {
        const bal = k.tw ? r.int(30, 600) * 100 : r.int(30000, 300000), I = monthInterest(bal, apr);
        if (t === 'interest') {
          return {
            q: T(`${wz}的信用卡有 ${k.z(bal)} 沒繳清，年利率 ${bpP(apr)}。下個月要付多少利息？（每月利息 = 餘額 × 年利率 ÷ 12，${k.rnd.zh}）${k.hint.zh}`,
              `${we} has an unpaid credit-card balance of ${k.e(bal)} at an APR of ${bpP(apr)}. How much interest is charged next month? (Monthly interest = balance × APR ÷ 12, ${k.rnd.en}.) ${k.hint.en}`),
            ans: k.ans(I),
            sol: [T(`月利率 = ${bpP(apr)} ÷ 12 ${apr % 3 ? "≈" : "="} ${num(+(apr / 1200).toFixed(4))}%。`, `Monthly rate = ${bpP(apr)} ÷ 12 ${apr % 3 ? "≈" : "="} ${num(+(apr / 1200).toFixed(4))}%.`),
              T(`利息 = ${k.z(bal)} × ${bpP(apr)} ÷ 12 ≈ ${k.z(I)}。`, `Interest = ${k.e(bal)} × ${bpP(apr)} ÷ 12 ≈ ${k.e(I)}.`),
              T(`一整年都不還，光利息就大約 ${k.z(I * 12)} 以上。`, `Left unpaid for a whole year, the interest alone would be about ${k.e(I * 12)} or more.`),
              k.tw ? twFact : T('信用卡的年利率常常比其他借款高很多，所以最好每月全額繳清。', 'Card APRs are often much higher than other loans, so it is best to pay in full every month.')],
          };
        }
        const pay = Math.min(bal, k.tw ? r.int(10, 50) * 100 : r.int(25, 150) * 100), buy = r.chance(0.5) ? (k.tw ? r.int(5, 50) * 100 : r.int(1000, 15000)) : 0;
        const nb = bal + I - pay + buy;
        return {
          q: T(`${wz}的信用卡上期沒繳清的餘額是 ${k.z(bal)}，年利率 ${bpP(apr)}。這個月加上利息（餘額 × 年利率 ÷ 12，${k.rnd.zh}）後，${wz}繳了 ${k.z(pay)}${buy ? `，又刷卡買了 ${k.z(buy)} 的東西` : ''}。新的餘額是多少？${k.hint.zh}`,
            `${we}'s credit card has an unpaid balance of ${k.e(bal)} at an APR of ${bpP(apr)}. This month interest is added (balance × APR ÷ 12, ${k.rnd.en}), then ${we} pays ${k.e(pay)}${buy ? ` and also charges a ${k.e(buy)} purchase` : ''}. What is the new balance? ${k.hint.en}`),
          ans: k.ans(nb),
          sol: [T(`利息 = ${k.z(bal)} × ${bpP(apr)} ÷ 12 ≈ ${k.z(I)}。`, `Interest = ${k.e(bal)} × ${bpP(apr)} ÷ 12 ≈ ${k.e(I)}.`),
            T(`${k.z(bal)} + ${k.z(I)} − ${k.z(pay)}${buy ? ` + ${k.z(buy)}` : ''} = ${k.z(nb)}。`, `${k.e(bal)} + ${k.e(I)} − ${k.e(pay)}${buy ? ` + ${k.e(buy)}` : ''} = ${k.e(nb)}.`),
            T(`繳的 ${k.z(pay)} 裡，有 ${k.z(Math.min(I, pay))} 先拿去付利息，真正還到本金的只有 ${k.z(Math.max(0, pay - I))}。`, `Of the ${k.e(pay)} paid, ${k.e(Math.min(I, pay))} covers interest first; only ${k.e(Math.max(0, pay - I))} actually reduces the debt.`)],
        };
      }
      if (t === 'why') {
        return {
          q: T(`${wz}的信用卡欠了 ${k.z(k.tw ? 30000 : 300000)}，每個月只繳一小筆固定金額（剛好比利息多一點）。會發生什麼事？`,
            `${we} owes ${k.e(k.tw ? 30000 : 300000)} on a credit card and pays only a small fixed amount each month, just a bit more than the interest. What will happen?`),
          ans: ansChoice([T('要花很多年才還得完，而且付的利息總額會很高', 'It will take many years to pay off and cost a lot of interest in total'),
            T('只要每月有繳錢，就不會被收利息', 'As long as some payment is made each month, there is no interest'),
            T('欠款會在一年內自動還清', 'The debt will be paid off within a year automatically'),
            T('銀行會在一段時間後把欠款一筆勾銷', 'The bank will cancel the debt after a while')]),
          sol: [T('每月繳的錢要先付利息，剩下的才會減少欠款。', 'Each payment pays the interest first; only the rest lowers the debt.'),
            T('如果繳款只比利息多一點，欠款每月只減少一點點，下個月的利息也幾乎一樣多。', 'If the payment is barely more than the interest, the debt drops only a little, so next month\'s interest is almost the same.'),
            T('所以會拖很久，付出的利息可能比原本買的東西還貴。最好的做法：每期全額繳清。', 'So it drags on, and the interest can cost more than what was bought. Best habit: pay in full every month.')],
        };
      }
      // simulations
      let bal, pay, res;
      const maxM = t === 'three' ? 200 : g >= 11 ? 90 : 48;
      do {
        bal = k.tw ? r.int(10, 80) * 1000 : k.d(r.int(16, 80) * 50);
        pay = k.tw ? Math.round((bal * r.int(25, 90)) / 1000 / 100) * 100 : Math.round((bal * r.int(25, 90)) / 1000 / 500) * 500;
        res = pay > 0 ? payoff(bal, apr, pay) : null;
      } while (!res || (t !== 'three' && res.months <= ceilDiv(bal, pay)) || res.months < (t === 'three' ? 4 : 10) || res.months > maxM || pay < monthInterest(bal, apr) * 1.3);
      const R = res.rows;
      if (t === 'three') {
        const b3 = R[2].b;
        let prev = bal;
        const steps = R.slice(0, 3).map((x, j) => { const s = T(`第 ${j + 1} 個月：${k.z(prev)} + 利息 ${k.z(x.i)} − ${k.z(x.p)} = ${k.z(x.b)}。`, `Month ${j + 1}: ${k.e(prev)} + interest ${k.e(x.i)} − ${k.e(x.p)} = ${k.e(x.b)}.`); prev = x.b; return s; });
        return {
          q: T(`${wz}的信用卡欠了 ${k.z(bal)}，年利率 ${bpP(apr)}，不再刷卡，每月固定繳 ${k.z(pay)}。${rule.zh}。繳完第 3 個月後，還欠多少？${k.hint.zh}`,
            `${we} owes ${k.e(bal)} on a credit card at an APR of ${bpP(apr)}, makes no new purchases and pays ${k.e(pay)} each month. Rule: ${rule.en}. How much is still owed after the 3rd payment? ${k.hint.en}`),
          ans: k.ans(b3),
          sol: [...steps, T(`繳了 3 × ${k.z(pay)} = ${k.z(3 * pay)}，欠款卻只少了 ${k.z(bal - b3)}，因為有 ${k.z(R[0].i + R[1].i + R[2].i)} 拿去付利息。`, `${we} paid 3 × ${k.e(pay)} = ${k.e(3 * pay)}, but the debt fell only ${k.e(bal - b3)}, because ${k.e(R[0].i + R[1].i + R[2].i)} went to interest.`)],
        };
      }
      const last = R[R.length - 1];
      const head = [T(`第 1 個月：利息 ${k.z(R[0].i)}，繳 ${k.z(pay)} 後剩 ${k.z(R[0].b)}；第 2 個月：利息 ${k.z(R[1].i)}，剩 ${k.z(R[1].b)}……`, `Month 1: interest ${k.e(R[0].i)}, after paying ${k.e(pay)} the balance is ${k.e(R[0].b)}; month 2: interest ${k.e(R[1].i)}, balance ${k.e(R[1].b)}…`),
        T(`一個月一個月算下去（用試算表最方便），到第 ${res.months} 個月最後一次只要繳 ${k.z(last.p)} 就還清。`, `Keep going month by month (a spreadsheet helps); in month ${res.months} the last payment is just ${k.e(last.p)} and the debt is gone.`)];
      if (t === 'months') {
        return {
          q: T(`${wz}的信用卡欠了 ${k.z(bal)}，年利率 ${bpP(apr)}，不再刷卡，每月固定繳 ${k.z(pay)}（最後一次只繳剩下的金額）。${rule.zh}。總共要繳幾個月才能還清？（可以用試算表或計算機一個月一個月算）`,
            `${we} owes ${k.e(bal)} on a credit card at an APR of ${bpP(apr)}, makes no new purchases and pays ${k.e(pay)} each month (the last payment is just what is left). Rule: ${rule.en}. How many monthly payments does it take to pay it off? (Use a spreadsheet or calculator, month by month.)`),
          ans: ansNum(res.months),
          sol: [...head, T(`答案：${res.months} 個月，總共付了利息 ${k.z(res.interest)}。`, `Answer: ${res.months} months, with ${k.e(res.interest)} of interest in total.`),
            T(`如果沒有利息，${k.z(bal)} ÷ ${k.z(pay)} 只要 ${ceilDiv(bal, pay)} 個月；多出來的 ${res.months - ceilDiv(bal, pay)} 個月都是在付利息。`, `With no interest, ${k.e(bal)} ÷ ${k.e(pay)} would take only ${ceilDiv(bal, pay)} months; the extra ${res.months - ceilDiv(bal, pay)} months are all spent paying interest.`)],
        };
      }
      if (t === 'total') {
        return {
          q: T(`${wz}的信用卡欠了 ${k.z(bal)}，年利率 ${bpP(apr)}，不再刷卡，每月固定繳 ${k.z(pay)}（最後一次只繳剩下的金額）。${rule.zh}。還清時總共付了多少利息？（用試算表一個月一個月算）${k.hint.zh}`,
            `${we} owes ${k.e(bal)} on a credit card at an APR of ${bpP(apr)}, makes no new purchases and pays ${k.e(pay)} each month (the last payment is just what is left). Rule: ${rule.en}. How much interest is paid in total? (Use a spreadsheet, month by month.) ${k.hint.en}`),
          ans: k.ans(res.interest),
          sol: [...head, T(`把每個月的利息加起來：總利息 = ${k.z(res.interest)}。`, `Add up each month's interest: total interest = ${k.e(res.interest)}.`),
            T(`檢查：總共繳了 ${k.z(res.paid)} = 欠款 ${k.z(bal)} + 利息 ${k.z(res.interest)} ✔。`, `Check: total paid ${k.e(res.paid)} = debt ${k.e(bal)} + interest ${k.e(res.interest)} ✔.`)],
        };
      }
      // compare: pay vs 2·pay
      const res2 = payoff(bal, apr, 2 * pay), saved = res.interest - res2.interest;
      return {
        q: T(`${wz}的信用卡欠了 ${k.z(bal)}，年利率 ${bpP(apr)}，不再刷卡。${rule.zh}，最後一次只繳剩下的金額。每月繳 ${k.z(2 * pay)} 比每月只繳 ${k.z(pay)}，總利息少付多少？（用試算表算）${k.hint.zh}`,
          `${we} owes ${k.e(bal)} on a credit card at an APR of ${bpP(apr)} and makes no new purchases. Rule: ${rule.en}; the last payment is just what is left. How much less interest does ${we} pay in total by paying ${k.e(2 * pay)} a month instead of ${k.e(pay)}? (Use a spreadsheet.) ${k.hint.en}`),
        ans: k.ans(saved),
        sol: [T(`每月繳 ${k.z(pay)}：${res.months} 個月還清，總利息 ${k.z(res.interest)}。`, `Paying ${k.e(pay)}: paid off in ${res.months} months, total interest ${k.e(res.interest)}.`),
          T(`每月繳 ${k.z(2 * pay)}：${res2.months} 個月還清，總利息 ${k.z(res2.interest)}。`, `Paying ${k.e(2 * pay)}: paid off in ${res2.months} months, total interest ${k.e(res2.interest)}.`),
          T(`少付 ${k.z(res.interest)} − ${k.z(res2.interest)} = ${k.z(saved)}。`, `Saved: ${k.e(res.interest)} − ${k.e(res2.interest)} = ${k.e(saved)}.`),
          2 * res2.interest < res.interest
            ? T('繳款加倍，利息卻少了一半以上：因為欠款減得快，之後每個月的利息都變少。', 'Doubling the payment cuts the interest by more than half, because the debt shrinks faster and every later month is charged less.')
            : T('多繳一點，欠款減得快，之後每個月的利息都變少，總利息就省下很多。', 'Paying more shrinks the debt faster, so every later month is charged less and the total interest drops a lot.')],
      };
    },
  },

  // 6 ──────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'loan-payment',
    grades: [10, 12],
    area: 'credit',
    name: T('貸款的每月還款', 'Loan payments'),
    std: { us: 'Jump$tart · Managing Credit', tw: '金融教育 · 借貸與信用' },
    lesson: T('分期攤還的貸款每月繳一樣的金額：M = P·r ÷ (1 − (1 + r)^−n)，P 是借款、r 是月利率（年利率 ÷ 12）、n 是期數。每期的錢一部分付利息、一部分還本金。期數越長，每月繳得越少，但總利息越多。',
      'An amortized loan has the same payment every month: M = P·r ÷ (1 − (1 + r)^−n), where P is the amount borrowed, r the monthly rate (APR ÷ 12) and n the number of months. Each payment is part interest, part principal. A longer loan means a smaller payment but more total interest.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const LOANS = k.tw
        ? [[T('汽車貸款', 'a car loan'), 300000, 900000, 10000, [36, 48, 60, 72], [250, 300, 350, 400, 450]],
          [T('機車貸款', 'a scooter loan'), 40000, 120000, 1000, [12, 18, 24, 30, 36], [600, 800, 1000, 1200]],
          [T('個人信用貸款', 'a personal loan'), 100000, 500000, 10000, [24, 36, 48, 60, 84], [300, 400, 500, 600, 800]]]
        : [[T('汽車貸款', 'a car loan'), 10000, 35000, 500, [36, 48, 60, 72], [399, 450, 550, 650, 799]],
          [T('個人貸款', 'a personal loan'), 3000, 15000, 500, [24, 36, 48, 60], [800, 1000, 1200, 1500]],
          [T('學生貸款', 'a student loan'), 10000, 40000, 1000, [120], [450, 550, 650]]];
      const [what, lo, hi, st, ns, aprs] = r.pick(LOANS);
      const P = k.d(r.int(lo / st, hi / st) * st), apr = r.pick(aprs), n = r.pick(ns), M = loanPayment(P, apr, n);
      const rr = num(+(apr / 1200).toFixed(4));
      const t = r.pick(['pay', 'pay', 'total', 'compare', 'split', 'concept']);
      const intro = T(`${wz}借了${what.zh} ${k.z(P)}，年利率 ${bpP(apr)}，分 ${n} 個月攤還（每月繳一樣的金額）。`, `${we} takes out ${what.en} of ${k.e(P)} at an APR of ${bpP(apr)}, repaid in ${n} equal monthly payments.`);
      const formula = T(`公式：M = P·r ÷ (1 − (1 + r)^−n)，r = ${bpP(apr)} ÷ 12 ${apr % 3 ? "≈" : "="} ${rr}%，n = ${n}。`, `Formula: M = P·r ÷ (1 − (1 + r)^−n), with r = ${bpP(apr)} ÷ 12 ${apr % 3 ? "≈" : "="} ${rr}% and n = ${n}.`);
      const calc = T(`M = ${k.z(P)} × r ÷ (1 − (1 + r)^−${n}) ≈ ${k.z(M)}（${k.rnd.zh}）。`, `M = ${k.e(P)} × r ÷ (1 − (1 + r)^−${n}) ≈ ${k.e(M)} (${k.rnd.en}).`);
      if (t === 'pay') {
        return {
          q: T(`${intro.zh}每月要繳多少？用 M = P·r ÷ (1 − (1 + r)^−n)，r = 年利率 ÷ 12，${k.rnd.zh}。${k.hint.zh}`, `${intro.en} What is the monthly payment? Use M = P·r ÷ (1 − (1 + r)^−n) with r = APR ÷ 12, ${k.rnd.en}. ${k.hint.en}`),
          ans: k.ans(M),
          sol: [formula, calc,
            T(`檢查：${n} × ${k.z(M)} = ${k.z(n * M)}，比借的 ${k.z(P)} 多，多的部分就是利息。`, `Check: ${n} × ${k.e(M)} = ${k.e(n * M)}, more than the ${k.e(P)} borrowed; the extra is the interest.`),
            T('如果不收利息，每月只要 P ÷ n；利息讓每月繳款變高一些。', 'With no interest it would be just P ÷ n each month; interest makes each payment a bit bigger.')],
          hint: T('先算月利率 r = 年利率 ÷ 12。', 'First find the monthly rate r = APR ÷ 12.'),
        };
      }
      if (t === 'total') {
        return {
          q: T(`${intro.zh}每月繳 ${k.z(M)}（已${k.rnd.zh}）。把 ${n} 期都繳完，總共付了多少利息？（用 每月繳款 × 期數 − 借款 計算，忽略最後一期可能的零頭調整）${k.hint.zh}`,
            `${intro.en} The monthly payment is ${k.e(M)} (${k.rnd.en}). How much interest is paid in total over all ${n} payments? (Use payment × number of payments − amount borrowed; ignore any small adjustment to the final payment.) ${k.hint.en}`),
          ans: k.ans(M * n - P),
          sol: [T(`總共繳 ${n} × ${k.z(M)} = ${k.z(M * n)}。`, `Total paid: ${n} × ${k.e(M)} = ${k.e(M * n)}.`),
            T(`總利息 = ${k.z(M * n)} − ${k.z(P)} = ${k.z(M * n - P)}。`, `Total interest = ${k.e(M * n)} − ${k.e(P)} = ${k.e(M * n - P)}.`),
            T(`也就是說，為了現在就拿到 ${k.z(P)}，要多付 ${k.z(M * n - P)}。`, `In other words, getting ${k.e(P)} now costs an extra ${k.e(M * n - P)}.`)],
        };
      }
      if (t === 'compare') {
        let n1, n2; const pool = ns.length > 1 ? ns : [60, 120];
        do { [n1, n2] = r.sample(pool, 2).sort((a, b) => a - b); } while (n1 === n2);
        const M1 = loanPayment(P, apr, n1), M2 = loanPayment(P, apr, n2), I1 = M1 * n1 - P, I2 = M2 * n2 - P;
        return {
          q: T(`${wz}要借${what.zh} ${k.z(P)}，年利率 ${bpP(apr)}。分 ${n1} 期每月繳 ${k.z(M1)}，分 ${n2} 期每月繳 ${k.z(M2)}（都已${k.rnd.zh}）。分 ${n2} 期總利息比分 ${n1} 期多多少？（利息 = 每月繳款 × 期數 − 借款）${k.hint.zh}`,
            `${we} wants to borrow ${k.e(P)} (${what.en}) at an APR of ${bpP(apr)}. Over ${n1} months the payment is ${k.e(M1)}; over ${n2} months it is ${k.e(M2)} (both ${k.rnd.en}). How much more total interest does the ${n2}-month loan cost? (Interest = payment × months − amount borrowed.) ${k.hint.en}`),
          ans: k.ans(I2 - I1),
          sol: [T(`${n1} 期：${n1} × ${k.z(M1)} − ${k.z(P)} = ${k.z(I1)} 利息。`, `${n1} months: ${n1} × ${k.e(M1)} − ${k.e(P)} = ${k.e(I1)} interest.`),
            T(`${n2} 期：${n2} × ${k.z(M2)} − ${k.z(P)} = ${k.z(I2)} 利息。`, `${n2} months: ${n2} × ${k.e(M2)} − ${k.e(P)} = ${k.e(I2)} interest.`),
            T(`多了 ${k.z(I2)} − ${k.z(I1)} = ${k.z(I2 - I1)}。`, `That is ${k.e(I2)} − ${k.e(I1)} = ${k.e(I2 - I1)} more.`),
            T('期數拉長，每月輕鬆一點，但欠錢的時間變長，利息就付得更多。', 'A longer loan feels easier each month, but you owe money for longer, so you pay more interest.')],
        };
      }
      if (t === 'split') {
        const I1 = monthInterest(P, apr), pr = M - I1, askP = r.chance(0.6);
        return {
          q: T(`${intro.zh}每月繳 ${k.z(M)}。第 1 期的利息 = 借款 × 年利率 ÷ 12（${k.rnd.zh}），其餘用來還本金。第 1 期有多少錢是${askP ? '還本金' : '付利息'}？${k.hint.zh}`,
            `${intro.en} The payment is ${k.e(M)}. In month 1 the interest is the amount borrowed × APR ÷ 12 (${k.rnd.en}), and the rest pays down the principal. How much of the first payment goes to ${askP ? 'principal' : 'interest'}? ${k.hint.en}`),
          ans: k.ans(askP ? pr : I1),
          sol: [T(`第 1 期利息 = ${k.z(P)} × ${bpP(apr)} ÷ 12 ≈ ${k.z(I1)}。`, `Month 1 interest = ${k.e(P)} × ${bpP(apr)} ÷ 12 ≈ ${k.e(I1)}.`),
            T(`還本金 = ${k.z(M)} − ${k.z(I1)} = ${k.z(pr)}。`, `Principal = ${k.e(M)} − ${k.e(I1)} = ${k.e(pr)}.`),
            T(`繳完後還欠 ${k.z(P)} − ${k.z(pr)} = ${k.z(P - pr)}。`, `After it, ${we} owes ${k.e(P)} − ${k.e(pr)} = ${k.e(P - pr)}.`),
            T('欠款變少，下一期的利息就少一點，還本金的部分就多一點。越後面的期數，越多錢在還本金。', 'With a smaller balance, next month\'s interest is a bit lower and more goes to principal. Later payments are mostly principal.')],
        };
      }
      const n2 = n * 2, M2 = loanPayment(P, apr, n2);
      return {
        q: T(`${intro.zh}每月繳 ${k.z(M)}。如果改成分 ${n2} 期，會怎樣？`, `${intro.en} The payment is ${k.e(M)}. What happens if ${we} stretches it to ${n2} months instead?`),
        ans: ansChoice([T('每月繳得比較少，但總利息比較多', 'A smaller monthly payment, but more total interest'),
          T('每月繳得比較少，總利息也比較少', 'A smaller monthly payment and less total interest'),
          T('每月繳款剛好變成一半，總利息不變', 'The payment is exactly cut in half and the total interest stays the same'),
          T('每月繳得比較多，總利息比較少', 'A bigger monthly payment and less total interest')]),
        sol: [T(`分 ${n2} 期每月約 ${k.z(M2)}，比 ${k.z(M)} 少（但不到一半）。`, `Over ${n2} months the payment is about ${k.e(M2)}, less than ${k.e(M)} (but not half).`),
          T(`總利息：${n} 期 ≈ ${k.z(M * n - P)}，${n2} 期 ≈ ${k.z(M2 * n2 - P)}。`, `Total interest: ${n} months ≈ ${k.e(M * n - P)}, ${n2} months ≈ ${k.e(M2 * n2 - P)}.`),
          T('借得越久，欠錢的時間越長，利息就越多。', 'The longer you borrow, the longer you owe, and the more interest you pay.')],
      };
    },
  },

  // 7 ──────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'rule-of-72',
    grades: [9, 12],
    area: 'invest',
    name: T('72 法則：錢多久翻倍？', 'The Rule of 72'),
    std: { us: 'Jump$tart · Investing', tw: '金融教育 · 投資理財' },
    lesson: T('72 法則是一個心算估計：用 72 除以每年的報酬率（%），大約就是錢翻倍所需的年數。例如 6% → 72 ÷ 6 ≈ 12 年。它只是估計值，報酬率在 6%～10% 左右最準。',
      'The Rule of 72 is a mental-math estimate: 72 ÷ the yearly rate (in %) ≈ the years it takes money to double. For example, 6% → 72 ÷ 6 ≈ 12 years. It is only an estimate, most accurate for rates around 6% to 10%.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const kinds = ['years', 'rate', 'final', 'final'];
      if (g >= 11) kinds.push('exact', 'exact');
      const t = r.pick(kinds);
      const P0 = k.tw ? r.int(1, 10) * 10000 : k.d(r.int(1, 10) * 1000);
      if (t === 'years') {
        const p = r.pick([2, 3, 4, 6, 8, 9, 12]);
        return {
          q: T(`${wz}的投資假設每年固定成長 ${p}%（複利）。用 72 法則估計，大約幾年錢會翻倍？`, `Suppose ${we}'s investment grows ${p}% every year (compounded). Using the Rule of 72, about how many years until the money doubles?`),
          ans: ansNum(72 / p),
          sol: [T('72 法則：翻倍年數 ≈ 72 ÷ 年報酬率。', 'Rule of 72: years to double ≈ 72 ÷ yearly rate.'), T(`72 ÷ ${p} = ${72 / p}，大約 ${72 / p} 年。`, `72 ÷ ${p} = ${72 / p}, so about ${72 / p} years.`),
            T(`例如 ${k.z(P0)} 大約 ${72 / p} 年後會變成 ${k.z(2 * P0)}。這是估計值，不是精確答案。`, `So ${k.e(P0)} would grow to about ${k.e(2 * P0)} in ${72 / p} years. It is an estimate, not an exact answer.`)],
        };
      }
      if (t === 'rate') {
        const y = r.pick([6, 8, 9, 12, 18, 24]);
        return {
          q: T(`${wz}希望 ${k.z(P0)} 在 ${y} 年內翻倍成 ${k.z(2 * P0)}。用 72 法則估計，每年大約要有百分之幾的報酬率？（只寫數字）`, `${we} wants ${k.e(P0)} to double to ${k.e(2 * P0)} in ${y} years. Using the Rule of 72, about what yearly rate is needed, in percent? (Type just the number.)`),
          ans: ansNum(72 / y),
          sol: [T('72 法則也可以反過來用：所需報酬率 ≈ 72 ÷ 翻倍年數。', 'The rule works backward too: rate needed ≈ 72 ÷ years to double.'), T(`72 ÷ ${y} = ${72 / y}，大約每年 ${72 / y}%。`, `72 ÷ ${y} = ${72 / y}, so about ${72 / y}% a year.`),
            T(`報酬率越高通常風險也越高，${72 / y >= 9 ? '這麼高的報酬率並不容易穩定達到。' : '要選擇自己能承受的風險。'}`, `Higher returns usually come with higher risk${72 / y >= 9 ? '; a rate this high is hard to get reliably.' : ', so choose a level of risk you can live with.'}`)],
        };
      }
      if (t === 'final') {
        const opts = [[3, 2], [4, 2], [6, 2], [6, 3], [6, 4], [8, 2], [8, 3], [8, 4], [9, 2], [9, 3], [9, 4], [12, 2], [12, 3], [12, 4]];
        const [p, d] = r.pick(opts), D = 72 / p, N = D * d, F = P0 * 2 ** d;
        return {
          q: T(`${wz}投資 ${k.z(P0)}，假設每年固定成長 ${p}%（複利），${N} 年都不動它。用 72 法則估計，${N} 年後大約有多少錢？${k.hint.zh}`,
            `${we} invests ${k.e(P0)}. Suppose it grows ${p}% every year (compounded) and stays untouched for ${N} years. Using the Rule of 72, estimate how much it will be worth after ${N} years. ${k.hint.en}`),
          ans: k.ans(F),
          sol: [T(`翻倍一次大約要 72 ÷ ${p} = ${D} 年。`, `One doubling takes about 72 ÷ ${p} = ${D} years.`),
            T(`${N} 年 ÷ ${D} 年 = 翻倍 ${d} 次。`, `${N} years ÷ ${D} years = ${d} doublings.`),
            T(`${k.z(P0)} × 2^${d} = ${k.z(P0)} × ${2 ** d} = ${k.z(F)}。`, `${k.e(P0)} × 2^${d} = ${k.e(P0)} × ${2 ** d} = ${k.e(F)}.`),
            T(`這是估計值；精確算法 ${k.z(P0)} × (1 + ${p / 100})^${N} ≈ ${k.z(grow(P0, p * 100, N))}（${k.rnd.zh}），相當接近。`, `It is an estimate; the exact value ${k.e(P0)} × (1 + ${p / 100})^${N} ≈ ${k.e(grow(P0, p * 100, N))} (${k.rnd.en}) is fairly close.`)],
        };
      }
      // exact: first whole year at which the money has at least doubled
      const p = r.pick([3, 4, 6, 8, 9, 12]), bp = p * 100;
      let n = 1; while ((10000n + BigInt(bp)) ** BigInt(n) < 2n * 10000n ** BigInt(n)) n++;
      return {
        q: T(`${wz}存了 ${k.z(P0)}，年利率 ${p}%，每年複利一次。精確計算（不用 72 法則）：最少要滿幾年，金額才會至少是 ${k.z(2 * P0)}？`,
          `${we} saves ${k.e(P0)} at ${p}% a year, compounded once a year. Computing exactly (not with the Rule of 72), after how many full years is the amount first at least ${k.e(2 * P0)}?`),
        ans: ansNum(n),
        sol: [T(`72 法則估計：72 ÷ ${p} = ${72 / p} 年左右。`, `The Rule of 72 estimates 72 ÷ ${p} = ${72 / p} years.`),
          T(`精確檢查：${n - 1} 年後 ${k.z(P0)} × ${factorText(bp, n - 1)} ≈ ${k.z(grow(P0, bp, n - 1))}，還不到 ${k.z(2 * P0)}。`, `Check exactly: after ${n - 1} years, ${k.e(P0)} × ${factorText(bp, n - 1)} ≈ ${k.e(grow(P0, bp, n - 1))}, not yet ${k.e(2 * P0)}.`),
          T(`${n} 年後 ${k.z(P0)} × ${factorText(bp, n)} ≈ ${k.z(grow(P0, bp, n))}，已經超過 ${k.z(2 * P0)}。`, `After ${n} years, ${k.e(P0)} × ${factorText(bp, n)} ≈ ${k.e(grow(P0, bp, n))}, which is past ${k.e(2 * P0)}.`),
          T(`所以答案是 ${n} 年。72 法則給的是很好的估計，但不是精確答案。`, `So the answer is ${n} years. The Rule of 72 is a good estimate, not an exact answer.`)],
      };
    },
  },

  // 8 ──────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'risk-return',
    grades: [9, 12],
    area: 'invest',
    name: T('風險與報酬', 'Risk and return'),
    std: { us: 'Jump$tart · Investing', tw: '金融教育 · 投資理財' },
    lesson: T('預期報酬越高的投資，通常風險也越高：價格可能大漲，也可能大跌。過去的報酬不保證未來的報酬。投資組合的報酬率是各部分報酬率按比例的加權平均。任何「保證高報酬」的說法都是危險訊號。',
      'Investments with higher expected returns usually carry higher risk: they can rise a lot or fall a lot. Past returns do not guarantee future returns. A portfolio\'s return is the weighted average of its parts. Any promise of "guaranteed high returns" is a red flag.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const t = r.pick(['order', 'past', 'flag', 'trade', 'weighted', 'weighted', 'money', 'money']);
      const SA = T('銀行存款', 'a savings account'), BD = T('優質政府債券', 'high-quality government bonds'), IF = T('股票指數型基金', 'a stock index fund'), ST = T('單一公司的股票', 'one company\'s stock');
      if (t === 'order') {
        const seq = [SA, BD, IF, ST], perms = [[0, 1, 2, 3], [3, 2, 1, 0], [0, 3, 1, 2], [2, 0, 1, 3], [1, 0, 3, 2], [0, 2, 3, 1]];
        const OEN = ['Savings account', 'High-quality government bonds', 'Stock index fund', 'Single company stock'];
        const mk = (p) => T(p.map((i) => seq[i].zh).join(' → '), p.map((i) => OEN[i]).join(' → '));
        return {
          q: T('一般來說，下面哪個排列是「風險由低到高」？', 'In general, which list goes from LOWEST risk to HIGHEST risk?'),
          ans: ansChoice([mk(perms[0]), ...r.sample(perms.slice(1), 3).map(mk)]),
          sol: [T('銀行存款：本金很穩，利息也低。', 'Savings account: the money is very stable, and the interest is low.'),
            T('優質政府債券：價格會有些波動，但通常比股票穩。', 'High-quality government bonds: prices move some, but usually less than stocks.'),
            T('股票指數型基金：一次持有很多公司，會漲跌，但分散了單一公司的風險。', 'Stock index fund: owns many companies; it goes up and down, but no single company can sink it.'),
            T('單一公司股票：全部押在一家公司，那家公司出事就可能大跌。預期報酬越高，風險通常越高。', 'One company\'s stock: everything rides on one company, which can crash. Higher expected return usually means higher risk.')],
        };
      }
      if (t === 'past') {
        const up = r.int(25, 60);
        return {
          q: T(`${wz}看到某檔基金去年漲了 ${up}%，就想把所有存款都投進去，因為「明年一定也會漲這麼多」。哪個說法最正確？`, `${we} sees that a fund went up ${up}% last year and wants to put all savings into it because "it will surely do the same next year." Which statement is most accurate?`),
          ans: ansChoice([T('過去的報酬不保證未來的報酬，明年可能漲也可能跌', 'Past returns do not guarantee future returns; next year it could go up or down'),
            T(`去年漲 ${up}%，明年一定至少再漲 ${up}%`, `It went up ${up}% last year, so it will surely gain at least ${up}% again`),
            T('漲過的基金就不會再跌了', 'A fund that has gone up can never go down again'),
            T('把全部存款投進去是零風險的', 'Putting all savings into it has zero risk')]),
          sol: [T('投資的價格會受經濟、公司獲利、市場情緒影響，每年都不一樣。', 'Prices depend on the economy, company profits and market mood, and they change every year.'),
            T('漲很多的投資，通常波動也很大，也可能跌很多。', 'Investments that jump a lot are usually volatile and can also drop a lot.'),
            T('所以不要把所有存款押在一個地方，也要先留好緊急預備金。', 'So do not put all your savings in one place, and keep an emergency fund first.')],
        };
      }
      if (t === 'flag') {
        const pm = r.pick([10, 15, 20, 30]);
        return {
          q: T(`有人邀請${wz}投資一個「保證每個月賺 ${pm}%、絕對不會賠」的方案。這代表什麼？`, `Someone invites ${we} to join a plan that "guarantees ${pm}% profit every month with no risk at all." What does this tell you?`),
          ans: ansChoice([T('這是詐騙的危險訊號：高報酬一定伴隨高風險，沒有人能保證', 'It is a red flag for a scam: high returns always come with high risk, and no one can guarantee them'),
            T('這是很難得的好機會，要趕快投入', 'It is a rare great opportunity; get in quickly'),
            T('只要先投小錢試試看，就一定安全', 'Investing a small amount first makes it safe for sure'),
            T('有保證就代表是政府認可的投資', 'A guarantee means the government approved it')]),
          sol: [T(`每月 ${pm}% 複利一年，大約是本金的 ${num(+((1 + pm / 100) ** 12).toFixed(1))} 倍，遠遠超過任何正常投資。`, `${pm}% a month compounded for a year is about ${num(+((1 + pm / 100) ** 12).toFixed(1))} times the money, far beyond any normal investment.`),
            T('真正的投資都有風險；「保證高報酬、零風險」就是詐騙最常見的說法。', 'Real investments all carry risk; "guaranteed high returns, zero risk" is the classic scam line.'),
            T('遇到這種邀約：不要投錢，告訴信任的大人。', 'Do not invest; tell a trusted adult.')],
        };
      }
      if (t === 'trade') {
        return {
          q: T('關於「風險」和「預期報酬」，哪一句話最正確？', 'Which statement about risk and expected return is most accurate?'),
          ans: ansChoice([T('想要較高的預期報酬，通常就要承擔較高的風險', 'To get a higher expected return, you usually have to accept more risk'),
            T('風險越低的投資，報酬一定越高', 'The lower the risk, the higher the return, always'),
            T('只要投資夠久，任何單一股票都一定賺錢', 'Any single stock always makes money if you hold it long enough'),
            T('銀行存款的長期報酬通常比股票高', 'Savings accounts usually beat stocks over the long run')]),
          sol: [T('投資人願意承擔較大的漲跌，是因為期待得到較高的報酬作為補償。', 'Investors accept bigger ups and downs because they expect a higher return in exchange.'),
            T('但「預期」不是「保證」：高風險的投資也可能虧很多。', 'But expected is not guaranteed: risky investments can also lose a lot.'),
            T('所以要看自己多久後要用這筆錢，再決定承擔多少風險。', 'So decide how much risk to take based on when you will need the money.')],
        };
      }
      const w1 = r.int(1, 9) * 10, w2 = 100 - w1, x = r.int(-20, 25), y = r.int(1, 6);
      if (t === 'weighted') {
        const ret = (w1 * x + w2 * y) / 100;   // exact to 0.1 because w1, w2 are multiples of 10
        return {
          q: T(`${wz}的投資組合有 ${w1}% 是股票基金、${w2}% 是債券基金。今年股票基金${x < 0 ? `跌了 ${-x}%` : `漲了 ${x}%`}，債券基金漲了 ${y}%。整個組合今年的報酬率是百分之幾？（只寫數字，可能是負數）`,
            `${we}'s portfolio is ${w1}% in a stock fund and ${w2}% in a bond fund. This year the stock fund ${x < 0 ? `lost ${-x}%` : `gained ${x}%`} and the bond fund gained ${y}%. What is the whole portfolio's return this year, in percent? (Type just the number; it may be negative.)`),
          ans: ansNum(ret),
          sol: [T('組合報酬率 = 各部分的比例 × 各自的報酬率，再加起來（加權平均）。', 'Portfolio return = each part\'s weight × its return, added up (a weighted average).'),
            T(`${w1}% × ${x < 0 ? `(${num(x)}%)` : `${x}%`} + ${w2}% × ${y}% = ${num((w1 * x) / 100)}% + ${num((w2 * y) / 100)}% = ${num(ret)}%。`, `${w1}% × ${x < 0 ? `(${num(x)}%)` : `${x}%`} + ${w2}% × ${y}% = ${num((w1 * x) / 100)}% + ${num((w2 * y) / 100)}% = ${num(ret)}%.`),
            T(`結果介於 ${num(Math.min(x, y))}% 和 ${num(Math.max(x, y))}% 之間，比較靠近比例大的那一邊。`, `The result is between ${num(Math.min(x, y))}% and ${num(Math.max(x, y))}%, closer to the bigger part.`),
            T('股票比例越高，好年頭賺越多，壞年頭也賠越多。', 'More stocks means bigger gains in good years and bigger losses in bad years.')],
        };
      }
      const A = k.tw ? r.int(10, 100) * 10000 : k.d(r.int(1, 50) * 1000), a1 = (A * w1) / 100, a2 = A - a1, g1 = (a1 * x) / 100, g2 = (a2 * y) / 100, end = A + g1 + g2;
      const sg = (v, z) => (v < 0 ? `−${z(-v)}` : `+${z(v)}`); const op = (v, z) => (v < 0 ? `− ${z(-v)}` : `+ ${z(v)}`);
      return {
        q: T(`${wz}投資 ${k.z(A)}：${w1}% 放股票基金，${w2}% 放債券基金。一年後股票基金${x < 0 ? `跌了 ${-x}%` : `漲了 ${x}%`}，債券基金漲了 ${y}%。現在整個投資值多少錢？${k.hint.zh}`,
          `${we} invests ${k.e(A)}: ${w1}% in a stock fund and ${w2}% in a bond fund. After a year the stock fund ${x < 0 ? `lost ${-x}%` : `gained ${x}%`} and the bond fund gained ${y}%. What is the whole investment worth now? ${k.hint.en}`),
        ans: k.ans(end),
        sol: [T(`股票基金：${k.z(A)} × ${w1}% = ${k.z(a1)}；債券基金：${k.z(a2)}。`, `Stock fund: ${k.e(A)} × ${w1}% = ${k.e(a1)}; bond fund: ${k.e(a2)}.`),
          T(`股票部分 ${k.z(a1)} × (${num(x)}%) = ${sg(g1, k.z)}；債券部分 ${k.z(a2)} × ${y}% = ${sg(g2, k.z)}。`, `Stocks: ${k.e(a1)} × (${num(x)}%) = ${sg(g1, k.e)}; bonds: ${k.e(a2)} × ${y}% = ${sg(g2, k.e)}.`),
          T(`現在值 ${k.z(A)} ${op(g1, k.z)} ${op(g2, k.z)} = ${k.z(end)}。`, `Now worth ${k.e(A)} ${op(g1, k.e)} ${op(g2, k.e)} = ${k.e(end)}.`),
          T(`整體${end >= A ? '賺了' : '賠了'} ${k.z(Math.abs(end - A))}，也就是 ${num((w1 * x + w2 * y) / 100)}%。`, `Overall ${end >= A ? 'a gain' : 'a loss'} of ${k.e(Math.abs(end - A))}, which is ${num((w1 * x + w2 * y) / 100)}%.`)],
      };
    },
  },

  // 9 ──────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'diversification',
    grades: [9, 12],
    area: 'invest',
    name: T('分散投資', 'Diversification'),
    std: { us: 'Jump$tart · Investing', tw: '金融教育 · 投資理財' },
    lesson: T('「不要把雞蛋放在同一個籃子裡」：把錢分散在很多家公司，就算其中一家出事，整體受到的傷害也小很多。指數型基金一次持有很多公司，是簡單的分散方法。分散能降低風險，但不能讓投資完全沒有風險。',
      '"Don\'t put all your eggs in one basket": if your money is spread across many companies, one company failing does much less damage. An index fund owns many companies at once, an easy way to diversify. Diversification lowers risk, but it cannot remove all risk.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const t = r.pick(['one', 'split', 'split', 'diff', 'index', 'index', 'concept', 'fund']);
      const A = k.tw ? r.int(10, 50) * 10000 : k.d(r.int(5, 20) * 1000), part = A / 10;
      const d = r.pick([50, 60, 70, 80, 90]), up = r.int(2, 15);
      const one = (A * (100 - d)) / 100, bad = (part * (100 - d)) / 100, good = (9 * part * (100 + up)) / 100, split = bad + good;
      const setup = T(`${wz}有 ${k.z(A)} 要投資。`, `${we} has ${k.e(A)} to invest.`);
      if (t === 'one') {
        return {
          q: T(`${setup.zh}全部買了同一家公司的股票，後來這家公司出問題，股價跌了 ${d}%。現在還剩多少錢？${k.hint.zh}`, `${setup.en} ${we} puts it all into one company's stock. The company runs into trouble and the stock drops ${d}%. How much is left? ${k.hint.en}`),
          ans: k.ans(one),
          sol: [T(`跌 ${d}% 代表只剩 ${100 - d}%。`, `Down ${d}% means ${100 - d}% is left.`), T(`${k.z(A)} × ${100 - d}% = ${k.z(one)}。`, `${k.e(A)} × ${100 - d}% = ${k.e(one)}.`),
            T(`一次就損失 ${k.z(A - one)}。把全部的錢押在一家公司，風險非常集中。`, `That is ${k.e(A - one)} lost at once. Betting everything on one company concentrates the risk.`)],
        };
      }
      const story = T(`${setup.zh}平均分成 10 份，各買一家不同公司的股票（每家 ${k.z(part)}）。一年後，其中一家跌了 ${d}%，另外 9 家都漲了 ${up}%。`,
        `${setup.en} ${we} splits it equally among 10 different companies (${k.e(part)} each). After a year one company is down ${d}%, and the other 9 are each up ${up}%.`);
      const ssol = [T(`跌的那家剩下 ${100 - d}%：${k.z(part)} × ${100 - d}% = ${k.z(bad)}。`, `The loser keeps ${100 - d}%: ${k.e(part)} × ${100 - d}% = ${k.e(bad)}.`),
        T(`其他 9 家：9 × ${k.z(part)} × ${100 + up}% = ${k.z(good)}。`, `The other 9: 9 × ${k.e(part)} × ${100 + up}% = ${k.e(good)}.`),
        T(`合計 ${k.z(bad)} + ${k.z(good)} = ${k.z(split)}。`, `Total: ${k.e(bad)} + ${k.e(good)} = ${k.e(split)}.`)];
      if (t === 'split') {
        return {
          q: T(`${story.zh}現在全部的股票值多少錢？${k.hint.zh}`, `${story.en} What are all the stocks worth now? ${k.hint.en}`), ans: k.ans(split),
          sol: [...ssol, T(`如果全部押在跌 ${d}% 的那家，只會剩 ${k.z(one)}。分散讓一家公司出事的傷害變小很多。`, `Had it all been in the company that fell ${d}%, only ${k.e(one)} would be left. Spreading out shrinks the damage.`)],
        };
      }
      if (t === 'diff') {
        return {
          q: T(`${story.zh}如果當初把 ${k.z(A)} 全部買那家跌了 ${d}% 的公司，會比分散投資少多少錢？${k.hint.zh}`, `${story.en} If ${we} had put the whole ${k.e(A)} into the company that fell ${d}%, how much less would ${we} have than with the split? ${k.hint.en}`),
          ans: k.ans(split - one),
          sol: [...ssol, T(`全部押一家：${k.z(A)} × ${100 - d}% = ${k.z(one)}。`, `All in one: ${k.e(A)} × ${100 - d}% = ${k.e(one)}.`), T(`差 ${k.z(split)} − ${k.z(one)} = ${k.z(split - one)}。`, `Difference: ${k.e(split)} − ${k.e(one)} = ${k.e(split - one)}.`)],
        };
      }
      if (t === 'index') {
        const N = r.pick([20, 25, 50, 100, 200, 500]), B = k.tw ? r.int(5, 50) * 10000 : k.d(r.int(2, 20) * 1000), loss = B / N;
        return {
          q: T(`${wz}在一檔基金投資了 ${k.z(B)}。假設這檔基金平均持有 ${N} 家公司（每家的錢一樣多）。如果其中一家公司倒閉、股票變成 0，其他公司都沒變，${wz}會損失多少錢？${k.hint.zh}`,
            `${we} has ${k.e(B)} in a fund. Suppose the fund holds ${N} companies in equal amounts. If one company goes bankrupt and its stock falls to zero while the others stay the same, how much does ${we} lose? ${k.hint.en}`),
          ans: k.ans(loss),
          sol: [T(`每家公司佔 ${k.z(B)} ÷ ${N} = ${k.z(loss)}。`, `Each company is ${k.e(B)} ÷ ${N} = ${k.e(loss)}.`), T(`倒閉的那家全部歸零，損失 ${k.z(loss)}，只佔 ${num(100 / N)}%。`, `The bankrupt one goes to zero: a loss of ${k.e(loss)}, only ${num(100 / N)}%.`),
            T(`如果全部只買那一家，就會損失全部的 ${k.z(B)}。這就是分散投資的力量。`, `Had it all been in that one company, all ${k.e(B)} would be gone. That is the power of diversification.`)],
        };
      }
      if (t === 'fund') {
        return {
          q: T('「股票指數型基金」是什麼？', 'What is a stock index fund?'),
          ans: ansChoice([T('一次持有很多家公司股票的基金，跟著某個市場指數的成分去買', 'A fund that owns stocks of many companies at once, following a market index'),
            T('只買一家公司股票的基金', 'A fund that buys only one company\'s stock'),
            T('保證每年都賺錢的存款', 'A deposit that is guaranteed to make money every year'),
            T('一種借錢給你買股票的貸款', 'A loan that lends you money to buy stocks')]),
          sol: [T('指數型基金照著一個指數（例如一大群大型公司）去持有股票。', 'An index fund holds the stocks in an index, such as a large group of big companies.'),
            T('因為一次擁有很多公司，任何一家出事，影響都很小。', 'Because it owns many companies, any single failure has a small effect.'),
            T('但整個市場下跌時，它也會跟著跌，所以不是保證賺錢。', 'But when the whole market falls, it falls too, so it is not guaranteed.')],
        };
      }
      return {
        q: T('關於分散投資，哪一句話正確？', 'Which statement about diversification is true?'),
        ans: ansChoice([T('它能降低單一公司出事造成的傷害，但整個市場下跌時還是會虧損', 'It reduces the damage when one company fails, but you can still lose money when the whole market falls'),
          T('只要分散投資，就保證永遠不會虧錢', 'If you diversify, you are guaranteed never to lose money'),
          T('分散投資就是多買幾張同一家公司的股票', 'Diversifying means buying more shares of the same company'),
          T('分散投資會讓每年的報酬一定比較高', 'Diversifying makes your return higher every single year')]),
        sol: [T('分散的意思是把錢放在很多不同的公司（甚至不同種類的資產）。', 'Diversifying means spreading money across many different companies (or even different kinds of assets).'),
          T('一家公司倒閉時，只會影響一小部分的錢。', 'When one company fails, only a small part of the money is hit.'),
          T('但如果整個經濟變差、大部分股票一起跌，分散也擋不住，所以它是「降低」風險，不是「消除」風險。', 'But if the whole economy slows and most stocks fall together, diversification cannot stop that; it lowers risk, it does not remove it.')],
      };
    },
  },

  // 10 ─────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'insurance',
    grades: [8, 12],
    area: 'risk',
    name: T('保險怎麼算？', 'How insurance works'),
    std: { us: 'Jump$tart · Managing Risk', tw: '金融教育 · 保險與風險' },
    lesson: T('保險是付一筆小而確定的「保費」，把可能發生的大損失轉給保險公司。理賠時常有「自負額」（先由自己付的部分）、「共同負擔」（例如保險付 80%、自己付 20%）和「自付上限」（一年最多自己付多少）。',
      'Insurance means paying a small, certain premium so that a large possible loss is covered by the insurer. Claims often involve a deductible (the part you pay first), coinsurance (for example the insurer pays 80% and you pay 20%) and an out-of-pocket maximum (the most you pay in a year).'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const kinds = ['you', 'you', 'insurer', 'term', 'expected'];
      if (g >= 10) kinds.push('plans', 'plans');
      if (k.tw) kinds.push('twfact');
      const t = r.pick(kinds);
      const hypo = T('假設某個醫療保險方案', 'Suppose a health-insurance plan');
      if (t === 'you' || t === 'insurer') {
        const D = k.tw ? r.pick([5000, 10000, 20000]) : k.d(r.pick([500, 1000, 1500, 2000, 3000]));
        const c = r.pick([20, 20, 30]), X = k.tw ? r.pick([50000, 80000, 100000]) : k.d(r.pick([4000, 5000, 6000, 8000]));
        const want = r.chance(0.15) ? 0 : r.chance(0.5) ? 1 : 2;   // 0 below the deductible, 1 shared, 2 capped
        let B, kind;
        do {
          B = k.tw ? r.int(1, 600) * 1000 : k.d(r.int(10, 4000) * 10);
          kind = B <= D ? 0 : D + ((B - D) * c) / 100 > X ? 2 : 1;
        } while (kind !== want || B === D);
        const you = kind === 0 ? B : Math.min(D + ((B - D) * c) / 100, X), ins = B - you, capped = kind === 2;
        const askYou = t === 'you';
        if (kind === 0) {
          return {
            q: T(`${hypo.zh}：自負額 ${k.z(D)}；超過自負額的部分，保險付 ${100 - c}%、自己付 ${c}%；一年自付上限 ${k.z(X)}。${wz}今年只有一筆 ${k.z(B)} 的醫療費用。${askYou ? `${wz}自己要付多少？` : '保險公司要付多少？'}${k.hint.zh}`,
              `${hypo.en}: deductible ${k.e(D)}; above the deductible the insurer pays ${100 - c}% and you pay ${c}%; out-of-pocket maximum ${k.e(X)} a year. ${we}'s only medical bill this year is ${k.e(B)}. How much does ${askYou ? we : 'the insurer'} pay? ${k.hint.en}`),
            ans: k.ans(askYou ? B : 0),
            sol: [T(`自負額是 ${k.z(D)}：前 ${k.z(D)} 的費用都要自己付。`, `The deductible is ${k.e(D)}: you pay the first ${k.e(D)} of costs yourself.`),
              T(`這筆費用 ${k.z(B)} 沒有超過自負額，所以全部由${wz}自己付，保險公司付 ${k.z(0)}。`, `The ${k.e(B)} bill is not above the deductible, so ${we} pays all of it and the insurer pays ${k.e(0)}.`),
              T('保險主要是幫忙應付大筆的費用；小額費用通常要自己準備。', 'Insurance mainly helps with big bills; small bills are usually yours to cover.')],
            hint: T('費用有沒有超過自負額？', 'Is the bill above the deductible?'),
          };
        }
        return {
          q: T(`${hypo.zh}：自負額 ${k.z(D)}；超過自負額的部分，保險付 ${100 - c}%、自己付 ${c}%；一年自付上限 ${k.z(X)}。${wz}今年只有一筆 ${k.z(B)} 的醫療費用。${askYou ? `${wz}自己要付多少？` : '保險公司要付多少？'}${k.hint.zh}`,
            `${hypo.en}: deductible ${k.e(D)}; above the deductible the insurer pays ${100 - c}% and you pay ${c}%; out-of-pocket maximum ${k.e(X)} a year. ${we}'s only medical bill this year is ${k.e(B)}. How much does ${askYou ? we : 'the insurer'} pay? ${k.hint.en}`),
          ans: k.ans(askYou ? you : ins),
          sol: [T(`先付自負額 ${k.z(D)}：剩下 ${k.z(B)} − ${k.z(D)} = ${k.z(B - D)} 由雙方分擔。`, `First the deductible ${k.e(D)}: the remaining ${k.e(B)} − ${k.e(D)} = ${k.e(B - D)} is shared.`),
            T(`自己付 ${c}%：${k.z(B - D)} × ${c}% = ${k.z(((B - D) * c) / 100)}，加上自負額共 ${k.z(D + ((B - D) * c) / 100)}。`, `You pay ${c}%: ${k.e(B - D)} × ${c}% = ${k.e(((B - D) * c) / 100)}; with the deductible that is ${k.e(D + ((B - D) * c) / 100)}.`),
            capped ? T(`這超過自付上限 ${k.z(X)}，所以自己最多只付 ${k.z(X)}。`, `That is over the out-of-pocket maximum of ${k.e(X)}, so you pay only ${k.e(X)}.`)
              : T(`沒有超過自付上限 ${k.z(X)}，所以自己付 ${k.z(you)}。`, `That is under the ${k.e(X)} out-of-pocket maximum, so you pay ${k.e(you)}.`),
            T(`保險公司付 ${k.z(B)} − ${k.z(you)} = ${k.z(ins)}。費用越大，保險幫忙付的比例越高。`, `The insurer pays ${k.e(B)} − ${k.e(you)} = ${k.e(ins)}. The bigger the bill, the larger the share insurance covers.`)],
          hint: T('先扣自負額，再算自己的比例，最後檢查自付上限。', 'Deductible first, then your percent, then check the maximum.'),
        };
      }
      if (t === 'term') {
        const prem = k.tw ? r.int(5, 30) * 100 : k.d(r.int(8, 40) * 10), ded = k.tw ? r.pick([3000, 5000, 10000]) : k.d(r.pick([500, 1000, 2000]));
        const which = r.int(0, 2);
        const opts = [T('保費', 'Premium'), T('自負額', 'Deductible'), T('共同負擔（自付比例）', 'Coinsurance'), T('自付上限', 'Out-of-pocket maximum')];
        const qs = [T(`${wz}每個月固定付 ${k.z(prem)} 給保險公司，才能保有這張保單。這筆錢叫做什麼？`, `${we} pays the insurer ${k.e(prem)} every month to keep the policy. What is this payment called?`),
          T(`每次理賠時，前面 ${k.z(ded)} 的費用要由${wz}自己先付，超過的部分保險才開始給付。這 ${k.z(ded)} 叫做什麼？`, `On a claim, ${we} must pay the first ${k.e(ded)} before the insurer starts paying. What is this ${k.e(ded)} called?`),
          T(`超過自負額後，保險付 80%、${wz}自己付 20%。這種「依比例分擔」的方式叫做什麼？`, `Above the deductible, the insurer pays 80% and ${we} pays 20%. What is this percentage split called?`)];
        const ex = [T('保費是為了「有保險」而定期付的錢，不管有沒有理賠都要付。', 'The premium is what you pay regularly to have insurance, whether or not you make a claim.'),
          T('自負額是理賠時自己先負擔的金額，自負額越高，保費通常越低。', 'The deductible is what you pay first on a claim; a higher deductible usually means a lower premium.'),
          T('共同負擔是超過自負額後，雙方依比例分擔費用。', 'Coinsurance means splitting the costs above the deductible by percentage.')];
        return {
          q: qs[which], ans: ansChoice([opts[which], ...opts.filter((_, j) => j !== which)]),
          sol: [ex[which], T('自付上限則是一年內自己最多要付的總額，超過的全部由保險負擔。', 'The out-of-pocket maximum is the most you pay in a year; above it the insurer pays everything.'),
            T('看保單時，這四個數字一起看，才知道真正要花多少錢。', 'Read all four numbers together to know what a policy really costs you.')],
        };
      }
      if (t === 'expected') {
        const [pz, pe, num1, den1] = r.pick([['1%', '1%', 1, 100], ['2%', '2%', 2, 100], ['0.5%', '0.5%', 1, 200], ['5%', '5%', 5, 100]]);
        // [what, TW loss range (thousands of NT$), US loss range (thousands of $)]
        const items = [[T('機車被偷', 'a scooter being stolen'), T('汽車被偷', 'a car being stolen'), [30, 90], [8, 30]], [T('手機摔壞', 'a phone breaking'), T('手機摔壞', 'a phone breaking'), [10, 40], [1, 2]], [T('家裡淹水', 'the home flooding'), T('家裡淹水', 'the home flooding'), [100, 900], [10, 60]]];
        const it = r.pick(items), rg = k.tw ? it[2] : it[3];
        const what = [k.tw ? it[0] : it[1]];
        const L = r.int(rg[0], rg[1]) * 1000 * 100, E = (L * num1) / den1;
        return {
          q: T(`假設每年發生「${what[0].zh}」的機率是 ${pz}，一旦發生會損失 ${k.z(L)}。平均來說，每年的預期損失是多少？${k.hint.zh}`,
            `Suppose the chance of ${what[0].en} in a year is ${pe}, and if it happens the loss is ${k.e(L)}. On average, what is the expected loss per year? ${k.hint.en}`),
          ans: k.ans(E),
          sol: [T('預期損失 = 發生機率 × 損失金額。', 'Expected loss = probability × size of the loss.'), T(`${pz} × ${k.z(L)} = ${k.z(E)}。`, `${pe} × ${k.e(L)} = ${k.e(E)}.`),
            T(`保險公司收的保費通常會比 ${k.z(E)} 多一點，因為要支付營運成本。`, `An insurer's premium is usually a bit more than ${k.e(E)}, to cover its costs.`),
            T(`那為什麼還要買？因為一次損失 ${k.z(L)} 可能讓人付不出來；用小而確定的保費，換掉小機率但很大的損失。`, `So why buy it? Because a sudden ${k.e(L)} loss could be impossible to pay; a small, certain premium replaces a small chance of a huge loss.`)],
        };
      }
      if (t === 'plans') {
        const pa = k.tw ? r.int(5, 10) * 100 : k.d(r.int(15, 30) * 10), pb = pa + (k.tw ? r.int(3, 8) * 100 : k.d(r.int(6, 15) * 10));
        const da = k.tw ? 30000 : k.d(3000), db = k.tw ? 5000 : k.d(500), X = k.tw ? 80000 : k.d(6000);
        const pay = (B, d) => (B <= d ? B : Math.min(d + (B - d) / 5, X));
        let B, ta, tb;
        do {
          B = r.chance(0.5) ? (k.tw ? r.int(0, 5) * 1000 : k.d(r.int(0, 5) * 100)) : k.tw ? r.int(40, 200) * 1000 : k.d(r.int(4, 20) * 1000);
          ta = 12 * pa + pay(B, da); tb = 12 * pb + pay(B, db);
        } while (ta === tb);
        const cheaper = ta < tb ? 0 : 1, nm = [T('方案 A', 'Plan A'), T('方案 B', 'Plan B')];
        return {
          q: T(`兩個假設的保險方案（超過自負額後都是自己付 20%，自付上限都是 ${k.z(X)}）：方案 A 每月保費 ${k.z(pa)}、自負額 ${k.z(da)}；方案 B 每月保費 ${k.z(pb)}、自負額 ${k.z(db)}。如果${wz}今年的醫療費用一共是 ${k.z(B)}，哪個方案一整年的總花費（保費 + 自己付的醫療費）比較少？`,
            `Two made-up plans (above the deductible you pay 20%; out-of-pocket maximum ${k.e(X)} for both): Plan A costs ${k.e(pa)} a month with a ${k.e(da)} deductible; Plan B costs ${k.e(pb)} a month with a ${k.e(db)} deductible. If ${we}'s medical bills this year total ${k.e(B)}, which plan costs less for the whole year (premiums + what ${we} pays for care)?`),
          ans: ansChoice([nm[cheaper], nm[1 - cheaper], T('兩個一樣', 'They cost the same')]),
          sol: [T(`方案 A：保費 12 × ${k.z(pa)} = ${k.z(12 * pa)}，醫療自付 ${k.z(pay(B, da))}，共 ${k.z(ta)}。`, `Plan A: premiums 12 × ${k.e(pa)} = ${k.e(12 * pa)}, care ${k.e(pay(B, da))}, total ${k.e(ta)}.`),
            T(`方案 B：保費 12 × ${k.z(pb)} = ${k.z(12 * pb)}，醫療自付 ${k.z(pay(B, db))}，共 ${k.z(tb)}。`, `Plan B: premiums 12 × ${k.e(pb)} = ${k.e(12 * pb)}, care ${k.e(pay(B, db))}, total ${k.e(tb)}.`),
            T(`${nm[cheaper].zh} 少 ${k.z(Math.abs(ta - tb))}。`, `${nm[cheaper].en} costs ${k.e(Math.abs(ta - tb))} less.`),
            T('醫療費用少的年份，保費低的方案划算；費用多的年份，自負額低的方案可能比較划算。', 'In a low-cost year the cheaper premium wins; in a high-cost year the lower deductible may win.')],
        };
      }
      // twfact (Taiwan mode only)
      if (r.chance(0.5)) {
        return {
          q: T(`${wz}滿 18 歲考到機車駕照，準備騎機車上路。依台灣法律，機車一定要投保哪一種保險？`, `${we} turns 18, gets a scooter license and is about to ride on the road. Under Taiwan law, which insurance must every scooter have?`),
          ans: ansChoice([T('強制汽車責任保險（強制險）', 'Compulsory automobile liability insurance'), T('不用保任何保險', 'No insurance at all'), T('只要保壽險就可以', 'Only life insurance'), T('只要保旅遊平安險就可以', 'Only travel accident insurance')]),
          sol: [T('台灣的汽車和機車都必須投保「強制汽車責任保險」，沒保會被罰。', 'In Taiwan, every car and scooter must carry compulsory automobile liability insurance; riding without it is fined.'),
            T('它主要用來賠償交通事故中受傷或死亡的人。', 'It mainly pays people injured or killed in traffic accidents.'),
            T('強制險的保障有限，很多人會再加保其他的車險（例如第三人責任險）。', 'Its coverage is limited, so many people add other vehicle insurance, such as third-party liability.')],
        };
      }
      return {
        q: T('關於台灣的「全民健康保險」，哪一句話正確？', 'Which statement about Taiwan\'s National Health Insurance is true?'),
        ans: ansChoice([T('符合資格的人都必須參加，大家定期繳保費，看病時健保負擔大部分費用', 'Everyone who is eligible must join; people pay premiums regularly and NHI covers most of the cost of care'),
          T('想參加的人才參加，大部分人都沒有保', 'Only people who want it join, and most people are not covered'),
          T('有了健保，看病一定完全免費，什麼都不用付', 'With NHI every doctor visit is completely free, with nothing to pay'),
          T('健保是一種投資，繳的保費會變成股票', 'NHI is an investment; the premiums turn into stocks')]),
        sol: [T('全民健保是強制參加的社會保險。', 'National Health Insurance is a compulsory social insurance program.'),
          T('大家（還有雇主、政府）一起繳保費，生病時由健保支付大部分醫療費。', 'People (with employers and the government) pay premiums, and NHI pays most medical costs.'),
          T('看病時通常還是要付「部分負擔」，所以不是完全免費。', 'Patients usually still pay a copayment, so care is not completely free.')],
      };
    },
  },

  // 11 ─────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'net-worth',
    grades: [7, 10],
    area: 'save',
    name: T('淨資產', 'Net worth'),
    std: { us: 'Jump$tart · Saving', tw: '金融教育 · 儲蓄' },
    lesson: T('資產是你擁有、有價值的東西（現金、存款、投資、車子）；負債是你欠別人的錢（貸款、卡債）。淨資產 = 資產 − 負債。用存款還債，淨資產不變；把錢花在用完就沒了的東西上，淨資產就會減少。',
      'Assets are things you own that have value (cash, savings, investments, a car); liabilities are money you owe (loans, card balances). Net worth = assets − liabilities. Paying a debt with savings leaves net worth the same; spending on something that is used up lowers it.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const veh = k.tw ? ['機車 Scooter', T('機車', 'a scooter')] : ['汽車 Car', T('汽車', 'a car')];
      // [fig label, text, lo, hi, step] in whole dollars / 元
      const AS = k.tw
        ? [['現金 Cash', T('現金', 'cash'), 500, 5000, 100], ['存款 Savings', T('銀行存款', 'a savings account'), 5000, 80000, 1000], [veh[0], veh[1], 15000, 40000, 1000], ['基金 Index fund', T('指數型基金', 'an index fund'), 10000, 50000, 1000], ['腳踏車 Bike', T('腳踏車', 'a bike'), 2000, 8000, 500]]
        : [['現金 Cash', T('現金', 'cash'), 20, 300, 5], ['存款 Savings', T('銀行存款', 'a savings account'), 500, 8000, 50], [veh[0], veh[1], 3000, 12000, 100], ['基金 Index fund', T('指數型基金', 'an index fund'), 500, 5000, 50], ['腳踏車 Bike', T('腳踏車', 'a bike'), 150, 800, 10]];
      const LI = k.tw
        ? [['學貸 Student loan', T('學生貸款', 'a student loan'), 50000, 200000, 1000], ['卡債 Card balance', T('信用卡未繳餘額', 'a credit-card balance'), 1000, 15000, 100], ['機車貸款 Scooter loan', T('機車貸款', 'a scooter loan'), 5000, 30000, 1000], ['欠朋友 Owed to a friend', T('向朋友借的錢', 'money borrowed from a friend'), 500, 3000, 100]]
        : [['學貸 Student loan', T('學生貸款', 'a student loan'), 5000, 30000, 100], ['卡債 Card balance', T('信用卡未繳餘額', 'a credit-card balance'), 100, 1500, 1], ['車貸 Car loan', T('汽車貸款', 'a car loan'), 2000, 9000, 100], ['欠朋友 Owed to a friend', T('向朋友借的錢', 'money borrowed from a friend'), 20, 200, 5]];
      const val = (it) => k.d(r.int(it[2] / it[4], it[3] / it[4]) * it[4]);
      const t = r.pick(['compute', 'compute', 'compute', 'classify', 'decision', 'decision', 'reverse']);
      if (t === 'compute' || t === 'reverse') {
        let as, li, A, L;
        do {
          as = r.sample(AS, r.int(3, 4)).map((it) => [it, val(it)]);
          const hasVeh = as.some(([it]) => it === AS[2]);
          const pool = LI.filter((it, j) => (j !== 0 || g >= 9) && (j !== 2 || hasVeh));
          li = r.sample(pool, Math.min(pool.length, r.int(2, 3))).map((it) => [it, val(it)]);
          A = as.reduce((s, x) => s + x[1], 0); L = li.reduce((s, x) => s + x[1], 0);
        } while (A === L || ((g < 9 || t === 'reverse') && A < L));
        const NW = A - L;
        const fig = table(null, [['<b>資產 Assets</b>', ''], ...as.map(([it, v]) => [it[0], k.e(v)]), ['<b>負債 Liabilities</b>', ''], ...li.map(([it, v]) => [it[0], k.e(v)])]);
        if (t === 'reverse') {
          const shown = table(null, [['<b>資產 Assets</b>', ''], ...as.map(([it, v]) => [it[0], k.e(v)])]);
          return {
            q: T(`${wz}的資產如下表。${wz}的淨資產是 ${k.z(NW)}。${wz}的負債一共是多少？${k.hint.zh}`, `${we}'s assets are in the table. ${we}'s net worth is ${k.e(NW)}. How much does ${we} owe in total (liabilities)? ${k.hint.en}`),
            fig: shown, ans: k.ans(L),
            sol: [T(`資產合計 = ${as.map((x) => k.z(x[1])).join(' + ')} = ${k.z(A)}。`, `Total assets = ${as.map((x) => k.e(x[1])).join(' + ')} = ${k.e(A)}.`),
              T('淨資產 = 資產 − 負債，所以 負債 = 資產 − 淨資產。', 'Net worth = assets − liabilities, so liabilities = assets − net worth.'),
              T(`負債 = ${k.z(A)} − ${k.z(NW)} = ${k.z(L)}。`, `Liabilities = ${k.e(A)} − ${k.e(NW)} = ${k.e(L)}.`)],
          };
        }
        return {
          q: T(`下表是${wz}擁有的東西和欠的錢。${wz}的淨資產是多少？${g >= 9 ? '（可能是負數，負數請加上負號）' : ''}${k.hint.zh}`, `The table lists what ${we} owns and owes. What is ${we}'s net worth?${g >= 9 ? ' (It may be negative; type a minus sign if so.)' : ''} ${k.hint.en}`),
          fig, ans: k.ans(NW),
          sol: [T(`資產合計 = ${as.map((x) => k.z(x[1])).join(' + ')} = ${k.z(A)}。`, `Total assets = ${as.map((x) => k.e(x[1])).join(' + ')} = ${k.e(A)}.`),
            T(`負債合計 = ${li.map((x) => k.z(x[1])).join(' + ')} = ${k.z(L)}。`, `Total liabilities = ${li.map((x) => k.e(x[1])).join(' + ')} = ${k.e(L)}.`),
            T(`淨資產 = ${k.z(A)} − ${k.z(L)} = ${k.z(NW)}。`, `Net worth = ${k.e(A)} − ${k.e(L)} = ${k.e(NW)}.`),
            NW < 0 ? T('淨資產是負的，代表欠的比擁有的多。剛畢業有學貸的人常常這樣，只要按時還款、持續存錢，淨資產就會慢慢變正。', 'A negative net worth means owing more than you own. It is common right after school with a student loan; paying on time and saving steadily turns it positive.')
              : T('淨資產是正的：就算把所有債都還清，還會剩下這麼多。', 'It is positive: even after paying every debt, this much would be left.')],
        };
      }
      if (t === 'classify') {
        const items = [...AS.map((it) => [it[1], 0]), ...LI.map((it) => [it[1], 1]), [T('朋友欠你、會還你的錢', 'money a friend owes you and will pay back'), 0]];
        const [it, c] = r.pick(items), opts = [T('資產', 'An asset'), T('負債', 'A liability')];
        return {
          q: T(`對${wz}來說，「${it.zh}」是資產還是負債？`, `For ${we}, is "${it.en}" an asset or a liability?`),
          ans: ansChoice([opts[c], opts[1 - c]]),
          sol: [T('資產：自己擁有、有價值的東西，或別人欠你的錢。負債：你欠別人、將來要還的錢。', 'Asset: something you own that has value, or money others owe you. Liability: money you owe and must pay back.'),
            c === 0 ? T(`「${it.zh}」是${wz}擁有的價值，所以是資產。`, `"${cap(it.en)}" is value that ${we} owns, so it is an asset.`) : T(`「${it.zh}」是${wz}將來要還的錢，所以是負債。`, `"${cap(it.en)}" is money ${we} must pay back, so it is a liability.`),
            T('淨資產 = 資產 − 負債。', 'Net worth = assets − liabilities.')],
        };
      }
      // decision
      const A = k.tw ? r.int(50, 200) * 1000 : k.d(r.int(60, 400) * 50), L = k.tw ? r.int(5, 40) * 1000 : k.d(r.int(10, 80) * 50);
      const X = Math.min(L, k.tw ? r.int(10, 100) * 100 : k.d(r.int(10, 100) * 10)), NW = A - L;
      const D = r.int(0, 4);
      const acts = [
        [T(`用存款還清 ${k.z(X)} 的卡債`, `uses ${k.e(X)} of savings to pay off a card balance of ${k.e(X)}`), 0, T(`資產少 ${k.z(X)}，負債也少 ${k.z(X)}，兩邊一起減，淨資產不變。`, `Assets drop ${k.e(X)} and liabilities drop ${k.e(X)}; both fall together, so net worth does not change.`)],
        [T(`收到 ${k.z(X)} 的現金紅包，存進銀行`, `receives a ${k.e(X)} cash gift and deposits it`), X, T(`資產多 ${k.z(X)}，負債不變，淨資產增加 ${k.z(X)}。`, `Assets rise ${k.e(X)} and liabilities stay the same, so net worth rises ${k.e(X)}.`)],
        [T(`從存款拿 ${k.z(X)} 去旅行，錢花完就沒了`, `spends ${k.e(X)} of savings on a trip (the money is used up)`), -X, T(`資產少 ${k.z(X)}，負債不變，淨資產減少 ${k.z(X)}。`, `Assets drop ${k.e(X)} and liabilities stay the same, so net worth falls ${k.e(X)}.`)],
        [T(`向銀行借 ${k.z(X)}，全部存在帳戶裡沒動`, `borrows ${k.e(X)} from a bank and keeps all of it in savings`), 0, T(`資產多 ${k.z(X)}，負債也多 ${k.z(X)}，淨資產不變（但之後要付利息）。`, `Assets rise ${k.e(X)} and liabilities rise ${k.e(X)}, so net worth is unchanged (though interest will cost money later).`)],
        [T(`刷卡 ${k.z(X)} 買演唱會門票，演唱會已經結束了`, `charges a ${k.e(X)} concert ticket to a credit card, and the concert is over`), -X, T(`資產沒有增加（門票用完了），負債卻多了 ${k.z(X)}，淨資產減少 ${k.z(X)}。`, `No asset was added (the ticket is used up), but liabilities rose ${k.e(X)}, so net worth falls ${k.e(X)}.`)],
      ];
      const [act, dv, why] = acts[D], NW2 = NW + dv;
      return {
        q: T(`${wz}的資產一共 ${k.z(A)}，負債一共 ${k.z(L)}。後來${wz}${act.zh}。現在${wz}的淨資產是多少？${k.hint.zh}`, `${we} has ${k.e(A)} in assets and ${k.e(L)} in liabilities. Then ${we} ${act.en}. What is ${we}'s net worth now? ${k.hint.en}`),
        ans: k.ans(NW2),
        sol: [T(`原本的淨資產 = ${k.z(A)} − ${k.z(L)} = ${k.z(NW)}。`, `Net worth before = ${k.e(A)} − ${k.e(L)} = ${k.e(NW)}.`), why,
          T(`現在的淨資產 = ${k.z(NW2)}。`, `Net worth now = ${k.e(NW2)}.`),
          T('想讓淨資產變大：多存錢、少借錢、少花在用完就沒了的東西上。', 'To grow net worth: save more, borrow less, and spend less on things that get used up.')],
      };
    },
  },

  // 12 ─────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'scams-advanced',
    grades: [7, 12],
    area: 'risk',
    name: T('識破詐騙', 'Spotting scams'),
    std: { us: 'Jump$tart · Managing Risk', tw: '金融教育 · 防詐騙' },
    lesson: T('詐騙常見的訊號：製造急迫感（「24 小時內」「不能告訴家人」）、保證高報酬、要你點連結登入、要求用禮物卡或轉帳付款、要你交出驗證碼或出借帳戶。遇到可疑訊息：停下來，用自己查到的官方管道確認，再和信任的大人討論。',
      'Common scam signals: pressure to act fast ("within 24 hours", "don\'t tell your family"), guaranteed high returns, links asking you to log in, payment by gift card or transfer, and requests for your verification codes or bank account. When something looks off: stop, check through an official channel you look up yourself, and talk to a trusted adult.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS), tw = k.tw;
      const amt = (twLo, twHi, twSt, usLo, usHi, usSt) => (tw ? r.int(twLo / twSt, twHi / twSt) * twSt : k.d(r.int(usLo / usSt, usHi / usSt) * usSt));
      const S = [];
      const add = (q, o, s, only) => { if (!only || only === cur) S.push({ q, o, s }); };
      // 1 package text
      const fee = tw ? 30 : 199;
      add(T(`${wz}收到簡訊：「您的包裹因地址不完整無法配送，請在 24 小時內點擊連結補繳運費 ${k.z(fee)}。」${wz}最近剛好有網購。最好怎麼做？`, `${we} gets a text: "Your package cannot be delivered because the address is incomplete. Click this link within 24 hours to pay a ${k.e(fee)} fee." ${we} did order something online recently. What is the best thing to do?`),
        [T('不點連結，自己打開購物網站或物流公司的官方 App 查詢包裹', 'Do not click; check the order in the store\'s or the carrier\'s official app or website'), T('點連結付錢，反正金額很小', 'Click and pay, since the amount is tiny'), T('回覆簡訊，問對方是哪一家物流', 'Reply to the text and ask which company it is'), T('把連結轉給朋友，看他們能不能打開', 'Forward the link to friends to see if it opens for them')],
        [T('小額費用只是誘餌，假網站真正要的是你的信用卡資料。', 'The small fee is bait; the fake site is really after your card details.'), T('「24 小時內」的急迫期限是詐騙常用的壓力手法。', 'A "24 hours" deadline is a classic pressure trick.')]);
      // 2 bank email
      add(T(`${wz}收到一封看起來像銀行寄來的信：「您的帳戶因異常活動已被鎖定，請點此連結登入解鎖。」怎麼做最安全？`, `${we} gets an email that looks like it is from the bank: "Your account has been locked due to unusual activity. Log in at this link to unlock it." What is the safest move?`),
        [T('不用信裡的連結，自己打開銀行官方 App，或打卡片背面的電話詢問', 'Skip the link; open the bank\'s official app or call the number on the back of the card'), T('趕快點連結登入，免得帳戶被鎖太久', 'Log in through the link quickly so the account is not locked for long'), T('回信附上帳號和密碼，請銀行幫忙檢查', 'Reply with the account number and password so the bank can check'), T('照信中的電話打過去，把收到的驗證碼告訴對方', 'Call the number in the email and read them the code that gets texted')],
        [T('釣魚信會模仿銀行的標誌和用字，連結卻通往假網站。', 'Phishing emails copy a bank\'s logo and wording, but the link leads to a fake site.'), T('真正的銀行不會要你回信提供密碼或驗證碼；自己查到的官方管道才可靠。', 'Real banks never ask for your password or codes by email; only channels you look up yourself are safe.')]);
      // 3 investment group
      const pm = r.pick([20, 30, 50]);
      add(T(`${wz}被拉進一個${tw ? ' LINE ' : '通訊軟體的'}投資群組，「老師」每天報明牌，群裡很多人貼出賺錢截圖，說只要下載某個 App 投資，保證每月賺 ${pm}%。怎麼做才對？`, `${we} is added to a group chat where an "investment coach" shares stock tips every day, many members post screenshots of big profits, and they say a certain app guarantees ${pm}% a month. What should ${we} do?`),
        [T(`立刻退出群組，不下載 App 也不匯款${tw ? '；有疑問可以打 165 查證' : ''}`, `Leave the group right away; do not install the app or send money${tw ? '; check with the 165 hotline if unsure' : ''}`), T('先投一點小錢試試看，賺了再多投', 'Invest a small amount first and add more if it pays'), T('群裡大家都有賺，應該是真的', 'Everyone in the group is making money, so it must be real'), T('把親友也拉進來一起賺', 'Invite family and friends so they can earn too')],
        [T(`保證每月 ${pm}% 是不可能的；群裡的「成員」和截圖常常是詐騙集團自己扮的。`, `A guaranteed ${pm}% a month is impossible; the "members" and screenshots are often the scammers themselves.`), T('一開始讓你小賺、可以提領，是為了讓你投入更多錢。', 'Small early "profits" you can withdraw are a hook to get you to put in more.')]);
      // 4 cancel installments (TW) / refund remote access (US)
      add(T(`${wz}接到自稱網拍客服的電話：「您之前的訂單被誤設成 12 期分期付款，每月都會扣款，請依照銀行人員的指示到 ATM 操作解除。」怎麼做才對？`, `${we} gets a call from someone claiming to be an online store's customer service: "Your order was mistakenly set to 12 monthly installments. Go to an ATM and follow the bank officer's instructions to cancel it." What should ${we} do?`),
        [T('掛掉電話，打 165 或自己查官方客服電話確認；ATM 不能解除分期付款', 'Hang up and check by calling 165 or the store\'s official number; an ATM cannot cancel installments'), T('照指示去 ATM 操作，免得每月被扣款', 'Go to the ATM and follow the steps so no more money is taken'), T('把銀行帳號和密碼告訴對方，請他幫忙取消', 'Give them the bank account number and password to cancel it'), T('等「銀行人員」打來後照他說的做', 'Wait for the "bank officer" to call and do what they say')],
        [T('「解除分期付款」是台灣很常見的詐騙：照著操作 ATM，其實是把錢轉給詐騙集團。', '"Cancel the installments" is a very common scam in Taiwan: the ATM steps actually transfer your money to the scammers.'), T('ATM 只能領錢和轉帳，不能取消任何訂單或分期。', 'An ATM can only withdraw and transfer money; it cannot cancel any order or installment plan.')], 'tw');
      const ref = amt(0, 0, 1, 200, 500, 1);
      add(T(`${wz}接到電話：「您的防毒軟體被多扣了 ${k.z(ref)}，請讓我們遠端連線到您的電腦，把錢退給您。」怎麼做才對？`, `${we} gets a call: "You were overcharged ${k.e(ref)} for your antivirus subscription. Let us connect to your computer remotely so we can send the refund." What should ${we} do?`),
        [T('掛掉電話，絕不讓陌生人遠端連線；自己登入帳戶查看', 'Hang up, never give a stranger remote access, and check the accounts yourself'), T('讓他們連線，反正是要退錢給我', 'Let them connect, since they are giving money back'), T('把網路銀行的帳號密碼給他們，方便退款', 'Give them the online-banking login so the refund is easier'), T('照他們說的買禮物卡來「修正」退款錯誤', 'Buy gift cards as they say to "fix" the refund mistake')],
        [T('「退款詐騙」會假裝多退了錢，再要你把「多的」用轉帳或禮物卡還回去。', 'Refund scams pretend to refund too much, then ask you to send the "extra" back by transfer or gift card.'), T('讓陌生人遠端連線，等於把電腦和網路銀行交給他。', 'Remote access hands a stranger your computer and your online banking.')], 'us');
      // 5 fake shop
      const real = amt(4000, 6000, 100, 180, 250, 10), cheap = Math.round(real / 4 / (tw ? 100 : 1000)) * (tw ? 100 : 1000);
      add(T(`${wz}在社群網站看到原價 ${k.z(real)} 的名牌球鞋只賣 ${k.z(cheap)}，賣家說「私下轉帳才有這個價格，不要用平台下單」。怎麼做？`, `${we} sees designer sneakers that normally cost ${k.e(real)} selling for only ${k.e(cheap)} on social media. The seller says "this price is only if you pay me directly, not through the platform." What should ${we} do?`),
        [T('不買：價格好得不像真的，又要求私下轉帳，很可能是假網拍', 'Do not buy: the price is too good to be true and paying directly is a big warning sign'), T('先轉一半訂金，收到貨再付另一半', 'Send half as a deposit and the rest on delivery'), T('請賣家先傳商品照片，有照片就放心匯款', 'Ask for photos of the shoes; if there are photos, pay'), T('揪朋友一起買，可以再便宜一點', 'Get friends to buy too for an even lower price')],
        [T('照片可以從網路上隨便抓；私下轉帳出了問題，平台也保護不了你。', 'Photos are easy to copy from the internet, and paying outside the platform means it cannot protect you.'), T('只用平台內有保障的付款方式，價格太便宜就要更小心。', 'Pay only through the platform\'s protected checkout, and be extra careful when a price is very low.')]);
      // 6 rent out your account
      const per = amt(500, 3000, 500, 50, 200, 25);
      add(T(`${wz}在網路上看到工作：「只要把你的提款卡和密碼寄給我們，每張卡每天給你 ${k.z(per)}，在家輕鬆賺錢。」怎麼做？`, `${we} sees a job online: "Just mail us your debit card and PIN, and we pay you ${k.e(per)} per card per day. Easy money from home." What should ${we} do?`),
        [T('拒絕：這是把帳戶借給詐騙集團，會變成人頭帳戶，自己可能要負法律責任', 'Refuse: it lends your account to criminals, making you a money mule, and you can face criminal charges'), T('只借一個月應該沒關係', 'Lending it for just one month should be fine'), T('先把存款領光再借出去，就不會有事', 'Empty the account first, then lending it is safe'), T('對方說是公司，應該是合法的工作', 'They say they are a company, so it must be legal')],
        [T('詐騙集團需要別人的帳戶來收被害人的錢，警察查到的會是你的名字。', 'Scammers need other people\'s accounts to receive victims\' money, and police will trace it to your name.'), T('出借帳戶、提款卡和密碼是違法的，帳戶也可能被凍結。', 'Handing over your account, card and PIN is illegal, and the account can be frozen.')]);
      // 7 forward money (money mule)
      add(T(`${wz}應徵到一個「財務助理」工作：錢會匯進${wz}的帳戶，${wz}留下 10% 當薪水，其餘馬上轉到另一個帳戶。這份工作是？`, `${we} is offered a "payment assistant" job: money will arrive in ${we}'s bank account, ${we} keeps 10% as pay and forwards the rest to another account right away. What is this job?`),
        [T('幫詐騙集團洗錢的「車手」工作，應該拒絕並告訴大人', 'Moving stolen money for criminals (a money mule); refuse and tell an adult'), T('正常的工作，因為有薪水可以拿', 'A normal job, since it pays'), T('只要不認識匯款的人就沒問題', 'It is fine as long as you do not know the senders'), T('只要多要一點，例如 20%，就很划算', 'A good deal if you ask for more, like 20%')],
        [T('匯進來的錢通常是被害人被騙的錢，轉出去就是在幫忙洗錢。', 'The incoming money usually comes from scam victims; forwarding it is money laundering.'), T('就算說自己不知道，也可能被追究法律責任，帳戶也會被凍結。', 'Even if you say you did not know, you can face legal trouble and a frozen account.')]);
      // 8 gift cards from "boss"
      const gc = amt(1000, 3000, 500, 100, 200, 50);
      add(T(`${wz}打工的店長傳訊息：「我在開會不方便講電話，請你先去買 5 張 ${k.z(gc)} 的禮物卡，把卡片背面的號碼拍照傳給我，之後再還你。」怎麼做？`, `A message that seems to be from ${we}'s manager says: "I'm in a meeting and can't talk. Please buy 5 gift cards of ${k.e(gc)} each and send me photos of the codes on the back. I'll pay you back." What should ${we} do?`),
        [T('先用原本就知道的電話打給店長本人確認，不要買', 'Call the manager on a number already known to check first; do not buy anything'), T('馬上去買，店長在忙不能拖', 'Buy them right away; the manager is busy'), T('先買 1 張就好，風險比較小', 'Buy just one card to keep the risk small'), T('把號碼傳過去，但記得留收據', 'Send the codes but keep the receipts')],
        [T('禮物卡的號碼一傳出去，錢就被用掉了，追不回來。', 'Once gift-card codes are sent, the money is spent and cannot be traced or recovered.'), T('「用禮物卡付款」幾乎都是詐騙；冒充主管、親友是常見手法。', 'Requests to pay with gift cards are almost always scams; pretending to be a boss or relative is a common trick.')]);
      // 9 fake prosecutor (TW) / fake IRS (US)
      add(T(`${wz}的家人接到自稱檢察官的電話：「你的帳戶涉及洗錢，必須把存款轉到法院的『監管帳戶』保護，而且不能告訴任何人。」怎麼做？`, `A family member gets a call from someone claiming to be a prosecutor: "Your account is linked to money laundering. You must move your savings to a court 'safekeeping account', and you must not tell anyone." What should they do?`),
        [T('掛掉電話，打 165 查證；檢警不會要求轉帳到監管帳戶', 'Hang up and check with the 165 hotline; police and prosecutors never ask you to move money into a "safekeeping account"'), T('照指示轉帳，證明自己清白', 'Transfer the money to prove innocence'), T('先轉一部分，看看對方怎麼說', 'Transfer part of it and see what they say'), T('保密不告訴家人，免得被調查', 'Keep it secret from family to avoid an investigation')],
        [T('「假檢警」詐騙會用恐嚇和「不能告訴別人」讓你沒辦法冷靜查證。', 'Fake-police scams use fear and "tell no one" so you cannot stop and check.'), T('檢察官和警察不會在電話中要你轉帳或交出存款。', 'Real prosecutors and police never ask you to transfer money over the phone.')], 'tw');
      add(T(`${wz}的家人接到電話：「我是美國國稅局（IRS），你欠稅，今天不用禮物卡付清就會被逮捕。」怎麼做？`, `A family member gets a call: "This is the IRS. You owe back taxes and will be arrested today unless you pay right now with gift cards." What should they do?`),
        [T('掛掉電話；國稅局不會用電話威脅立刻逮捕，也不會要求用禮物卡繳稅', 'Hang up; the IRS does not threaten immediate arrest by phone or demand payment by gift card'), T('趕快去買禮物卡，免得被抓', 'Buy gift cards quickly to avoid arrest'), T('把銀行帳號給對方，讓他直接扣款', 'Give the caller the bank account number to take the payment'), T('先付一半，再要求分期', 'Pay half now and ask for a payment plan')],
        [T('冒充政府機關、威脅逮捕、要求禮物卡，三個都是詐騙訊號。', 'Pretending to be the government, threatening arrest and demanding gift cards are all scam signals.'), T('真的有稅務問題，可以自己上國稅局官網或打官方電話查。', 'If unsure about taxes, check on the official IRS website or phone number you look up yourself.')], 'us');
      // 10 romance
      const need = amt(20000, 80000, 5000, 800, 3000, 100);
      add(T(`${wz}在網路上認識一位「朋友」，聊了好幾個月但從沒視訊見面。對方說家人急病，需要 ${k.z(need)}，請${wz}先匯款幫忙，之後一定還。怎麼做？`, `${we} met a "friend" online and has chatted for months but never video-called. The friend says a family member is sick and needs ${k.e(need)}, and asks ${we} to send money, promising to pay it back. What should ${we} do?`),
        [T('不匯款，告訴信任的大人；從沒見過面又急著借錢，是感情詐騙的典型', 'Do not send money and tell a trusted adult; a never-met friend who urgently needs money is a classic romance scam'), T('先匯一小部分表示誠意', 'Send part of it to show good faith'), T('對方承諾會還，就可以匯', 'Send it, since they promised to repay'), T('改買禮物卡寄給對方，比較安全', 'Send gift cards instead; that is safer')],
        [T('感情詐騙會花很長時間建立信任，再編出急需用錢的故事。', 'Romance scammers spend a long time building trust, then invent an urgent need for money.'), T('一直不肯視訊見面，是很大的警訊。', 'Always avoiding a video call is a big warning sign.')]);
      // 11 prize
      const ship = amt(200, 600, 50, 15, 40, 5);
      add(T(`${wz}收到訊息：「恭喜你抽中最新款手機！只要先付運費和手續費 ${k.z(ship)}，馬上寄出。」${wz}根本沒參加過抽獎。怎麼做？`, `${we} gets a message: "Congratulations, you won the newest phone! Just pay ${k.e(ship)} for shipping and fees and we'll send it now." ${we} never entered any contest. What should ${we} do?`),
        [T('不理會也不付錢：真正的獎品不需要先付錢', 'Ignore it and pay nothing: real prizes do not ask you to pay first'), T('付錢，手機比運費貴多了很划算', 'Pay; the phone is worth much more than the fee'), T('先把地址和信用卡號給對方', 'Give them your address and card number first'), T('分享給朋友，可以多抽一次', 'Share it with friends to get another chance')],
        [T('沒參加過的抽獎卻中獎，本身就很可疑。', 'Winning a contest you never entered is suspicious by itself.'), T('「先付小錢領大獎」是常見的詐騙；付了錢，獎品也不會來。', '"Pay a small fee to claim a big prize" is a common scam; the prize never comes.')]);
      // 12 verification code
      add(T(`朋友的帳號傳訊息給${wz}：「我剛剛不小心把驗證碼傳到你的手機了，可以把那組數字給我嗎？」怎麼做？`, `A friend's account messages ${we}: "I accidentally sent a verification code to your phone. Can you send me the number?" What should ${we} do?`),
        [T('不給，並用電話或當面問朋友本人；驗證碼就像帳號的鑰匙', 'Do not send it, and check with the friend by phone or in person; a code is like a key to your account'), T('是朋友就給他，反正只是一組數字', 'Send it; it is a friend and just a number'), T('只給前面一半的數字', 'Send only the first half of the number'), T('把驗證碼貼在群組，讓大家幫忙看', 'Post the code in a group chat so others can look')],
        [T('那組驗證碼其實是登入「你的」帳號用的，給出去帳號就會被盜。', 'That code is really for logging in to YOUR account; giving it away lets them take it over.'), T('朋友的帳號很可能已經被盜，用別的方式通知朋友本人。', 'The friend\'s account was probably hacked; warn the friend another way.')]);
      // 13 game currency
      add(T(`遊戲裡有人說：「在我給的網站輸入你的遊戲帳號和密碼，就送你 10,000 點遊戲幣。」${wz}該怎麼做？`, `Someone in a game says: "Enter your game username and password on my website and I'll give you 10,000 free coins." What should ${we} do?`),
        [T('不輸入：這是要偷帳號的釣魚網站，可以向遊戲官方檢舉', 'Do not enter anything: it is a phishing site to steal accounts; report it to the game'), T('用自己的帳號試一次看看', 'Try it once with the real account'), T('只給密碼、不給帳號就安全', 'Giving only the password, not the username, is safe'), T('請爸媽提供信用卡號，換更多點數', 'Ask parents for their card number to get more coins')],
        [T('「免費送點數」是吸引你交出帳密的誘餌。', '"Free coins" is bait to get your login.'), T('帳號被盜，裡面的道具和儲值都會被拿走。', 'A stolen account loses all its items and stored value.')]);
      // 14 toll text
      add(T(`${wz}的家人收到簡訊：「${tw ? '您有一筆 ETC 通行費' : '您有一筆過路費'}逾期未繳，請點連結立即繳費，否則將加收罰款。」怎麼做？`, `A family member gets a text: "You have an unpaid toll balance. Pay now at this link to avoid a penalty." What should they do?`),
        [T('不點連結，自己用官方 App 或官方網站查詢有沒有欠費', 'Do not click; check for any unpaid tolls in the official app or website you look up yourself'), T('點連結繳費，免得被罰更多', 'Click and pay to avoid a bigger penalty'), T('回覆簡訊要求對方打電話來說明', 'Reply asking them to call and explain'), T('把信用卡號回傳，請對方代扣', 'Text back the card number so they can charge it')],
        [T('假冒過路費、停車費的簡訊很常見，利用「怕被罰款」的心理。', 'Fake toll and parking texts are very common; they play on the fear of a fine.'), T('連結通常通往假網站，輸入的信用卡資料會被盜用。', 'The link usually goes to a fake site that steals card details.')]);
      // 15 pay to withdraw
      const fake = amt(100000, 500000, 10000, 5000, 20000, 1000);
      add(T(`${wz}的哥哥在一個投資網站上看到自己的帳戶「賺」到 ${k.z(fake)}，網站卻說要先付 20% 的「稅金」才能提領。怎麼做？`, `${we}'s older brother sees his account on an investing website show a profit of ${k.e(fake)}, but the site says he must first pay a 20% "tax" before he can withdraw. What should he do?`),
        [T(`不要再付任何錢：這是詐騙平台，帳面上的獲利是假的，應該報警${tw ? '或打 165' : ''}`, `Pay nothing more: it is a scam platform and the "profit" is fake; report it${tw ? ' (in Taiwan, call 165)' : ''}`), T('付稅金，才能把獲利領出來', 'Pay the tax so the profit can be withdrawn'), T('再投更多錢，升級成 VIP 就能提領', 'Invest more to become VIP and unlock withdrawals'), T('借錢來付稅金，領出來再還', 'Borrow money to pay the tax and repay it after withdrawing')],
        [T('真正的平台不會要你另外匯錢才讓你提領自己的錢。', 'Real platforms never make you send more money to withdraw your own.'), T('畫面上的數字是假網站自己顯示的，付再多也領不到。', 'The numbers are just shown by the fake site; no payment will ever unlock them.')]);
      // 16 tech-support pop-up
      add(T(`${wz}的電腦突然跳出警告：「你的電腦中毒了！請立刻撥打這支電話找技術人員，不要關機。」怎麼做？`, `A warning suddenly pops up on ${we}'s computer: "Your computer is infected! Call this number now for a technician. Do not turn off your computer." What should ${we} do?`),
        [T('不打電話，關掉視窗或瀏覽器，再請家人協助檢查', 'Do not call; close the window or browser and ask family to help check'), T('馬上打電話，照技術人員說的做', 'Call right away and do what the technician says'), T('讓技術人員遠端連線修電腦', 'Let the technician connect remotely to fix it'), T('用禮物卡付修理費', 'Pay the repair fee with gift cards')],
        [T('真的防毒軟體不會跳出視窗要你打電話給陌生人。', 'Real antivirus software does not pop up asking you to call a stranger.'), T('打過去後，對方會要求遠端連線和付款，目的是偷錢和個資。', 'If you call, they ask for remote access and payment to steal money and data.')]);
      // 17 friend borrowing
      const bor = amt(2000, 8000, 1000, 100, 400, 50);
      add(T(`好朋友的社群帳號傳訊息：「我手機壞了，急需 ${k.z(bor)}，可以先幫我轉帳或買點數卡嗎？明天還你。」${wz}該怎麼做？`, `A close friend's social media account messages: "My phone broke and I urgently need ${k.e(bor)}. Can you send money or buy me a gift card? I'll pay you back tomorrow." What should ${we} do?`),
        [T('先打電話或當面問朋友本人，確認是不是他', 'First call or ask the friend in person to make sure it is really them'), T('馬上轉帳，好朋友有急事要幫', 'Send it right away; a friend in need comes first'), T('先轉一半，明天再轉另一半', 'Send half now and half tomorrow'), T('把自己的信用卡號給他，讓他自己刷', 'Give your card number so the friend can charge it')],
        [T('帳號被盜後，詐騙者會用朋友的名義向所有聯絡人借錢。', 'When an account is hacked, scammers ask every contact for money in the friend\'s name.'), T('用另一個管道確認，幾分鐘就能分辨真假。', 'Checking through another channel takes minutes and tells you the truth.')]);
      // 18 fake buyer (TW) / overpayment check (US)
      add(T(`${wz}在二手平台賣東西，買家說：「我沒辦法付款，因為你的賣場還沒通過金流認證，請加客服 LINE，照指示操作網路銀行完成認證。」怎麼做？`, `${we} is selling something on a second-hand platform. The buyer says: "I can't pay because your shop hasn't passed payment verification. Add customer service on LINE and follow their steps in your online banking to verify." What should ${we} do?`),
        [T('停止聯絡：正規平台不會要你操作網路銀行做「認證」，這是假買家詐騙', 'Stop replying: real platforms never ask you to use online banking to "verify"; this is a fake-buyer scam'), T('加客服，照指示操作網路銀行', 'Add the "customer service" and follow the banking steps'), T('把網路銀行的帳號密碼給客服，請他幫忙認證', 'Give the online-banking login to customer service to verify'), T('先轉一筆「保證金」給客服', 'Send customer service a "deposit" first')],
        [T('「假買家」會引導你到假客服，所謂的認證其實是把錢轉出去。', 'The fake buyer leads you to fake customer service, and the "verification" is really a transfer out.'), T('有問題只透過平台內的官方客服處理。', 'Handle problems only through the platform\'s own official support.')], 'tw');
      const price = amt(0, 0, 1, 100, 300, 10), over = price + amt(0, 0, 1, 300, 800, 50);
      add(T(`${wz}在網路上賣一台 ${k.z(price)} 的二手平板。買家寄來一張 ${k.z(over)} 的支票，說「多付了，請把差額匯還給我」。怎麼做？`, `${we} is selling a used tablet online for ${k.e(price)}. The buyer mails a check for ${k.e(over)} and says, "I overpaid. Please wire the difference back to me." What should ${we} do?`),
        [T('不要匯任何錢回去：這是假支票的「多付款」詐騙', 'Send nothing back: this is a fake-check overpayment scam'), T(`馬上匯 ${k.z(over - price)} 回去，表示誠信`, `Wire back ${k.e(over - price)} right away to be honest`), T('支票存進去後隔天就匯差額回去', 'Deposit the check and wire the difference the next day'), T('用禮物卡把差額還給買家', 'Pay back the difference with gift cards')],
        [T('支票存入後，錢可能先出現在帳戶裡，幾天後才發現是假支票被退回。', 'After you deposit a check, the money can appear at first, and the check bounces days later.'), T('那時你匯出的差額已經追不回來，還要自己負擔。', 'By then the money you sent is gone, and you are on the hook for it.')], 'us');
      const sc = r.pick(S);
      return {
        q: sc.q,
        ans: ansChoice(sc.o),
        sol: [...sc.s, T(`正確做法是「${sc.o[0].zh}」。`, `The right move: ${sc.o[0].en[0].toLowerCase() + sc.o[0].en.slice(1)}.`),
          tw ? T('有疑問就撥打 165 反詐騙諮詢專線，或告訴信任的大人。', 'When in doubt, call Taiwan\'s 165 anti-fraud hotline or tell a trusted adult.')
            : T('有疑問就先停下來，和信任的大人討論。詐騙可以向美國聯邦貿易委員會（FTC）的 ReportFraud.ftc.gov 檢舉。', 'When in doubt, stop and talk to a trusted adult. Scams can be reported to the FTC at ReportFraud.ftc.gov.')],
      };
    },
  },

  // 13 ─────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'emergency-fund',
    grades: [7, 10],
    area: 'save',
    name: T('緊急預備金', 'The emergency fund'),
    std: { us: 'Jump$tart · Saving', tw: '金融教育 · 儲蓄' },
    lesson: T('緊急預備金是專門留給意外的錢，例如失業、生病或東西突然壞掉。常見的建議是存下 3～6 個月的必要開銷。有了它，遇到意外就不必刷卡借錢、付高額利息。',
      'An emergency fund is money set aside only for surprises, such as losing a job, getting sick or something breaking. A common guideline is 3 to 6 months of essential expenses. With one, a surprise does not have to go on a credit card with high interest.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const ex = k.tw
        ? [[T('房租', 'rent'), r.int(80, 180) * 100], [T('伙食', 'food'), r.int(60, 100) * 100], [T('水電瓦斯', 'utilities'), r.int(10, 25) * 100], [T('交通', 'transportation'), r.int(10, 25) * 100]]
        : [[T('房租', 'rent'), k.d(r.int(18, 40) * 50)], [T('伙食', 'groceries'), k.d(r.int(30, 60) * 10)], [T('水電瓦斯', 'utilities'), k.d(r.int(10, 25) * 10)], [T('交通', 'transportation'), k.d(r.int(10, 40) * 10)]];
      const E = ex.reduce((s, x) => s + x[1], 0);
      const list = T(ex.map(([n, v]) => `${n.zh} ${k.z(v)}`).join('、'), ex.map(([n, v]) => `${n.en} ${k.e(v)}`).join(', '));
      const sumStep = T(`每月必要開銷 = ${ex.map((x) => k.z(x[1])).join(' + ')} = ${k.z(E)}。`, `Essential expenses per month = ${ex.map((x) => k.e(x[1])).join(' + ')} = ${k.e(E)}.`);
      const t = r.pick(['target', 'target', 'build', 'build', 'last', 'card', 'card']);
      if (t === 'target') {
        const mo = r.int(3, 6);
        return {
          q: T(`${wz}每月的必要開銷是：${list.zh}。${wz}想存 ${mo} 個月的必要開銷當緊急預備金，要存多少？${k.hint.zh}`, `${we}'s essential monthly expenses are: ${list.en}. ${we} wants an emergency fund of ${mo} months of essential expenses. How much is that? ${k.hint.en}`),
          ans: k.ans(E * mo),
          sol: [sumStep, T(`${mo} 個月：${k.z(E)} × ${mo} = ${k.z(E * mo)}。`, `${mo} months: ${k.e(E)} × ${mo} = ${k.e(E * mo)}.`),
            T('只算「必要」開銷（住、吃、水電、交通），因為遇到意外時，想要的東西可以先暫停。', 'Count only essentials (housing, food, utilities, transportation), since wants can be paused in an emergency.'),
            T('3～6 個月是常見的建議，收入越不穩定，可以存越多。', 'Three to six months is a common guideline; the less steady your income, the more you may want.')],
        };
      }
      if (t === 'build') {
        const mo = r.int(3, 6), target = E * mo;
        let have, save, need;
        do {
          have = k.tw ? r.int(0, 30) * 1000 : k.d(r.int(0, 30) * 100);
          save = k.tw ? r.int(20, 80) * 100 : k.d(r.int(20, 80) * 10);
          need = target - have;
        } while (need <= 0 || need % save === 0 || ceilDiv(need, save) > 60);
        const months = ceilDiv(need, save);
        return {
          q: T(`${wz}的目標是存 ${k.z(target)} 的緊急預備金，現在已經有 ${k.z(have)}。如果每個月存 ${k.z(save)}，最少要幾個月才能達到目標？`, `${we}'s goal is an emergency fund of ${k.e(target)}, and ${we} already has ${k.e(have)}. Saving ${k.e(save)} a month, how many months does it take to reach the goal (at least)?`),
          ans: ansNum(months),
          sol: [T(`還差 ${k.z(target)} − ${k.z(have)} = ${k.z(need)}。`, `Still needed: ${k.e(target)} − ${k.e(have)} = ${k.e(need)}.`),
            T(`${k.z(need)} ÷ ${k.z(save)} ≈ ${num(+(need / save).toFixed(2))}，不是整數。`, `${k.e(need)} ÷ ${k.e(save)} ≈ ${num(+(need / save).toFixed(2))}, not a whole number.`),
            T(`${months - 1} 個月只存到 ${k.z(save * (months - 1))}，還不夠，所以要無條件進位：${months} 個月。`, `${months - 1} months gives only ${k.e(save * (months - 1))}, not enough, so round up: ${months} months.`),
            T('每月自動轉帳存一筆固定金額，最容易持續。', 'An automatic monthly transfer is the easiest way to keep it going.')],
        };
      }
      if (t === 'last') {
        const F = E * r.int(1, 7) + Math.floor((E * r.int(1, 9)) / 10 / 100) * 100;   // TW: whole 100 元; US: whole dollars
        const mo = Math.floor(F / E);
        return {
          q: T(`${wz}的緊急預備金有 ${k.z(F)}，每月必要開銷是：${list.zh}。如果${wz}突然沒有收入，這筆錢可以撐滿幾個月？`, `${we} has an emergency fund of ${k.e(F)}. Essential monthly expenses are: ${list.en}. If ${we}'s income suddenly stopped, how many full months could the fund cover?`),
          ans: ansNum(mo),
          sol: [sumStep, T(`${k.z(F)} ÷ ${k.z(E)} ≈ ${num(+(F / E).toFixed(2))}。`, `${k.e(F)} ÷ ${k.e(E)} ≈ ${num(+(F / E).toFixed(2))}.`),
            T(`只算「撐滿」的月份，捨去小數：${mo} 個月（${mo} × ${k.z(E)} = ${k.z(mo * E)}）。`, `Count only full months, dropping the decimal: ${mo} months (${mo} × ${k.e(E)} = ${k.e(mo * E)}).`),
            mo >= 3 ? T('已經達到 3 個月以上的常見建議。', 'That meets the common guideline of at least 3 months.') : T('還不到 3 個月的常見建議，可以繼續存。', 'That is short of the common 3-month guideline, so keep saving.')],
        };
      }
      // card: a surprise expense put on a credit card instead of paid from a fund
      const what = r.pick([[T('機車修理', 'a scooter repair'), T('汽車修理', 'a car repair')], [T('看牙醫', 'a dental bill'), T('看牙醫', 'a dental bill')], [T('筆電壞掉換新', 'replacing a broken laptop'), T('筆電壞掉換新', 'replacing a broken laptop')]]);
      const w = k.tw ? what[0] : what[1];
      const X = k.tw ? r.int(50, 250) * 100 : k.d(r.int(60, 250) * 10), apr = k.tw ? 1500 : r.pick([2000, 2400, 2700]), n = g <= 8 ? r.int(1, 2) : r.int(2, 6);
      let b = X, tot = 0; const rows = [];
      for (let i = 1; i <= n; i++) { const it = monthInterest(b, apr); rows.push([i, b, it]); b += it; tot += it; }
      return {
        q: T(`${wz}突然要付 ${k.z(X)}（${w.zh}），但沒有緊急預備金，只好刷信用卡，年利率 ${bpP(apr)}。${n} 個月都沒繳錢，每月利息 = 當時餘額 × 年利率 ÷ 12（${k.rnd.zh}）加進欠款，第 ${n} 個月底才一次還清。和用緊急預備金直接付比起來，多付了多少利息？${k.hint.zh}`,
          `${we} suddenly has to pay ${k.e(X)} for ${w.en} but has no emergency fund, so it goes on a credit card at an APR of ${bpP(apr)}. For ${n} month${n > 1 ? 's' : ''} nothing is paid; each month interest = current balance × APR ÷ 12 (${k.rnd.en}) is added, and at the end of month ${n} the whole balance is paid off. Compared with paying from an emergency fund, how much extra interest does ${we} pay? ${k.hint.en}`),
        ans: k.ans(tot),
        sol: [...rows.slice(0, 3).map(([i, bb, it]) => T(`第 ${i} 個月：${k.z(bb)} × ${bpP(apr)} ÷ 12 ≈ ${k.z(it)}，欠款變成 ${k.z(bb + it)}。`, `Month ${i}: ${k.e(bb)} × ${bpP(apr)} ÷ 12 ≈ ${k.e(it)}; the balance becomes ${k.e(bb + it)}.`)),
          ...(n > 3 ? [T(`……一直算到第 ${n} 個月，欠款變成 ${k.z(b)}。`, `…continue through month ${n}; the balance reaches ${k.e(b)}.`)] : []),
          T(`多付的利息 = ${k.z(b)} − ${k.z(X)} = ${k.z(tot)}。`, `Extra interest = ${k.e(b)} − ${k.e(X)} = ${k.e(tot)}.`),
          T(`如果有緊急預備金，直接付 ${k.z(X)}，一毛利息都不用付。`, `With an emergency fund, ${we} pays just ${k.e(X)} and no interest at all.`)],
      };
    },
  },

  // 14 ─────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'installments',
    grades: [7, 9],
    area: 'credit',
    name: T('分期付款划算嗎？', 'Paying in installments'),
    std: { us: 'Jump$tart · Managing Credit', tw: '金融教育 · 借貸與信用' },
    lesson: T('分期付款讓你先拿到東西、之後每月付一點，但常常總共要付得比現價多。比較時，把「每期金額 × 期數」算出來和現價比。「0 利率」也要看清楚有沒有手續費，晚繳還可能有滯納金。',
      'Installments let you get something now and pay a bit each month, but the total is often more than the cash price. Compare "payment × number of payments" with the price. Even with "0% interest," check the fine print for fees, and late payments can add late fees.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const ITEMS = k.tw ? [[T('新手機', 'a new phone'), 150, 400], [T('筆記型電腦', 'a laptop'), 200, 450], [T('遊戲主機', 'a game console'), 100, 180]]
        : [[T('新手機', 'a new phone'), 50, 120], [T('筆記型電腦', 'a laptop'), 60, 150], [T('遊戲主機', 'a game console'), 30, 60]];
      const [it, lo, hi] = r.pick(ITEMS);
      const price = k.tw ? r.int(lo, hi) * 100 - r.pick([0, 10, 100]) : k.d(r.int(lo, hi) * 10) - r.pick([0, 1, 1]);
      const t = r.pick(['extra', 'extra', 'pct', 'fee', 'late', 'late']);
      if (t === 'extra' || t === 'pct') {
        const nper = r.pick([6, 12, 12, 24]);
        const X = ceilDiv(price, nper) + (k.tw ? r.int(1, 20) * 10 : r.int(4, 60) * 25), tot = X * nper, extra = tot - price, pp = pct1(extra, price);
        const base = T(`${it.zh}現金價 ${k.z(price)}，也可以分 ${nper} 期，每期付 ${k.z(X)}。`, `${cap(it.en)} costs ${k.e(price)} in cash, or ${nper} monthly payments of ${k.e(X)}.`);
        const sol = [T(`分期總共付 ${nper} × ${k.z(X)} = ${k.z(tot)}。`, `Installments total ${nper} × ${k.e(X)} = ${k.e(tot)}.`),
          T(`多付 ${k.z(tot)} − ${k.z(price)} = ${k.z(extra)}。`, `Extra cost: ${k.e(tot)} − ${k.e(price)} = ${k.e(extra)}.`)];
        if (t === 'extra') {
          return {
            q: T(`${base.zh}${wz}選分期的話，總共比付現金多付多少錢？${k.hint.zh}`, `${base.en} If ${we} chooses installments, how much more does ${we} pay in total than with cash? ${k.hint.en}`), ans: k.ans(extra),
            sol: [...sol, T('多付的錢就是「先拿到東西」的代價。如果可以先存錢再買，就能省下這筆錢。', 'The extra is the price of getting it now. Saving up first and paying cash avoids it.')],
          };
        }
        return {
          q: T(`${base.zh}分期總共比現金價多付了百分之幾？（四捨五入到小數第一位，只寫數字）`, `${base.en} The installment total is what percent more than the cash price? (Round to one decimal place; type just the number.)`), ans: ansNum(pp),
          sol: [...sol, T(`${k.z(extra)} ÷ ${k.z(price)} × 100% ≈ ${pc(pp)}。`, `${k.e(extra)} ÷ ${k.e(price)} × 100% ≈ ${pc(pp)}.`), T('百分比方便比較不同價格的分期方案。', 'A percent makes it easy to compare plans for items with different prices.')],
        };
      }
      if (t === 'fee') {
        const fp = r.pick([2, 3, 4, 5]), fee = pctOf(price, fp), tot = price + fee;
        return {
          q: T(`${it.zh}現金價 ${k.z(price)}。店家廣告「12 期 0 利率」，但小字寫著：分期要另付一次「手續費」，是價格的 ${fp}%（${k.rnd.zh}）。選分期的話，總共要付多少？${k.hint.zh}`,
            `${cap(it.en)} costs ${k.e(price)}. The store advertises "12 months, 0% interest," but the fine print says installments add a one-time fee of ${fp}% of the price (${k.rnd.en}). With installments, how much is paid in total? ${k.hint.en}`),
          ans: k.ans(tot),
          sol: [T(`手續費 = ${k.z(price)} × ${fp}% ≈ ${k.z(fee)}。`, `Fee = ${k.e(price)} × ${fp}% ≈ ${k.e(fee)}.`), T(`總共 = ${k.z(price)} + ${k.z(fee)} = ${k.z(tot)}。`, `Total = ${k.e(price)} + ${k.e(fee)} = ${k.e(tot)}.`),
            T(`雖然寫「0 利率」，實際上還是多付了 ${k.z(fee)}，也就是 ${fp}%。`, `Even with "0% interest," it still costs ${k.e(fee)} more, which is ${fp}%.`),
            T('廣告的大字之外，一定要看清楚小字。', 'Always read the fine print, not just the big print.')],
        };
      }
      // late: split into 4 payments (buy now, pay later), with late fees
      const p4 = Math.round(price / 400) * 100, P = p4 * 4;   // a quarter of the price, in whole 100 元 / whole dollars
      const lf = k.tw ? r.pick([100, 150, 200, 300]) : k.d(r.pick([7, 8, 10])), miss = r.int(1, 3);
      return {
        q: T(`${wz}用「先買後付」買了 ${k.z(P)} 的${it.zh}，分 4 期，每期 ${k.z(p4)}，不收利息。假設條款寫：每一期晚繳要付滯納金 ${k.z(lf)}。${wz}有 ${miss} 期晚繳。最後總共付了多少錢？${k.hint.zh}`,
          `${we} buys ${it.en} for ${k.e(P)} with "buy now, pay later": 4 payments of ${k.e(p4)}, no interest. Suppose the terms say each late payment has a ${k.e(lf)} late fee. ${we} paid ${miss} of the payments late. How much did ${we} pay in total? ${k.hint.en}`),
        ans: k.ans(P + miss * lf),
        sol: [T(`4 期 × ${k.z(p4)} = ${k.z(P)}。`, `4 × ${k.e(p4)} = ${k.e(P)}.`), T(`滯納金：${miss} × ${k.z(lf)} = ${k.z(miss * lf)}。`, `Late fees: ${miss} × ${k.e(lf)} = ${k.e(miss * lf)}.`),
          T(`總共 ${k.z(P)} + ${k.z(miss * lf)} = ${k.z(P + miss * lf)}，多付了 ${pc(pct1(miss * lf, P))}（四捨五入到小數第一位）。`, `Total: ${k.e(P)} + ${k.e(miss * lf)} = ${k.e(P + miss * lf)}, which is ${pc(pct1(miss * lf, P))} extra (rounded to one decimal place).`),
          T('「不收利息」不代表不會多付錢；晚繳也可能影響信用紀錄。設定提醒，準時繳款。', '"No interest" does not mean no extra cost; late payments can also hurt your credit record. Set reminders and pay on time.')],
      };
    },
  },

  // 15 ─────────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'income-tax',
    grades: [11, 12],
    area: 'earn',
    name: T('累進稅率', 'Progressive income tax'),
    std: { us: 'Jump$tart · Earning Income', tw: '金融教育 · 收入與工作' },
    lesson: T('累進稅率是把所得切成好幾段，每一段用自己的稅率計算，再加起來。「邊際稅率」是最後一段（最高那段）的稅率；「平均稅率」是總稅額 ÷ 所得。加薪跳到下一級，只有超過的那一段用較高稅率，實領一定還是變多。',
      'A progressive tax splits income into brackets; each slice is taxed at its own rate, and the slices are added up. The marginal rate is the rate on the top slice; the average (effective) rate is total tax ÷ income. A raise into a higher bracket only taxes the extra slice at the higher rate, so take-home pay still goes up.'),
    gen(r, cur, g) {
      const k = kit(cur), [wz, we] = r.pick(KIDS);
      const TABLES = k.tw
        ? [[[0, 300000, 5], [300000, 800000, 10], [800000, 2000000, 20], [2000000, 0, 30]], [[0, 400000, 6], [400000, 1000000, 14], [1000000, 2500000, 22], [2500000, 0, 32]]]
        : [[[0, 10000, 0], [10000, 40000, 10], [40000, 100000, 20], [100000, 0, 30]], [[0, 15000, 5], [15000, 50000, 15], [50000, 120000, 25], [120000, 0, 35]]];
      const TB = r.pick(TABLES).map(([lo, hi, p]) => [k.d(lo), hi ? k.d(hi) : Infinity, p]);
      const tax = (I) => TB.reduce((s, [lo, hi, p]) => s + ((Math.max(0, Math.min(I, hi) - lo)) * p) / 100, 0);
      const parts = (I) => TB.filter(([lo]) => I > lo).map(([lo, hi, p]) => [lo, Math.min(I, hi), p, ((Math.min(I, hi) - lo) * p) / 100]);
      const fig = table(['應稅所得 Taxable income', '稅率 Rate'], TB.map(([lo, hi, p]) => [hi === Infinity ? `> ${k.e(lo)}` : `${k.e(lo)} – ${k.e(hi)}`, `${p}%`]));
      const land = T(k.tw ? '假設某國「錢幣國」的所得稅率表如下（這是虛構的，不是台灣真正的稅率），每一級只對落在那一段的所得課稅。' : '假設虛構的「錢幣國」所得稅率表如下（不是真正的美國稅率），每一級只對落在那一段的所得課稅。',
        'In the made-up country of Moneyland, the income-tax brackets are in the table (not any real country\'s rates). Each rate applies only to the income that falls inside its bracket.');
      let I; do { I = k.tw ? r.int(20, 350) * 10000 : k.d(r.int(30, 360) * 500); } while (TB.some(([lo]) => lo === I) || I <= TB[0][1]);
      const T0 = tax(I), P = parts(I);
      const steps = (Iv, Pv) => T(Pv.map(([lo, hi, p, v]) => `(${k.z(hi)} − ${k.z(lo)}) × ${p}% = ${k.z(v)}`).join('；'), Pv.map(([lo, hi, p, v]) => `(${k.e(hi)} − ${k.e(lo)}) × ${p}% = ${k.e(v)}`).join('; '));
      const t = r.pick(['tax', 'tax', 'avg', 'marginal', 'raise', 'raise', 'myth']);
      if (t === 'tax' || t === 'avg' || t === 'marginal') {
        const marg = P[P.length - 1][2], avg = pct1(T0, I);
        const ask = t === 'tax' ? T(`${wz}的應稅所得是 ${k.z(I)}，要繳多少所得稅？${k.hint.zh}`, `${we}'s taxable income is ${k.e(I)}. How much income tax does ${we} owe? ${k.hint.en}`)
          : t === 'avg' ? T(`${wz}的應稅所得是 ${k.z(I)}。${wz}的平均稅率（總稅額 ÷ 所得）是百分之幾？（四捨五入到小數第一位，只寫數字）`, `${we}'s taxable income is ${k.e(I)}. What is ${we}'s average (effective) tax rate, total tax ÷ income, as a percent? (Round to one decimal place; type just the number.)`)
            : T(`${wz}的應稅所得是 ${k.z(I)}。${wz}的邊際稅率（下一塊錢所得要繳的稅率）是百分之幾？（只寫數字）`, `${we}'s taxable income is ${k.e(I)}. What is ${we}'s marginal tax rate (the rate on the next dollar earned), in percent? (Type just the number.)`);
        const sol = [T('把所得切成各級，每一段乘上自己的稅率：', 'Split the income into brackets and tax each slice at its own rate:'), steps(I, P),
          T(`總稅額 = ${P.map((x) => k.z(x[3])).join(' + ')} = ${k.z(T0)}。`, `Total tax = ${P.map((x) => k.e(x[3])).join(' + ')} = ${k.e(T0)}.`)];
        if (t === 'avg') sol.push(T(`平均稅率 = ${k.z(T0)} ÷ ${k.z(I)} × 100% ≈ ${pc(avg)}，比邊際稅率 ${marg}% 低。`, `Average rate = ${k.e(T0)} ÷ ${k.e(I)} × 100% ≈ ${pc(avg)}, lower than the ${marg}% marginal rate.`));
        if (t === 'marginal') sol.splice(0, 3, T(`${k.z(I)} 落在「${P[P.length - 1][0] ? k.z(P[P.length - 1][0]) : k.z(0)} 以上」那一級，稅率 ${marg}%。`, `${k.e(I)} falls in the bracket that starts at ${k.e(P[P.length - 1][0])}, taxed at ${marg}%.`),
          T(`再多賺一塊錢，這一塊錢要繳 ${marg}% 的稅，所以邊際稅率是 ${marg}%。`, `One more dollar earned would be taxed at ${marg}%, so the marginal rate is ${marg}%.`),
          T(`但總稅額 ${k.z(T0)} 只佔所得的約 ${pc(avg)}（平均稅率），因為前面幾段的稅率比較低。`, `But the total tax of ${k.e(T0)} is only about ${pc(avg)} of income (the average rate), because the lower slices are taxed less.`));
        if (t === 'tax') sol.push(T(`平均稅率約 ${pc(avg)}，比最高那級的 ${marg}% 低很多。`, `The average rate is about ${pc(avg)}, well below the top ${marg}%.`));
        return { q: T(`${land.zh}${ask.zh}`, `${land.en} ${ask.en}`), fig, ans: t === 'tax' ? k.ans(T0) : ansNum(t === 'avg' ? avg : marg), sol };
      }
      // raise across a bracket boundary
      const bi = r.int(1, TB.length - 1), b = TB[bi][0];
      const below = k.tw ? r.int(1, 5) * 10000 : k.d(r.int(1, 10) * 100), above = k.tw ? r.int(1, 8) * 10000 : k.d(r.int(1, 20) * 100);
      const I0 = b - below, I1 = b + above, R = I1 - I0, T1 = tax(I0), T2 = tax(I1), keep = R - (T2 - T1);
      const pLo = TB[bi - 1][2], pHi = TB[bi][2];
      const sol = [T(`加薪前 ${k.z(I0)}：稅 ${k.z(T1)}，稅後 ${k.z(I0 - T1)}。`, `Before: ${k.e(I0)}, tax ${k.e(T1)}, after tax ${k.e(I0 - T1)}.`),
        T(`加薪後 ${k.z(I1)}：稅 ${k.z(T2)}，稅後 ${k.z(I1 - T2)}。`, `After: ${k.e(I1)}, tax ${k.e(T2)}, after tax ${k.e(I1 - T2)}.`),
        T(`加薪 ${k.z(R)} 中，${k.z(below)} 用 ${pLo}% 課稅、${k.z(above)} 用 ${pHi}% 課稅，多繳的稅 = ${k.z(T2 - T1)}。`, `Of the ${k.e(R)} raise, ${k.e(below)} is taxed at ${pLo}% and ${k.e(above)} at ${pHi}%: extra tax ${k.e(T2 - T1)}.`),
        T(`稅後多拿 ${k.z(R)} − ${k.z(T2 - T1)} = ${k.z(keep)}。原本那 ${k.z(I0)} 的稅一點都沒變。`, `Take-home rises ${k.e(R)} − ${k.e(T2 - T1)} = ${k.e(keep)}. The tax on the first ${k.e(I0)} did not change at all.`)];
      if (t === 'raise') {
        return {
          q: T(`${land.zh}${wz}的應稅所得從 ${k.z(I0)} 加薪到 ${k.z(I1)}，跨進了 ${pHi}% 那一級。加薪後，${wz}稅後的錢比原本多多少？${k.hint.zh}`, `${land.en} ${we}'s taxable income rises from ${k.e(I0)} to ${k.e(I1)}, crossing into the ${pHi}% bracket. How much more does ${we} keep after tax? ${k.hint.en}`),
          fig, ans: k.ans(keep), sol,
        };
      }
      return {
        q: T(`${land.zh}${wz}的應稅所得從 ${k.z(I0)} 加薪到 ${k.z(I1)}，跨進了 ${pHi}% 那一級。${wz}擔心：「這樣我全部的所得都要用 ${pHi}% 課稅，稅後反而變少。」這個說法對嗎？`,
          `${land.en} ${we}'s taxable income rises from ${k.e(I0)} to ${k.e(I1)}, into the ${pHi}% bracket. ${we} worries: "Now all my income is taxed at ${pHi}%, so I'll take home less." Is that right?`),
        fig,
        ans: ansChoice([T(`不對：只有超過 ${k.z(b)} 的部分用 ${pHi}% 課稅，稅後還是多了 ${k.z(keep)}`, `No: only the part above ${k.e(b)} is taxed at ${pHi}%, so take-home still rises by ${k.e(keep)}`),
          T(`對：全部所得都改用 ${pHi}% 課稅，應該拒絕加薪`, `Yes: all income is now taxed at ${pHi}%, so the raise should be refused`),
          T('對：跨級之後稅後一定變少', 'Yes: crossing a bracket always lowers take-home pay'),
          T('不對：加薪的部分完全不用繳稅', 'No: the raise is not taxed at all')]),
        sol,
      };
    },
  },
];
