"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  LogOut,
  TrendingUp,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";

interface WatchlistSummary {
  id: string;
  name: string;
  itemCount: number;
  lastViewedAt: string | null;
  needingAttention: number;
  biggestMover: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [watchlists, setWatchlists] = useState<WatchlistSummary[]>([]);
  const [user, setUser] = useState<{ name: string | null; email: string } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        router.push("/login");
        return;
      }
      const meData = await me.json();
      setUser(meData.user);

      const res = await fetch("/api/watchlists");
      if (res.ok) {
        const data = await res.json();
        setWatchlists(data.watchlists);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/me", { method: "DELETE" });
    router.push("/");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setWatchlists((prev) => [
          {
            id: data.watchlist.id,
            name: data.watchlist.name,
            itemCount: 0,
            lastViewedAt: null,
            needingAttention: 0,
            biggestMover: null,
          },
          ...prev,
        ]);
        setNewName("");
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted bg-app">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-card bg-header backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white text-sm font-bold">
              L
            </div>
            Lookback
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted hidden sm:inline">
              {user?.name || user?.email}
            </span>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="text-muted hover:text-foreground p-1.5 rounded-lg hover:bg-muted"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your books</h1>
            <p className="text-sm text-muted mt-0.5">
              What changed since you last looked
            </p>
          </div>
        </div>

        <form
          onSubmit={handleCreate}
          className="mb-8 flex gap-2 bg-card border border-card rounded-xl p-3 shadow-sm"
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New watchlist name…"
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-card bg-app text-foreground focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="inline-flex items-center gap-1.5 bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-sky-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </form>

        {watchlists.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p>No watchlists yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {watchlists.map((wl) => (
              <Link
                key={wl.id}
                href={`/watchlist/${wl.id}`}
                className="block bg-card border border-card rounded-xl p-4 shadow-sm hover:border-sky-400/50 hover:shadow transition group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400">
                      {wl.name}
                    </h2>
                    <p className="text-xs text-muted mt-0.5">
                      {wl.itemCount} symbol{wl.itemCount !== 1 ? "s" : ""} · Last
                      viewed {timeAgo(wl.lastViewedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {wl.needingAttention > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2.5 py-0.5">
                        <AlertCircle className="w-3 h-3" />
                        {wl.needingAttention} need attention
                      </span>
                    )}
                    {wl.biggestMover && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <TrendingUp className="w-3 h-3" />
                        {wl.biggestMover}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-sky-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
