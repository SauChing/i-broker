import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Compass,
  Bookmark,
  Scale,
  Sparkles,
  SlidersHorizontal,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Header } from './components/Header';
import { RiskProfiler } from './components/RiskProfiler';
import { MarketOverview } from './components/MarketOverview';
import { StockCard } from './components/StockCard';
import { StockDetailModal } from './components/StockDetailModal';
import { ComparisonView } from './components/ComparisonView';
import { PortfolioSimulator } from './components/PortfolioSimulator';
import { WatchlistView } from './components/WatchlistView';
import { SearchBar } from './components/SearchBar';
import { FinancialDisclaimer } from './components/FinancialDisclaimer';
import { api, type AnalysisResponse } from './services/api';
import { calculateRiskProfile, DEFAULT_ANSWERS } from './utils/riskProfiler';
import type {
  RiskAnswers,
  RiskProfileResult,
  InvestmentAnalysis,
  RiskCategory,
  SentimentType,
} from './types/market';

export default function App() {
  // Persistence states
  const [answers, setAnswers] = useState<RiskAnswers>(() => {
    try {
      const saved = localStorage.getItem('investwise_answers');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_ANSWERS;
  });

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem('investwise_onboarding_done') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('investwise_watchlist');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['MSFT', 'VOO', 'NVDA'];
  });

  const [comparedSymbols, setComparedSymbols] = useState<string[]>(['MSFT', 'NVDA', 'GOOGL']);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'discover' | 'watchlist' | 'portfolio'>('dashboard');

  // Modals & UI controls
  const [isProfilerModalOpen, setIsProfilerModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedStockDetail, setSelectedStockDetail] = useState<string | null>(null);

  // Filters & sorting
  const [filterType, setFilterType] = useState<'all' | 'stock' | 'etf'>('all');
  const [sortBy, setSortBy] = useState<'score' | 'risk' | 'growth'>('score');

  // Market analysis data
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Derive current risk profile from answers
  const riskResult: RiskProfileResult = useMemo(() => {
    return calculateRiskProfile(answers);
  }, [answers]);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('investwise_answers', JSON.stringify(answers));
      localStorage.setItem('investwise_onboarding_done', String(hasCompletedOnboarding));
      localStorage.setItem('investwise_watchlist', JSON.stringify(watchlist));
    } catch (e) {}
  }, [answers, hasCompletedOnboarding, watchlist]);

  // Fetch analysis data from API based on current risk profile
  const fetchAnalysis = async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    else setIsLoadingAnalysis(true);
    setFetchError(null);

    try {
      const data = await api.getAnalysis(riskResult.category);
      setAnalysisData(data);
    } catch (err: any) {
      console.error('Failed to load market analysis:', err);
      setFetchError('Market data is temporarily unavailable. Retrying with cached benchmarks...');
    } finally {
      setIsLoadingAnalysis(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [riskResult.category]);

  // Handle questionnaire completion
  const handleProfilerComplete = (newAnswers: RiskAnswers, result: RiskProfileResult) => {
    setAnswers(newAnswers);
    setHasCompletedOnboarding(true);
    setIsProfilerModalOpen(false);
    setActiveTab('dashboard');
  };

  // Watchlist toggle
  const handleToggleWatchlist = (symbol: string) => {
    const sym = symbol.toUpperCase();
    setWatchlist(prev =>
      prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym]
    );
  };

  // Compare toggle
  const handleToggleCompare = (symbol: string) => {
    const sym = symbol.toUpperCase();
    setComparedSymbols(prev => {
      if (prev.includes(sym)) {
        return prev.filter(s => s !== sym);
      }
      if (prev.length >= 3) {
        return [prev[1], prev[2], sym]; // Rotate out oldest
      }
      return [...prev, sym];
    });
  };

  const handleAddCompare = (symbol: string) => {
    const sym = symbol.toUpperCase();
    if (!comparedSymbols.includes(sym) && comparedSymbols.length < 3) {
      setComparedSymbols(prev => [...prev, sym]);
    }
  };

  const handleRemoveCompare = (symbol: string) => {
    setComparedSymbols(prev => prev.filter(s => s !== symbol.toUpperCase()));
  };

  // Filtered & sorted opportunities
  const displayedOpportunities = useMemo(() => {
    if (!analysisData?.opportunities) return [];

    let list = [...analysisData.opportunities];

    // Filter by type
    if (filterType !== 'all') {
      list = list.filter(item => item.quote.type === filterType);
    }

    // Sort
    if (sortBy === 'score') {
      list.sort((a, b) => b.overallScore - a.overallScore);
    } else if (sortBy === 'risk') {
      // Sort by lowest beta / highest risk score (safest first)
      list.sort((a, b) => (a.quote.beta ?? 1) - (b.quote.beta ?? 1));
    } else if (sortBy === 'growth') {
      list.sort((a, b) => b.factors.growthScore - a.factors.growthScore);
    }

    return list;
  }, [analysisData, filterType, sortBy]);

  // Active stock detail analysis object
  const activeDetailAnalysis = useMemo(() => {
    if (!selectedStockDetail || !analysisData) return undefined;
    return analysisData.opportunities.find(
      o => o.quote.symbol.toUpperCase() === selectedStockDetail.toUpperCase()
    );
  }, [selectedStockDetail, analysisData]);

  // Landing page view when onboarding is not yet completed
  if (!hasCompletedOnboarding) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
        {/* Simple Top Navigation */}
        <header className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-base shadow-xs">
              W
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-950">
              InvestWise
            </span>
          </div>

          <div className="text-xs text-neutral-500 font-medium">
            Personalised Market Discovery
          </div>
        </header>

        {/* Landing Hero Screen */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="max-w-3xl w-full mx-auto text-center py-10">
            <div className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-3">
              Step 1 — Risk Appetite
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-950 mb-4 [text-wrap:balance]">
              Invest with more clarity.
            </h1>

            <p className="text-base sm:text-xl text-neutral-600 max-w-xl mx-auto leading-relaxed mb-8 [text-wrap:balance]">
              Tell us how much risk you're comfortable taking, and we'll analyse the market for you.
            </p>

            {/* Quick 3-step value illustration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto mb-10 text-left">
              <div className="p-4 rounded-xl bg-white border border-neutral-200">
                <div className="text-xs font-bold text-neutral-400 mb-1">01</div>
                <div className="text-sm font-semibold text-neutral-900">Risk Profile</div>
                <div className="text-xs text-neutral-500 mt-0.5">5 quick questions</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-neutral-200">
                <div className="text-xs font-bold text-neutral-400 mb-1">02</div>
                <div className="text-sm font-semibold text-neutral-900">Live Yahoo Data</div>
                <div className="text-xs text-neutral-500 mt-0.5">Dynamic market scan</div>
              </div>
              <div className="p-4 rounded-xl bg-white border border-neutral-200">
                <div className="text-xs font-bold text-neutral-400 mb-1">03</div>
                <div className="text-sm font-semibold text-neutral-900">What Fits You</div>
                <div className="text-xs text-neutral-500 mt-0.5">Clear match score</div>
              </div>
            </div>

            {/* Profiler Embedded */}
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-6 sm:p-10 text-left">
              <RiskProfiler
                initialAnswers={answers}
                onComplete={handleProfilerComplete}
              />
            </div>
          </div>
        </main>

        <FinancialDisclaimer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between selection:bg-neutral-900 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab: any) => setActiveTab(tab)}
        riskCategory={riskResult.category}
        onOpenProfiler={() => setIsProfilerModalOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        watchlistCount={watchlist.length}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error notification if market API is degraded */}
        {fetchError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{fetchError}</span>
            </div>
            <button
              onClick={() => fetchAnalysis(true)}
              className="px-2.5 py-1 rounded bg-amber-200/80 font-medium hover:bg-amber-300 text-amber-900 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Market Overview Hero */}
            <MarketOverview
              riskProfile={riskResult.category}
              sentiment={analysisData?.marketSentiment || 'Positive'}
              lastUpdated={analysisData?.lastUpdated || null}
              totalAssets={analysisData?.totalAnalyzed || 10}
              onEditProfile={() => setIsProfilerModalOpen(true)}
              onRefresh={() => fetchAnalysis(true)}
              isRefreshing={isRefreshing}
              filterType={filterType}
              onFilterChange={setFilterType}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Top Opportunities Grid */}
            {isLoadingAnalysis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-80 rounded-2xl bg-white border border-neutral-200 animate-pulse p-6" />
                ))}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {displayedOpportunities.slice(0, 9).map((analysis, index) => (
                    <StockCard
                      key={analysis.quote.symbol}
                      analysis={analysis}
                      rank={index + 1}
                      isWatchlisted={watchlist.includes(analysis.quote.symbol)}
                      onToggleWatchlist={handleToggleWatchlist}
                      isCompared={comparedSymbols.includes(analysis.quote.symbol)}
                      onToggleCompare={handleToggleCompare}
                      onSelect={(sym) => setSelectedStockDetail(sym)}
                    />
                  ))}
                </div>

                {displayedOpportunities.length === 0 && (
                  <div className="p-12 text-center bg-white rounded-2xl border border-neutral-200 text-xs text-neutral-500">
                    No matching assets for the selected filter. Try selecting "All Assets".
                  </div>
                )}
              </div>
            )}

            {/* Quick Comparison Section on Dashboard */}
            {comparedSymbols.length > 0 && analysisData && (
              <div className="pt-6 border-t border-neutral-200">
                <ComparisonView
                  selectedSymbols={comparedSymbols}
                  analyses={analysisData.opportunities}
                  onRemoveSymbol={handleRemoveCompare}
                  onAddSymbol={handleAddCompare}
                  onSelectDetail={(sym) => setSelectedStockDetail(sym)}
                  riskProfile={riskResult.category}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISCOVER */}
        {activeTab === 'discover' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
                  Discover Market Universe
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Explore liquid US stocks, ETFs and index leaders evaluated for your {riskResult.category} risk appetite.
                </p>
              </div>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search All Tickers</span>
              </button>
            </div>

            {/* Opportunities List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedOpportunities.map((analysis, index) => (
                <StockCard
                  key={analysis.quote.symbol}
                  analysis={analysis}
                  rank={index + 1}
                  isWatchlisted={watchlist.includes(analysis.quote.symbol)}
                  onToggleWatchlist={handleToggleWatchlist}
                  isCompared={comparedSymbols.includes(analysis.quote.symbol)}
                  onToggleCompare={handleToggleCompare}
                  onSelect={(sym) => setSelectedStockDetail(sym)}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: WATCHLIST */}
        {activeTab === 'watchlist' && (
          <WatchlistView
            watchlistSymbols={watchlist}
            analyses={analysisData?.opportunities || []}
            onRemoveWatchlist={handleToggleWatchlist}
            onSelectDetail={(sym) => setSelectedStockDetail(sym)}
            onToggleCompare={handleToggleCompare}
            comparedSymbols={comparedSymbols}
            onOpenSearch={() => setIsSearchOpen(true)}
            riskProfile={riskResult.category}
          />
        )}

        {/* TAB 4: PORTFOLIO SIMULATOR */}
        {activeTab === 'portfolio' && (
          <PortfolioSimulator riskProfile={riskResult.category} />
        )}
      </main>

      {/* Financial Disclaimer Footer */}
      <FinancialDisclaimer />

      {/* Stock Detail Modal */}
      {selectedStockDetail && (
        <StockDetailModal
          symbol={selectedStockDetail}
          riskProfile={riskResult.category}
          onClose={() => setSelectedStockDetail(null)}
          isWatchlisted={watchlist.includes(selectedStockDetail)}
          onToggleWatchlist={handleToggleWatchlist}
          isCompared={comparedSymbols.includes(selectedStockDetail)}
          onToggleCompare={handleToggleCompare}
          analysis={activeDetailAnalysis}
        />
      )}

      {/* Global Search Modal */}
      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectSymbol={(sym) => setSelectedStockDetail(sym)}
      />

      {/* Risk Profile Modal Overlay (when user clicks Profile button in header) */}
      {isProfilerModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsProfilerModalOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl">
            <RiskProfiler
              initialAnswers={answers}
              onComplete={handleProfilerComplete}
              onClose={() => setIsProfilerModalOpen(false)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
