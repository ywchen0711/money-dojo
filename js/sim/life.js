// Life budget month (grades 7–12): pick a job, a home, a food plan, transport and a fun budget, set a savings goal,
// then live four weeks with surprises. At the end: did you reach your goal, and how does it compare with 50/30/20?
import { T } from '../util.js';
import { mon, rdiv } from '../money.js';

export const meta = {
  id: 'sim-life', grades: [7, 12], icon: '🏠', area: 'save',
  name: T('一個月生活大挑戰', 'Life on a Budget: one month'),
  blurb: T('第一份工作的第一個月：付房租、吃飯、交通，還有意外事件。你能存到目標金額嗎？', 'Your first month on your own: rent, food, getting around — and surprises. Can you hit your savings goal?'),
};
// [zh, en, TW NT$, US $] amounts in whole dollars, converted to cents below
const D = (tw, us) => ({ tw: tw * 100, us: us * 100 });
export const CHOICES = {
  job: [
    { zh: '便利商店店員', en: 'Store clerk', amt: D(29000, 2500) },
    { zh: '行政助理', en: 'Office assistant', amt: D(34000, 3300) },
    { zh: '新手工程師', en: 'Junior engineer', amt: D(46000, 4600) },
  ],
  home: [
    { zh: '住家裡，付一點房租給爸媽', en: 'Live with family, pay a little rent', amt: D(5000, 400) },
    { zh: '分租雅房（共用衛浴）', en: 'A room in a shared apartment', amt: D(8500, 850) },
    { zh: '自己住套房', en: 'Your own studio apartment', amt: D(14000, 1450) },
  ],
  food: [
    { zh: '大多自己煮、帶便當', en: 'Cook at home, pack lunches', amt: D(6000, 350) },
    { zh: '一半自己煮、一半外食', en: 'Half home cooking, half eating out', amt: D(9000, 550) },
    { zh: '三餐都外食、叫外送', en: 'Eat out and order delivery every day', amt: D(13000, 900) },
  ],
  move: [
    { zh: '公車捷運月票', en: 'Bus / subway pass', amt: D(1200, 90) },
    { zh: '騎機車（油錢、保養）', en: 'Used car (gas, insurance)', amt: D(2000, 450), us: true },
    { zh: '開車（停車、油錢、保險）', en: 'New car (loan payment, gas, insurance)', amt: D(9000, 900) },
  ],
  fun: [
    { zh: '省一點：偶爾看電影', en: 'Light: a movie now and then', amt: D(2000, 150) },
    { zh: '普通：聚餐、訂閱、逛街', en: 'Medium: dinners out, subscriptions, shopping', amt: D(4000, 300) },
    { zh: '盡情玩：每週都出去玩', en: 'Big: going out every week', amt: D(7000, 550) },
  ],
  goal: [{ pct: 10 }, { pct: 20 }, { pct: 30 }],
};
// in Taiwan the middle transport option is a scooter; in the US a used car
const moveName = (o, cur, lang) => (o.us && cur === 'tw' ? (lang === 'zh' ? '騎機車（油錢、保養）' : 'Scooter (gas, upkeep)') : o.us && lang === 'zh' ? '開二手車（油錢、保險）' : o[lang]);
export const BILLS = D(2000, 180);   // utilities + phone, fixed
// weekly surprises: each option has a cash effect (negative = spend) and a kind: need | want | income | save
export const EVENTS = [
  { zh: '好朋友生日，大家約去吃大餐。', en: 'Your best friend’s birthday — everyone is going out for a big dinner.', opts: [
    { zh: '一起去吃大餐', en: 'Go to the dinner', amt: D(-1200, -60), kind: 'want' },
    { zh: '提議改去公園野餐', en: 'Suggest a picnic in the park instead', amt: D(-300, -15), kind: 'want' },
    { zh: '送一張手寫卡片', en: 'Give a handmade card', amt: D(-50, -3), kind: 'want' }] },
  { zh: '手機螢幕摔破了！', en: 'You dropped your phone and cracked the screen!', opts: [
    { zh: '送修換螢幕', en: 'Get the screen replaced', amt: D(-3000, -180), kind: 'need' },
    { zh: '貼保護貼先用著', en: 'Put on a screen protector and keep using it', amt: D(-400, -25), kind: 'need' }] },
  { zh: '你感冒了，喉嚨很痛。', en: 'You caught a bad cold and your throat hurts.', opts: [
    { zh: '去診所看醫生', en: 'See a doctor', amt: D(-350, -40), kind: 'need' },
    { zh: '在家休息，買成藥', en: 'Rest at home and buy medicine', amt: D(-250, -15), kind: 'need' }] },
  { zh: '有人找你週末接一個小案子。', en: 'Someone offers you a weekend side job.', opts: [
    { zh: '接！多賺一點', en: 'Take it and earn extra', amt: D(3000, 200), kind: 'income' },
    { zh: '不接，好好休息', en: 'Say no and rest', amt: D(0, 0), kind: 'income' }] },
  { zh: '你超想要的球鞋在特價。', en: 'The sneakers you really want are on sale.', opts: [
    { zh: '馬上買', en: 'Buy them now', amt: D(-2500, -120), kind: 'want' },
    { zh: '先放進願望清單，下個月再說', en: 'Put them on a wish list for next month', amt: D(0, 0), kind: 'want' }] },
  { zh: '這個月電費比平常多。', en: 'Your electricity bill is higher than usual this month.', opts: [
    { zh: '繳費（帳單一定要繳）', en: 'Pay it (bills must be paid)', amt: D(-700, -45), kind: 'need' }] },
  { zh: '公司發了一筆小獎金！', en: 'Your boss gives you a small bonus!', opts: [
    { zh: '全部存起來', en: 'Save all of it', amt: D(2000, 150), kind: 'income' },
    { zh: '存一半、花一半', en: 'Save half, spend half', amt: D(1000, 75), kind: 'income', spendWant: D(1000, 75) },
    { zh: '全部拿去買東西', en: 'Spend all of it', amt: D(0, 0), kind: 'income', spendWant: D(2000, 150) }] },
  { zh: '喜歡的歌手開演唱會。', en: 'Your favorite singer has a concert in town.', opts: [
    { zh: '買門票去現場', en: 'Buy a ticket', amt: D(-3500, -150), kind: 'want' },
    { zh: '看線上直播', en: 'Watch the free livestream', amt: D(0, 0), kind: 'want' }] },
  { zh: '媽媽生日快到了。', en: 'Your mom’s birthday is coming up.', opts: [
    { zh: '買一份禮物', en: 'Buy a gift', amt: D(-800, -40), kind: 'want' },
    { zh: '親手做一頓晚餐', en: 'Cook her a dinner yourself', amt: D(-300, -20), kind: 'want' }] },
  { zh: '洗衣機壞了，房東說要你分攤修理費。', en: 'The washing machine broke and you must share the repair bill.', opts: [
    { zh: '付你的那一份', en: 'Pay your share', amt: D(-600, -50), kind: 'need' }] },
  { zh: '網路上看到「限時搶購」的遊戲禮包。', en: 'A “limited-time” game bundle pops up online.', opts: [
    { zh: '買下去', en: 'Buy it', amt: D(-990, -30), kind: 'want' },
    { zh: '不買，限時不等於划算', en: 'Skip it — “limited time” doesn’t mean a good deal', amt: D(0, 0), kind: 'want' }] },
];
export const WEEKS = 4;

