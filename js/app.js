// Money Dojo: pick a grade, then practice one unit (endless generated questions with explanations), take a
// 10-question quiz, print a worksheet with an answer key, or play a simulation. Currency NT$ ↔ US$ switch.
// Hash routes: #/  #/g/5  #/p/<unit>/<grade>  #/quiz/5  #/print/<unit>/<grade> | #/print/g5  #/sim/<id>/<grade>
import BANK from './bank/index.js';
import { rng, tx } from './util.js';
import { check } from './check.js';
import { logAnswer, logActivity } from './learnlog.js';
import { pile } from './money.js';
import * as shop from './sim/shop.js';
import * as tea from './sim/tea.js';
import * as life from './sim/life.js';
import * as invest from './sim/invest.js';

const APP = 'moneydojo';
const META = { name: { zh: '財商小學堂', en: 'Money Dojo' }, url: '/money-dojo/' };
const SIMS = [shop, tea, life, invest];
const AREAS = {
  earn: ['💼', '收入與工作', 'Earning income'], spend: ['🛒', '聰明消費', 'Spending'], save: ['🐷', '儲蓄與預算', 'Saving & budgeting'],
  invest: ['📈', '投資', 'Investing'], credit: ['💳', '借貸與信用', 'Credit & borrowing'], risk: ['🛡️', '風險與保險', 'Risk & protection'],
};

const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const store = {
  get(k, d) { try { const v = localStorage.getItem('mo-' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('mo-' + k, JSON.stringify(v)); } catch {} },
};
const navLang = (navigator.language || '').toLowerCase();
let lang = store.get('lang', navLang.startsWith('zh') ? 'zh' : 'en');
let cur = store.get('cur', navLang.startsWith('zh') ? 'tw' : 'us');
const stats = store.get('stats', {});
const L = (zh, en) => (lang === 'zh' ? zh : en);
const X = (x) => tx(x, lang);

const ZH_N = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const gradeName = (g) => (lang === 'en' ? `Grade ${g}` : g <= 6 ? `國小${ZH_N[g]}年級` : g <= 9 ? `國${ZH_N[g - 6]}（${ZH_N[g]}年級）` : `高${ZH_N[g - 9]}（${ZH_N[g]}年級）`);
const unitsFor = (g) => BANK.filter((u) => u.grades[0] <= g && g <= u.grades[1]);
const simsFor = (g) => SIMS.filter((s) => s.meta.grades[0] <= g && g <= s.meta.grades[1]);
const byId = (id) => BANK.find((u) => u.id === id);
const newSeed = () => (Math.random() * 2 ** 31) >>> 0;
const draw = (u, g, seed) => ({ ...u.gen(rng(seed), cur, g), u, g, seed });
const band = (g) => (g <= 3 ? 'b1' : g <= 6 ? 'b2' : g <= 9 ? 'b3' : 'b4');
const unitLog = (u, g) => ({ id: u.id, name: u.name, grade: g });

function stars(id) {
  const s = stats[id]; if (!s) return 0;
  const [n, ok] = s;
  return ok >= 20 && ok / n >= 0.8 ? 3 : ok >= 8 ? 2 : ok >= 3 ? 1 : 0;
}
const starHTML = (k) => `<span class="stars">${'★'.repeat(k)}<i>${'★'.repeat(3 - k)}</i></span>`;
function record(u, g, ok) { const s = (stats[u.id] ||= [0, 0]); s[0]++; if (ok) s[1]++; store.set('stats', stats); logAnswer(APP, META, unitLog(u, g), ok); }

// ---------- header ----------
function header() {
  $('.bt').innerHTML = `<b>${L('財商小學堂', 'Money Dojo')}</b><small>${L('1–12 年級 · 理財素養 · 隨機出題 · 詳細解說', 'Grades 1–12 · money smarts · endless questions · clear explanations')}</small>`;
  $('#lang').textContent = lang === 'zh' ? 'EN' : '中文';
  $('#cur').innerHTML = `<button data-c="tw" class="${cur === 'tw' ? 'on' : ''}" aria-pressed="${cur === 'tw'}">NT$</button><button data-c="us" class="${cur === 'us' ? 'on' : ''}" aria-pressed="${cur === 'us'}">US$</button>`;
  $('#cur').setAttribute('aria-label', L('貨幣', 'Currency'));
  $('#cur').querySelectorAll('button').forEach((b) => (b.onclick = () => { if (cur === b.dataset.c) return; cur = b.dataset.c; store.set('cur', cur); header(); route(); }));
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  document.title = L('財商小學堂 Money Dojo', 'Money Dojo 財商小學堂');
  $('#foot').innerHTML = L(`共 ${BANK.length} 個練習單元、${SIMS.length} 個模擬遊戲。題目都由程式隨機產生，金額全部用整數「分」精確計算。參考美國 Jump$tart 個人理財教育國家標準與台灣金融基礎教育主題。進度只存在這台裝置的瀏覽器裡。`,
    `${BANK.length} practice units and ${SIMS.length} simulations. Every question is generated fresh, and all money math is exact (whole cents). Topics follow the US Jump$tart National Standards for Personal Financial Education and Taiwan's financial-education themes. Progress is saved only in this browser.`);
}
let relang = null;
$('#lang').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; store.set('lang', lang); header(); relang ? relang() : route(); };

