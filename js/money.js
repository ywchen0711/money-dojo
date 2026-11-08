// Money tools shared by the question generators and the simulations.
// ALL amounts are integers in CENTS (1/100 of a dollar). New Taiwan dollars have no cents in daily life, so a
// Taiwan amount is always a multiple of 100 cents (NT$37 = 3700). Never store money as a float.
import { T, tx } from './util.js';

// denominations in cents, small to large
export const CUR = {
  tw: { coins: [100, 500, 1000, 5000], bills: [10000, 50000, 100000], step: 100 },
  us: { coins: [1, 5, 10, 25], bills: [100, 500, 1000, 2000], step: 1 },
};
export const denoms = (cur) => [...CUR[cur].coins, ...CUR[cur].bills];          // ascending
export const denomsDesc = (cur) => denoms(cur).slice().reverse();
export const isCoin = (d, cur) => CUR[cur].coins.includes(d);

const group = (n) => n.toLocaleString('en-US');
// format an amount: fm(1250, 'us', 'en') → "$12.50"; fm(3700, 'tw', 'zh') → "37 元"; fm(3700, 'tw', 'en') → "NT$37"
export function fm(c, cur, lang) {
  if (!Number.isInteger(c)) throw new Error('money must be integer cents: ' + c);
  const neg = c < 0; c = Math.abs(c);
  let s;
  if (cur === 'tw') {
    if (c % 100) throw new Error('NT$ amount with cents: ' + c);
    s = lang === 'zh' ? `${group(c / 100)} 元` : `NT$${group(c / 100)}`;
  } else {
    const d = Math.floor(c / 100), ct = String(c % 100).padStart(2, '0');
    s = lang === 'zh' ? `${group(d)}.${ct} 美元` : `$${group(d)}.${ct}`;
  }
  return (neg ? '−' : '') + s;
}
// whole-dollar amounts shown without ".00" in US (for big numbers like salaries): $3,200
export function fmShort(c, cur, lang) {
  if (cur === 'us' && c % 100 === 0) return (c < 0 ? '−' : '') + (lang === 'zh' ? `${group(Math.abs(c) / 100)} 美元` : `$${group(Math.abs(c) / 100)}`);
  return fm(c, cur, lang);
}
// US small change in cents: "67¢" / "67 分"
export const fmCents = (c, lang) => (lang === 'zh' ? `${c} 分` : `${c}¢`);

// A per-currency helper for generators:  const m = mon(cur);  T(`你有 ${m.z(500)}`, `You have ${m.e(500)}`)
export function mon(cur) {
  return {
    cur,
    tw: cur === 'tw',
    step: CUR[cur].step,
    z: (c) => fmShort(c, cur, 'zh'),
    e: (c) => fmShort(c, cur, 'en'),
    zf: (c) => fm(c, cur, 'zh'),          // always with cents in US ($5.00)
    ef: (c) => fm(c, cur, 'en'),
    T: (c) => T(fmShort(c, cur, 'zh'), fmShort(c, cur, 'en')),
    ans: (c) => ansMoney(c, cur),
    // unit words
    uz: cur === 'tw' ? '元' : '美元',
    ue: cur === 'tw' ? 'NT dollars' : 'dollars',
    // "type the number of dollars" hint text
    typeHint: cur === 'tw' ? T('（只要寫數字，單位是元）', '(type just the number of NT dollars)') : T('（寫成美元，例如 12.50）', '(type dollars and cents, like 12.50)'),
    name: (d) => denomName(d, cur),
  };
}

// a money answer; c in cents. Typed as dollars ("12.50", "37"); the checker ignores $, NT$, 元.
export function ansMoney(c, cur) {
  if (!Number.isInteger(c)) throw new Error('money answer must be integer cents: ' + c);
  if (cur === 'tw' && c % 100) throw new Error('NT$ answer with cents: ' + c);
  const text = cur === 'tw' ? String(c / 100) : (c / 100).toFixed(2);
  return { type: 'num', v: c / 100, text, cents: c, money: cur };
}
// an answer counted in US cents ("67") — for coin counting below a dollar
export const ansCents = (c) => ({ type: 'num', v: c, text: String(c), cents: c, money: 'us' });

