import type {
  MarketQuote,
  MarketFundamentals,
  HistoricalPriceData,
  SearchResultItem,
  InvestmentAnalysis,
  RiskCategory,
  SentimentType,
} from '../types/market';

export interface AnalysisResponse {
  riskProfile: RiskCategory;
  marketSentiment: SentimentType;
  totalAnalyzed: number;
  opportunities: InvestmentAnalysis[];
  lastUpdated: string;
}

export const api = {
  async getQuote(symbol: string): Promise<MarketQuote | null> {
    try {
      const res = await fetch(`/api/market/quote?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('Error fetching quote:', e);
      return null;
    }
  },

  async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
    try {
      const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbols.join(','))}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.quotes || [];
    } catch (e) {
      console.error('Error fetching quotes:', e);
      return [];
    }
  },

  async search(query: string): Promise<SearchResultItem[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.results || [];
    } catch (e) {
      console.error('Error searching market:', e);
      return [];
    }
  },

  async getHistory(symbol: string, range: string = '1mo'): Promise<HistoricalPriceData | null> {
    try {
      const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('Error fetching history:', e);
      return null;
    }
  },

  async getFundamentals(symbol: string): Promise<MarketFundamentals | null> {
    try {
      const res = await fetch(`/api/market/fundamentals?symbol=${encodeURIComponent(symbol)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('Error fetching fundamentals:', e);
      return null;
    }
  },

  async getAnalysis(riskProfile: RiskCategory, symbols?: string[]): Promise<AnalysisResponse> {
    const params = new URLSearchParams({ riskProfile });
    if (symbols && symbols.length > 0) {
      params.append('symbols', symbols.join(','));
    }
    const res = await fetch(`/api/analyse?${params.toString()}`);
    if (!res.ok) {
      throw new Error('Analysis request failed');
    }
    return await res.json();
  },
};
