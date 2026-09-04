# 📈 Lookback — Smart Market Watchlist

> **What changed since *you* last looked — and what deserves your attention now?**

A market watchlist that prioritizes **change awareness** over raw prices.

Built for **Code by Groww 2026**.

---

## Live Demo

**Application:** https://smart-watchlist-zxjr-iq7nzbxn5.vercel.app/


---

## Why Lookback?

Traditional watchlists answer:

> *"What are today's prices?"*

Lookback answers:

- What has meaningfully changed since **my last visit**?
- Which stocks deserve my attention right now?
- Is this move backed by conviction, absorption, or just noise?

Instead of flooding users with data, Lookback highlights only the signals that matter.

---

#  Features

### Change since your last visit

Every watchlist stores the time it was last viewed.

Instead of comparing prices with yesterday's close, Lookback compares today's market against **your own last interaction**, making every revisit instantly meaningful.

---

###  Attention Score

Each stock receives a transparent score based on:

- Price movement
- Volume anomaly
- Distance from 52-week high/low
- Price–volume regime

Only stocks with meaningful changes surface to the top.

---

### 📊 Price–Volume Regimes

Rather than showing price alone, Lookback classifies market behaviour.

| Regime | Meaning |
|---------|---------|
| Conviction | Strong price move supported by high volume |
| Absorption | Heavy volume with little price movement |
| Thin Move | Price moved without participation |
| Quiet | Little movement and low volume |

---

### Focus Mode

Working memory is limited.

Instead of overwhelming users, Lookback intentionally highlights only the **top four** highest-priority stocks.

---

### Deterministic Market Brief

Every watchlist generates a concise four-sentence summary directly from the scoring engine.

No LLM is used during page load, ensuring:

- deterministic behaviour
- explainable outputs
- reproducible demos

---

### Market Hours Awareness

The application understands NSE trading hours.

After market close, it freezes the latest session instead of pretending prices are live.

Every quote includes freshness metadata.

---

# Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Next.js API Routes |
| ORM | Prisma |
| Database | postgresql |
| Authentication | JWT + httpOnly Cookies |
| Market Data | Deterministic NSE mock feed |

---

# Architecture

```
                 +--------------------+
                 |   Next.js Client   |
                 +---------+----------+
                           |
                    API Routes
                           |
        +------------------+------------------+
        |                                     |
 Authentication                    Market Engine
 (JWT Cookies)                (Scoring + Quotes)
        |                                     |
        +------------------+------------------+
                           |
                       Prisma ORM
                           |
                        postgresql DB
```

---

# Attention Score

The ranking algorithm is fully transparent.

```text
attentionScore =
  |changePercent| × 1.5
  + max(0, volumeRatio − 1.3) × 8
  + (near 52w high/low ? 6 : 0)
  + (|changePercent| > 2 ? 4 : 0)
  + regimeBonus
```

Threshold:

```
Score ≥ 8
→ Needs Attention
```

The weights are intentionally opinionated and easy to debate or tune.

---

# 📂 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── market/
│   │   └── watchlists/
│   ├── dashboard/
│   ├── login/
│   ├── register/
│   └── watchlist/
│
├── components/
│   ├── Sparkline.tsx
│   ├── ThemeProvider.tsx
│   └── ThemeToggle.tsx
│
└── lib/
    ├── auth.ts
    ├── change-detection.ts
    ├── market-data.ts
    ├── market-hours.ts
    ├── prisma.ts
    └── utils.ts

prisma/
├── schema.prisma
└── seed.ts
```

---

# Running Locally

Clone the repository.

```bash
git clone https://github.com/yourusername/lookback.git
cd lookback
```

Install dependencies.

```bash
npm install
```

Create a `.env` file.

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your_secret_here
```

Initialize the database.

```bash
npx prisma db push
npm run seed
```

Start the development server.

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# Demo Flow

1. Register a new account
2. A default watchlist is automatically created
3. Explore the generated market brief
4. Toggle Focus Mode
5. Add or remove stocks
6. Return later to see what changed since your previous visit

---

# Design Decisions

### postgresql + Prisma

Chosen for zero-configuration local development while keeping a production-ready schema.

### Deterministic Market Feed

A reproducible mock market avoids API rate limits and ensures judges always see consistent behaviour.

### Explainable Intelligence

Every recommendation comes directly from the scoring model instead of a black-box AI response.

### Hard Attention Budget

Only four stocks are surfaced because prioritization is more valuable than showing everything.

---

# Edge Cases

- Empty watchlists
- Duplicate symbols
- Invalid symbols
- Expired authentication
- Stale market data
- Market closed handling
- Last-write-wins updates
- Large watchlists
- Theme persistence

---

# Future Improvements

- Live NSE market feeds
- Historical quote snapshots
- Real-time updates using WebSockets
- Personalized alerts
- Multi-device synchronization
- Portfolio analytics
- Watchlist sharing

---

# Key Takeaway

Lookback isn't another stock tracker.

It is a watchlist designed around **human attention**.

Instead of asking users to inspect dozens of prices, it continuously answers one simple question:

> **"What changed since I last looked, and what deserves my attention now?"**

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-blue)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![TailwindCSS](https://img.shields.io/badge/Tailwind-v4-38B2AC)

Website snapshot:
---

<img width="1311" height="755" alt="image" src="https://github.com/user-attachments/assets/1bbe4ff9-4a85-48bb-87fd-2e064452c213" />


Built for **Code by Groww 2026**.
