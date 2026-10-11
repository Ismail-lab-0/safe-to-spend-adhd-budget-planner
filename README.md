# Safe to Spend — ADHD Budget Planner

A calm, no-account budgeting web app for ADHD adults. One number tells you what is safe to spend today, built around how your bills and paychecks actually land, with no manual weekly re-budgeting.

**Try the free demo:** https://ismail-lab-0.github.io/safe-to-spend-adhd-budget-planner/ (feature-limited preview)

**Full version (buyers):** https://ismail-lab-0.github.io/safe-to-spend-adhd-budget-planner/app-a24a1613/

## Features

- One number: what is safe to spend today, recalculated automatically
- Bills on any real-world schedule (monthly, every 2 weeks, every week, every few months, one-off) — never re-entered
- Debt tracker with a highest-rate-first or smallest-balance-first payoff order
- Savings goals with visible progress
- Works offline once installed to your Home Screen — no account, no subscription
- One-tap JSON backup/restore — your data, portable

## Setup

This is a static, self-contained HTML app — no build step required to run it.
Open `index.html` directly, or serve the repo's `docs/` folder (this is what
GitHub Pages does automatically for this repo).

## Limitations

- The public demo caps a few actions (spends/bills/debts/goals) so it stays a quick preview, not DRM — a client-side nudge like any static site, not a security boundary.

## Deployment

Published via GitHub Pages from the `docs/` folder on `main`. The demo build (if any) and the full build are generated from the same source by `tools/app_bundle.js` — see that script for the `--demo` flag.