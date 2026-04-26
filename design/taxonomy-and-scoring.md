# Taxonomy and Scoring Model Design for Polymarket Dashboard

## Sphere Taxonomy Mapping

### Spheres
- **DeFi:** Decentralized finance protocols.
- **NFTs:** Non-Fungible Tokens and their marketplaces.
- **Gaming:** GameFi, virtual assets, NFT gaming platforms.
- **Social:** Social token ecosystems and communities.
- **Governance:** Token-based governance systems in decentralized networks.

### Mapping Rules
- Each asset should be classified into a single sphere based on its primary function or utility.
- Assets with mixed functionalities may have a secondary classification.

## Confidence Scoring

### Liquidity
- **Score Range:** 0-100
- **Metrics:** Trading volume, depth of order book, number of active traders.
- **Calculation Formula:**
  - Score = (Volume / Total Volume) * 100 + (Depth / Total Depth)

### Volume
- **Score Range:** 0-100
- **Metrics:** Daily trading volume, historical trends.
- **Calculation Formula:**
  - Score = (Volume / Average Volume Over N Days) * 100

### Spread
- **Score Range:** 0-100
- **Metrics:** Bid-ask spread, liquidity provider fees.
- **Calculation Formula:**
  - Score = (Average Spread Over N Days / Maximum Spread Recorded)

### Recency
- **Score Range:** 0-100
- **Metrics:** Last trade date, time since last price update.
- **Calculation Formula:**
  - Score = 100 - (Days Since Last Trade / Days Since First Trade in Sphere) * 100

## Decision-Signal Generation

### Confidence Thresholds
- Set thresholds for each score to determine when an asset is considered 'High', 'Medium', or 'Low' confidence.
- Example Thresholds:
  - **Liquidity:** High (80-100), Medium (50-79), Low (0-49)
  - **Volume:** High (80-100), Medium (50-79), Low (0-49)
  - **Spread:** High (20-100), Medium (10-19), Low (0-9)
  - **Recency:** High (100), Medium (60-99), Low (0-59)

### Decision Rules
- Generate a combined score for each asset by aggregating the individual scores.
- Determine if an asset meets the thresholds to be included in the dashboard.
- Provide a recommendation on whether to display or exclude assets based on their confidence levels.