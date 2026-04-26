import type { Market } from "./polymarket";
import { getYesPrice } from "./polymarket";

export type ScoredMarket = {
  market: Market;
  yesPrice?: number;
  score: number;
  reasons: string[];
};

// Heuristic “actionability” score (not investment advice):
// prefers liquid, high-volume, active markets that are not near-certain.
const focusCats = (import.meta as any).env?.VITE_FOCUS_CATEGORIES as string | undefined;
const focus = new Set(
  (focusCats ?? "")
    .split(",")
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean)
);

export function scoreMarket(m: Market): ScoredMarket {
  const yes = getYesPrice(m);
  const vol = Number(m.volume ?? 0) || 0;
  const liq = Number(m.liquidity ?? 0) || 0;
  const active = Boolean(m.active ?? true);

  let score = 0;
  const reasons: string[] = [];

  // liquidity and volume are primary
  score += Math.log10(1 + vol) * 12;
  score += Math.log10(1 + liq) * 18;

  const cat = (m.category ?? "").toLowerCase();
  if (cat && focus.size > 0) {
    const hit = Array.from(focus).some((f) => cat.includes(f));
    if (hit) {
      score += 12;
      reasons.push("In focus category");
    }
  }

  if (active) {
    score += 10;
  } else {
    score -= 30;
    reasons.push("Not active");
  }

  if (yes != null) {
    // penalize near 0 or 1 (low informational leverage)
    const centered = 1 - Math.abs(yes - 0.5) * 2; // 1 at 0.5, 0 at edges
    score += centered * 20;
    if (yes > 0.9) reasons.push("Price near 1.0 (low upside)");
    if (yes < 0.1) reasons.push("Price near 0.0 (low upside)");
  } else {
    score -= 5;
    reasons.push("No YES price detected");
  }

  if ((m.resolved ?? false) === true) {
    score -= 100;
    reasons.push("Resolved");
  }

  if (vol > 100000) reasons.push("High volume");
  if (liq > 50000) reasons.push("High liquidity");

  return { market: m, yesPrice: yes, score: Math.round(score), reasons };
}
