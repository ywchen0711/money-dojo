// Checks every unit generator and every simulation:  node test/run.mjs [bank file …]
// Units: 300 draws per unit per currency (spread over the unit's grades). Checks the text in both languages, that the
// stated answer passes the answer checker, that money answers are exact integer cents (whole NT$ in Taiwan mode),
// that choices are distinct, that no float noise leaks into the text, and that the numbers vary.
// Simulations: each one is played headless many times with random choices and must finish without errors.
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { rng } from '../js/util.js';
import { check } from '../js/check.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const files = args.length ? args : readdirSync(path.join(root, 'js/bank')).filter((f) => /^[a-z].*\.js$/.test(f) && f !== 'index.js').map((f) => path.join(root, 'js/bank', f));
const strip = (s) => s.replace(/<[^>]*>/g, '');
const bad = (s) => typeof s !== 'string' || !s.trim() || /undefined|NaN|\[object|Infinity|null/.test(strip(s)) || /\d\.\d{5,}/.test(strip(s));
const txt = (x) => (typeof x === 'string' ? [x, x] : x && typeof x === 'object' ? [x.zh, x.en] : [undefined, undefined]);
const AREAS = ['earn', 'spend', 'save', 'invest', 'credit', 'risk'];
const ids = new Set();
let errs = 0, units = 0, draws = 0;
const perGrade = {};
const fail = (id, seed, msg) => { if (errs++ < 80) console.log(`✗ ${id} ${seed}: ${msg}`); };

for (const f of files) {
  const bank = (await import(pathToFileURL(path.resolve(f)).href)).default;
  for (const u of bank) {
    units++;
    const id = u.id;
    if (!id || ids.has(id)) fail(id, '-', 'missing or duplicate id'); ids.add(id);
    const [lo, hi] = u.grades || [];
    if (!(lo >= 1 && hi <= 12 && lo <= hi)) { fail(id, '-', 'bad grades'); continue; }
    for (let g = lo; g <= hi; g++) perGrade[g] = (perGrade[g] || 0) + 1;
    if (!AREAS.includes(u.area)) fail(id, '-', 'bad area');
    if (txt(u.name).some(bad)) fail(id, '-', 'bad name');
    if (txt(u.lesson).some(bad)) fail(id, '-', 'bad lesson');
    if (!u.std || txt(u.std.us).some(bad) || txt(u.std.tw).some(bad)) fail(id, '-', 'bad std');
    for (const cur of ['tw', 'us']) {
      const seen = new Set();
      for (let k = 1; k <= 300; k++) {
        const g = lo + (k % (hi - lo + 1)), seed = k * 7919 + 13 + (cur === 'us' ? 1 : 0), tag = `${cur} g${g} seed ${seed}`;
        let q; draws++;
        try { q = u.gen(rng(seed), cur, g); } catch (e) { fail(id, tag, 'throws ' + e.message); continue; }
        const [qz, qe] = txt(q.q);
        if (bad(qz) || bad(qe)) { fail(id, tag, 'bad question text: ' + JSON.stringify(q.q).slice(0, 200)); continue; }
        if (/[一-鿿]/.test(strip(qe))) fail(id, tag, 'Chinese in English text: ' + strip(qe).slice(0, 120));
        if (cur === 'tw' && /\$\d+\.\d\d/.test(strip(qe))) fail(id, tag, 'cents in NT$ text: ' + strip(qe).slice(0, 120));
        if (cur === 'us' && /NT\$|元/.test(strip(qe) + strip(qz).replace(/美元/g, ''))) fail(id, tag, 'NT$ in US text: ' + strip(qz).slice(0, 120));
        seen.add(qe + JSON.stringify(q.ans) + (q.fig || ''));
        if (!Array.isArray(q.sol) || q.sol.length < 2) fail(id, tag, 'solution needs 2+ steps');
        else for (const st of q.sol) {
          const [a, b] = txt(st);
          if (bad(a) || bad(b)) { fail(id, tag, 'bad solution step ' + JSON.stringify(st).slice(0, 160)); break; }
          if (/[一-鿿]/.test(strip(b))) { fail(id, tag, 'Chinese in English solution: ' + strip(b).slice(0, 120)); break; }
        }
        if (q.hint && txt(q.hint).some(bad)) fail(id, tag, 'bad hint');
        if (q.fig != null && typeof q.fig !== 'string') fail(id, tag, 'fig must be a string');
        const a = q.ans;
        if (!a) { fail(id, tag, 'no answer'); continue; }
        if (a.type === 'choice') {
          if (!Array.isArray(a.options) || a.options.length < 2 || a.options.length > 6) fail(id, tag, 'choice needs 2–6 options');
          else if (new Set(a.options.map((o) => JSON.stringify(o))).size !== a.options.length) fail(id, tag, 'duplicate options ' + JSON.stringify(a.options).slice(0, 200));
          else if (new Set(a.options.map((o) => txt(o)[1])).size !== a.options.length || new Set(a.options.map((o) => txt(o)[0])).size !== a.options.length) fail(id, tag, 'options look the same in one language ' + JSON.stringify(a.options).slice(0, 200));
          else if (a.options.some((o) => txt(o).some(bad))) fail(id, tag, 'bad option ' + JSON.stringify(a.options).slice(0, 200));
          if (a.correct !== 0) fail(id, tag, 'correct must be 0');
        } else if (a.type === 'num') {
          if (!Number.isFinite(a.v)) fail(id, tag, 'answer not finite ' + JSON.stringify(a));
          else if (bad(a.text) || !check(a, a.text).ok) fail(id, tag, `answer text "${a.text}" does not pass the checker`);
          if (a.money) {
            if (!Number.isInteger(a.cents)) fail(id, tag, 'money answer not integer cents ' + JSON.stringify(a));
            if (a.money === 'tw' && a.cents % 100) fail(id, tag, 'NT$ answer has cents ' + JSON.stringify(a));
            if (a.money !== cur) fail(id, tag, 'answer currency differs from the question currency');
          }
        } else fail(id, tag, 'unknown answer type ' + a.type);
      }
      if (seen.size < 12) fail(id, cur, `only ${seen.size} different questions in 300 draws`);
    }
  }
}
console.log(`${units} units, ${draws} draws`);
console.log('units per grade: ' + Object.entries(perGrade).map(([g, n]) => `G${g}:${n}`).join(' '));

// ---- simulations ----
const simDir = path.join(root, 'js/sim');
if (!args.length && existsSync(simDir)) {
  for (const f of readdirSync(simDir).filter((f) => f.endsWith('.js'))) {
    const mod = await import(pathToFileURL(path.join(simDir, f)).href);
    if (typeof mod.headless !== 'function') continue;
    let runs = 0;
    for (const cur of ['tw', 'us']) for (let s = 1; s <= 200; s++) {
      try { const res = mod.headless(rng(s * 104729 + 7), cur); runs++; if (res !== true) fail(f, `${cur} run ${s}`, 'headless check: ' + res); }
      catch (e) { fail(f, `${cur} run ${s}`, 'throws ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')); }
    }
    console.log(`sim ${f}: ${runs} headless runs`);
  }
}
console.log(`${errs} problems`);
process.exit(errs ? 1 : 0);
