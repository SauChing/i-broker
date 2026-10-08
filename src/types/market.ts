export type RiskCategory = 'Conservative' | 'Moderate' | 'Growth' | 'Aggressive';

export type SentimentType = 'Positive' | 'Neutral' | 'Cautious';

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  dividendYield: number | null;
  beta: number | null;
  volume: number | null;
  avgVolume: number | null;
  sector?: string | null;
  industry?: string | null;
  currency: string;
  type: 'stock' | 'etf' | 'index';
  lastUpdated: string;
  isUnavailable?: boolean;
}

export interface MarketFundamentals {
  symbol: string;
  name: string;
  revenueGrowth: number | null; // e.g. 0.15 = 15%
  profitMargin: number | null;  // e.g. 0.25 = 25%
  returnOnEquity: number | null;// e.g. 0.35 = 35%
  debtToEquity: number | null;
  freeCashFlow: number | null;
  priceToBook: number | null;
  forwardPE: number | null;
  trailingPE: number | null;
  trailingEps: number | null;
  beta: number | null;
  fiftyTwoWeekChange: number | null;
  summary: string | null;
  lastUpdated: string;
}

export interface HistoricalDataPoint {
  date: string;
  timestamp: number;
  price: number;
  volume?: number;
}

export interface HistoricalPriceData {
  symbol: string;
  range: string;
  interval: string;
  data: HistoricalDataPoint[];
  currentPrice: number | null;
  previousClose: number | null;
  priceChange: number | null;
  priceChangePercent: number | null;
  lastUpdated: string;
}

export interface SearchResultItem {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

export interface InvestmentFactorScores {
  riskScore: number;     // 0-100 (100 = safest/lowest risk)
  growthScore: number;   // 0-100
  valuationScore: number;// 0-100 (100 = most attractively valued)
  qualityScore: number;  // 0-100
  momentumScore: number; // 0-100
}

export type RiskLevelLabel = 'Low' | 'Medium' | 'High' | 'Very High';
export type GrowthLevelLabel = 'Low' | 'Moderate' | 'High' | 'Very High';
export type ValuationLevelLabel = 'Undervalued' | 'Fair' | 'High' | 'Stretched';
export type QualityLevelLabel = 'Moderate' | 'Good' | 'Strong' | 'Excellent';

export interface InvestmentAnalysis {
  quote: MarketQuote;
  overallScore: number; // 0-100
  riskProfileMatch: RiskCategory;
  factors: InvestmentFactorScores;
  labels: {
    risk: RiskLevelLabel;
    growth: GrowthLevelLabel;
    valuation: ValuationLevelLabel;
    quality: QualityLevelLabel;
  };
  oneSentenceSummary: string;
  whyFitsYou: string[];
  potentialConcern: string;
  fitExplanation: string;
  metrics: {
    pe: string;
    oneYearReturn: string;
    profitMargin: string;
    beta: string;
    marketCap: string;
    dividendYield: string;
  };
}

export interface RiskAnswers {
  timeframe: string;       // '<1yr' | '1-3yr' | '3-5yr' | '5+yr'
  dropReaction: string;    // 'sell' | 'uncomfortable' | 'hold' | 'buy_more'
  objective: string;       // 'preserve' | 'balanced' | 'long_term' | 'aggressive'
  volatility: string;      // 'low' | 'medium' | 'high'
  preference: string;      // 'stable' | 'balanced' | 'growth' | 'high_growth'
}

export interface RiskProfileResult {
  score: number; // 1-100
  category: RiskCategory;
  title: string;
  description: string;
  weights: {
    risk: number;
    quality: number;
    valuation: number;
    growth: number;
    momentum: number;
  };
}
