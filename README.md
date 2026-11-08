# 財商小學堂 Money Dojo

**Play:** https://ywchen0711.github.io/money-dojo/

Financial literacy for kids from grade 1 to grade 12, in Traditional Chinese and English, with a currency switch
between New Taiwan dollars (NT$) and US dollars. 一到十二年級的理財素養練習，中英雙語，可切換新台幣／美元。

- **33 practice units** sorted by grade (each unit covers a grade range and gets harder with the grade). Every unit is a
  question generator — new numbers and situations each time — with a short mini-lesson and a step-by-step explanation
  of *why* for every answer. Topics: counting coins and bills, fewest coins, making change, needs vs wants, shopping
  on a budget, saving for a goal, unit prices, discounts (折 in Taiwan), sales tax (US) / 5% VAT included in the price
  (Taiwan), bank ledgers, opportunity cost, profit, simple and compound interest, inflation, 50/30/20 budgets,
  paychecks and taxes, credit cards (APR, the minimum-payment trap), amortized loans, the rule of 72, risk and return,
  diversification, insurance, net worth, emergency funds, installments, progressive income tax, and scams / online safety.
- **Coins and bills drawn in SVG** (simple original drawings): NT$1/5/10/50 coins and 100/500/1000 bills; US penny,
  nickel, dime, quarter and $1/5/10/20 bills.
- **Four simulations**, each ending with a bilingual "what you learned" summary:
  - 🏪 Little Shop (G1–4): give change by tapping coins and bills from the cash drawer.
  - 🧋 Bubble Tea Boss (G3–8): run a bubble tea stand for 14 days — price, supplies, weather and demand; profit = revenue − cost.
  - 🏠 Life on a Budget (G7–12): job, rent, food, transport, fun, a savings goal and four weeks of surprises; compared with 50/30/20.
  - 📈 The 30-Year Investing Lab (G9–12): savings vs an index fund vs a single stock vs your mix, with random but
    realistic yearly returns (and the odd bankruptcy) — compounding and diversification on one chart.
- **Mixed quiz** per grade (10 questions, results with explanations) and **printable worksheets** (20 questions + answer key).
- **Exact money math**: every amount is an integer number of cents (BigInt for compound growth and loan payments);
  Taiwan amounts are whole dollars.
- Standards: areas of the US Jump$tart National Standards for Personal Financial Education (Earning Income, Spending,
  Saving, Investing, Managing Credit, Managing Risk) and Taiwan financial-education themes.
- Progress is saved only in the browser (localStorage, `mo-` keys) and reported to the Learning Hub via `js/learnlog.js`.

## Files
```
index.html, style.css
js/app.js          pages: grades, unit list, practice, quiz, worksheet, simulations; NT$/US$ and language switches
js/money.js        integer-cent money tools: formatting, exact rounding, compound growth, loan payment, coin/bill SVGs
js/util.js         seeded random numbers, bilingual text, answer builders
js/check.js        reads a typed answer (ignores $, NT$, 元 …) and compares it with the right value
js/learnlog.js     shared progress log for the Learning Hub
js/bank/elem.js    18 units, mostly grades 1–8
js/bank/second.js  15 units, grades 7–12
js/bank/_example.js two example units showing the format (not loaded)
js/sim/shop.js, tea.js, life.js, invest.js   the simulations (pure logic + UI + a headless runner)
SPEC.md            how to write a unit
test/run.mjs       node test/run.mjs — 300 draws per unit per currency + headless runs of every simulation
```
