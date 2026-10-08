import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Activity,
  Clock,
  SlidersHorizontal,
  RefreshCw,
  Search,
} from 'lucide-react';
import type { RiskCategory, SentimentType } from '../types/market';

interface MarketOverviewProps {
  riskProfile: RiskCategory;
  sentiment: SentimentType;
  lastUpdated: string | null;
  totalAssets: number;
  onEditProfile: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  filterType: 'all' | 'stock' | 'etf';
  onFilterChange: (type: 'all' | 'stock' | 'etf') => void;
  sortBy: 'score' | 'risk' | 'growth';
  onSortChange: (sort: 'score' | 'risk' | 'growth') => void;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  riskProfile,
  sentiment,
  lastUpdated,
  totalAssets,
  onEditProfile,
  onRefresh,
  isRefreshing,
  filterType,
  onFilterChange,
  sortBy,
  onSortChange,
}) => {
  const sentimentColor = {
    Positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    Neutral: 'text-neutral-700 bg-neutral-100 border-neutral-200',
    Cautious: 'text-amber-800 bg-amber-50 border-amber-200',
  }[sentiment];

  const timeString = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : 'Live';

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Headline & Description */}
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2 font-medium">
              <span>Your Investment Dashboard</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-neutral-400" />
                Updated {timeString}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-950">
              Matched for <span className="underline decoration-neutral-300 decoration-2 underline-offset-4">{riskProfile} Investor</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mt-2 leading-relaxed">
              We analysed current market data across {totalAssets} high-liquidity stocks and ETFs weighted specifically for your risk tolerance and growth goals.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Risk Profile Card */}
            <button
              onClick={onEditProfile}
              className="flex-1 sm:flex-none p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200 transition-all text-left cursor-pointer group"
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1 flex items-center justify-between gap-3">
                <span>Risk Profile</span>
                <SlidersHorizontal className="w-3 h-3 text-neutral-400 group-hover:text-neutral-700" />
              </div>
              <div className="text-base font-bold text-neutral-950">
                {riskProfile}
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Click to adjust
              </div>
            </button>

            {/* Sentiment Card */}
            <div className="flex-1 sm:flex-none p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-neutral-50 border border-neutral-200">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400 mb-1">
                Market Sentiment
              </div>
              <div className="flex items-center gap-1.5 text-base font-bold text-neutral-950">
                <span className="w-2 h-2 rounded-full bg-neutral-900" />
                <span>{sentiment}</span>
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                S&P 500 / VOO proxy
              </div>
            </div>

            {/* Refresh Live Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh live prices"
              className="p-3.5 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-950 transition-colors cursor-pointer self-stretch flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-neutral-900' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h2 className="text-lg font-bold text-neutral-950 tracking-tight">
            Top Opportunities
          </h2>
          <p className="text-xs text-neutral-500">
            Ranked by multi-factor score (Risk, Growth, Valuation, Quality, Momentum)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Asset Type Filter Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              All Assets
            </button>
            <button
              onClick={() => onFilterChange('stock')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterType === 'stock'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Equities
            </button>
            <button
              onClick={() => onFilterChange('etf')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filterType === 'etf'
                  ? 'bg-white text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              ETFs
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white text-neutral-700 font-medium cursor-pointer shadow-xs"
          >
            <option value="score">Sort: Highest Match Score</option>
            <option value="risk">Sort: Lowest Risk Exposure</option>
            <option value="growth">Sort: Highest Growth Momentum</option>
          </select>
        </div>
      </div>
    </div>
  );
};
