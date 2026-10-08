import type {
  MarketQuote,
  MarketFundamentals,
  HistoricalPriceData,
  SearchResultItem,
  InvestmentAnalysis,
  RiskCategory,
  SentimentType,
} from '../types/market';
import { generateLocalMarketAnalysis, BENCHMARK_ASSETS } from '../utils/marketEngine';

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
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback to benchmark asset
    const found = BENCHMARK_ASSETS.find(a => a.quote.symbol.toUpperCase() === symbol.toUpperCase());
    return found ? found.quote : null;
  },

  async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
    try {
      const res = await fetch(`/api/market/quote?symbols=${encodeURIComponent(symbols.join(','))}`);
      if (res.ok) {
        const json = await res.json();
        if (json.quotes?.length) return json.quotes;
      }
    } catch (e) {}

    // Fallback to benchmarks
    return BENCHMARK_ASSETS.map(a => a.quote).filter(q =>
      symbols.some(s => s.toUpperCase() === q.symbol.toUpperCase())
    );
  },

  async search(query: string): Promise<SearchResultItem[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.results?.length) return json.results;
      }
    } catch (e) {}

    const qLower = query.toLowerCase();
    return BENCHMARK_ASSETS
      .filter(a => a.quote.symbol.toLowerCase().includes(qLower) || a.quote.name.toLowerCase().includes(qLower))
      .map(a => ({
        symbol: a.quote.symbol,
        name: a.quote.name,
        type: a.quote.type === 'etf' ? 'ETF' : 'Equity',
        exchange: 'US',
      }));
  },

  async getHistory(symbol: string, range: string = '1mo'): Promise<HistoricalPriceData | null> {
    try {
      const res = await fetch(`/api/market/history?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    // Generate client-side realistic curve
    const found = BENCHMARK_ASSETS.find(a => a.quote.symbol.toUpperCase() === symbol.toUpperCase());
    const basePrice = found?.quote.price ?? 100;
    const pointsCount = range === '1d' ? 24 : range === '1w' ? 28 : range === '1mo' ? 22 : range === '6mo' ? 40 : 52;
    const points = [];
    const timeStep = 24 * 3600 * 1000;
    for (let i = 0; i < pointsCount; i++) {
      const t = Date.now() - (pointsCount - i) * timeStep;
      const noise = Math.sin(i * 0.4) * (basePrice * 0.05);
      points.push({
        date: new Date(t).toISOString(),
        timestamp: t,
        price: Math.round((basePrice * 0.92 + (i / pointsCount) * (basePrice * 0.08) + noise) * 100) / 100,
      });
    }
    return {
      symbol,
      range,
      interval: '1d',
      data: points,
      currentPrice: basePrice,
      previousClose: points[0].price,
      priceChange: Math.round((basePrice - points[0].price) * 100) / 100,
      priceChangePercent: Math.round(((basePrice - points[0].price) / points[0].price) * 10000) / 100,
      lastUpdated: new Date().toISOString(),
    };
  },

  async getFundamentals(symbol: string): Promise<MarketFundamentals | null> {
    try {
      const res = await fetch(`/api/market/fundamentals?symbol=${encodeURIComponent(symbol)}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const found = BENCHMARK_ASSETS.find(a => a.quote.symbol.toUpperCase() === symbol.toUpperCase());
    return found ? found.fundamentals : null;
  },

  async getAnalysis(riskProfile: RiskCategory, symbols?: string[]): Promise<AnalysisResponse> {
    const params = new URLSearchParams({ riskProfile });
    if (symbols && symbols.length > 0) {
      params.append('symbols', symbols.join(','));
    }
    const url = `/api/analyse?${params.toString()}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.opportunities && data.opportunities.length > 0) {
          return data;
        }
      }
    } catch (e) {}

    // Seamless client-side engine fallback so assets always appear immediately
    return generateLocalMarketAnalysis(riskProfile);
  },
};
