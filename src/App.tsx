import { useMemo, useState } from "react";
import useSWR from "swr";
import "./App.css";
import { fetchMarkets, type Market, getYesPrice } from "./lib/polymarket";
import { scoreMarket, type ScoredMarket } from "./lib/scoring";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const fetcher = async (_key: string, args: any) => fetchMarkets(args);

function num(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : 0;
}

export default function App() {
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [focusCategory, setFocusCategory] = useState<string>("");
  const [sort, setSort] = useState<"score" | "volume" | "liquidity" | "yes">("score");

  const { data, error, isLoading, mutate } = useSWR(
    ["markets", { limit: 200, offset: 0, active: true, category: category || undefined, search: search || undefined }],
    ([key, args]) => fetcher(key, args),
    { refreshInterval: 30_000 }
  );

  const markets: Market[] = data ?? [];

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const m of markets) {
      if (m.category) set.add(m.category);
    }
    return Array.from(set).sort();
  }, [markets]);

  const focusCategories = useMemo(() => {
    const set = new Set<string>();
    const focusCatsEnv = (import.meta as any).env?.VITE_FOCUS_CATEGORIES as string | undefined;
    const focusArr = (focusCatsEnv ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    // Filter `markets` to only include those that have at least one category that includes one of the focus terms.

    // Filter `markets` to only include those that have at least one category that includes one of the focus terms.
    const filteredMarkets = markets.filter((m) => {
      if (!m.category) return false;
      const marketCategory = m.category.toLowerCase();
      return focusArr.some((f) => marketCategory.includes(f));
    });
    for (const m of filteredMarkets) {
      if (m.category) set.add(m.category);
    }
    return Array.from(set).sort();
  }, [markets]);

  const scored: ScoredMarket[] = useMemo(() => markets.map(scoreMarket), [markets]);

  const sorted = useMemo(() => {
    const arr = [...scored];
    arr.sort((a, b) => {
      if (sort === "volume") return num(b.market.volume) - num(a.market.volume);
      if (sort === "liquidity") return num(b.market.liquidity) - num(a.market.liquidity);
      if (sort === "yes") return (getYesPrice(b.market) ?? -1) - (getYesPrice(a.market) ?? -1);
      return b.score - a.score;
    });
    return arr;
  }, [scored, sort]);

  const filteredAndSorted = useMemo(() => {
    if (!focusCategory) return sorted;
    return sorted.filter((s) => s.market.category?.toLowerCase().includes(focusCategory.toLowerCase()));
  }, [sorted, focusCategory]);

  const topByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of scored) {
      const c = s.market.category || "(uncategorized)";
      map.set(c, (map.get(c) ?? 0) + num(s.market.volume));
    }
    return Array.from(map.entries())
      .map(([name, volume]) => ({ name, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 12);
  }, [scored]);

  return (
    <div className="container">
      <header className="header">
        <div>
          <div className="title">Polymarket Live Dashboard</div>
          <div className="subtitle">Live markets, categories, and a simple “actionability” ranking (heuristic, not financial advice).</div>
        </div>
        <button className="btn" onClick={() => mutate()}>
          Refresh
        </button>
      </header>

      <section className="card">
        <div className="filters">
          <input
            className="input"
            placeholder="Search question…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="input" value={focusCategory} onChange={(e) => setFocusCategory(e.target.value)}>
            <option value="">All Focus Categories</option>
            {focusCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="score">Sort: Actionability</option>
            <option value="volume">Sort: Volume</option>
            <option value="liquidity">Sort: Liquidity</option>
            <option value="yes">Sort: YES price</option>
          </select>
        </div>
        {error ? <div className="error">Error: {String(error)}</div> : null}
        {isLoading ? <div className="muted">Loading…</div> : null}
      </section>

      <section className="grid">
        <div className="card">
          <div className="cardTitle">Focus: world, events, politics, climate, business, technology, macro</div>
          <div className="muted">These are prioritized in the “Actionability” view. (Still showing all markets.)</div>

          <div className="cardTitle" style={{ marginTop: 12 }}>Top categories by volume (current fetch)</div>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={topByCategory} margin={{ left: 8, right: 8, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="volume" fill="#6ea8fe" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="muted">Tip: filter a category, then sort by Actionability to find liquid, non-extreme prices.</div>
        </div>

        <div className="card">
          <div className="cardTitle">Markets</div>
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Cat</th>
                  <th className="num">YES</th>
                  <th className="num">Vol</th>
                  <th className="num">Liq</th>
                  <th className="num">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.slice(0, 50).map((s) => (
                  <tr key={s.market.id}>
                    <td className="q">
                      <a
                        href={s.market.slug ? `https://polymarket.com/market/${s.market.slug}` : `https://polymarket.com`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {s.market.question}
                      </a>
                      {s.reasons.length ? <div className="reasons">{s.reasons.slice(0, 2).join(" • ")}</div> : null}
                    </td>
                    <td>{s.market.category ?? ""}</td>
                    <td className="num">{s.yesPrice == null ? "–" : s.yesPrice.toFixed(3)}</td>
                    <td className="num">{Math.round(num(s.market.volume)).toLocaleString()}</td>
                    <td className="num">{Math.round(num(s.market.liquidity)).toLocaleString()}</td>
                    <td className="num"><span className="pill">{s.score}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="muted">Auto-refreshes every 30s. Showing top 50 of {filteredAndSorted.length}.</div>
        </div>
      </section>

      <footer className="footer">
        <div className="muted">
          Data: Polymarket (public). Dashboard: Vite + React, deployed on Vercel.
        </div>
      </footer>
    </div>
  );
}
