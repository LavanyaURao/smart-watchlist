/**
 * Market Data Service
 * -------------------
 * Design decisions:
 * - Primary source is a realistic mock of NSE stocks that evolves over time.
 * - Every price carries fetchedAt + source + isStale so the UI can be transparent.
 * - We always prefer last-known-good data over a blank screen (resilience).
 * - In a real system this would call Groww/NSE/Yahoo with proper rate limiting,
 *   circuit breakers and multi-source reconciliation.
 */

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume20d: number;
  high52w: number;
  low52w: number;
  sector: string;
  fetchedAt: Date;
  source: "mock" | "live" | "cache";
  isStale: boolean;
  // Derived for attention scoring
  volumeRatio: number; // volume / avgVolume20d
  isNearHigh: boolean;
  isNearLow: boolean;
}

// Realistic base data for popular Indian stocks (NSE)
const BASE_STOCKS: Omit<
  MarketQuote,
  | "price"
  | "change"
  | "changePercent"
  | "volume"
  | "fetchedAt"
  | "source"
  | "isStale"
  | "volumeRatio"
  | "isNearHigh"
  | "isNearLow"
>[] = [
  { symbol: "RELIANCE", name: "Reliance Industries", previousClose: 2850.4, avgVolume20d: 6_200_000, high52w: 3210.0, low52w: 2220.5, sector: "Energy" },
  { symbol: "TCS", name: "Tata Consultancy Services", previousClose: 4125.75, avgVolume20d: 2_100_000, high52w: 4590.0, low52w: 3310.2, sector: "IT" },
  { symbol: "INFY", name: "Infosys", previousClose: 1856.3, avgVolume20d: 5_800_000, high52w: 1995.0, low52w: 1350.8, sector: "IT" },
  { symbol: "HDFCBANK", name: "HDFC Bank", previousClose: 1689.55, avgVolume20d: 12_400_000, high52w: 1880.0, low52w: 1420.0, sector: "Banking" },
  { symbol: "ICICIBANK", name: "ICICI Bank", previousClose: 1245.2, avgVolume20d: 9_800_000, high52w: 1365.0, low52w: 980.5, sector: "Banking" },
  { symbol: "SBIN", name: "State Bank of India", previousClose: 812.4, avgVolume20d: 18_500_000, high52w: 912.0, low52w: 620.0, sector: "Banking" },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", previousClose: 1589.6, avgVolume20d: 4_200_000, high52w: 1775.0, low52w: 1120.0, sector: "Telecom" },
  { symbol: "ITC", name: "ITC Limited", previousClose: 468.25, avgVolume20d: 11_200_000, high52w: 528.0, low52w: 399.0, sector: "FMCG" },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank", previousClose: 1789.9, avgVolume20d: 3_100_000, high52w: 1920.0, low52w: 1540.0, sector: "Banking" },
  { symbol: "LT", name: "Larsen & Toubro", previousClose: 3620.5, avgVolume20d: 1_800_000, high52w: 3950.0, low52w: 2980.0, sector: "Infrastructure" },
  { symbol: "AXISBANK", name: "Axis Bank", previousClose: 1124.75, avgVolume20d: 7_600_000, high52w: 1280.0, low52w: 920.0, sector: "Banking" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", previousClose: 7125.0, avgVolume20d: 1_200_000, high52w: 8250.0, low52w: 5800.0, sector: "NBFC" },
  { symbol: "MARUTI", name: "Maruti Suzuki", previousClose: 12450.0, avgVolume20d: 450_000, high52w: 13800.0, low52w: 9900.0, sector: "Auto" },
  { symbol: "SUNPHARMA", name: "Sun Pharmaceutical", previousClose: 1789.3, avgVolume20d: 2_400_000, high52w: 1950.0, low52w: 1280.0, sector: "Pharma" },
  { symbol: "TITAN", name: "Titan Company", previousClose: 3456.8, avgVolume20d: 1_100_000, high52w: 3890.0, low52w: 2900.0, sector: "Consumer" },
  { symbol: "WIPRO", name: "Wipro", previousClose: 498.6, avgVolume20d: 8_900_000, high52w: 580.0, low52w: 380.0, sector: "IT" },
  { symbol: "HCLTECH", name: "HCL Technologies", previousClose: 1789.4, avgVolume20d: 3_500_000, high52w: 1990.0, low52w: 1240.0, sector: "IT" },
  { symbol: "ASIANPAINT", name: "Asian Paints", previousClose: 2456.2, avgVolume20d: 1_400_000, high52w: 2890.0, low52w: 2100.0, sector: "Consumer" },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement", previousClose: 11250.0, avgVolume20d: 380_000, high52w: 12500.0, low52w: 8900.0, sector: "Cement" },
  { symbol: "NESTLEIND", name: "Nestle India", previousClose: 2450.0, avgVolume20d: 220_000, high52w: 2780.0, low52w: 2100.0, sector: "FMCG" },
];

/**
 * Deterministic pseudo-random movement based on symbol + time bucket.
 * This lets the "market" feel alive across page refreshes without external APIs,
 * while remaining reproducible for demos.
 */
function getMovementFactor(symbol: string, now: Date): number {
  const bucket = Math.floor(now.getTime() / (1000 * 60 * 5)); // 5-min buckets
  let hash = 0;
  const str = symbol + bucket.toString();
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  // -2.5% to +2.5% roughly
  return ((hash % 500) - 250) / 10000;
}

function getVolumeFactor(symbol: string, now: Date): number {
  const bucket = Math.floor(now.getTime() / (1000 * 60 * 15));
  let hash = 0;
  const str = "vol-" + symbol + bucket;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  // 0.4x to 2.8x average volume
  return 0.4 + (Math.abs(hash) % 240) / 100;
}

export function getQuote(symbol: string, now: Date = new Date()): MarketQuote | null {
  const base = BASE_STOCKS.find((s) => s.symbol === symbol.toUpperCase());
  if (!base) return null;

  const move = getMovementFactor(symbol, now);
  const price = +(base.previousClose * (1 + move)).toFixed(2);
  const change = +(price - base.previousClose).toFixed(2);
  const changePercent = +((change / base.previousClose) * 100).toFixed(2);
  const volume = Math.round(base.avgVolume20d * getVolumeFactor(symbol, now));
  const volumeRatio = volume / base.avgVolume20d;

  // Age simulation: occasionally mark as slightly stale to demonstrate resilience UI
  const ageSeconds = (now.getTime() % 120000) / 1000; // 0-120s cycle
  const isStale = ageSeconds > 90;

  return {
    ...base,
    price,
    change,
    changePercent,
    volume,
    volumeRatio,
    isNearHigh: price >= base.high52w * 0.98,
    isNearLow: price <= base.low52w * 1.02,
    fetchedAt: now,
    source: "mock",
    isStale,
  };
}

export function getQuotes(symbols: string[], now: Date = new Date()): MarketQuote[] {
  return symbols
    .map((s) => getQuote(s, now))
    .filter((q): q is MarketQuote => q !== null);
}

export function searchSymbols(query: string): { symbol: string; name: string; sector: string }[] {
  const q = query.trim().toUpperCase();
  if (!q) return BASE_STOCKS.map(({ symbol, name, sector }) => ({ symbol, name, sector }));
  return BASE_STOCKS.filter(
    (s) =>
      s.symbol.includes(q) ||
      s.name.toUpperCase().includes(q) ||
      s.sector.toUpperCase().includes(q)
  ).map(({ symbol, name, sector }) => ({ symbol, name, sector }));
}

export function getAllSymbols() {
  return BASE_STOCKS.map(({ symbol, name, sector }) => ({ symbol, name, sector }));
}
