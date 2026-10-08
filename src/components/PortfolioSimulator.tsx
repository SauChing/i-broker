import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Calendar,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import type { RiskCategory } from '../types/market';

interface PortfolioSimulatorProps {
  riskProfile: RiskCategory;
}

export const PortfolioSimulator: React.FC<PortfolioSimulatorProps> = ({ riskProfile }) => {
  const [initialAmount, setInitialAmount] = useState<number>(10000);
  const [years, setYears] = useState<number>(5);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(250);

  // Growth rates adjusted realistically by risk profile
  const rates = useMemo(() => {
    switch (riskProfile) {
      case 'Conservative':
        return { conservative: 0.035, base: 0.06, optimistic: 0.09 };
      case 'Moderate':
        return { conservative: 0.045, base: 0.08, optimistic: 0.12 };
      case 'Growth':
        return { conservative: 0.05, base: 0.095, optimistic: 0.15 };
      case 'Aggressive':
        return { conservative: 0.04, base: 0.11, optimistic: 0.18 };
    }
  }, [riskProfile]);

  // Calculate year-by-year points for all 3 scenarios
  const projection = useMemo(() => {
    const points: {
      year: number;
      contributions: number;
      conservative: number;
      base: number;
      optimistic: number;
    }[] = [];

    let currentContrib = initialAmount;
    let valCons = initialAmount;
    let valBase = initialAmount;
    let valOpt = initialAmount;

    points.push({
      year: 0,
      contributions: initialAmount,
      conservative: initialAmount,
      base: initialAmount,
      optimistic: initialAmount,
    });

    for (let yr = 1; yr <= years; yr++) {
      // 12 monthly additions per year with compounding
      for (let m = 0; m < 12; m++) {
        currentContrib += monthlyContribution;
        valCons = (valCons + monthlyContribution) * (1 + rates.conservative / 12);
        valBase = (valBase + monthlyContribution) * (1 + rates.base / 12);
        valOpt = (valOpt + monthlyContribution) * (1 + rates.optimistic / 12);
      }

      points.push({
        year: yr,
        contributions: Math.round(currentContrib),
        conservative: Math.round(valCons),
        base: Math.round(valBase),
        optimistic: Math.round(valOpt),
      });
    }

    const final = points[points.length - 1];

    return {
      points,
      finalContributions: final.contributions,
      finalConservative: final.conservative,
      finalBase: final.base,
      finalOptimistic: final.optimistic,
    };
  }, [initialAmount, years, monthlyContribution, rates]);

  // Chart dimensions for SVG
  const chartWidth = 580;
  const chartHeight = 220;
  const paddingY = 25;
  const paddingX = 10;

  const maxVal = projection.finalOptimistic * 1.05;

  const makePath = (key: 'conservative' | 'base' | 'optimistic') => {
    return projection.points
      .map((p, idx) => {
        const x = paddingX + (idx / years) * (chartWidth - paddingX * 2);
        const y = chartHeight - paddingY - (p[key] / maxVal) * (chartHeight - paddingY * 2);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const pathCons = makePath('conservative');
  const pathBase = makePath('base');
  const pathOpt = makePath('optimistic');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
          Portfolio "What If?" Simulator
        </h2>
        <p className="text-xs text-neutral-500 mt-1">
          Model hypothetical compounding scenarios based on your {riskProfile} asset allocation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-neutral-900 tracking-tight">
            Simulation Parameters
          </h3>

          {/* Initial Investment */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 block mb-1.5">
              Initial Investment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                $
              </span>
              <input
                type="number"
                min="100"
                step="500"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 font-mono text-sm text-neutral-900 focus:bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-hidden transition-all"
              />
            </div>
            {/* Quick buttons */}
            <div className="flex items-center gap-1.5 mt-2">
              {[5000, 10000, 25000, 50000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInitialAmount(amt)}
                  className={`text-[11px] px-2 py-1 rounded-md border transition-colors cursor-pointer font-mono ${
                    initialAmount === amt
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  ${(amt / 1000)}k
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Additions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700">
                Monthly Contribution
              </label>
              <span className="text-xs font-mono font-medium text-neutral-900">
                ${monthlyContribution}/mo
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(parseInt(e.target.value, 10))}
              className="w-full accent-neutral-900 cursor-pointer"
            />
          </div>

          {/* Time Horizon */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700">
                Time Horizon
              </label>
              <span className="text-xs font-mono font-bold text-neutral-900">
                {years} {years === 1 ? 'Year' : 'Years'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 3, 5, 10, 20].map(yr => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setYears(yr)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    years === yr
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {yr}Y
                </button>
              ))}
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 text-xs space-y-1.5">
            <div className="flex justify-between text-neutral-500">
              <span>Total principal contributed:</span>
              <span className="font-mono font-semibold text-neutral-900">
                {formatCurrency(projection.finalContributions)}
              </span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Profile alignment:</span>
              <span className="font-semibold text-neutral-900">{riskProfile} Investor</span>
            </div>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-7 space-y-4">
          {/* 3 Outcome Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Conservative */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Conservative
              </div>
              <div className="text-xl font-bold font-mono-numbers text-neutral-900">
                {formatCurrency(projection.finalConservative)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Hypothetical ~{(rates.conservative * 100).toFixed(1)}% annual
              </div>
            </div>

            {/* Base Scenario */}
            <div className="p-4 rounded-2xl bg-neutral-900 text-white border border-neutral-800 shadow-sm">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Base Case
              </div>
              <div className="text-xl font-bold font-mono-numbers text-white">
                {formatCurrency(projection.finalBase)}
              </div>
              <div className="text-[11px] text-neutral-300 mt-1">
                Hypothetical ~{(rates.base * 100).toFixed(1)}% annual
              </div>
            </div>

            {/* Optimistic */}
            <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-xs">
              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Optimistic
              </div>
              <div className="text-xl font-bold font-mono-numbers text-neutral-900">
                {formatCurrency(projection.finalOptimistic)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Hypothetical ~{(rates.optimistic * 100).toFixed(1)}% annual
              </div>
            </div>
          </div>

          {/* SVG Multi-Scenario Trajectory Chart */}
          <div className="p-5 rounded-2xl bg-white border border-neutral-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-3">
              <span className="font-semibold text-neutral-900">Trajectory Projection</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  <span>Conservative</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-neutral-900" />
                  <span className="font-medium text-neutral-900">Base</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Optimistic</span>
                </span>
              </div>
            </div>

            <div className="w-full h-[220px] bg-neutral-50/60 rounded-xl overflow-hidden border border-neutral-100 p-2">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full" preserveAspectRatio="none">
                {/* Horizontal guide lines */}
                <line x1={0} y1={paddingY} x2={chartWidth} y2={paddingY} stroke="#E5E7EB" strokeDasharray="3 3" />
                <line x1={0} y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#E5E7EB" strokeDasharray="3 3" />
                <line x1={0} y1={chartHeight - paddingY} x2={chartWidth} y2={chartHeight - paddingY} stroke="#E5E7EB" strokeDasharray="3 3" />

                {/* Optimistic Line */}
                <path d={pathOpt} fill="none" stroke="#059669" strokeWidth="2" strokeDasharray="4 2" />

                {/* Base Line */}
                <path d={pathBase} fill="none" stroke="#111827" strokeWidth="2.5" />

                {/* Conservative Line */}
                <path d={pathCons} fill="none" stroke="#9CA3AF" strokeWidth="1.5" />
              </svg>
            </div>

            <div className="flex justify-between text-[11px] text-neutral-400 font-mono mt-2">
              <span>Year 0 (Today: {formatCurrency(initialAmount)})</span>
              <span>Year {years} Target Horizon</span>
            </div>
          </div>

          {/* Mandatory Prominent Illustrative Disclaimer */}
          <div className="p-4 rounded-xl bg-neutral-100/80 border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Illustrative scenarios only.</strong> These calculations are hypothetical models intended to demonstrate compound math. They do <strong>NOT</strong> represent guaranteed returns or future price performance. Investments fluctuate in value and involve risk of loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
