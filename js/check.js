// Checking a typed answer. Students can type whole numbers, decimals, fractions (3/4), mixed numbers (1 1/2),
// roots (2√3, 2sqrt3, √(12)), π (3π, 3pi), powers (2^5), percent signs, "x = 3", and lists ("2, -5" or "2 or -5").
// The typed text is evaluated as a small arithmetic expression and compared with the right value.
import { gcd, T } from './util.js';

function norm(s) {
  return String(s).trim()
    .replace(/[−–—]/g, '-').replace(/[×✕·]/g, '*').replace(/÷/g, '/').replace(/＋/g, '+').replace(/[（]/g, '(').replace(/[）]/g, ')')
    .replace(/，/g, ',').replace(/(NT|US)\s*\$/gi, '').replace(/美元|新台幣|台幣|塊錢|元整|個月|週|周|年|個|分|cents?|dollars?|months?|weeks?|years?/gi, '').replace(/sqrt/gi, '√').replace(/pi/gi, 'π').replace(/[°%元$¢]/g, '').replace(/\s+/g, ' ');
}

// evaluate one expression; NaN if it doesn't parse
export function evalExpr(src) {
  let s = norm(src).replace(/^[a-zA-Z]\s*=\s*/, '');
  // thousands separators: 12,345
  if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  // mixed number: 1 1/2, -2 3/4
  const m = s.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  if (m) { const v = +m[2] + +m[3] / +m[4]; return m[1] ? -v : v; }
  s = s.replace(/ /g, '');
  let i = 0;
  const peek = () => s[i];
  const atomStart = (c) => c != null && (/[\d.(π√e]/.test(c));
  function expr() { let v = termP(); while (peek() === '+' || peek() === '-') { const op = s[i++]; const w = termP(); v = op === '+' ? v + w : v - w; } return v; }
  function termP() {
    let v = unary();
    for (;;) {
      const c = peek();
      if (c === '*' || c === '/') { i++; const w = unary(); v = c === '*' ? v * w : v / w; }
      else if (atomStart(c)) v *= power();   // implicit: 2√3, 3π, 2(4)
      else return v;
    }
  }
  function unary() { if (peek() === '-') { i++; return -unary(); } if (peek() === '+') { i++; return unary(); } return power(); }
  function power() { const b = atom(); if (peek() === '^') { i++; return Math.pow(b, unary()); } return b; }
  function atom() {
    const c = peek();
    if (c === '(') { i++; const v = expr(); if (peek() !== ')') throw 0; i++; return v; }
    if (c === 'π') { i++; return Math.PI; }
    if (c === 'e') { i++; return Math.E; }
    if (c === '√') { i++; return Math.sqrt(power()); }
    const mm = s.slice(i).match(/^(\d+\.?\d*|\.\d+)/);
    if (!mm) throw 0;
    i += mm[0].length; return +mm[0];
  }
  try { const v = expr(); if (i !== s.length) return NaN; return v; } catch { return NaN; }
}

const same = (a, b, tol) => Math.abs(a - b) <= (tol ?? 1e-6 * Math.max(1, Math.abs(b)));
const splitList = (s) => norm(s).replace(/^\{|\}$/g, '').split(/\s*(?:,|;|\bor\b|\band\b|或|和|與)\s*/i).filter((x) => x.trim() !== '');

// → { ok, note? } ; note explains a near miss (not in lowest terms, wrong order …)
export function check(ans, input) {
  if (ans.type === 'choice') return { ok: input === ans.correct };
  if (input == null || String(input).trim() === '') return { ok: false };
  if (ans.type === 'num') {
    const v = evalExpr(input);
    if (!same(v, ans.v, ans.tol)) return { ok: false };
    if (ans.lowest) {
      const f = norm(input).replace(/ /g, '').match(/^-?(\d+)\/(\d+)$/);
      if (f && gcd(+f[1], +f[2]) > 1) return { ok: false, note: T('答案對了，但還要約分成最簡分數。', 'Right value, but reduce the fraction to lowest terms.') };
    }
    return { ok: true };
  }
  if (ans.type === 'set') {
    const xs = splitList(input).map(evalExpr), need = ans.v.slice();
    if (xs.some(isNaN)) return { ok: false };
    if (xs.length !== need.length) {
      const all = xs.every((x) => need.some((y) => same(x, y)));
      return { ok: false, note: all && xs.length < need.length ? T('還少了答案，全部都要寫出來（用逗號隔開）。', 'Some answers are missing — write all of them, separated by commas.') : undefined };
    }
    for (const x of xs) { const k = need.findIndex((y) => same(x, y)); if (k < 0) return { ok: false }; need.splice(k, 1); }
    return { ok: true };
  }
  if (ans.type === 'pair') {
    const xs = norm(input).replace(/^\(|\)$/g, '').split(/\s*,\s*/).map(evalExpr);
    if (xs.length !== 2 || xs.some(isNaN)) return { ok: false };
    if (same(xs[0], ans.v[0]) && same(xs[1], ans.v[1])) return { ok: true };
    if (same(xs[1], ans.v[0]) && same(xs[0], ans.v[1])) return { ok: false, note: T('順序反了：先寫 x，再寫 y。', 'The order is reversed: x first, then y.') };
    return { ok: false };
  }
  if (ans.type === 'text') {
    const k = (x) => norm(x).toLowerCase().replace(/[\s*]/g, '');
    return { ok: ans.v.some((w) => k(w) === k(input)) };
  }
  return { ok: false };
}
