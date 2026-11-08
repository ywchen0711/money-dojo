// Shared tools for the question generators: a seeded random source, bilingual text, fractions, radicals and
// polynomial formatting. Display strings use the real minus sign (−) and small HTML pieces (see style.css):
//   <span class="fr"><span>n</span><span>d</span></span>  a stacked fraction
//   <span class="rt">…</span>                             the part under a square-root bar
export function rng(seed) {
  let a = seed >>> 0;
  const f = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
  f.nz = (lo, hi) => { let x; do x = f.int(lo, hi); while (x === 0); return x; };
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  f.shuffle = (arr) => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  f.sample = (arr, k) => f.shuffle(arr).slice(0, k);
  f.chance = (p) => f() < p;
  f.sign = () => (f() < 0.5 ? -1 : 1);
  return f;
}

// ---- bilingual text ----
export const T = (zh, en) => ({ zh, en });
export const tx = (x, lang) => (x == null ? '' : typeof x === 'object' && !Array.isArray(x) ? x[lang] ?? x.en : String(x));

// ---- numbers ----
export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
export const lcm = (a, b) => (a && b ? Math.abs((a / gcd(a, b)) * b) : 0);
export const isPrime = (n) => { if (n < 2 || n % 1) return false; for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return true; };
export const factors = (n) => { const o = []; for (let k = 1; k <= n; k++) if (n % k === 0) o.push(k); return o; };
export const primeFactors = (n) => { const o = []; for (let p = 2; p * p <= n; p++) while (n % p === 0) { o.push(p); n /= p; } if (n > 1) o.push(n); return o; };
export const C = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1); return Math.round(r); };
export const P = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r *= n - i; return r; };
export const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
export const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
export const sum = (a) => a.reduce((s, x) => s + x, 0);
// kill floating-point noise: 0.1 + 0.2 → 0.3
export const clean = (x, p = 9) => +(+x).toFixed(p);

// display a number: real minus sign, thousands separators from 10 000 up, no float noise
export function num(x) {
  if (typeof x !== 'number') return String(x);   // text pieces like '?' or 'x' pass through
  x = clean(x);
  const neg = x < 0, a = Math.abs(x);
  let s = Number.isInteger(a) && a >= 10000 ? a.toLocaleString('en-US') : String(a);
  return (neg ? '−' : '') + s;
}
// a number as the student would type it (plain minus, no separators)
export const numText = (x) => String(clean(x));
// a signed term to follow something else: "+ 3" / "− 3"
export const sgn = (x) => (x < 0 ? `− ${num(-x)}` : `+ ${num(x)}`);
// a number in parentheses if negative: (−3)
export const par = (x) => (x < 0 ? `(${num(x)})` : num(x));

// ---- fractions [n, d] ----
export const red = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return [n / g, d / g]; };
export const fracText = (n, d) => { [n, d] = red(n, d); return d === 1 ? String(n) : `${n}/${d}`; };
// stacked fraction, not reduced (use fracR for the reduced one); a negative sign goes in front
export const frac = (n, d) => { const neg = typeof n === 'number' && typeof d === 'number' && n * d < 0; n = Math.abs(n); d = Math.abs(d); return `${neg ? '−' : ''}<span class="fr"><span>${num(n)}</span><span>${num(d)}</span></span>`; };
export const fracR = (n, d) => { [n, d] = red(n, d); return d === 1 ? num(n) : frac(n, d); };
// mixed number for an improper fraction: 7/2 → 3½ (as HTML)
export function mixed(n, d) {
  [n, d] = red(n, d);
  if (d === 1) return num(n);
  const neg = n < 0; n = Math.abs(n);
  const w = Math.floor(n / d), r = n % d;
  return (neg ? '−' : '') + (w ? num(w) : '') + frac(r, d);
}
export const mixedText = (n, d) => { [n, d] = red(n, d); if (d === 1) return String(n); const neg = n < 0; n = Math.abs(n); const w = Math.floor(n / d); return (neg ? '-' : '') + (w ? `${w} ${n % d}/${d}` : `${n}/${d}`); };
// fraction arithmetic
export const fadd = ([a, b], [c, d]) => red(a * d + b * c, b * d);
export const fsub = ([a, b], [c, d]) => red(a * d - b * c, b * d);
export const fmul = ([a, b], [c, d]) => red(a * c, b * d);
export const fdiv = ([a, b], [c, d]) => red(a * d, b * c);

