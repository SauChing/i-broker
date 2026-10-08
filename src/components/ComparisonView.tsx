import React, { useState, useMemo } from 'react';
import {
  Scale,
  Award,
  TrendingUp,
  Shield,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Search,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Info,
} from 'lucide-react';
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
  const [searchSlot, setSearchSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [chartRange, setChartRange] = useState<'1mo' | '6mo' | '1y'>('1y');

  // Curated comparison presets
  const presets = [
    { label: 'AI & Big Tech', symbols: ['NVDA', 'MSFT', 'GOOGL'] },
    { label: 'Index ETFs', symbols: ['VOO', 'QQQ', 'SPY'] },
    { label: 'Global Payments', symbols: ['V', 'MA', 'AXP'] },
    { label: 'Retail & E-Com', symbols: ['AMZN', 'WMT', 'COST'] },
    { label: 'Growth & Tech', symbols: ['PLTR', 'ARM', 'AMD'] },
    { label: 'Healthcare', symbols: ['LLY', 'JNJ', 'UNH'] },
  ];

  // Map selected symbols to analysis objects
  const selectedAnalyses = useMemo(() => {
    return selectedSymbols
      .map(sym => analyses.find(a => a.quote.symbol.toUpperCase() === sym.toUpperCase()))
      .filter((a): a is InvestmentAnalysis => a !== undefined);
  }, [selectedSymbols, analyses]);

  // Available assets to pick
  const availableToPick = useMemo(() => {
    const qLower = searchQuery.toLowerCase().trim();
    return analyses.filter(a => {
      const notAlreadySelected = !selectedSymbols.includes(a.quote.symbol);
      if (!qLower) return notAlreadySelected;
      return (
        notAlreadySelected &&
        (a.quote.symbol.toLowerCase().includes(qLower) || a.quote.name.toLowerCase().includes(qLower))
      );
    });
  }, [analyses, selectedSymbols, searchQuery]);

  // RECOMMENDATION ENGINE: Identify top pick and category winners
  const recommendation = useMemo(() => {
    if (selectedAnalyses.length < 2) return null;

    // Sort by overall profile match score descending
    const sortedByScore = [...selectedAnalyses].sort((a, b) => b.overallScore - a.overallScore);
    const topPick = sortedByScore[0];
    const runnerUp = sortedByScore[1];
    const thirdPick = sortedByScore[2] || null;

    // Highest Growth Winner
    const growthWinner = [...selectedAnalyses].sort(
      (a, b) => b.factors.growthScore - a.factors.growthScore
    )[0];

    // Lowest Volatility / Best Risk Defense Winner
    const riskWinner = [...selectedAnalyses].sort((a, b) => {
      const betaA = a.quote.beta ?? 1.1;
      const betaB = b.quote.beta ?? 1.1;
      return betaA - betaB;
    })[0];

    // Highest Business Quality Winner
    const qualityWinner = [...selectedAnalyses].sort(
      (a, b) => b.factors.qualityScore - a.factors.qualityScore
    )[0];

    // Most Attractive Valuation Winner
    const valuationWinner = [...selectedAnalyses].sort((a, b) => {
      const peA = parseFloat(a.metrics.pe) || 999;
      const peB = parseFloat(b.metrics.pe) || 999;
      return peA - peB;
    })[0];

    // Build personalized decision rationale based on user's risk profile
    let rationale = '';
    let allocationSuggestion = '';

    if (riskProfile === 'Conservative') {
      rationale = `${topPick.quote.symbol} leads with a top risk score of ${topPick.factors.riskScore}/100 and lower price volatility (Beta ${topPick.metrics.beta}). It provides the most resilient capital preservation among the compared assets.`;
      allocationSuggestion = `Consider allocating 60% to ${topPick.quote.symbol} for capital preservation, 25% to ${runnerUp.quote.symbol}, and 15% to ${thirdPick?.quote.symbol || 'cash/short-term bonds'}.`;
    } else if (riskProfile === 'Moderate') {
      rationale = `${topPick.quote.symbol} strikes the optimal equilibrium between business quality (${topPick.labels.quality}) and upside participation. It offers the strongest risk-adjusted return ratio for your balanced objectives.`;
      allocationSuggestion = `Balanced split: 45% ${topPick.quote.symbol}, 35% ${runnerUp.quote.symbol}, and 20% ${thirdPick?.quote.symbol || 'diversified core'}.`;
    } else if (riskProfile === 'Growth') {
      rationale = `${topPick.quote.symbol} ranks #1 with a combined Score of ${topPick.overallScore}/100, driven by ${topPick.labels.growth.toLowerCase()} expansion trajectory and solid financial quality (${topPick.metrics.profitMargin} margins).`;
      allocationSuggestion = `Growth tilt: 50% ${topPick.quote.symbol} (primary driver), 30% ${runnerUp.quote.symbol}, and 20% ${thirdPick?.quote.symbol || 'satellite'}.`;
    } else {
      // Aggressive
      rationale = `${topPick.quote.symbol} delivers maximum momentum and growth scoring (${topPick.factors.growthScore}/100). Ideal for compounding upside when market volatility is accepted.`;
      allocationSuggestion = `Aggressive momentum: 55% ${topPick.quote.symbol}, 30% ${runnerUp.quote.symbol}, and 15% ${thirdPick?.quote.symbol || 'high-beta opportunities'}.`;
    }

    return {
      topPick,
      runnerUp,
      thirdPick,
      growthWinner,
      riskWinner,
      qualityWinner,
      valuationWinner,
      rationale,
      allocationSuggestion,
    };
  }, [selectedAnalyses, riskProfile]);

  const handlePickSymbol = (sym: string, slotIndex: number) => {
    const newSymbols = [...selectedSymbols];
    newSymbols[slotIndex] = sym.toUpperCase();
    // remove duplicates
    const unique = Array.from(new Set(newSymbols)).slice(0, 3);
    // clear all and re-add
    selectedSymbols.forEach(s => onRemoveSymbol(s));
    unique.forEach(s => onAddSymbol(s));
    setSearchSlot(null);
    setSearchQuery('');
  };

  const handleApplyPreset = (symbols: string[]) => {
    selectedSymbols.forEach(s => onRemoveSymbol(s));
    symbols.forEach(s => onAddSymbol(s));
  };

  return (
    <div className="space-y-8">
      {/* 1. Top Header & Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950">
              Stock Comparison & Recommendation
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Compare 3 stocks or ETFs side-by-side. Our engine evaluates growth, quality, valuation, and volatility to recommend the best match for your <strong>{riskProfile}</strong> profile.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-neutral-400 mr-1 uppercase tracking-wider">Presets:</span>
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => handleApplyPreset(p.symbols)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Three Interactive Asset Slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map(slotIndex => {
          const analysis = selectedAnalyses[slotIndex];
          const isSearchingThis = searchSlot === slotIndex;

          if (isSearchingThis) {
            return (
              <div
                key={slotIndex}
                className="bg-white rounded-2xl border-2 border-neutral-900 p-4 shadow-sm flex flex-col min-h-[160px]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-100">
                  <span className="text-xs font-bold text-neutral-900">
                    Select Asset {slotIndex + 1} of 3
                  </span>
                  <button
                    onClick={() => {
                      setSearchSlot(null);
                      setSearchQuery('');
                    }}
                    className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search ticker or company name..."
                    autoFocus
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                  />
                </div>

                <div className="flex-1 overflow-y-auto max-h-48 divide-y divide-neutral-100 text-xs">
                  {availableToPick.slice(0, 10).map(a => (
                    <button
                      key={a.quote.symbol}
                      onClick={() => handlePickSymbol(a.quote.symbol, slotIndex)}
                      className="w-full py-2 px-1 text-left flex items-center justify-between hover:bg-neutral-50 rounded cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-bold text-neutral-900 mr-1.5">{a.quote.symbol}</span>
                        <span className="text-[11px] text-neutral-500 truncate max-w-[140px] inline-block align-bottom">
                          {a.quote.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-medium text-neutral-800">${a.quote.price}</span>
                        <span className="text-[10px] text-neutral-400 ml-1.5 font-bold">
                          {a.overallScore}/100
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          if (analysis) {
            const isWinner = recommendation?.topPick.quote.symbol === analysis.quote.symbol;
            return (
              <div
                key={analysis.quote.symbol}
                className={`relative rounded-2xl p-5 border transition-all ${
                  isWinner
                    ? 'bg-emerald-50/40 border-emerald-300 shadow-sm ring-1 ring-emerald-200'
                    : 'bg-white border-neutral-200 shadow-2xs'
                }`}
              >
                {/* Winner Crown Badge */}
                {isWinner && (
                  <div className="absolute -top-3 right-4 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wide uppercase shadow-xs">
                    <Award className="w-3 h-3" />
                    <span>Top Match</span>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-extrabold tracking-tight text-neutral-950">
                        {analysis.quote.symbol}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                        {analysis.quote.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-600 truncate max-w-[190px]">
                      {analysis.quote.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSearchSlot(slotIndex)}
                      className="p-1 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg cursor-pointer transition-colors"
                      title="Change stock"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onRemoveSymbol(analysis.quote.symbol)}
                      className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-4">
                  <div className="font-mono text-xl font-bold text-neutral-950">
                    ${analysis.quote.price?.toFixed(2)}
                  </div>
                  <div
                    className={`font-mono text-xs font-semibold ${
                      (analysis.quote.changePercent || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {(analysis.quote.changePercent || 0) >= 0 ? '+' : ''}
                    {analysis.quote.changePercent?.toFixed(2)}%
                  </div>
                </div>

                {/* Score bar */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-neutral-500 font-medium">Investment Score</span>
                    <span className="font-mono font-bold text-neutral-900">
                      {analysis.overallScore} / 100
                    </span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        analysis.overallScore >= 80
                          ? 'bg-emerald-600'
                          : analysis.overallScore >= 70
                          ? 'bg-neutral-800'
                          : 'bg-amber-600'
                      }`}
                      style={{ width: `${analysis.overallScore}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={slotIndex}
              onClick={() => setSearchSlot(slotIndex)}
              className="rounded-2xl border-2 border-dashed border-neutral-300 hover:border-neutral-900 p-6 flex flex-col items-center justify-center gap-2 text-neutral-500 hover:text-neutral-900 hover:bg-white/80 transition-all cursor-pointer min-h-[160px]"
            >
              <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">
                + Select Stock or ETF #{slotIndex + 1}
              </span>
              <span className="text-[11px] text-neutral-400">Click to choose from 63 assets</span>
            </button>
          );
        })}
      </div>

      {/* 3. RECOMMENDATION VERDICT BANNER ("Which to Buy") */}
      {recommendation && (
        <div className="rounded-3xl bg-neutral-950 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
                    Automated Decision Verdict
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Suggested Primary Fit: {recommendation.topPick.quote.name} ({recommendation.topPick.quote.symbol})
                  </h3>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-xs font-bold self-start sm:self-auto">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Score: {recommendation.topPick.overallScore} / 100</span>
              </div>
            </div>

            {/* Rationale & Decision Logic */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="text-sm text-neutral-200 leading-relaxed">
                <strong>Why {recommendation.topPick.quote.symbol} is recommended: </strong>
                {recommendation.rationale}
              </div>

              {/* Alternative Choice Guidance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
                <div>
                  <span className="text-neutral-400">When to choose <strong>{recommendation.runnerUp.quote.symbol}</strong>: </span>
                  <span className="text-neutral-300">
                    If you prefer {recommendation.runnerUp.labels.risk.toLowerCase()} risk profile, lower volatility (Beta {recommendation.runnerUp.metrics.beta}), or higher capital preservation.
                  </span>
                </div>
                {recommendation.thirdPick && (
                  <div>
                    <span className="text-neutral-400">When to choose <strong>{recommendation.thirdPick.quote.symbol}</strong>: </span>
                    <span className="text-neutral-300">
                      If you prioritize {recommendation.thirdPick.labels.valuation.toLowerCase()} valuation metrics or specific sector exposure.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Category Winners Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>Highest Growth</span>
                </div>
                <div className="font-bold text-white text-sm">
                  {recommendation.growthWinner.quote.symbol} ({recommendation.growthWinner.factors.growthScore} pts)
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1 mb-1">
                  <Shield className="w-3 h-3 text-blue-400" />
                  <span>Lowest Volatility</span>
                </div>
                <div className="font-bold text-white text-sm">
                  {recommendation.riskWinner.quote.symbol} (Beta {recommendation.riskWinner.metrics.beta})
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1 mb-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>Top Quality</span>
                </div>
                <div className="font-bold text-white text-sm">
                  {recommendation.qualityWinner.quote.symbol} ({recommendation.qualityWinner.labels.quality})
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1 mb-1">
                  <Percent className="w-3 h-3 text-purple-400" />
                  <span>Attractive Value</span>
                </div>
                <div className="font-bold text-white text-sm">
                  {recommendation.valuationWinner.quote.symbol} ({recommendation.valuationWinner.metrics.pe})
                </div>
              </div>
            </div>

            {/* Suggested Allocation Split */}
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
              <span>{recommendation.allocationSuggestion}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. SIDE-BY-SIDE METRICS COMPARISON TABLE */}
      {selectedAnalyses.length > 0 && (
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-950 flex items-center gap-2">
              <span>Detailed Side-by-Side Breakdown</span>
            </h3>
            <span className="text-xs text-neutral-500">
              Comparing {selectedAnalyses.length} assets
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70">
                  <th className="py-4 px-5 text-neutral-600 font-semibold w-48 min-w-[150px]">
                    Evaluation Criteria
                  </th>
                  {selectedAnalyses.map(a => (
                    <th key={a.quote.symbol} className="py-4 px-5 min-w-[180px]">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-neutral-900 text-sm mr-2">{a.quote.symbol}</span>
                          <span className="text-[11px] text-neutral-500">{a.quote.name}</span>
                        </div>
                        <button
                          onClick={() => onSelectDetail(a.quote.symbol)}
                          className="text-[11px] font-semibold text-neutral-900 hover:underline cursor-pointer"
                        >
                          Details →
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100">
                {/* 1. Overall Score */}
                <tr className="hover:bg-neutral-50/50 bg-neutral-50/20 font-medium">
                  <td className="py-3 px-5 text-neutral-700">Overall Match Score</td>
                  {selectedAnalyses.map(a => {
                    const isTop = recommendation?.topPick.quote.symbol === a.quote.symbol;
                    return (
                      <td key={a.quote.symbol} className="py-3 px-5">
                        <div className="flex items-center gap-2 font-mono text-sm font-bold">
                          <span className={isTop ? 'text-emerald-700 font-extrabold' : 'text-neutral-900'}>
                            {a.overallScore} / 100
                          </span>
                          {isTop && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                              Winner
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* 2. Live Price & 24h Change */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-3 px-5 text-neutral-500">Live Price & Day Change</td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3 px-5 font-mono">
                      <span className="font-bold text-neutral-900 mr-2">${a.quote.price?.toFixed(2)}</span>
                      <span
                        className={`text-xs font-semibold ${
                          (a.quote.changePercent || 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {(a.quote.changePercent || 0) >= 0 ? '+' : ''}
                        {a.quote.changePercent?.toFixed(2)}%
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 3. Risk Level (Beta) */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-3 px-5 text-neutral-500">Volatility Risk & Beta</td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-700">
                          {a.labels.risk}
                        </span>
                        <span className="font-mono text-neutral-500 text-[11px]">
                          β {a.metrics.beta}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 4. Growth Trajectory */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-3 px-5 text-neutral-500">Growth Score & Label</td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900">{a.factors.growthScore} pts</span>
                        <span className="text-[11px] text-neutral-500">({a.labels.growth})</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 5. Valuation Multiple */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-3 px-5 text-neutral-500">Valuation & P/E Ratio</td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-neutral-900">{a.metrics.pe}</span>
                        <span className="text-[11px] text-neutral-500">({a.labels.valuation})</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 6. Business Quality */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-3 px-5 text-neutral-500">Business Quality & Margins</td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{a.labels.quality}</span>
                        <span className="font-mono text-neutral-500 text-[11px]">({a.metrics.profitMargin})</span>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* 7. 1-Year Performance */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-3 px-5 text-neutral-500">1-Year Return</td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3 px-5 font-mono font-medium">
                      <span className={a.metrics.oneYearReturn.startsWith('+') ? 'text-emerald-700 font-bold' : 'text-neutral-700'}>
                        {a.metrics.oneYearReturn}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 8. Market Capitalization */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-3 px-5 text-neutral-500">Market Capitalization</td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3 px-5 font-mono text-neutral-800">
                      {a.metrics.marketCap}
                    </td>
                  ))}
                </tr>

                {/* 9. Dividend Yield */}
                <tr className="hover:bg-neutral-50/50">
                  <td className="py-3 px-5 text-neutral-500">Dividend Yield</td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3 px-5 font-mono text-neutral-800">
                      {a.metrics.dividendYield}
                    </td>
                  ))}
                </tr>

                {/* 10. Why it fits your profile */}
                <tr className="hover:bg-neutral-50/50 align-top">
                  <td className="py-3.5 px-5 text-neutral-500 font-medium">Why It Fits Your Profile</td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5">
                      <ul className="space-y-1.5 text-[11px] text-neutral-700">
                        {a.whyFitsYou.slice(0, 3).map((w, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>

                {/* 11. Key Watch-out / Potential Concern */}
                <tr className="hover:bg-neutral-50/50 align-top">
                  <td className="py-3.5 px-5 text-neutral-500 font-medium">Key Trade-off / Watch-out</td>
                  {selectedAnalyses.map(a => (
                    <td key={a.quote.symbol} className="py-3.5 px-5">
                      <div className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/60">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{a.potentialConcern}</span>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Educational Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-neutral-100/70 border border-neutral-200/80 text-[11px] text-neutral-500 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
        <div>
          <strong>Educational Assessment Notice: </strong>
          The suggested top fit is calculated algorithmically using your <strong>{riskProfile}</strong> factor weightings (Risk, Quality, Valuation, Growth, and Momentum) applied to current Yahoo Finance market metrics. This is not individualized financial advice. Always verify with your own due diligence.
        </div>
      </div>
    </div>
  );
};
