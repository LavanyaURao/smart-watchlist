/**
 * Change Detection & Attention Scoring
 * ------------------------------------
 * Core product thesis: a watchlist should answer
 * "What changed since *you* last looked, and what deserves attention now?"
 *
 * We deliberately do NOT treat every tick as important.
 *
 * Scoring (transparent & tunable):
 *   attentionScore =
 *     abs(priceChangePercent) * 1.5
 *     + max(0, volumeRatio - 1.3) * 8
 *     + (isNearHigh || isNearLow ? 6 : 0)
 *     + (abs(priceChangePercent) > 2 ? 4 : 0)
 *     + regimeBonus (conviction / absorption / thin)
 *
 * Price–volume regimes (the novel signal most watchlists never surface):
 *   - conviction  : price moves + elevated volume  → real participation
 *   - absorption  : high volume, flat price         → supply/demand soaking
 *   - thin        : price moves on low volume       → unreliable tape
 *   - quiet       : neither moves nor volume        → noise
 *
 * Attention budget of 4: working memory is limited. Only the top scorers
 * earn the primary focus slots; the rest stay in the background.
 */

import { MarketQuote } from "./market-data";
import { isMarketOpen, getMarketStatusLabel } from "./market-hours";

export type VolumePriceRegime =
  | "conviction"
  | "absorption"
  | "thin"
  | "quiet";

export interface AttentionItem {
  symbol: string;
  name: string;
  current: MarketQuote;
  reasons: string[];
  attentionScore: number;
  regime: VolumePriceRegime;
  regimeLabel: string;
  priceChangeSinceView: number | null;
  isSignificant: boolean;
  inFocusBudget: boolean; // top 4 by score
  sparkline: number[]; // simple synthetic path for UI
}

export interface WatchlistBrief {
  sentences: string[];
  marketStatus: string;
  focusCount: number;
  needingAttention: number;
}

export interface WatchlistAnalysis {
  attentionItems: AttentionItem[];
  focusItems: AttentionItem[]; // attention budget of 4
  allItems: AttentionItem[];
  lastViewedAt: Date | null;
  analyzedAt: Date;
  marketOpen: boolean;
  marketStatusLabel: string;
  brief: WatchlistBrief;
  summary: {
    total: number;
    needingAttention: number;
    biggestMover: string | null;
    highestVolumeSpike: string | null;
    convictionCount: number;
    absorptionCount: number;
  };
}

const SIGNIFICANT_MOVE_PCT = 1.5;
const VOLUME_SPIKE_RATIO = 1.4;
const HIGH_ATTENTION_THRESHOLD = 8;
const FOCUS_BUDGET = 4;

function classifyRegime(quote: MarketQuote): {
  regime: VolumePriceRegime;
  label: string;
  bonus: number;
} {
  const absMove = Math.abs(quote.changePercent);
  const vol = quote.volumeRatio;

  // Loud volume + flat price = absorption (someone is soaking supply/demand)
  if (vol >= 1.6 && absMove < 0.8) {
    return {
      regime: "absorption",
      label: "Absorption — high volume, little price progress",
      bonus: 5,
    };
  }
  // Move on thin volume = unreliable
  if (absMove >= 1.2 && vol < 0.75) {
    return {
      regime: "thin",
      label: "Thin tape — move lacks volume confirmation",
      bonus: 3,
    };
  }
  // Price + volume together = conviction
  if (absMove >= 1.0 && vol >= 1.4) {
    return {
      regime: "conviction",
      label: "Conviction — price and volume aligned",
      bonus: 7,
    };
  }
  return {
    regime: "quiet",
    label: "Quiet — no notable disagreement",
    bonus: 0,
  };
}

function buildReasons(
  quote: MarketQuote,
  regime: VolumePriceRegime,
  regimeLabel: string
): string[] {
  const reasons: string[] = [];

  if (Math.abs(quote.changePercent) >= 3) {
    reasons.push(
      `${quote.changePercent > 0 ? "Strong gain" : "Sharp drop"} of ${Math.abs(quote.changePercent).toFixed(1)}%`
    );
  } else if (Math.abs(quote.changePercent) >= SIGNIFICANT_MOVE_PCT) {
    reasons.push(
      `${quote.changePercent > 0 ? "Up" : "Down"} ${Math.abs(quote.changePercent).toFixed(1)}% today`
    );
  }

  if (quote.volumeRatio >= 2) {
    reasons.push(
      `Volume ${quote.volumeRatio.toFixed(1)}× average — unusual activity`
    );
  } else if (quote.volumeRatio >= VOLUME_SPIKE_RATIO) {
    reasons.push(`Elevated volume (${quote.volumeRatio.toFixed(1)}× avg)`);
  }

  if (quote.isNearHigh) reasons.push("Trading near 52-week high");
  if (quote.isNearLow) reasons.push("Trading near 52-week low");

  if (regime !== "quiet") {
    reasons.push(regimeLabel);
  }

  return reasons;
}

function computeScore(quote: MarketQuote, regimeBonus: number): number {
  let score = Math.abs(quote.changePercent) * 1.5;
  score += Math.max(0, quote.volumeRatio - 1.3) * 8;
  if (quote.isNearHigh || quote.isNearLow) score += 6;
  if (Math.abs(quote.changePercent) > 2) score += 4;
  score += regimeBonus;
  return +score.toFixed(2);
}

