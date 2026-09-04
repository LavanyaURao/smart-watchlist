"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Focus,
  BookOpen,
  X,
  Info,
} from "lucide-react";
import { formatINR, formatPercent, formatNumber, timeAgo, cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sparkline } from "@/components/Sparkline";

interface AttentionItem {
  symbol: string;
  name: string;
  current: {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    volumeRatio: number;
    high52w: number;
    low52w: number;
    isStale: boolean;
    fetchedAt: string;
    sector: string;
  };
  reasons: string[];
  attentionScore: number;
  regime: "conviction" | "absorption" | "thin" | "quiet";
  regimeLabel: string;
  isSignificant: boolean;
  inFocusBudget: boolean;
  sparkline: number[];
}

interface Analysis {
  attentionItems: AttentionItem[];
  focusItems: AttentionItem[];
  allItems: AttentionItem[];
  lastViewedAt: string | null;
  analyzedAt: string;
  marketOpen: boolean;
  marketStatusLabel: string;
  brief: {
    sentences: string[];
    marketStatus: string;
    focusCount: number;
    needingAttention: number;
  };
  summary: {
    total: number;
    needingAttention: number;
    biggestMover: string | null;
    highestVolumeSpike: string | null;
    convictionCount: number;
    absorptionCount: number;
  };
}

