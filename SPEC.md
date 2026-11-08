# Unit bank spec (for whoever writes js/bank/*.js)

財商小學堂 Money Dojo is a financial-literacy practice site for kids in grades 1–12, in Traditional Chinese
(繁體中文, Taiwan usage) and English. The whole site can switch currency between **NT$ (Taiwan)** and **US$**, so every
generator receives the currency and must produce a question that makes sense in that country (prices, coins, bills,
taxes, customs). Every question is **generated** from random numbers and word banks, and every answer comes with a
clear **explanation of why**.

## Files
- `js/util.js` — rng (`r.int`, `r.pick`, `r.shuffle`, `r.chance`, `r.sample`), `T(zh, en)`, `num`, `ansNum`, `ansChoice` … **Read it.**
- `js/money.js` — **all money helpers. Read it fully.** Amounts are always **integer cents**:
  NT$37 = `3700`, US$12.50 = `1250`. Taiwan amounts are always multiples of 100 (no NT cents).
  - `const m = mon(cur)` → `m.z(c)` / `m.e(c)` format for zh / en (`37 元` / `NT$37`, `12.50 美元` / `$12.50`;
    whole US dollars print as `$3,200`), `m.zf/m.ef` always show US cents, `m.ans(c)` the answer, `m.typeHint` a
    T() telling the child how to type the amount, `m.tw` true in Taiwan mode, `m.name(d)` a coin/bill name.
  - `pile(list, cur)` draws coins & bills (SVG) for `fig`; `fewest(c, cur)`, `tally`, `tallyText(list, cur)`.
  - exact math: `rdiv(a, b)` (half-up rounding of a/b, Number or BigInt), `pctOf(c, p)` (p % of c, rounded to the
    cent), `pctOfBp`, `grow(c, bp, n)` (compound growth, exact), `loanPayment(P, aprBp, n)` (amortized monthly payment,
    exact), `monthInterest(bal, aprBp)`.
- `js/bank/_example.js` — **two complete units. Copy this style.**
- `test/run.mjs` — `node test/run.mjs js/bank/yourfile.js` must print `0 problems`.

## A unit
```js
{
  id: 'unit-price',                 // unique, kebab-case
  grades: [4, 7],                   // grade range where it is listed (difficulty may grow with g)
  area: 'spend',                    // earn | spend | save | invest | credit | risk
  name: T('哪個比較划算？', 'Which is the better deal?'),
  std: { us: 'Jump$tart · Spending', tw: '金融教育 · 聰明消費' },   // short labels shown on the unit card
  lesson: T('…', '…'),              // a 2–4 sentence mini-lesson shown above the questions (the idea + one tip)
  gen(r, cur, g) { return { q, fig?, ans, sol, hint? }; },   // cur = 'tw' | 'us', g = the grade being practiced
}
```
**Standards labels.** US: the Jump$tart National Standards for Personal Financial Education (2021, with the Council for
Economic Education) has six areas — use exactly `Jump$tart · Earning Income`, `· Spending`, `· Saving`, `· Investing`,
`· Managing Credit`, `· Managing Risk`. Do not invent standard codes. Taiwan: use a plain topic label such as
`金融教育 · 認識貨幣`, `金融教育 · 儲蓄`, `金融教育 · 聰明消費`, `金融教育 · 借貸與信用`, `金融教育 · 投資理財`,
`金融教育 · 保險與風險`, `金融教育 · 防詐騙`, `金融教育 · 收入與工作`, or a math one like `國小數學 · 錢幣`,
`國小數學 · 百分率`, `國中數學 · 等比數列`. No codes.

## gen(r, cur, g) returns
- `q`: `T(zh, en)` — the question. English must contain no Chinese characters. Use `m.z()` in zh and `m.e()` in en.
- `fig` (optional): HTML/SVG string (e.g. `pile([...], cur)`, or a small table `<table class="tbl">…</table>`).
- `ans`, one of:
  - `m.ans(c)` — a money answer in integer cents (the child types dollars: `12.50` / `37`). Add `m.typeHint` to the question.
  - `ansCents(c)` — US cents for coin counting below a dollar.
  - `ansNum(v, text?)` — a plain number (weeks, years, months, percent, number of coins). Say the unit in the question.
  - `ansChoice([right, wrong1, wrong2, …])` — multiple choice, **right answer first** (the app shuffles), 2–5 options,
    strings or `T(zh, en)`, all different **in both languages**. Wrong options = mistakes kids really make.
- `sol`: 3–6 `T(zh, en)` steps with the actual numbers: the idea, each computation, the answer, a check or a
  "why it matters" money lesson. Short sentences a child of that grade understands.
- `hint` (optional): `T(zh, en)` one-line nudge.

## Money correctness (most important)
- **All money math in integer cents.** Never multiply floats like `12.5 * 0.08`. Use `pctOf`, `rdiv`, `grow`, `loanPayment`.
- When rounding happens, the question must say so ("rounded to the nearest cent / 四捨五入到整數元").
- Taiwan mode: every amount (prices, answers, intermediate results shown) is a whole number of 元. Choose numbers so
  results come out whole, or say "四捨五入到整數元 / round to the nearest NT dollar" and round with `rdiv`.
- Realistic prices per country (a bubble tea ≈ NT$50–75 / US$5–7; rent ≈ NT$8,000–25,000 / US$900–2,200 a month;
  starting salary ≈ NT$30,000–45,000 / US$2,800–4,500 a month).
- Country facts must be true: Taiwan prices include 5% 營業稅 (VAT inside the tag price; tax = price × 5/105);
  US sales tax is added at the register and rates differ by state/city (say "suppose the sales tax is 7%").
  Taiwan discounts are written as 折: 8 折 = pay 80% = 20% off; 75 折 = pay 75%. In English always say "20% off".
  US paycheck: Social Security 6.2% + Medicare 1.45% (FICA 7.65%); income-tax withholding — give the % in the question.
  Taiwan paycheck: give 勞保/健保 deductions as amounts or a stated % ("假設…") — don't claim exact official rates.
- Choice questions about concepts (needs vs wants, scams, risk) must have one clearly right answer that no adult would
  argue with. Avoid edge cases ("is a phone a need?").
- Names: 小明/Max, 小美/Mia, 阿傑/Jay, 欣怡/Emma, 志豪/Leo, 雅婷/Ava, 家豪/Noah, 佳穎/Lily …
- Several templates per unit (≥ 3 where possible): compute, reverse ("how much did it cost?"), compare, story.
- ES module, `export default [ ...units ]`, import only from '../util.js' and '../money.js'.
- Run `node test/run.mjs js/bank/yourfile.js` until `0 problems`, then print ~4 questions per unit per currency with
  a small node script and read them: wording, numbers and explanation must agree.