// ---------- pages ----------
function home() {
  let h = `<section class="hero"><div><h1>${L('今天想學哪一年級的理財？', 'Which grade are you money-training today?')}</h1>
    <p>${L('數錢、找零、存錢、預算、利息、信用卡、投資、防詐騙……每一題都有說明「為什麼」。右上角可以切換新台幣 NT$ 或美元 US$。', 'Counting coins, making change, saving, budgets, interest, credit cards, investing, avoiding scams… every answer explains why. Switch between NT$ and US$ at the top right.')}</p></div>
    <div class="hero-money" aria-hidden="true">${heroMoney()}</div></section><div class="grades">`;
  for (let g = 1; g <= 12; g++) {
    const us = unitsFor(g), done = us.reduce((s, u) => s + stars(u.id), 0), max = us.length * 3;
    h += `<a class="gcard ${band(g)}" href="#/g/${g}"><span class="gn">${g}</span><span class="gl">${gradeName(g)}</span><span class="gc">${L(`${us.length} 個單元`, `${us.length} units`)}${simsFor(g).length ? ' · 🎮 ' + simsFor(g).length : ''}</span>
      <span class="bar"><i style="width:${max ? (100 * done) / max : 0}%"></i></span></a>`;
  }
  h += `</div><h2 class="sec">🎮 ${L('模擬遊戲', 'Simulations')}</h2><div class="sims">${SIMS.map((s) => simCard(s, Math.max(s.meta.grades[0], Math.min(s.meta.grades[1], s.meta.grades[0] + 1)))).join('')}</div>`;
  app.innerHTML = h;
}
function heroMoney() {
  return cur === 'tw' ? HERO.tw : HERO.us;
}
let HERO = { tw: '', us: '' };
const simCard = (s, g) => `<a class="simcard" href="#/sim/${s.meta.id}/${g}"><span class="si">${s.meta.icon}</span><span><b>${X(s.meta.name)}</b><small>${X(s.meta.blurb)}</small>
  <em>${L(`${s.meta.grades[0]}–${s.meta.grades[1]} 年級`, `Grades ${s.meta.grades[0]}–${s.meta.grades[1]}`)}</em></span></a>`;

function grade(g) {
  const us = unitsFor(g);
  let h = `<nav class="crumb"><a href="#/">← ${L('所有年級', 'All grades')}</a></nav>
    <section class="ghead"><h1>${gradeName(g)}</h1><span class="cur-tag">${cur === 'tw' ? L('新台幣 NT$', 'New Taiwan dollars (NT$)') : L('美元 US$', 'US dollars')}</span>
    <div class="acts"><a class="btn big" href="#/quiz/${g}">🎯 ${L('綜合測驗 10 題', 'Mixed quiz · 10 questions')}</a>
    <a class="btn ghost" href="#/print/g${g}">🖨️ ${L('列印學習單', 'Print a worksheet')}</a></div></section>`;
  const ss = simsFor(g);
  if (ss.length) h += `<div class="sims">${ss.map((s) => simCard(s, g)).join('')}</div>`;
  h += '<div class="topics">' + us.map((u) => {
    const s = stats[u.id], a = AREAS[u.area];
    return `<a class="topic a-${u.area}" href="#/p/${u.id}/${g}"><span class="tn"><span class="ai">${a[0]}</span>${X(u.name)}</span>${starHTML(stars(u.id))}
      <span class="tags"><span class="tag">${L(a[1], a[2])}</span><span class="tag t-us">${X(u.std.us)}</span><span class="tag t-tw">${X(u.std.tw)}</span></span>
      <span class="ts">${s ? L(`答對 ${s[1]} / ${s[0]} 題`, `${s[1]} / ${s[0]} correct`) : L('還沒練習', 'Not started')}</span></a>`;
  }).join('') + '</div>';
  app.innerHTML = h;
}

