import React, { useState } from 'react';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Scale,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import type { InvestmentAnalysis } from '../types/market';

interface StockCardProps {
  analysis: InvestmentAnalysis;
  rank?: number;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
  isCompared: boolean;
  onToggleCompare: (symbol: string) => void;
  onSelect: (symbol: string) => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  analysis,
  rank,
  isWatchlisted,
  onToggleWatchlist,
  isCompared,
  onToggleCompare,
  onSelect,
}) => {
  const [isWhyExpanded, setIsWhyExpanded] = useState<boolean>(false);
  const { quote, overallScore, labels, oneSentenceSummary, whyFitsYou, potentialConcern } = analysis;

  const isPositive = (quote.change ?? 0) >= 0;

  // Simple label colors - refined and quiet
  const riskColor = {
    Low: 'text-neutral-700 bg-neutral-100',
    Medium: 'text-neutral-700 bg-neutral-100',
    High: 'text-amber-800 bg-amber-50',
    'Very High': 'text-rose-800 bg-rose-50',
  }[labels.risk];

  const growthColor = {
    Low: 'text-neutral-600 bg-neutral-100',
    Moderate: 'text-neutral-700 bg-neutral-100',
    High: 'text-neutral-900 bg-neutral-100 font-medium',
    'Very High': 'text-neutral-950 bg-neutral-200 font-semibold',
  }[labels.growth];

  const qualityColor = {
    Moderate: 'text-neutral-600 bg-neutral-100',
    Good: 'text-neutral-700 bg-neutral-100',
    Strong: 'text-neutral-900 bg-neutral-100 font-medium',
    Excellent: 'text-neutral-950 bg-neutral-200 font-semibold',
  }[labels.quality];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300 transition-all shadow-xs hover:shadow-sm overflow-hidden flex flex-col justify-between">
      <div className="p-5 sm:p-6">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            {rank !== undefined && (
              <span className="text-xs font-mono font-bold text-neutral-400 mt-1">
                #{rank}
              </span>
            )}
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelect(quote.symbol)}
                  className="text-lg font-bold text-neutral-950 hover:text-neutral-700 transition-colors text-left cursor-pointer"
                >
                  {quote.name}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                <span className="font-mono font-semibold text-neutral-700">{quote.symbol}</span>
                <span aria-hidden="true">·</span>
                <span>{quote.type === 'etf' ? 'ETF' : quote.sector || 'US Equity'}</span>
              </div>
            </div>
          </div>

          {/* Action buttons (Bookmark & Compare) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleCompare(quote.symbol)}
              title={isCompared ? 'Remove from comparison' : 'Add to compare'}
              className={`p-2 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                isCompared
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Scale className="w-4 h-4" />
            </button>

            <button
              onClick={() => onToggleWatchlist(quote.symbol)}
              title={isWatchlisted ? 'Remove from Watchlist' : 'Save to Watchlist'}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isWatchlisted
                  ? 'text-neutral-900 bg-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isWatchlisted ? 'fill-neutral-900' : ''}`} />
            </button>
          </div>
        </div>

        {/* Price and Investment Score Row */}
        <div className="grid grid-cols-2 gap-4 py-3.5 px-4 bg-neutral-50/80 rounded-xl border border-neutral-100 mb-4">
          {/* Price */}
          <div>
            <div className="text-[11px] text-neutral-500 mb-0.5">Current price</div>
            <div className="text-xl sm:text-2xl font-bold font-mono-numbers text-neutral-950">
              {quote.price !== null ? `$${quote.price.toFixed(2)}` : 'Market data unavailable'}
            </div>
            {quote.changePercent !== null && (
              <div
                className={`text-xs font-mono font-medium mt-0.5 ${
                  isPositive ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {isPositive ? '+' : ''}
                {quote.change !== null ? `$${quote.change.toFixed(2)}` : ''} ({isPositive ? '+' : ''}
                {quote.changePercent.toFixed(2)}%)
              </div>
            )}
          </div>

          {/* Investment Score */}
          <div className="border-l border-neutral-200/80 pl-4">
            <div className="text-[11px] text-neutral-500 mb-0.5">Investment score</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono-numbers text-neutral-950">
                {overallScore}
              </span>
              <span className="text-xs font-mono text-neutral-400">/ 100</span>
            </div>
            <div className="text-[11px] text-neutral-500 mt-0.5">
              Profile fit: <strong className="text-neutral-800">{analysis.riskProfileMatch}</strong>
            </div>
          </div>
        </div>

        {/* 4 Factor Badges (Risk, Growth, Valuation, Quality) */}
        <div className="grid grid-cols-4 gap-2 mb-4 text-center">
          <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
            <div className="text-[10px] text-neutral-600 mb-0.5">Risk</div>
            <div className="text-xs font-semibold text-neutral-900">{labels.risk}</div>
          </div>
          <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
            <div className="text-[10px] text-neutral-600 mb-0.5">Growth</div>
            <div className="text-xs font-semibold text-neutral-900">{labels.growth}</div>
          </div>
          <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
            <div className="text-[10px] text-neutral-600 mb-0.5">Valuation</div>
            <div className="text-xs font-semibold text-neutral-900">{labels.valuation}</div>
          </div>
          <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100">
            <div className="text-[10px] text-neutral-600 mb-0.5">Quality</div>
            <div className="text-xs font-semibold text-neutral-900">{labels.quality}</div>
          </div>
        </div>

        {/* One-Sentence Explanation */}
        <p className="text-xs text-neutral-600 leading-relaxed mb-4">
          "{oneSentenceSummary}"
        </p>

        {/* Dynamic "Why this fits you" section */}
        <div className="border-t border-neutral-100 pt-3">
          <button
            onClick={() => setIsWhyExpanded(!isWhyExpanded)}
            className="w-full flex items-center justify-between text-xs font-semibold text-neutral-900 hover:text-neutral-700 py-1 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-neutral-700" />
              <span>Why {quote.symbol}?</span>
            </span>
            {isWhyExpanded ? (
              <ChevronUp className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          {isWhyExpanded && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="space-y-1.5">
                {whyFitsYou.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {potentialConcern && (
                <div className="mt-3 p-2.5 rounded-lg bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Potential concern</span>
                  </div>
                  <p className="text-neutral-600 text-xs">
                    {potentialConcern}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer CTA */}
      <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-[11px] text-neutral-600 font-mono">
          P/E: {analysis.metrics.pe} · 1Y: {analysis.metrics.oneYearReturn}
        </span>
        <button
          onClick={() => onSelect(quote.symbol)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
        >
          <span>Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
