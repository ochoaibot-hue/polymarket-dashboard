import { z } from "zod";

const API_BASE = "/api";

export const MarketSchema = z.object({
  id: z.string().or(z.number()).transform(String),
  question: z.string().default(""),
  slug: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  resolved: z.boolean().optional().nullable(),
  active: z.boolean().optional().nullable(),
  volume: z.number().optional().nullable(),
  liquidity: z.number().optional().nullable(),
  // polymarket often returns outcomes + outcomePrices as JSON strings
  outcomes: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  outcomePrices: z.union([z.string(), z.array(z.string())]).optional().nullable(),
});

export type Market = z.infer<typeof MarketSchema>;

export function parseJsonMaybe<T>(v: unknown): T | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return undefined;
    }
  }
  return v as T;
}

export async function fetchMarkets(params: {
  limit?: number;
  offset?: number;
  active?: boolean;
  closed?: boolean;
  category?: string;
  search?: string;
}): Promise<Market[]> {
  const sp = new URLSearchParams();
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.offset != null) sp.set("offset", String(params.offset));
  if (params.active != null) sp.set("active", String(params.active));
  if (params.closed != null) sp.set("closed", String(params.closed));
  if (params.category) sp.set("category", params.category);
  if (params.search) sp.set("search", params.search);

  const res = await fetch(`${API_BASE}/markets?${sp.toString()}`);
  if (!res.ok) throw new Error(`Polymarket error: ${res.status}`);
  const json = await res.json();

  const arr = Array.isArray(json) ? json : Array.isArray(json?.markets) ? json.markets : [];
  return arr
    .map((m: unknown) => {
      const parsed = MarketSchema.safeParse(m);
      return parsed.success ? parsed.data : null;
    })
    .filter((x: Market | null): x is Market => Boolean(x));
}

export function getYesPrice(m: Market): number | undefined {
  const prices = parseJsonMaybe<string[] | number[]>(m.outcomePrices);
  const outcomes = parseJsonMaybe<string[]>(m.outcomes);
  if (!prices || !outcomes) return undefined;
  const idx = outcomes.findIndex((o) => o.toLowerCase() === "yes");
  const raw = (prices as any)[idx];
  const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  return Number.isFinite(n) ? n : undefined;
}