export function newGame() { return { pick: { job: null, home: null, food: null, move: null, fun: null, goal: null }, week: 0, events: [], answers: [] }; }
export function start(r, s) { s.events = r.sample(EVENTS.map((_, i) => i), WEEKS); s.week = 1; }
export function totals(s, cur) {
  const P = s.pick, C = CHOICES;
  const income = C.job[P.job].amt[cur];
  const needs0 = C.home[P.home].amt[cur] + C.food[P.food].amt[cur] + C.move[P.move].amt[cur] + BILLS[cur];
  const wants0 = C.fun[P.fun].amt[cur];
  let extraIncome = 0, needs = needs0, wants = wants0;
  s.answers.forEach((oi, k) => {
    const o = EVENTS[s.events[k]].opts[oi], a = o.amt[cur];
    if (o.kind === 'income') { extraIncome += a + (o.spendWant ? o.spendWant[cur] : 0); if (o.spendWant) wants += o.spendWant[cur]; }
    else if (o.kind === 'need') needs -= a; else wants -= a;
  });
  const totalIncome = income + extraIncome, saved = totalIncome - needs - wants;
  const goal = rdiv(income * C.goal[P.goal].pct, 100);
  return { income, extraIncome, totalIncome, needs, wants, saved, goal };
}
export function headless(r, cur) {
  const s = newGame();
  for (const k of Object.keys(s.pick)) s.pick[k] = r.int(0, CHOICES[k].length - 1);
  start(r, s);
  for (let w = 0; w < WEEKS; w++) s.answers.push(r.int(0, EVENTS[s.events[w]].opts.length - 1));
  const t = totals(s, cur);
  for (const v of Object.values(t)) if (!Number.isInteger(v)) return 'non-integer ' + JSON.stringify(t);
  if (t.totalIncome - t.needs - t.wants !== t.saved) return 'sum mismatch';
  if (cur === 'tw' && Object.values(t).some((v) => v % 100)) return 'NT$ cents';
  const sm = summary(s, cur);
  if (!sm.learned.length) return 'no summary';
  return true;
}
const pct = (a, b) => (b ? Math.round((1000 * a) / b) / 10 : 0);
export function summary(s, cur) {
  const m = mon(cur), t = totals(s, cur);
  const pn = pct(t.needs, t.totalIncome), pw = pct(t.wants, t.totalIncome), ps = pct(t.saved, t.totalIncome);
  const learned = [
    T(`這個月收入 ${m.z(t.totalIncome)}，必要開銷 ${m.z(t.needs)}（${pn}%），想要的花費 ${m.z(t.wants)}（${pw}%），存下 ${m.z(t.saved)}（${ps}%）。`,
      `This month you earned ${m.e(t.totalIncome)}: needs ${m.e(t.needs)} (${pn}%), wants ${m.e(t.wants)} (${pw}%), saved ${m.e(t.saved)} (${ps}%).`),
    T('50/30/20 是常見的參考：約 50% 用在必要開銷、30% 用在想要的、20% 存起來或還債。', 'The 50/30/20 guideline: about 50% for needs, 30% for wants, 20% for savings or paying off debt.'),
    T('房租和交通是最大的固定開銷，選擇住哪裡、怎麼通勤，對存錢的影響最大。', 'Rent and transportation are the biggest fixed costs — where you live and how you get around matter most for saving.'),
    T('意外一定會發生（看醫生、修手機），所以要留一筆「緊急預備金」。', 'Surprises always happen (a doctor visit, a broken phone) — that is why you keep an emergency fund.'),
    T('先存再花：發薪水那天先把目標存款轉走，剩下的錢再拿來花。', 'Pay yourself first: move your savings goal out on payday, then spend what is left.'),
  ];
  if (t.saved < 0) learned.splice(1, 0, T(`⚠️ 你花的比賺的多 ${m.z(-t.saved)}！現實生活中這通常會變成信用卡債，還要付利息。`, `⚠️ You spent ${m.e(-t.saved)} more than you earned! In real life that usually becomes credit-card debt — with interest.`));
  return {
    score: t.saved >= t.goal
      ? T(`🎉 達成目標！存下 ${m.z(t.saved)}，目標是 ${m.z(t.goal)}。`, `🎉 Goal reached! You saved ${m.e(t.saved)}; your goal was ${m.e(t.goal)}.`)
      : T(`存下 ${m.z(t.saved)}，目標是 ${m.z(t.goal)}，還差 ${m.z(t.goal - t.saved)}。`, `You saved ${m.e(t.saved)}; your goal was ${m.e(t.goal)} — ${m.e(t.goal - t.saved)} short.`),
    learned,
    t,
  };
}

