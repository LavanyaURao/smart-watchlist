# Lookback — Smart Market Watchlist

> **What changed since *you* last looked — and what deserves attention now?**

Built for **Code by Groww 2026**.  
This is not a flat price list. It is a system with a point of view.

---

## Product thesis

A normal watchlist shows prices.  
**Lookback** answers:

1. What has **meaningfully changed** since my last visit?
2. What deserves my **limited attention** right now?
3. Is the tape **conviction**, **absorption**, or **noise**?

---

## The ideas judges will remember

### 1. Last look is the unit of change
When you open a list we freeze every quote. The next visit is compared to *your* memory — not yesterday's close. `lastViewedAt` is first-class in the data model.

### 2. Price–volume disagreement (the novel signal)
| Regime | Meaning |
|--------|---------|
| **Conviction** | Price moves + elevated volume → real participation |
| **Absorption** | High volume, flat price → supply/demand soaking |
| **Thin** | Price moves on low volume → unreliable tape |
| **Quiet** | Neither moves nor volume → noise |

Most watchlists never surface this.

### 3. Attention budget of 4
Working memory is small. Only the top scorers earn the primary focus slots. Toggle **Focus mode** to see only the budget.

### 4. The market is allowed to be closed
After 15:30 IST (NSE) we freeze the last session and label it. No fake 11pm "live" prints.

### 5. The brief is deterministic
Four sentences generated from the scoring function. **Never** an LLM on page load. Every word is defendable.

---

## Scoring model (transparent)

```
attentionScore =
  |changePercent| × 1.5
  + max(0, volumeRatio − 1.3) × 8
  + (near 52w high/low ? 6 : 0)
  + (|changePercent| > 2 ? 4 : 0)
  + regimeBonus (conviction 7 / absorption 5 / thin 3)
```

Threshold ≥ 8 → "needs attention".  
Weights are opinionated and documented so they can be debated.

---

## Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Backend**: Next.js API routes
- **DB**: SQLite + Prisma (zero-config local; swap to Postgres for prod)
- **Auth**: Email/password + JWT httpOnly cookies
- **Market data**: Realistic deterministic mock of NSE stocks (time-bucketed movement) so demos are reproducible and resilient without external rate limits

---

## How to run

```bash
npm install
npm run db:setup   # push schema + seed
npm run dev
```

Open http://localhost:3000

**Demo flow**
1. Register → default "Core book" with RELIANCE, TCS, HDFCBANK, INFY is created
2. Open the watchlist → read **The brief** first
3. Hit the sun/moon for light/dark mode
4. Toggle **Focus** to see only the attention budget of 4
5. Open **How it thinks** (book icon) — your 5-minute defence
6. Add/remove symbols, refresh later → ranking updates

---

## Architecture decisions & trade-offs

| Decision | Why |
|----------|-----|
| SQLite + Prisma | Zero ops for the hackathon; schema is production-shaped |
| Mock market feed | Reproducible demos, no rate-limit risk, every quote still carries `fetchedAt` + `source` + `isStale` |
| JWT cookies | Simple, secure enough for the scope; no third-party auth complexity |
| Deterministic brief | Defendable in a room with engineers; LLM is optional later, never on load |
| Attention budget hard-capped at 4 | Product opinion: more than that is noise |
| No WebSockets | Prefer clear "as of" timestamps over the illusion of perfect realtime |

---

## Edge cases handled

- Empty watchlist
- Duplicate symbol (409)
- Unknown / invalid symbol (400)
- Auth expiry → redirect
- Stale data badge + still usable
- Market closed → labelled freeze
- Concurrent-looking updates (last-write-wins)
- Large lists → ranked so important names surface first
- Dark / light mode with system preference + persistence

---

## Project structure

```
src/
  app/
    api/auth/          # register, login, me
    api/watchlists/    # CRUD + items + analysis
    api/market/        # symbol search
    dashboard/
    watchlist/[id]/   # the product surface
  components/          # ThemeProvider, ThemeToggle, Sparkline
  lib/
    auth.ts
    market-data.ts     # quote generation + universe
    market-hours.ts    # NSE session awareness
    change-detection.ts # attention scoring + brief (core IP)
    prisma.ts
    utils.ts
prisma/
  schema.prisma
```

---

## 100-word pitch

> Lookback answers the real question investors ask: "What changed and needs my attention now?"  
> It freezes the book on every visit, ranks names by a transparent attention score (price move, volume anomaly, 52-week extremes, price–volume regime), and hard-caps focus at 4.  
> A deterministic four-sentence brief is generated from the same scoring function — never an LLM on page load.  
> Architecture prioritises resilience: every quote carries timestamp and freshness, the market is allowed to be closed, and the system degrades to last-known-good instead of a blank screen.  
> A system with opinions you can defend.

---

## What we would do next (production)

1. Real multi-source market feed with reconciliation
2. Historical snapshots so "change since last view" is exact delta
3. Background refresh of popular symbols + per-user rate limits
5. Alerts and notification preferences

All of the above sit on top of the current architecture without a rewrite.

---

Built for Code by Groww 2026.  
Ready to be defended.
