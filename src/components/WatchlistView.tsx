import React from 'react';
import { Bookmark, ArrowUpRight, Trash2, Scale, Plus } from 'lucide-react';
import type { InvestmentAnalysis, RiskCategory } from '../types/market';

interface WatchlistViewProps {
  watchlistSymbols: string[];
  analyses: InvestmentAnalysis[];
  onRemoveWatchlist: (symbol: string) => void;
  onSelectDetail: (symbol: string) => void;
  onToggleCompare: (symbol: string) => void;
  comparedSymbols: string[];
  onOpenSearch: () => void;
  riskProfile: RiskCategory;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlistSymbols,
  analyses,
  onRemoveWatchlist,
  onSelectDetail,
  onToggleCompare,
  comparedSymbols,
  onOpenSearch,
  riskProfile,
}) => {
  const watchlistedAnalyses = watchlistSymbols
    .map(sym => analyses.find(a => a.quote.symbol.toUpperCase() === sym.toUpperCase()))
    .filter((a): a is InvestmentAnalysis => a !== undefined);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-neutral-900 fill-neutral-900" />
            <span>My Watchlist</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Tracking {watchlistSymbols.length} {watchlistSymbols.length === 1 ? 'investment' : 'investments'} tailored to your {riskProfile} profile.
          </p>
        </div>

        <button
          onClick={onOpenSearch}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Stock or ETF</span>
        </button>
      </div>

      {watchlistedAnalyses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200">
          <Bookmark className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            Your watchlist is empty
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-6">
            Keep track of stocks and ETFs that match your risk appetite by clicking the bookmark icon on any card.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {analyses.slice(0, 4).map(a => (
              <button
                key={a.quote.symbol}
                onClick={() => onSelectDetail(a.quote.symbol)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 transition-colors cursor-pointer"
              >
                Explore {a.quote.symbol}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-500">
                  <th className="py-3.5 px-5 font-semibold">Asset</th>
                  <th className="py-3.5 px-5 font-semibold">Price</th>
                  <th className="py-3.5 px-5 font-semibold">Daily Change</th>
                  <th className="py-3.5 px-5 font-semibold">Investment Score</th>
                  <th className="py-3.5 px-5 font-semibold">Risk Level</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {watchlistedAnalyses.map(({ quote, overallScore, labels }) => {
                  const isPos = (quote.change ?? 0) >= 0;
                  const isComp = comparedSymbols.includes(quote.symbol);

                  return (
                    <tr
                      key={quote.symbol}
                      className="hover:bg-neutral-50/60 transition-colors cursor-pointer"
                      onClick={() => onSelectDetail(quote.symbol)}
                    >
                      {/* Asset */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center font-mono font-bold text-neutral-800 text-xs">
                            {quote.symbol.slice(0, 3)}
                          </div>
                          <div>
                            <div className="font-bold text-neutral-950 text-sm">
                              {quote.symbol}
                            </div>
                            <div className="text-neutral-500 text-[11px] truncate max-w-[180px]">
                              {quote.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-4 px-5">
                        <span className="font-mono-numbers font-semibold text-neutral-900 text-sm">
                          {quote.price ? `$${quote.price.toFixed(2)}` : 'Unavailable'}
                        </span>
                      </td>

                      {/* Daily Change */}
                      <td className="py-4 px-5">
                        {quote.changePercent !== null ? (
                          <span
                            className={`font-mono text-xs font-medium ${
                              isPos ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isPos ? '+' : ''}
                            {quote.changePercent.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Investment Score */}
                      <td className="py-4 px-5">
                        <div className="flex items-baseline gap-1">
                          <span className="font-mono-numbers font-extrabold text-neutral-950 text-base">
                            {overallScore}
                          </span>
                          <span className="text-neutral-400 font-mono text-[10px]">/ 100</span>
                        </div>
                      </td>

                      {/* Risk Level */}
                      <td className="py-4 px-5">
                        <span className="font-medium text-neutral-800">
                          {labels.risk}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onToggleCompare(quote.symbol)}
                            title={isComp ? 'Remove comparison' : 'Compare'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isComp
                                ? 'bg-neutral-900 border-neutral-900 text-white'
                                : 'border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                            }`}
                          >
                            <Scale className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onRemoveWatchlist(quote.symbol)}
                            title="Remove from watchlist"
                            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onSelectDetail(quote.symbol)}
                            title="View details"
                            className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors cursor-pointer"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
