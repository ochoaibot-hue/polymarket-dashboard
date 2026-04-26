# API findings — Polymarket (Gamma) + Kalshi

## Polymarket (Gamma)

### Sample fetch (live)
- URL: https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=5
- HTTP: **200**

### Sample fields observed (from first item in response)
Key top-level fields that appear useful for our normalized Market object:
- `id` (string)
- `question` (string)
- `slug` (string)
- `conditionId` (string)
- `description` (string)
- `outcomes` (JSON-encoded string array, e.g. `["Yes","No"]`)
- `outcomePrices` (JSON-encoded string array of prices)
- `volumeNum`, `liquidityNum` (numbers)
- `volume24hr`, `volume1wk`, `volume1mo`, `volume1yr` (numbers)
- `active` (bool), `closed` (bool), `archived` (bool), `restricted` (bool)
- `startDate`, `endDate`, `createdAt`, `updatedAt` (timestamps)
- `image`, `icon` (URLs)
- `events[]` (array) containing event metadata (title/slug, totals, etc.)

### Sample JSON excerpt (trimmed)
```json
{
  "id": "540816",
  "question": "Russia-Ukraine Ceasefire before GTA VI?",
  "conditionId": "0x...",
  "slug": "russia-ukraine-ceasefire-before-gta-vi-554",
  "endDate": "2026-07-31T12:00:00Z",
  "liquidity": "48447.2464",
  "outcomes": "[\"Yes\", \"No\"]",
  "outcomePrices": "[\"0.525\", \"0.475\"]",
  "volumeNum": 1606334.6264430378,
  "liquidityNum": 48447.2464,
  "volume24hr": 3924.3037350000004,
  "active": true,
  "closed": false,
  "restricted": true,
  "events": [
    {
      "id": "23784",
      "slug": "what-will-happen-before-gta-vi",
      "title": "What will happen before GTA VI?",
      "liquidity": 1564449.06899,
      "volume": 21388391.15795858
    }
  ]
}
```

### Pagination / rate limits
Not confirmed yet from headers/docs in this pass. (Next step: inspect response headers + look for `next_cursor`-style fields or documented params like `offset`/`cursor`.)

### Sports filtering signals (concrete)
From the payload shape, sports filtering can be done via:
- Title/question keyword patterns (team names, leagues like “NBA”, “NFL”, “MLB”, “NHL”, “UFC”, “Premier League”, “Champions League”, etc.)
- Event `slug` / `ticker` patterns (sports collections often include league/team naming)
- Polymarket often uses topical groupings in `events[]` — we can exclude entire event slugs/tickers that match sports lists.

## Kalshi

### Docs root
- URL: https://docs.kalshi.com
- Final URL: https://docs.kalshi.com/welcome.md
- HTTP: **200**

Docs index hint:
- https://docs.kalshi.com/llms.txt

### OpenAPI spec
- URL: https://docs.kalshi.com/openapi.yaml
- HTTP: **200**

From the OpenAPI header:
- server base: `https://api.elections.kalshi.com/trade-api/v2`

Observed endpoint families in the snippet:
- `GET /historical/cutoff`
- `GET /historical/markets/{ticker}/candlesticks`
- `GET /historical/fills` (auth)
- `GET /historical/orders` (auth)
- `GET /historical/trades`
- `GET /historical/markets`

Auth requirements (from spec snippet):
- Some endpoints require headers/security schemes:
  - `kalshiAccessKey`
  - `kalshiAccessSignature`
  - `kalshiAccessTimestamp`

### Rate limits
Kalshi docs include a dedicated page linked from the welcome page (`/getting_started/rate_limits`). Not fetched yet in this pass.

### Sports filtering
Kalshi markets typically have tickers / series that can be excluded by category/series/event naming. Next step: pull the market-data quickstart + list markets endpoint definitions from OpenAPI to see available category fields.