// ---- powers and roots ----
export const pow = (b, e) => `${b}<sup>${e}</sup>`;
export const sqrt = (inner) => `√<span class="rt">${inner}</span>`;
// n = k²·r with r square-free → [k, r]
export function simpRoot(n) { let k = 1, r = n; for (let f = 2; f * f <= r; f++) while (r % (f * f) === 0) { k *= f; r /= f * f; } return [k, r]; }
// k√r as HTML / as typed text
export const rad = (k, r) => (r === 1 ? num(k) : `${k === 1 ? '' : k === -1 ? '−' : num(k)}${sqrt(r)}`);
export const radText = (k, r) => (r === 1 ? String(k) : `${k === 1 ? '' : k === -1 ? '-' : k}√${r}`);

// ---- algebra ----
// one term c·v^e as HTML; first = no leading "+"
export function term(c, v = 'x', e = 1, first = false) {
  if (c === 0) return '';
  const a = Math.abs(c), body = e === 0 ? num(a) : `${a === 1 ? '' : num(a)}${e === 1 ? v : pow(v, e)}`;
  if (first) return (c < 0 ? '−' : '') + body;
  return (c < 0 ? ' − ' : ' + ') + body;
}
// polynomial from coefficients, highest power first: poly([1, -3, 2]) → x² − 3x + 2
export function poly(cs, v = 'x') {
  const n = cs.length - 1; let s = '';
  cs.forEach((c, i) => { if (c) s += term(c, v, n - i, s === ''); });
  return s || '0';
}
export const lin = (a, b, v = 'x') => poly([a, b], v);
// the same, as plain text for typed answers: 2x^2-3x+1
export function polyText(cs, v = 'x') {
  const n = cs.length - 1; let s = '';
  cs.forEach((c, i) => {
    if (!c) return; const e = n - i, a = Math.abs(c);
    const body = e === 0 ? String(a) : `${a === 1 ? '' : a}${v}${e > 1 ? '^' + e : ''}`;
    s += (s === '' ? (c < 0 ? '-' : '') : c < 0 ? '-' : '+') + body;
  });
  return s || '0';
}
// multiply polynomials (coefficient arrays, highest first)
export function pmul(a, b) { const o = Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => (o[i + j] += x * y))); return o; }

// ---- choices ----
// distinct wrong answers near the right one (numbers), never equal to it
export function near(r, v, k = 3, spread = 5, ok = () => true) {
  const o = new Set(); let guard = 0;
  while (o.size < k && guard++ < 500) { const w = v + r.nz(-spread, spread); if (w !== v && ok(w)) o.add(w); }
  for (let w = v + 1; o.size < k; w++) if (w !== v) o.add(w);
  return [...o];
}
// keep the first k options that are different from each other (by their text)
export function uniq(opts, k) { const seen = new Set(), o = []; for (const x of opts) { const key = JSON.stringify(x); if (!seen.has(key)) { seen.add(key); o.push(x); } } return k ? o.slice(0, k) : o; }

// ---- answers ----
// a numeric answer: v can be a number or a fraction [n, d]; text = what a student would type
export const ansNum = (v, text) => ({ type: 'num', v: Array.isArray(v) ? v[0] / v[1] : v, text: text ?? (Array.isArray(v) ? fracText(...v) : numText(v)) });
export const ansFrac = (n, d) => ({ type: 'num', v: n / d, text: fracText(n, d), lowest: true });
export const ansSet = (vs, text) => ({ type: 'set', v: vs, text: text ?? vs.map(numText).join(', ') });
export const ansPair = (x, y, text) => ({ type: 'pair', v: [x, y], text: text ?? `(${numText(x)}, ${numText(y)})` });
// options[0] is the right one; the app shuffles them
export const ansChoice = (options) => ({ type: 'choice', options, correct: 0 });
