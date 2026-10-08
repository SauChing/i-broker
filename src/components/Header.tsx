import React from 'react';
import { Compass, Bookmark, TrendingUp, SlidersHorizontal, Search, ArrowUpRight, ShieldCheck } from 'lucide-react';
import type { RiskCategory } from '../types/market';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  riskCategory: RiskCategory;
  onOpenProfiler: () => void;
  onOpenSearch: () => void;
  watchlistCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  riskCategory,
  onOpenProfiler,
  onOpenSearch,
  watchlistCount,
}) => {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Zone 1: Brand wordmark */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-base tracking-tight shadow-sm transition-transform group-hover:scale-105">
                W
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-neutral-950">
                  InvestWise
                </span>
              </div>
            </button>

            {/* Zone 2: Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <button
                onClick={() => onTabChange('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'text-neutral-950 font-semibold bg-neutral-100'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onTabChange('discover')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'discover'
                    ? 'text-neutral-950 font-semibold bg-neutral-100'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Discover
              </button>
              <button
                onClick={() => onTabChange('watchlist')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'watchlist'
                    ? 'text-neutral-950 font-semibold bg-neutral-100'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <span>Watchlist</span>
                {watchlistCount > 0 && (
                  <span className="font-mono text-xs text-neutral-500 tabular-nums">
                    ({watchlistCount})
                  </span>
                )}
              </button>
              <button
                onClick={() => onTabChange('portfolio')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'portfolio'
                    ? 'text-neutral-950 font-semibold bg-neutral-100'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Simulator
              </button>
            </nav>
          </div>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5">
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-500 bg-neutral-100 hover:bg-neutral-200/80 rounded-lg border border-neutral-200/60 transition-colors cursor-pointer"
              title="Search stocks & ETFs"
            >
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <span>Search stocks & ETFs...</span>
              <kbd className="hidden lg:inline-block px-1 py-0.5 text-[10px] font-mono bg-white rounded border border-neutral-200 text-neutral-400">
                /
              </kbd>
            </button>

            <button
              onClick={onOpenSearch}
              className="sm:hidden p-2 text-neutral-600 hover:text-neutral-950 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Risk Profile CTA */}
            <button
              onClick={onOpenProfiler}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200/70 border border-neutral-300 rounded-lg transition-all cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-neutral-700" />
              <span>Risk: <strong>{riskCategory}</strong></span>
              <SlidersHorizontal className="w-3 h-3 text-neutral-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-2 flex items-center justify-around">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium cursor-pointer ${
            activeTab === 'dashboard' ? 'text-neutral-950 font-bold' : 'text-neutral-500'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          onClick={() => onTabChange('discover')}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium cursor-pointer ${
            activeTab === 'discover' ? 'text-neutral-950 font-bold' : 'text-neutral-500'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Discover</span>
        </button>
        <button
          onClick={() => onTabChange('watchlist')}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium cursor-pointer relative ${
            activeTab === 'watchlist' ? 'text-neutral-950 font-bold' : 'text-neutral-500'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Watchlist</span>
          {watchlistCount > 0 && (
            <span className="absolute top-0.5 right-2 w-1.5 h-1.5 rounded-full bg-neutral-900" />
          )}
        </button>
        <button
          onClick={() => onTabChange('portfolio')}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium cursor-pointer ${
            activeTab === 'portfolio' ? 'text-neutral-950 font-bold' : 'text-neutral-500'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Simulator</span>
        </button>
        <button
          onClick={onOpenProfiler}
          className="flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium text-neutral-500 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Profile</span>
        </button>
      </nav>
    </>
  );
};
