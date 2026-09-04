import Link from "next/link";
import {
  ArrowRight,
  Eye,
  Shield,
  Zap,
  BarChart3,
  Focus,
  Activity,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-app">
      <header className="border-b border-card bg-header backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white text-sm font-bold">
              L
            </div>
            Lookback
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-slate-900 dark:bg-sky-600 text-white px-3.5 py-1.5 rounded-lg hover:opacity-90 transition"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-16 pb-24">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-800 rounded-full px-3 py-1 mb-6">
            <Zap className="w-3.5 h-3.5" />
            Code by Groww · 2026
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-tight">
            What changed
            <br />
            <span className="text-sky-600 dark:text-sky-400">
              since you last looked.
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted leading-relaxed">
            Lookback is not a price list. It freezes the book when you leave,
            ranks what deserves attention when you return, and tells you whether
            the tape is conviction, absorption, or noise.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-sky-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-sky-700 transition shadow-sm"
            >
              Open your first book
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-card text-foreground font-medium px-6 py-3 rounded-xl border border-card hover:bg-muted transition"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Feature
            icon={<Eye className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
            title="Last look is the unit"
            body="We freeze every quote on open. Next visit is compared to your memory — not yesterday’s close."
          />
          <Feature
            icon={
              <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            }
            title="Price–volume regimes"
            body="Conviction, absorption, thin tape. Most watchlists never surface the disagreement."
          />
          <Feature
            icon={
              <Focus className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            }
            title="Attention budget of 4"
            body="Working memory is small. Only the top scorers earn the primary slots."
          />
          <Feature
            icon={
              <BarChart3 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            }
            title="Deterministic brief"
            body="Four sentences from the scoring function. No LLM on page load. Defendable."
          />
          <Feature
            icon={
              <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            }
            title="Market is allowed to close"
            body="After 15:30 IST we freeze the session. No fake 11pm live prints."
          />
          <Feature
            icon={<Zap className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
            title="Resilient by design"
            body="Every quote carries timestamp + source + freshness. Prefer last-good over blank."
          />
        </div>

        <div className="mt-16 rounded-2xl border border-card bg-card p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Built to be defended
          </h2>
          <p className="mt-2 text-muted leading-relaxed">
            This is a system with opinions. Scoring weights are transparent,
            edge cases are handled, and the product answers a real question:
            “What changed and needs my attention now?” That is the difference
            between a feature list and a point of view.
          </p>
        </div>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-card bg-card p-5 shadow-sm">
      <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted leading-relaxed">{body}</p>
    </div>
  );
}
