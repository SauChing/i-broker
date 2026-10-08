import { Router, Request, Response } from 'express';
import healthHandler from '../api/health.js';
import {
  getMarketQuote,
  getMarketQuotes,
  getMarketFundamentals,
  getMarketHistory,
  searchMarket,
} from './yahooProvider';
import { analyzeAsset } from './scoringEngine';
import type { RiskCategory, SentimentType } from '../src/types/market';

export const apiRouter = Router();

// Health check endpoints (/api/health and /api/health.js)
apiRouter.get('/health.js', healthHandler);
apiRouter.get('/health', healthHandler);

// Default monitored discovery universe
const DEFAULT_SYMBOLS = [
  'MSFT',
  'NVDA',
  'AAPL',
  'GOOGL',
  'AMZN',
  'VOO',
  'QQQ',
  'META',
  'TSLA',
  'SPY',
  'VTI',
];

/**
 * GET /api/market/quote?symbol=AAPL or ?symbols=AAPL,MSFT
 */
apiRouter.get('/market/quote', async (req: Request, res: Response) => {
  try {
    const symbolParam = req.query.symbol as string;
    const symbolsParam = req.query.symbols as string;

    if (symbolsParam) {
      const symbols = symbolsParam
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);
      const quotes = await getMarketQuotes(symbols);
      return res.json({ quotes, count: quotes.length, lastUpdated: new Date().toISOString() });
    }

    if (!symbolParam) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const quote = await getMarketQuote(symbolParam);
    if (!quote) {
      return res.status(404).json({
        error: 'Market data is temporarily unavailable.',
        symbol: symbolParam.toUpperCase(),
        isUnavailable: true,
      });
    }

    return res.json(quote);
  } catch (err: any) {
    return res.status(500).json({ error: 'Market data is temporarily unavailable.', message: err.message });
  }
});

/**
 * GET /api/market/search?q=Apple
 */
apiRouter.get('/market/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q.trim()) {
      return res.json({ results: [] });
    }

    const results = await searchMarket(q);
    return res.json({ query: q, results });
  } catch (err: any) {
    return res.status(500).json({ error: 'Search failed', results: [] });
  }
});

/**
 * GET /api/market/history?symbol=MSFT&range=1mo
 */
apiRouter.get('/market/history', async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string;
    const range = (req.query.range as string) || '1mo';

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const history = await getMarketHistory(symbol, range);
    return res.json(history);
  } catch (err: any) {
    return res.status(500).json({ error: 'Market data is temporarily unavailable.' });
  }
});

/**
 * GET /api/market/fundamentals?symbol=MSFT
 */
apiRouter.get('/market/fundamentals', async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string;
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const fundamentals = await getMarketFundamentals(symbol);
    if (!fundamentals) {
      return res.status(404).json({
        error: 'Market data is temporarily unavailable.',
        symbol: symbol.toUpperCase(),
        isUnavailable: true,
      });
    }

    return res.json(fundamentals);
  } catch (err: any) {
    return res.status(500).json({ error: 'Market data is temporarily unavailable.' });
  }
});

/**
 * GET /api/analyse?riskProfile=Growth&symbols=AAPL,MSFT,VOO
 */
apiRouter.get('/analyse', async (req: Request, res: Response) => {
  try {
    const rawProfile = (req.query.riskProfile as string) || 'Growth';
    const validProfiles: RiskCategory[] = ['Conservative', 'Moderate', 'Growth', 'Aggressive'];
    const riskProfile: RiskCategory = validProfiles.find(
      p => p.toLowerCase() === rawProfile.toLowerCase()
    ) || 'Growth';

    const symbolsParam = req.query.symbols as string;
    let symbols = symbolsParam
      ? symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      : DEFAULT_SYMBOLS;

    if (symbols.length === 0) symbols = DEFAULT_SYMBOLS;

    // Fetch quotes and fundamentals in parallel
    let quotes = await getMarketQuotes(symbols);
    if (!quotes || quotes.length === 0) {
      quotes = await getMarketQuotes(DEFAULT_SYMBOLS);
    }

    const analyses = (
      await Promise.all(
        quotes.map(async quote => {
          try {
            const fundamentals = await getMarketFundamentals(quote.symbol);
            return analyzeAsset(quote, fundamentals, riskProfile);
          } catch (e) {
            return analyzeAsset(quote, null, riskProfile);
          }
        })
      )
    ).filter(Boolean);

    // Sort opportunities by overall score descending
    analyses.sort((a, b) => b.overallScore - a.overallScore);

    // Compute live market sentiment from index proxies (VOO/SPY/QQQ)
    let marketSentiment: SentimentType = 'Positive';
    const indexQuotes = quotes.filter(q => ['VOO', 'SPY', 'QQQ'].includes(q.symbol));
    const avgChange = indexQuotes.length
      ? indexQuotes.reduce((acc, q) => acc + (q.changePercent || 0), 0) / indexQuotes.length
      : 0.5;

    if (avgChange > 0.2) marketSentiment = 'Positive';
    else if (avgChange < -0.4) marketSentiment = 'Cautious';
    else marketSentiment = 'Neutral';

    return res.json({
      riskProfile,
      marketSentiment,
      totalAnalyzed: analyses.length,
      opportunities: analyses,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Analyse error fallback:', err);
    // Even in case of unexpected error, return analyzed default benchmark set
    const fallbackQuotes = await getMarketQuotes(DEFAULT_SYMBOLS);
    const fallbackAnalyses = fallbackQuotes.map(q => analyzeAsset(q, null, 'Growth'));
    return res.json({
      riskProfile: 'Growth',
      marketSentiment: 'Positive',
      totalAnalyzed: fallbackAnalyses.length,
      opportunities: fallbackAnalyses,
      lastUpdated: new Date().toISOString(),
    });
  }
});