// ---- exact integer arithmetic ----
// a / b rounded half-up, for non-negative integers (Number or BigInt)
export function rdiv(a, b) {
  if (typeof a === 'bigint' || typeof b === 'bigint') { a = BigInt(a); b = BigInt(b); return (2n * a + b) / (2n * b); }
  if (a < 0 || b <= 0) throw new Error('rdiv expects a ≥ 0, b > 0');
  return Math.floor((2 * a + b) / (2 * b));
}
// p percent of c cents, rounded to the cent. p may be a decimal like 7.25 (given as basis points: bp = 725)
export const pctOfBp = (c, bp) => rdiv(c * bp, 10000);
export const pctOf = (c, p) => pctOfBp(c, Math.round(p * 100));
// compound growth: c · (1 + bp/10000)^n, rounded to the cent, computed exactly with BigInt
export function grow(c, bp, n) {
  const num = BigInt(c) * BigInt(10000 + bp) ** BigInt(n), den = 10000n ** BigInt(n);
  return Number(rdiv(num, den));
}
// fixed monthly payment for a loan of P cents at APR (basis points, e.g. 600 = 6%) over n months,
// rounded to the cent: M = P·r / (1 − (1 + r)^−n), r = APR/12, computed exactly.
export function loanPayment(P, aprBp, n) {
  if (aprBp === 0) return rdiv(P, n);
  const D = 120000n, a = BigInt(aprBp), A = (D + a) ** BigInt(n), B = D ** BigInt(n);
  return Number(rdiv(BigInt(P) * a * A, D * (A - B)));
}
// monthly interest on a balance at APR (basis points), rounded to the cent
export const monthInterest = (bal, aprBp) => rdiv(bal * aprBp, 120000);

// fewest coins & bills that make c (greedy is optimal for both the NT$ and the US systems)
export function fewest(c, cur, allowBills = true) {
  const ds = (allowBills ? denomsDesc(cur) : CUR[cur].coins.slice().reverse());
  const out = [];
  for (const d of ds) while (c >= d) { out.push(d); c -= d; }
  if (c) throw new Error('cannot make amount');
  return out;
}
// count of each denomination: [[d, k], …] largest first
export function tally(list) { const m = new Map(); for (const d of list.slice().sort((a, b) => b - a)) m.set(d, (m.get(d) || 0) + 1); return [...m]; }

// ---- names ----
const NAMES = {
  tw: {
    100: ['1 元硬幣', 'NT$1 coin'], 500: ['5 元硬幣', 'NT$5 coin'], 1000: ['10 元硬幣', 'NT$10 coin'], 5000: ['50 元硬幣', 'NT$50 coin'],
    10000: ['100 元鈔票', 'NT$100 bill'], 50000: ['500 元鈔票', 'NT$500 bill'], 100000: ['1000 元鈔票', 'NT$1000 bill'],
  },
  us: {
    1: ['1 分（penny）', 'penny (1¢)'], 5: ['5 分（nickel）', 'nickel (5¢)'], 10: ['10 分（dime）', 'dime (10¢)'], 25: ['25 分（quarter）', 'quarter (25¢)'],
    100: ['1 美元鈔票', '$1 bill'], 500: ['5 美元鈔票', '$5 bill'], 1000: ['10 美元鈔票', '$10 bill'], 2000: ['20 美元鈔票', '$20 bill'],
  },
};
export const denomName = (d, cur) => T(...NAMES[cur][d]);
// "3 個 10 元硬幣、2 張 100 元鈔票" / "3 NT$10 coins, 2 NT$100 bills"
export function tallyText(list, cur) {
  const t = tally(list);
  const zh = t.map(([d, k]) => `${k} ${isCoin(d, cur) ? '個' : '張'} ${NAMES[cur][d][0]}`).join('、');
  const en = t.map(([d, k]) => `${k} × ${NAMES[cur][d][1]}`).join(', ');
  return T(zh, en);
}