export default function WatchlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    { symbol: string; name: string; sector: string }[]
  >([]);
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showHow, setShowHow] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/watchlists/${id}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError("Watchlist not found");
        return;
      }
      const data = await res.json();
      setName(data.watchlist.name);
      setAnalysis(data.analysis);
    } catch {
      setError("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(
        `/api/market/search?q=${encodeURIComponent(search)}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  async function addSymbol(symbol: string) {
    setAdding(true);
    try {
      const res = await fetch(`/api/watchlists/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      if (res.ok) {
        setSearch("");
        setShowAdd(false);
        await load();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add");
      }
    } finally {
      setAdding(false);
    }
  }

  async function removeSymbol(symbol: string) {
    if (!confirm(`Remove ${symbol}?`)) return;
    await fetch(`/api/watchlists/${id}/items?symbol=${symbol}`, {
      method: "DELETE",
    });
    await load();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted bg-app">
        Loading watchlist…
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-app">
        <p className="text-muted">{error || "Something went wrong"}</p>
        <Link href="/dashboard" className="text-sky-600 dark:text-sky-400 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const displayItems = focusMode ? analysis.focusItems : analysis.allItems;

  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-card bg-header backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg hover:bg-muted text-muted"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="font-semibold text-foreground">{name}</h1>
            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                analysis.marketOpen
                  ? "border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10"
                  : "border-slate-500/30 text-muted bg-muted"
              )}
            >
              {analysis.marketStatusLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition",
                focusMode
                  ? "bg-sky-600 text-white"
                  : "text-muted hover:bg-muted"
              )}
              title="Focus mode — only the 4 that earned the budget"
            >
              <Focus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Focus</span>
            </button>
            <button
              onClick={() => setShowHow(true)}
              className="p-1.5 rounded-lg text-muted hover:bg-muted"
              title="How it thinks"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <ThemeToggle />
            <button
              onClick={load}
              className="p-1.5 rounded-lg hover:bg-muted text-muted"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="inline-flex items-center gap-1.5 text-sm font-medium bg-sky-600 text-white px-3 py-1.5 rounded-lg hover:bg-sky-700"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Add symbol panel */}
        {showAdd && (
          <div className="bg-card border border-card rounded-xl p-4 shadow-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol or company (e.g. RELIANCE, TCS, HDFC)…"
              className="w-full text-sm px-3 py-2 rounded-lg border border-card bg-app text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
              autoFocus
            />
            {searchResults.length > 0 && (
              <ul className="mt-2 max-h-48 overflow-auto divide-y divide-card">
                {searchResults.map((r) => (
                  <li key={r.symbol}>
                    <button
                      onClick={() => addSymbol(r.symbol)}
                      disabled={adding}
                      className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between text-sm"
                    >
                      <span>
                        <span className="font-medium">{r.symbol}</span>
                        <span className="text-muted ml-2">{r.name}</span>
                      </span>
                      <span className="text-xs text-muted">{r.sector}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* THE BRIEF — the product */}
        <section className="bg-card border border-card rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-sky-500" />
            <h2 className="font-semibold text-foreground text-sm tracking-wide uppercase">
              The brief
            </h2>
            <span className="text-[10px] text-muted ml-auto">
              Deterministic · not LLM
            </span>
          </div>
          <ol className="space-y-2">
            {analysis.brief.sentences.map((s, i) => (
              <li
                key={i}
                className="text-sm text-foreground/90 leading-relaxed flex gap-2"
              >
                <span className="text-muted font-mono text-xs mt-0.5 shrink-0">
                  {i + 1}.
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Summary bar */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>{analysis.summary.total} symbols</span>
          <span className="opacity-40">·</span>
          <span>Last viewed {timeAgo(analysis.lastViewedAt)}</span>
          {analysis.summary.needingAttention > 0 && (
            <>
              <span className="opacity-40">·</span>
              <span className="text-amber-700 dark:text-amber-400 font-medium">
                {analysis.summary.needingAttention} need attention
              </span>
            </>
          )}
          {analysis.summary.convictionCount > 0 && (
            <>
              <span className="opacity-40">·</span>
              <span className="text-green-600 dark:text-green-400">
                {analysis.summary.convictionCount} conviction
              </span>
            </>
          )}
          {focusMode && (
            <>
              <span className="opacity-40">·</span>
              <span className="text-sky-600 dark:text-sky-400 font-medium">
                Focus on {analysis.focusItems.length}
              </span>
            </>
          )}
        </div>

        {/* Focus / Attention section */}
        {!focusMode && analysis.attentionItems.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="font-semibold text-foreground">Needs attention</h2>
              <span className="text-xs text-muted">
                Ranked by score · budget of 4 in focus
              </span>
            </div>
            <div className="space-y-2">
              {analysis.attentionItems.map((item) => (
                <StockCard
                  key={item.symbol}
                  item={item}
                  highlight
                  onRemove={() => removeSymbol(item.symbol)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Full list or focus list */}
        <section>
          <h2 className="font-semibold text-foreground mb-3">
            {focusMode ? "Focus budget (top 4)" : "All symbols"}
          </h2>
          {displayItems.length === 0 ? (
            <div className="text-center py-12 text-muted bg-card rounded-xl border border-card">
              <p>No symbols yet. Add some to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayItems.map((item) => (
                <StockCard
                  key={item.symbol}
                  item={item}
                  highlight={focusMode || item.inFocusBudget}
                  onRemove={() => removeSymbol(item.symbol)}
                />
              ))}
            </div>
          )}
        </section>

        <p className="text-xs text-muted text-center pt-4 pb-8">
          Attention score = price move × volume anomaly × extremes × regime.
          Transparent by design. Working memory budget = 4.
        </p>
      </main>

      {/* How it thinks modal */}
      {showHow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-card rounded-2xl max-w-lg w-full max-h-[85vh] overflow-auto shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-card sticky top-0 bg-card">
              <h3 className="font-semibold text-foreground">How it thinks</h3>
              <button
                onClick={() => setShowHow(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm text-foreground/90 leading-relaxed">
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  1. Last look is the unit of change
                </h4>
                <p className="text-muted">
                  When you open a list we freeze every quote. The next visit is
                  compared to <em>your</em> memory — not yesterday’s close.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  2. Price–volume disagreement
                </h4>
                <p className="text-muted">
                  Loud volume + flat price = <strong>absorption</strong>. A move
                  on thin volume = <strong>unreliable tape</strong>. Price +
                  volume together = <strong>conviction</strong>. Most watchlists
                  never say this.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  3. Attention budget of 4
                </h4>
                <p className="text-muted">
                  Working memory is small. Extra “important” names exist, but
                  they stay in the background until they earn a slot. Toggle
                  Focus mode to see only the budget.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  4. The market is allowed to be closed
                </h4>
                <p className="text-muted">
                  After 15:30 IST we freeze the last session and label it. No
                  fake 11pm “live” prints.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-1">
                  5. The brief is deterministic
                </h4>
                <p className="text-muted">
                  Four sentences from the scoring function. No LLM on page load.
                  You can defend every word.
                </p>
              </div>
              <div className="pt-2 border-t border-card text-xs text-muted">
                Score = |Δ%|×1.5 + max(0, volRatio−1.3)×8 + extremes(6) +
                significant(4) + regime bonus. Threshold ≥ 8 → needs attention.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StockCard({
  item,
  highlight,
  onRemove,
}: {
  item: AttentionItem;
  highlight?: boolean;
  onRemove: () => void;
}) {
  const q = item.current;
  const isUp = q.changePercent >= 0;

  const regimeClass: Record<string, string> = {
    conviction: "regime-conviction",
    absorption: "regime-absorption",
    thin: "regime-thin",
    quiet: "regime-quiet",
  };

  return (
    <div
      className={cn(
        "bg-card border rounded-xl p-4 shadow-sm transition",
        highlight
          ? "border-amber-300/50 dark:border-amber-600/40 ring-1 ring-amber-200/40 dark:ring-amber-700/30"
          : "border-card"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground">{item.symbol}</span>
            <span className="text-xs text-muted truncate">{item.name}</span>
            {item.inFocusBudget && (
              <span className="text-[10px] font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                Focus
              </span>
            )}
            {q.isStale && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                <AlertTriangle className="w-2.5 h-2.5" />
                Stale
              </span>
            )}
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded border",
                regimeClass[item.regime]
              )}
            >
              {item.regime}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {formatINR(q.price)}
              </span>
              <span
                className={cn(
                  "text-sm font-medium tabular-nums flex items-center gap-0.5",
                  isUp ? "text-pos" : "text-neg"
                )}
              >
                {isUp ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {formatPercent(q.changePercent)}
              </span>
            </div>
            <Sparkline
              data={item.sparkline}
              positive={isUp}
              width={56}
              height={20}
              className="opacity-80"
            />
          </div>

          {item.reasons.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {item.reasons.map((r, i) => (
                <li
                  key={i}
                  className="text-xs text-amber-800 dark:text-amber-300/90 flex items-start gap-1.5"
                >
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted">
            <span>
              Vol {formatNumber(q.volume)} ({q.volumeRatio.toFixed(1)}×)
            </span>
            <span>
              52w {formatINR(q.low52w)} – {formatINR(q.high52w)}
            </span>
            <span>Score {item.attentionScore}</span>
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg shrink-0"
          title="Remove"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
