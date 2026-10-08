import React, { useState, useEffect } from 'react';
import {
  X,
  Bookmark,
  Scale,
  Check,
  AlertCircle,
  Shield,
  TrendingUp,
  BarChart3,
  Building2,
  Calendar,
} from 'lucide-react';
import { StockChart } from './StockChart';
import { api } from '../services/api';
import type {
  InvestmentAnalysis,
  HistoricalPriceData,
  MarketFundamentals,
  RiskCategory,
} from '../types/market';

interface StockDetailModalProps {
  symbol: string;
  riskProfile: RiskCategory;
  onClose: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
  isCompared: boolean;
  onToggleCompare: (symbol: string) => void;
  analysis?: InvestmentAnalysis;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  symbol,
  riskProfile,
  onClose,
  isWatchlisted,
  onToggleWatchlist,
  isCompared,
  onToggleCompare,
  analysis: initialAnalysis,
}) => {
  const [selectedRange, setSelectedRange] = useState<string>('1mo');
  const [historyData, setHistoryData] = useState<HistoricalPriceData | null>(null);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(initialAnalysis || null);
  const [fundamentals, setFundamentals] = useState<MarketFundamentals | null>(null);

  // Load history data whenever symbol or selectedRange changes
  useEffect(() => {
    let isCancelled = false;
    setIsChartLoading(true);

    api.getHistory(symbol, selectedRange).then((data) => {
      if (!isCancelled) {
        setHistoryData(data);
        setIsChartLoading(false);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [symbol, selectedRange]);

  // Load fundamentals & ensure analysis is complete
  useEffect(() => {
    let isCancelled = false;

    api.getFundamentals(symbol).then((fund) => {
      if (!isCancelled && fund) {
        setFundamentals(fund);
      }
    });

    if (!analysis) {
      api.getQuote(symbol).then(async (quote) => {
        if (!isCancelled && quote) {
          const fund = await api.getFundamentals(symbol);
          // If analysis missing, fetch analysis via api or scoring
          const res = await api.getAnalysis(riskProfile, [symbol]);
          if (!isCancelled && res.opportunities.length > 0) {
            setAnalysis(res.opportunities[0]);
          }
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [symbol, riskProfile, analysis]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const quote = analysis?.quote;
  const isPositive = quote ? (quote.change ?? 0) >= 0 : true;

  // Dynamic "What looks good" bullets
  const looksGoodBullets = analysis ? analysis.whyFitsYou : [
    'Strong brand equity and institutional balance sheet',
    'Consistent operational execution and leadership',
    'High market liquidity across major global sessions',
  ];

  // Dynamic "What to watch" bullets
  const whatToWatchBullets = [
    analysis?.potentialConcern || 'Market sensitivity to benchmark interest rate announcements.',
    quote?.type === 'etf'
      ? 'Underlying sector rebalancing and macroeconomic trends.'
      : 'Competitive pressures in enterprise software and consumer adoption cycles.',
    'Broad macroeconomic valuation multiple contractions during equity pullbacks.',
  ].slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl border border-neutral-200 shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Navigation Bar inside Modal */}
        <div className="p-5 sm:p-7 border-b border-neutral-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
                {quote?.name || symbol}
              </h2>
              <span className="font-mono text-sm px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-semibold">
                {symbol}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
              <span>{quote?.type === 'etf' ? 'Exchange Traded Fund' : quote?.sector || 'US Equity'}</span>
              <span aria-hidden="true">·</span>
              <span>{quote?.currency || 'USD'}</span>
              <span aria-hidden="true">·</span>
              <span>Latest data: {quote?.lastUpdated ? new Date(quote.lastUpdated).toLocaleTimeString() : 'Live'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleCompare(symbol)}
              title={isCompared ? 'Remove from compare' : 'Add to compare'}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer text-xs flex items-center gap-1.5 ${
                isCompared
                  ? 'bg-neutral-900 border-neutral-900 text-white'
                  : 'border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span className="hidden sm:inline">{isCompared ? 'Comparing' : 'Compare'}</span>
            </button>

            <button
              onClick={() => onToggleWatchlist(symbol)}
              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                isWatchlisted
                  ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
                  : 'border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-neutral-900' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="max-h-[75vh] overflow-y-auto p-5 sm:p-7 space-y-7">
          {/* Top Score & Factors Snapshot */}
          {analysis && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80">
              <div className="sm:border-r border-neutral-200/80 pr-2">
                <div className="text-[11px] text-neutral-500 font-medium">Investment Score</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black font-mono-numbers text-neutral-950">
                    {analysis.overallScore}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">/ 100</span>
                </div>
              </div>
              <div className="sm:border-r border-neutral-200/80 pr-2">
                <div className="text-[11px] text-neutral-500 font-medium">Risk</div>
                <div className="text-base font-bold text-neutral-900 mt-0.5">{analysis.labels.risk}</div>
              </div>
              <div className="sm:border-r border-neutral-200/80 pr-2">
                <div className="text-[11px] text-neutral-500 font-medium">Growth</div>
                <div className="text-base font-bold text-neutral-900 mt-0.5">{analysis.labels.growth}</div>
              </div>
              <div className="sm:border-r border-neutral-200/80 pr-2">
                <div className="text-[11px] text-neutral-500 font-medium">Valuation</div>
                <div className="text-base font-bold text-neutral-900 mt-0.5">{analysis.labels.valuation}</div>
              </div>
              <div>
                <div className="text-[11px] text-neutral-500 font-medium">Quality</div>
                <div className="text-base font-bold text-neutral-900 mt-0.5">{analysis.labels.quality}</div>
              </div>
            </div>
          )}

          {/* Interactive Chart */}
          <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-white shadow-xs">
            <StockChart
              historyData={historyData}
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
              isLoading={isChartLoading}
            />
          </div>

          {/* Key Fundamentals Table / Grid */}
          <div>
            <h3 className="text-sm font-bold text-neutral-900 tracking-tight mb-3">
              Key Market Data & Fundamentals
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="text-[11px] text-neutral-500">Market Cap</div>
                <div className="text-sm font-semibold font-mono-numbers text-neutral-900 mt-0.5">
                  {analysis?.metrics.marketCap || 'Data unavailable'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="text-[11px] text-neutral-500">P/E Ratio</div>
                <div className="text-sm font-semibold font-mono-numbers text-neutral-900 mt-0.5">
                  {analysis?.metrics.pe || 'Data unavailable'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="text-[11px] text-neutral-500">52-Week High</div>
                <div className="text-sm font-semibold font-mono-numbers text-neutral-900 mt-0.5">
                  {quote?.fiftyTwoWeekHigh ? `$${quote.fiftyTwoWeekHigh.toFixed(2)}` : 'Data unavailable'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="text-[11px] text-neutral-500">52-Week Low</div>
                <div className="text-sm font-semibold font-mono-numbers text-neutral-900 mt-0.5">
                  {quote?.fiftyTwoWeekLow ? `$${quote.fiftyTwoWeekLow.toFixed(2)}` : 'Data unavailable'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="text-[11px] text-neutral-500">Beta (Volatility)</div>
                <div className="text-sm font-semibold font-mono-numbers text-neutral-900 mt-0.5">
                  {analysis?.metrics.beta || '1.00'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="text-[11px] text-neutral-500">Dividend Yield</div>
                <div className="text-sm font-semibold font-mono-numbers text-neutral-900 mt-0.5">
                  {analysis?.metrics.dividendYield || '0.00%'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="text-[11px] text-neutral-500">Profit Margin</div>
                <div className="text-sm font-semibold font-mono-numbers text-neutral-900 mt-0.5">
                  {analysis?.metrics.profitMargin || 'Data unavailable'}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/60">
                <div className="text-[11px] text-neutral-500">1-Year Return</div>
                <div className="text-sm font-semibold font-mono-numbers text-neutral-900 mt-0.5">
                  {analysis?.metrics.oneYearReturn || 'Data unavailable'}
                </div>
              </div>
            </div>
          </div>

          {/* Three Analysis Sections as requested */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* What looks good */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <h4 className="text-sm font-bold text-neutral-950 mb-3 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>What looks good</span>
              </h4>
              <ul className="space-y-2 text-xs text-neutral-700">
                {looksGoodBullets.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What to watch */}
            <div className="p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80">
              <h4 className="text-sm font-bold text-neutral-950 mb-3 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>What to watch</span>
              </h4>
              <ul className="space-y-2 text-xs text-neutral-700">
                {whatToWatchBullets.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Why it may fit your profile */}
          <div className="p-5 rounded-2xl bg-neutral-900 text-white shadow-sm">
            <h4 className="text-sm font-bold tracking-tight mb-2 flex items-center gap-1.5 text-white">
              <Shield className="w-4 h-4 text-neutral-300" />
              <span>Why it may fit your {riskProfile} profile</span>
            </h4>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {analysis?.fitExplanation ||
                `Based on your ${riskProfile} risk profile, this asset offers balanced portfolio characteristics suited for your timeframe and volatility tolerance.`}
            </p>
          </div>

          {/* Summary / About */}
          {fundamentals?.summary && (
            <div className="text-xs text-neutral-500 leading-relaxed border-t border-neutral-100 pt-4">
              <span className="font-semibold text-neutral-700 block mb-1">About {quote?.name}:</span>
              {fundamentals.summary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
