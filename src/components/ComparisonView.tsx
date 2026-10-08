import React from 'react';
import { Plus, X, ArrowUpRight, Scale, Check } from 'lucide-react';
import type { InvestmentAnalysis, RiskCategory } from '../types/market';

interface ComparisonViewProps {
  selectedSymbols: string[];
  analyses: InvestmentAnalysis[];
  onRemoveSymbol: (symbol: string) => void;
  onAddSymbol: (symbol: string) => void;
  onSelectDetail: (symbol: string) => void;
  riskProfile: RiskCategory;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  selectedSymbols,
  analyses,
  onRemoveSymbol,
  onAddSymbol,
  onSelectDetail,
  riskProfile,
}) => {
  // Map selected symbols to their analysis objects
  const selectedAnalyses = selectedSymbols
    .map(sym => analyses.find(a => a.quote.symbol.toUpperCase() === sym.toUpperCase()))
    .filter((a): a is InvestmentAnalysis => a !== undefined);

  const availableOpportunities = analyses.filter(
    a => !selectedSymbols.includes(a.quote.symbol)
  );

  const presets = [
    { label: 'Big Tech Giants', symbols: ['MSFT', 'NVDA', 'GOOGL'] },
    { label: 'Core Index ETFs', symbols: ['VOO', 'QQQ', 'VTI'] },
    { label: 'Cloud & Commerce', symbols: ['MSFT', 'AMZN', 'AAPL'] },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950 flex items-center gap-2">
            <Scale className="w-5 h-5 text-neutral-900" />
            <span>Asset Comparison</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Compare up to 3 stocks or ETFs side-by-side weighted for your {riskProfile} profile.
          </p>
        </div>

        {/* Preset quick switches */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-neutral-600 mr-1 text-[11px]">Compare presets:</span>
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => {
                // Set preset
                p.symbols.forEach(s => {
                  if (!selectedSymbols.includes(s)) onAddSymbol(s);
                });
              }}
              className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 transition-colors cursor-pointer text-xs"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {selectedAnalyses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200">
          <Scale className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            No assets selected for comparison
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-5">
            Click the compare icon on any stock card or select from the opportunities below.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {analyses.slice(0, 3).map(a => (
              <button
                key={a.quote.symbol}
                onClick={() => onAddSymbol(a.quote.symbol)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                + Add {a.quote.symbol}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70">
                  <th className="py-4 px-5 text-neutral-600 font-semibold w-40 min-w-[140px]">
                    Metric
                  </th>
                  {selectedAnalyses.map(analysis => (
                    <th key={analysis.quote.symbol} className="py-4 px-5 min-w-[200px]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-bold text-neutral-950">
                            {analysis.quote.symbol}
                          </div>
                          <div className="text-neutral-500 text-[11px] font-normal truncate max-w-[150px]">
                            {analysis.quote.name}
                          </div>
                        </div>
                        <button
                          onClick={() => onRemoveSymbol(analysis.quote.symbol)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-200/50 transition-colors cursor-pointer"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </th>
                  ))}

                  {/* Empty slot placeholder if less than 3 */}
                  {selectedAnalyses.length < 3 && (
                    <th className="py-4 px-5 min-w-[180px] border-l border-neutral-100">
                      <div className="text-neutral-400 text-xs font-normal">
                        {3 - selectedAnalyses.length} slot available
                      </div>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {/* Row: Score */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30">
                    Investment Score
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black font-mono-numbers text-neutral-950">
                          {a.overallScore}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">/ 100</span>
                      </div>
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Row: Price */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30">
                    Current Price
                  </td>
                  {selectedAnalyses.map(a => {
                    const isPos = (a.quote.change ?? 0) >= 0;
                    return (
                      <td key={a.quote.symbol} className="py-3.5 px-5">
                        <div className="font-mono-numbers font-semibold text-neutral-950 text-sm">
                          {a.quote.price ? `$${a.quote.price.toFixed(2)}` : 'Data unavailable'}
                        </div>
                        {a.quote.changePercent !== null && (
                          <div
                            className={`text-[11px] font-mono ${
                              isPos ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isPos ? '+' : ''}
                            {a.quote.changePercent.toFixed(2)}%
                          </div>
                        )}
                      </td>
                    );
                  })}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Row: Risk Level */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30">
                    Risk Exposure
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5 font-medium text-neutral-900">
                      {a.labels.risk}
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Row: Growth Level */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30">
                    Growth Potential
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5 font-medium text-neutral-900">
                      {a.labels.growth}
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Row: Valuation */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30">
                    Valuation Level
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5 font-medium text-neutral-900">
                      {a.labels.valuation}
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Row: Quality */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30">
                    Quality Rating
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5 font-medium text-neutral-900">
                      {a.labels.quality}
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Row: P/E */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30">
                    P/E Ratio
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5 font-mono text-neutral-900">
                      {a.metrics.pe}
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Row: 1Y Return */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30">
                    1-Year Return
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5 font-mono font-medium text-neutral-900">
                      {a.metrics.oneYearReturn}
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Row: Beta */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30">
                    Beta (Volatility)
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5 font-mono text-neutral-900">
                      {a.metrics.beta}
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Row: Profit Margin */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30">
                    Profit Margin
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5 font-mono text-neutral-900">
                      {a.metrics.profitMargin}
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Row: Why fits profile */}
                <tr className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-neutral-700 bg-neutral-50/30 align-top">
                    Why It Fits You
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5 align-top">
                      <div className="space-y-1">
                        {a.whyFitsYou.slice(0, 2).map((item, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-neutral-700 text-[11px]">
                            <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && <td className="py-3.5 px-5" />}
                </tr>

                {/* Action row */}
                <tr className="bg-neutral-50/50">
                  <td className="py-3.5 px-5 font-semibold text-neutral-500">
                    Action
                  </td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5">
                      <button
                        onClick={() => onSelectDetail(a.quote.symbol)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <span>Full Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  ))}
                  {selectedAnalyses.length < 3 && (
                    <td className="py-3.5 px-5">
                      {availableOpportunities.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) onAddSymbol(e.target.value);
                            e.target.value = '';
                          }}
                          defaultValue=""
                          className="px-2.5 py-1.5 text-xs rounded-lg border border-neutral-300 bg-white text-neutral-700 cursor-pointer"
                        >
                          <option value="" disabled>+ Add to compare...</option>
                          {availableOpportunities.map(o => (
                            <option key={o.quote.symbol} value={o.quote.symbol}>
                              {o.quote.symbol} — {o.quote.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