// ---------- UI ----------
export function mount(el, ctx) {
  const { cur } = ctx, m = mon(cur), r = ctx.rng, s = newGame();
  const STEPS = ['job', 'home', 'food', 'move', 'fun', 'goal'];
  const Q = {
    job: T('你找到哪一份工作？（每月實領）', 'Which job did you get? (monthly take-home pay)'),
    home: T('你要住哪裡？（每月房租）', 'Where will you live? (monthly rent)'),
    food: T('你打算怎麼吃？（每月伙食費）', 'How will you eat? (monthly food)'),
    move: T('你怎麼上班？（每月交通費）', 'How will you get to work? (monthly transport)'),
    fun: T('娛樂預算要多少？', 'How much for fun?'),
    goal: T('這個月的存款目標？（薪水的百分比）', 'Savings goal this month (percent of your pay)?'),
  };
  const label = (k, o, lang) => (k === 'move' ? moveName(o, cur, lang) : k === 'goal' ? (lang === 'zh' ? `存 ${o.pct}%` : `Save ${o.pct}%`) : o[lang]);
  const amt = (k, o, lang) => (k === 'goal' ? (s.pick.job == null ? '' : (lang === 'zh' ? m.z : m.e)(rdiv(CHOICES.job[s.pick.job].amt[cur] * o.pct, 100))) : (lang === 'zh' ? m.z : m.e)(o.amt[cur]));
  let step = 0, phase = 'setup', lastNote = null;
  function bal() {
    const P = s.pick; let b = 0;
    if (P.job != null) b += CHOICES.job[P.job].amt[cur];
    for (const k of ['home', 'food', 'move', 'fun']) if (P[k] != null) b -= CHOICES[k][P[k]].amt[cur];
    if (P.goal != null) b -= BILLS[cur];
    return b;
  }
  function render() {
    const L = ctx.L, X = ctx.X, lang = ctx.lang();
    const t = phase === 'weeks' ? totals(s, cur) : null;
    const balance = phase === 'weeks' ? t.totalIncome - t.needs - t.wants : bal();
    let body = '';
    if (phase === 'setup') {
      const k = STEPS[step];
      body = `<h3>${step + 1} / ${STEPS.length} · ${X(Q[k])}</h3><div class="opts">${CHOICES[k].map((o, i) => `<button class="opt" data-i="${i}"><span>${label(k, o, lang)}</span><b>${amt(k, o, lang)}</b></button>`).join('')}</div>
        ${k === 'goal' ? `<p class="muted">${L(`另外每月固定帳單（水電、手機）${m.z(BILLS[cur])}。`, `Plus fixed bills (utilities, phone): ${m.e(BILLS[cur])} a month.`)}</p>` : ''}`;
    } else {
      const ev = EVENTS[s.events[s.week - 1]];
      body = `${lastNote ? `<div class="report">${X(lastNote)}</div>` : `<div class="report">${L(`發薪日！房租、伙食、交通、帳單和娛樂預算都先扣掉了，目標是存下 ${m.z(t.goal)}。接下來四週會發生一些事……`, `Payday! Rent, food, transport, bills and your fun budget are set aside. Your goal is to save ${m.e(t.goal)}. Now four weeks of life happen…`)}</div>`}
        <h3>${L(`第 ${s.week} 週`, `Week ${s.week}`)} · ${X(ev)}</h3>
        <div class="opts">${ev.opts.map((o, i) => { const a = o.amt[cur]; return `<button class="opt" data-e="${i}"><span>${X(o)}</span><b class="${a > 0 ? 'pos' : a < 0 ? 'neg' : ''}">${a > 0 ? '+' : ''}${L(m.z(a), m.e(a))}</b></button>`; }).join('')}</div>`;
    }
    el.innerHTML = `<div class="sim life"><div class="simbar"><span>💵 ${L('可用餘額', 'Money left')}: <b class="${balance < 0 ? 'neg' : ''}">${L(m.z(balance), m.e(balance))}</b></span>
      ${phase === 'weeks' ? `<span>🎯 ${L('目標', 'Goal')} ${L(m.z(t.goal), m.e(t.goal))}</span><span>${'●'.repeat(s.week - 1)}${'○'.repeat(WEEKS - s.week + 1)}</span>` : ''}</div>${body}
      ${phase === 'setup' ? budgetTable(L, lang) : ''}</div>`;
    el.querySelectorAll('[data-i]').forEach((b) => (b.onclick = () => {
      s.pick[STEPS[step]] = +b.dataset.i;
      if (++step >= STEPS.length) { phase = 'weeks'; start(r, s); }
      render();
    }));
    el.querySelectorAll('[data-e]').forEach((b) => (b.onclick = () => {
      const i = +b.dataset.e, o = EVENTS[s.events[s.week - 1]].opts[i];
      s.answers.push(i);
      lastNote = T(`你選了「${o.zh}」。`, `You chose: “${o.en}”.`);
      if (++s.week > WEEKS) { const sm = summary(s, cur); return ctx.done(Math.max(0, Math.min(1, sm.t.saved / Math.max(1, sm.t.goal))), { ...sm, extra: () => budgetTable(ctx.L, ctx.lang(), true) }); }
      render();
    }));
  }
  function budgetTable(L, lang, final = false) {
    const rows = [];
    const P = s.pick;
    if (P.job != null) rows.push([L('薪水', 'Pay'), CHOICES.job[P.job].amt[cur]]);
    const names = { home: L('房租', 'Rent'), food: L('伙食', 'Food'), move: L('交通', 'Transport'), fun: L('娛樂', 'Fun') };
    for (const k of ['home', 'food', 'move', 'fun']) if (P[k] != null) rows.push([names[k], -CHOICES[k][P[k]].amt[cur]]);
    if (P.goal != null) rows.push([L('帳單', 'Bills'), -BILLS[cur]]);
    if (final) s.answers.forEach((oi, k) => { const o = EVENTS[s.events[k]].opts[oi]; const a = o.amt[cur]; rows.push([o[lang], a]); });
    if (!rows.length) return '';
    const tot = rows.reduce((a, x) => a + x[1], 0);
    return `<div class="tblwrap"><table class="tbl">${rows.map(([n, a]) => `<tr><td>${n}</td><td class="num ${a < 0 ? 'neg' : 'pos'}">${L(m.z(a), m.e(a))}</td></tr>`).join('')}<tr class="tot"><td>${L('剩下', 'Left')}</td><td class="num">${L(m.z(tot), m.e(tot))}</td></tr></table></div>`;
  }
  render();
  return { render };
}