/** Deterministic mini sparkline from symbol + current state (for UI polish) */
function buildSparkline(quote: MarketQuote): number[] {
  const points: number[] = [];
  let v = quote.previousClose;
  const seed = quote.symbol
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = 0; i < 12; i++) {
    const noise = ((Math.sin(seed * (i + 1) * 0.7) + 1) / 2 - 0.5) * 0.012;
    v = v * (1 + noise);
    points.push(+v.toFixed(2));
  }
  points.push(quote.price);
  return points;
}

function generateBrief(
  items: AttentionItem[],
  marketOpen: boolean,
  lastViewedAt: Date | null
): WatchlistBrief {
  const sentences: string[] = [];
  const focus = items.filter((i) => i.inFocusBudget);
  const needing = items.filter((i) => i.isSignificant);
  const conviction = items.filter((i) => i.regime === "conviction");
  const absorption = items.filter((i) => i.regime === "absorption");

  // 1. Market status
  sentences.push(
    marketOpen
      ? "NSE session is open — quotes are live-ish within the mock feed."
      : "Market is closed. Showing last session snapshot; no fake after-hours prints."
  );

  // 2. Attention summary
  if (needing.length === 0) {
    sentences.push(
      "Nothing in this book currently clears the attention threshold — the tape is quiet."
    );
  } else {
    const names = focus
      .slice(0, 3)
      .map((i) => i.symbol)
      .join(", ");
    sentences.push(
      `${needing.length} name${needing.length > 1 ? "s" : ""} need a look. Focus budget holds: ${names || "—"}.`
    );
  }

  // 3. Regime insight
  if (conviction.length > 0) {
    sentences.push(
      `Conviction tape on ${conviction.map((i) => i.symbol).join(", ")} — price and volume are aligned.`
    );
  } else if (absorption.length > 0) {
    sentences.push(
      `Absorption showing on ${absorption.map((i) => i.symbol).join(", ")} — high volume without progress.`
    );
  } else {
    sentences.push(
      "No strong price–volume disagreement across the book right now."
    );
  }

  // 4. Last-view context
  if (lastViewedAt) {
    const mins = Math.floor(
      (Date.now() - new Date(lastViewedAt).getTime()) / 60000
    );
    if (mins < 2) {
      sentences.push("You were just here — this is the same session view.");
    } else if (mins < 60) {
      sentences.push(
        `Last look was ${mins}m ago. Ranking is relative to that memory, not yesterday’s close.`
      );
    } else {
      sentences.push(
        `Last look was ${Math.floor(mins / 60)}h ago. Ranking is relative to that memory, not yesterday’s close.`
      );
    }
  } else {
    sentences.push(
      "First open of this list — baseline locked. Next visit will compare against this freeze."
    );
  }

  return {
    sentences: sentences.slice(0, 4),
    marketStatus: getMarketStatusLabel(),
    focusCount: focus.length,
    needingAttention: needing.length,
  };
}

export function analyzeWatchlist(
  quotes: MarketQuote[],
  lastViewedAt: Date | null
): WatchlistAnalysis {
  const now = new Date();
  const marketOpen = isMarketOpen(now);

  const items: AttentionItem[] = quotes.map((q) => {
    const { regime, label, bonus } = classifyRegime(q);
    const reasons = buildReasons(q, regime, label);
    const attentionScore = computeScore(q, bonus);
    const isSignificant =
      attentionScore >= HIGH_ATTENTION_THRESHOLD || reasons.length > 0;

    return {
      symbol: q.symbol,
      name: q.name,
      current: q,
      reasons,
      attentionScore,
      regime,
      regimeLabel: label,
      priceChangeSinceView: null,
      isSignificant,
      inFocusBudget: false,
      sparkline: buildSparkline(q),
    };
  });

  items.sort((a, b) => b.attentionScore - a.attentionScore);

  // Assign focus budget (top 4)
  items.forEach((item, idx) => {
    item.inFocusBudget = idx < FOCUS_BUDGET && item.isSignificant;
  });

  // If fewer than 4 significant, still fill budget with highest scores
  if (items.filter((i) => i.inFocusBudget).length < FOCUS_BUDGET) {
    items.forEach((item, idx) => {
      if (idx < FOCUS_BUDGET) item.inFocusBudget = true;
    });
  }

  const attentionItems = items.filter((i) => i.isSignificant);
  const focusItems = items.filter((i) => i.inFocusBudget);

  const biggestMover =
    items.length > 0
      ? items.reduce((best, cur) =>
          Math.abs(cur.current.changePercent) >
          Math.abs(best.current.changePercent)
            ? cur
            : best
        ).symbol
      : null;

  const highestVolumeSpike =
    items.length > 0
      ? items.reduce((best, cur) =>
          cur.current.volumeRatio > best.current.volumeRatio ? cur : best
        ).symbol
      : null;

  const brief = generateBrief(items, marketOpen, lastViewedAt);

  return {
    attentionItems,
    focusItems,
    allItems: items,
    lastViewedAt,
    analyzedAt: now,
    marketOpen,
    marketStatusLabel: getMarketStatusLabel(now),
    brief,
    summary: {
      total: items.length,
      needingAttention: attentionItems.length,
      biggestMover,
      highestVolumeSpike,
      convictionCount: items.filter((i) => i.regime === "conviction").length,
      absorptionCount: items.filter((i) => i.regime === "absorption").length,
    },
  };
}

export const SCORING_RATIONALE = `
Meaningful change is not every tick. We surface stocks that combine:
1. Material price movement (≥1.5%)
2. Unusual volume (relative to 20-day average)
3. Proximity to 52-week extremes
4. Price–volume regime (conviction / absorption / thin)

Attention budget is hard-capped at 4 — working memory is small.
The brief is deterministic from the scoring function; never LLM on page load.
`;