// ---- pictures (simple original drawings, not copies of real designs) ----
// real-ish diameters in mm decide the coin sizes
const COIN = {
  tw: { 100: [20, 'bronze', '1'], 500: [22, 'silver', '5'], 1000: [26, 'silver', '10'], 5000: [28, 'gold', '50'] },
  us: { 1: [19, 'copper', '1¢'], 5: [21, 'silver', '5¢'], 10: [18, 'silver', '10¢'], 25: [24, 'silver', '25¢'] },
};
const METAL = {
  bronze: ['#d9a35a', '#a8722f', '#6e4515'], gold: ['#f2cd4f', '#c99a1b', '#7a5a06'],
  silver: ['#e4e7ec', '#aab1bc', '#4f5764'], copper: ['#d98a5b', '#a85a32', '#5e2c12'],
};
const BILL = {
  tw: { 10000: ['#e8747a', '#b8323b', '100'], 50000: ['#c99063', '#7d4a22', '500'], 100000: ['#7da7dc', '#2c5b9c', '1000'] },
  us: { 100: ['#a9cfa0', '#3d6e3a', '1'], 500: ['#b9d6a3', '#476f2f', '5'], 1000: ['#b5d4b8', '#2f6b4c', '10'], 2000: ['#c3d9a6', '#55702c', '20'] },
};
export function coinSVG(d, cur, scale = 2.4) {
  const [mm, metal, label] = COIN[cur][d], [hi, mid, dark] = METAL[metal];
  const R = (mm * scale) / 2, S = 2 * R + 4, c = S / 2;
  const fs = label.length > 2 ? R * 0.62 : R * 0.8;
  // rim, face, inner ring, a small star (TW) or laurel dots (US), the value
  let deco = '';
  if (cur === 'tw') { const r1 = R * 0.66; for (let k = 0; k < 8; k++) { const a = (k / 8) * 2 * Math.PI; deco += `<circle cx="${(c + r1 * Math.cos(a)).toFixed(1)}" cy="${(c + r1 * Math.sin(a)).toFixed(1)}" r="${(R * 0.05).toFixed(1)}" fill="${dark}" opacity=".35"/>`; } }
  else { const r1 = R * 0.7; for (let k = 0; k < 14; k++) { const a = Math.PI * 0.15 + (k / 13) * Math.PI * 0.7; deco += `<circle cx="${(c + r1 * Math.cos(a)).toFixed(1)}" cy="${(c + r1 * Math.sin(a)).toFixed(1)}" r="${(R * 0.06).toFixed(1)}" fill="${dark}" opacity=".35"/>`; } }
  return `<svg class="coin" data-d="${d}" viewBox="0 0 ${S} ${S}" width="${S.toFixed(0)}" height="${S.toFixed(0)}" role="img" aria-label="${NAMES[cur][d][1]}">` +
    `<circle cx="${c}" cy="${c}" r="${R}" fill="${mid}" stroke="${dark}" stroke-width="1.2"/>` +
    `<circle cx="${c}" cy="${c}" r="${R * 0.86}" fill="${hi}" stroke="${mid}" stroke-width="1"/>` +
    `<path d="M${c - R * 0.55},${c - R * 0.45} A${R * 0.75},${R * 0.75} 0 0 1 ${c + R * 0.2},${c - R * 0.72}" stroke="#fff" stroke-opacity=".55" stroke-width="${(R * 0.08).toFixed(1)}" fill="none" stroke-linecap="round"/>` +
    deco +
    `<text x="${c}" y="${c + fs * 0.36}" text-anchor="middle" font-size="${fs.toFixed(1)}" font-weight="800" fill="${dark}" font-family="system-ui, sans-serif">${label}</text></svg>`;
}
export function billSVG(d, cur, w = 132) {
  const [bg, ink, label] = BILL[cur][d], h = Math.round(w * 0.46);
  const pre = cur === 'tw' ? 'NT$' : '$';
  return `<svg class="bill" data-d="${d}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${NAMES[cur][d][1]}">` +
    `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="5" fill="${bg}" stroke="${ink}" stroke-width="1.5"/>` +
    `<rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="3" fill="none" stroke="${ink}" stroke-opacity=".45" stroke-dasharray="3 2"/>` +
    `<ellipse cx="${w * 0.62}" cy="${h / 2}" rx="${h * 0.32}" ry="${h * 0.32}" fill="#fff" fill-opacity=".45" stroke="${ink}" stroke-opacity=".5"/>` +
    `<path d="M${w * 0.62 - h * 0.16},${h / 2 + h * 0.12} q${h * 0.16},${-h * 0.36} ${h * 0.32},0" fill="none" stroke="${ink}" stroke-width="2" stroke-opacity=".6"/>` +
    `<text x="12" y="${h * 0.36}" font-size="${h * 0.24}" font-weight="800" fill="${ink}" font-family="system-ui, sans-serif">${label}</text>` +
    `<text x="${w - 10}" y="${h - 10}" text-anchor="end" font-size="${h * 0.17}" font-weight="700" fill="${ink}" font-family="system-ui, sans-serif">${pre}${label}</text></svg>`;
}
export const moneySVG = (d, cur, small = false) => (isCoin(d, cur) ? coinSVG(d, cur, small ? 1.8 : 2.4) : billSVG(d, cur, small ? 100 : 132));
// a pile of money as HTML: bills first then coins, largest first
export function pile(list, cur, small = false) {
  const s = list.slice().sort((a, b) => b - a);
  return `<div class="pile">${s.map((d) => moneySVG(d, cur, small)).join('')}</div>`;
}
export { tx };