// the question card; onDone(ok, given) after the last try
function card(q, el, { tries = 2, onDone, quiz = false } = {}) {
  let left = tries, finished = false;
  const a = q.ans;
  const opts = a.type === 'choice' ? rng(q.seed ^ 0x5bd1e995).shuffle(a.options.map((o, i) => ({ o, i }))) : null;
  const pre = a.money ? (a.money === 'tw' ? 'NT$' : a.money === 'us' && q.ans.text.includes('.') ? '$' : '') : '';
  el.innerHTML = `<div class="q">${X(q.q)}</div>${q.fig ? `<div class="figs">${q.fig}</div>` : ''}
    ${opts ? `<div class="choices">${opts.map((x, k) => `<button class="ch" data-i="${x.i}"><b>${'ABCDEF'[k]}</b><span>${X(x.o)}</span></button>`).join('')}</div>`
      : `<form class="ansrow" autocomplete="off">${pre ? `<span class="pre">${pre}</span>` : ''}<input id="ans" type="text" inputmode="decimal" spellcheck="false" placeholder="${L('輸入答案', 'Your answer')}" aria-label="answer">
        <button class="btn" type="submit">${L('送出', 'Check')}</button></form>`}
    <div class="fb" aria-live="polite"></div>${q.hint && !quiz ? `<button class="link hintb">💡 ${L('提示', 'Hint')}</button>` : ''}
    <div class="sol" hidden></div>`;
  const fb = $('.fb', el), solEl = $('.sol', el);
  const showSol = () => {
    solEl.hidden = false;
    solEl.innerHTML = `<h3>📖 ${L('為什麼？看說明', 'Why? The explanation')}</h3><ol>${q.sol.map((s) => `<li>${X(s)}</li>`).join('')}</ol>
      <p class="ansline">${L('答案：', 'Answer: ')}<b>${answerHTML(q)}</b></p>`;
    $('h3', solEl).onclick = () => solEl.classList.remove('fold');
  };
  const end = (ok, given) => {
    finished = true;
    el.querySelectorAll('input,.ch,.ansrow button').forEach((b) => (b.disabled = true));
    if (opts) el.querySelectorAll('.ch').forEach((b) => { if (+b.dataset.i === a.correct) b.classList.add('right'); });
    if (!quiz) { record(q.u, q.g, ok); showSol(); if (ok) solEl.classList.add('fold'); }
    onDone?.(ok, given);
  };
  const judge = (given, btn) => {
    if (finished) return;
    const r = check(a, given);
    if (r.ok) { fb.className = 'fb ok'; fb.innerHTML = `✅ ${L(pick(['答對了！', '太棒了！', '完全正確！', '理財高手！']), pick(['Correct!', 'Great job!', 'Exactly right!', 'Money smart!']))}`; btn?.classList.add('right'); return end(true, given); }
    left--; btn?.classList.add('wrong'); if (btn) btn.disabled = true;
    if (left > 0 && !quiz) {
      fb.className = 'fb no';
      fb.innerHTML = `🤔 ${r.note ? X(r.note) : L('不太對，再想一次！', 'Not quite — try once more!')}${q.hint ? ` <span class="h">💡 ${X(q.hint)}</span>` : ''}`;
      $('#ans', el)?.select();
      return;
    }
    fb.className = 'fb no';
    fb.innerHTML = quiz ? '' : `❌ ${r.note ? X(r.note) + ' ' : ''}${L('沒關係，看看下面的說明。', 'That’s OK — read the explanation below.')}`;
    end(false, given);
  };
  if (opts) el.querySelectorAll('.ch').forEach((b) => (b.onclick = () => judge(+b.dataset.i, b)));
  else {
    const inp = $('#ans', el);
    $('.ansrow', el).onsubmit = (e) => { e.preventDefault(); if (inp.value.trim()) judge(inp.value); };
    setTimeout(() => inp.focus({ preventScroll: true }), 30);
  }
  const hb = $('.hintb', el); if (hb) hb.onclick = () => { hb.remove(); fb.className = 'fb'; fb.innerHTML = `💡 ${X(q.hint)}`; };
  return { finished: () => finished };
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function answerHTML(q) {
  const a = q.ans;
  if (a.type === 'choice') return X(a.options[a.correct]);
  if (a.money === 'tw') return L(`${Number(a.text).toLocaleString('en-US')} 元`, `NT$${Number(a.text).toLocaleString('en-US')}`);
  if (a.money === 'us') return a.text.includes('.') ? (a.cents < 0 ? '−' : '') + '$' + (Math.abs(a.cents) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : L(`${a.text} 分`, `${a.text}¢`);
  return String(a.text).replace(/-/g, '−');
}

let cleanup = null;
function lessonBox(u) { return `<details class="lesson" ${stats[u.id] ? '' : 'open'}><summary>📘 ${L('小課堂', 'Mini-lesson')}</summary><p>${X(u.lesson)}</p></details>`; }
function practice(id, g, seed0) {
  const u = byId(id); if (!u) return (location.hash = '#/');
  g = Math.max(u.grades[0], Math.min(u.grades[1], g || u.grades[0]));
  let streak = 0, right = 0, done = 0, q;
  const a = AREAS[u.area];
  app.innerHTML = `<nav class="crumb"><a href="#/g/${g}">← ${gradeName(g)}</a></nav>
    <section class="phead"><h1>${a[0]} ${X(u.name)}</h1><span class="tags"><span class="tag">${L(a[1], a[2])}</span><span class="tag t-us">${X(u.std.us)}</span><span class="tag t-tw">${X(u.std.tw)}</span></span></section>
    ${lessonBox(u)}
    <div class="score"><span id="sc"></span><span id="st"></span><a class="link" href="#/print/${u.id}/${g}">🖨️ ${L('列印學習單', 'Worksheet')}</a></div>
    <article class="card" id="card"></article><div class="next"><button class="btn big" id="next" hidden>${L('下一題', 'Next question')} →</button></div>`;
  const sc = () => { $('#sc').innerHTML = L(`本次答對 <b>${right}</b> / ${done}`, `This session: <b>${right}</b> / ${done}`); $('#st').innerHTML = streak >= 2 ? `🔥 ${L(`連續答對 ${streak} 題`, `${streak} in a row`)}` : ''; };
  const nextB = $('#next');
  const one = (seed) => {
    q = draw(u, g, seed); nextB.hidden = true;
    card(q, $('#card'), { onDone(ok) { done++; if (ok) { right++; streak++; } else streak = 0; sc(); nextB.hidden = false; nextB.focus({ preventScroll: true }); } });
    sc();
  };
  nextB.onclick = () => { one(newSeed()); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const key = (e) => { if (e.key === 'Enter' && !nextB.hidden && document.activeElement?.id !== 'ans') { e.preventDefault(); nextB.click(); } };
  document.addEventListener('keydown', key); cleanup = () => document.removeEventListener('keydown', key);
  one(seed0 ?? newSeed());
  relang = () => practice(id, g, q.seed);
}

function quiz(g) {
  const us = unitsFor(g); if (!us.length) return (location.hash = '#/g/' + g);
  const order = []; let pool = [];
  while (order.length < 10) { if (!pool.length) pool = us.slice().sort(() => Math.random() - 0.5); order.push(pool.pop()); }
  const qs = order.map((u) => draw(u, g, newSeed())), res = [];
  let k = 0, nextB;
  const quizShell = () => {
    app.innerHTML = `<nav class="crumb"><a href="#/g/${g}">← ${gradeName(g)}</a></nav>
      <section class="phead"><h1>🎯 ${L('綜合測驗', 'Mixed quiz')} · ${gradeName(g)}</h1></section>
      <div class="qprog" id="qp"></div><article class="card" id="card"></article><div class="next"><button class="btn big" id="next" hidden></button></div>`;
    nextB = $('#next');
    nextB.onclick = () => { if (++k < 10) { show(); window.scrollTo({ top: 0, behavior: 'smooth' }); } else results(); };
  };
  const show = () => {
    const q = qs[k];
    $('#qp').innerHTML = qs.map((_, i) => `<i class="${i < k ? (res[i].ok ? 'ok' : 'no') : i === k ? 'now' : ''}"></i>`).join('') + `<span>${k + 1} / 10 · ${X(q.u.name)}</span>`;
    nextB.hidden = true;
    card(q, $('#card'), { tries: 1, quiz: true, onDone(ok, given) {
      res[k] = { ok, given }; record(q.u, g, ok);
      nextB.textContent = k < 9 ? L('下一題 →', 'Next →') : L('看成績 →', 'See results →'); nextB.hidden = false; nextB.focus({ preventScroll: true });
    } });
  };
  relang = () => { if (k >= 10) results(); else { quizShell(); show(); } };
  const results = () => {
    const n = res.filter((r) => r.ok).length;
    const msg = n === 10 ? L('滿分！理財小達人！🏆', 'Perfect score — money master! 🏆') : n >= 8 ? L('很棒！再接再厲！🌟', 'Great work! 🌟') : n >= 5 ? L('不錯喔，看看錯的題目怎麼想。💪', 'Good — check the ones you missed. 💪') : L('先看說明，再挑單元慢慢練。📚', 'Read the explanations, then practice unit by unit. 📚');
    app.innerHTML = `<nav class="crumb"><a href="#/g/${g}">← ${gradeName(g)}</a></nav>
      <section class="result"><div class="big-score">${n}<small>/10</small></div><p>${msg}</p>
      <div class="acts"><a class="btn big" href="#/quiz/${g}" id="again">${L('再考一次', 'Another quiz')}</a><a class="btn ghost" href="#/g/${g}">${L('回到單元列表', 'Back to units')}</a></div></section>
      <div class="review">${qs.map((q, i) => {
        const r = res[i], given = r.given == null ? '—' : q.ans.type === 'choice' ? X(q.ans.options[r.given]) : String(r.given).replace(/</g, '&lt;');
        return `<details class="rv ${r.ok ? 'ok' : 'no'}" ${r.ok ? '' : 'open'}><summary><b>${i + 1}.</b> ${r.ok ? '✅' : '❌'} ${X(q.u.name)}</summary>
          <div class="q">${X(q.q)}</div>${q.fig ? `<div class="figs">${q.fig}</div>` : ''}
          <p>${L('你的答案：', 'Your answer: ')}<b>${given}</b>　${L('正確答案：', 'Correct answer: ')}<b>${answerHTML(q)}</b></p>
          <ol class="steps">${q.sol.map((s) => `<li>${X(s)}</li>`).join('')}</ol></details>`;
      }).join('')}</div>`;
    $('#again').onclick = (e) => { e.preventDefault(); quiz(g); };
  };
  quizShell();
  show();
}

function print(what, gArg) {
  const gm = what.match(/^g(\d+)$/)?.[1];
  let items;
  if (gm) items = unitsFor(+gm).map((u) => [u, +gm]);
  else { const u = byId(what); if (u) items = [[u, Math.max(u.grades[0], Math.min(u.grades[1], gArg || u.grades[0]))]]; }
  if (!items?.length) return (location.hash = '#/');
  const title = gm ? gradeName(+gm) : X(items[0][0].name);
  const qs = Array.from({ length: 20 }, (_, i) => draw(...items[i % items.length], newSeed()));
  if (gm) qs.sort((a, b) => items.findIndex((x) => x[0] === a.u) - items.findIndex((x) => x[0] === b.u));
  const order = (q) => rng(q.seed ^ 0x5bd1e995).shuffle(q.ans.options.map((o, j) => ({ o, j })));
  const qHTML = (q) => `<li class="pq"><div class="q">${X(q.q)}</div>${q.fig ? `<div class="figs">${q.fig}</div>` : ''}${q.ans.type === 'choice'
    ? `<div class="pch">${order(q).map((x, k) => `<span>(${'ABCDEF'[k]}) ${X(x.o)}</span>`).join('')}</div>` : '<div class="line"></div>'}</li>`;
  const key = (q) => { if (q.ans.type !== 'choice') return answerHTML(q); const k = order(q).findIndex((x) => x.j === q.ans.correct); return `(${'ABCDEF'[k]}) ${X(q.ans.options[q.ans.correct])}`; };
  app.innerHTML = `<nav class="crumb noprint"><a href="javascript:history.back()">← ${L('返回', 'Back')}</a>
      <button class="btn" onclick="window.print()">🖨️ ${L('列印', 'Print')}</button><button class="btn ghost" id="regen">🔄 ${L('換一批題目', 'New questions')}</button></nav>
    <section class="sheet"><h1>${L('理財學習單', 'Money worksheet')} · ${title}</h1><p class="who">${L('姓名：', 'Name: ')}＿＿＿＿＿＿　${L('日期：', 'Date: ')}＿＿＿＿＿＿　${L('得分：', 'Score: ')}＿＿＿ / 20</p>
    <ol class="pqs">${qs.map(qHTML).join('')}</ol></section>
    <section class="sheet key"><h1>${L('解答與說明', 'Answer key')} · ${title}</h1><ol class="keys-list">${qs.map((q) => `<li><b>${key(q)}</b><ol class="steps">${q.sol.map((s) => `<li>${X(s)}</li>`).join('')}</ol></li>`).join('')}</ol></section>`;
  $('#regen').onclick = () => print(what, gArg);
  relang = () => print(what, gArg);
}

function sim(id, g) {
  const S = SIMS.find((s) => s.meta.id === id); if (!S) return (location.hash = '#/');
  g = Math.max(S.meta.grades[0], Math.min(S.meta.grades[1], g || S.meta.grades[0]));
  let result = null;
  app.innerHTML = `<nav class="crumb"><a href="#/g/${g}" id="cg"></a></nav>
    <section class="phead"><h1>${S.meta.icon} <span id="sn"></span></h1><p class="muted" id="sb"></p></section><div id="simbox" class="card"></div>`;
  const heads = () => { $('#cg').textContent = '← ' + gradeName(g); $('#sn').textContent = X(S.meta.name); $('#sb').textContent = X(S.meta.blurb); };
  heads();
  const ctx = {
    cur, grade: g, rng: rng(newSeed()), L, X, lang: () => lang,
    done(score, sum) { result = { score, sum }; logActivity(APP, META, { id: S.meta.id, name: S.meta.name, grade: g }, score); showEnd(); },
  };
  const showEnd = () => {
    const { sum } = result;
    $('#simbox').innerHTML = `<div class="simend"><h2>🏁 ${L('完成！', 'Finished!')}</h2><p class="big">${X(sum.score)}</p>
      <h3>💡 ${L('你學到了什麼', 'What you learned')}</h3><ul class="learned">${sum.learned.map((t) => `<li>${X(t)}</li>`).join('')}</ul>
      ${sum.extra ? (typeof sum.extra === 'function' ? sum.extra() : sum.extra) : ''}
      <div class="acts"><button class="btn big" id="again">🔄 ${L('再玩一次', 'Play again')}</button><a class="btn ghost" href="#/g/${g}">${L('回到單元列表', 'Back to units')}</a></div></div>`;
    $('#again').onclick = () => sim(id, g);
  };
  const inst = S.mount($('#simbox'), ctx);
  relang = () => { heads(); result ? showEnd() : inst.render(); };
}

// ---------- router ----------
function route() {
  cleanup?.(); cleanup = null; relang = null;
  const h = location.hash;
  let m;
  if ((m = h.match(/^#\/g\/(\d+)/))) grade(Math.max(1, Math.min(12, +m[1])));
  else if ((m = h.match(/^#\/p\/([^/]+)(?:\/(\d+))?/))) practice(decodeURIComponent(m[1]), +m[2] || 0);
  else if ((m = h.match(/^#\/quiz\/(\d+)/))) quiz(+m[1]);
  else if ((m = h.match(/^#\/print\/([^/]+)(?:\/(\d+))?/))) print(decodeURIComponent(m[1]), +m[2] || 0);
  else if ((m = h.match(/^#\/sim\/([^/]+)(?:\/(\d+))?/))) sim(decodeURIComponent(m[1]), +m[2] || 0);
  else home();
  document.body.dataset.page = (h.match(/^#\/(\w+)/) || [, 'home'])[1];
}
window.addEventListener('hashchange', () => { route(); window.scrollTo(0, 0); });

HERO = { tw: pile([100000, 10000, 5000, 1000, 500, 100], 'tw', true), us: pile([2000, 100, 25, 10, 5, 1], 'us', true) };
header();
route();
