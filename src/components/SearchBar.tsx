import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ArrowUpRight, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import type { SearchResultItem } from '../types/market';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  isOpen,
  onClose,
  onSelectSymbol,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
      // Shortcut '/' opens search
      if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        // Trigger via prop would be in App, but let's handle if open
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live search query with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.search(query);
        setResults(res);
      } catch (e) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const popular = ['AAPL', 'MSFT', 'NVDA', 'VOO', 'QQQ', 'AMZN', 'GOOGL', 'TSLA'];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-neutral-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Box */}
        <div className="relative p-4 border-b border-neutral-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks, ETFs or ticker symbols (e.g. Apple, AAPL, VOO)..."
            className="w-full bg-transparent text-sm sm:text-base text-neutral-900 placeholder:text-neutral-400 outline-hidden font-medium"
          />
          {isLoading && <Loader2 className="w-4 h-4 text-neutral-400 animate-spin shrink-0" />}
          {query && !isLoading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results or Popular suggestions */}
        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="p-3">
              <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Popular Discoveries
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popular.map((sym) => (
                  <button
                    key={sym}
                    onClick={() => {
                      onSelectSymbol(sym);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-mono text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-0.5">
              {results.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => {
                    onSelectSymbol(item.symbol);
                    onClose();
                  }}
                  className="w-full p-3 rounded-xl hover:bg-neutral-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center font-mono font-bold text-neutral-800 text-xs shrink-0 group-hover:bg-neutral-200 transition-colors">
                      {item.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-950 text-sm">
                          {item.symbol}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-neutral-100 text-neutral-500 font-medium">
                          {item.type}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 truncate max-w-sm">
                        {item.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-neutral-400 group-hover:text-neutral-900 transition-colors">
                    <span className="text-[11px] font-mono">{item.exchange}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          ) : !isLoading ? (
            <div className="p-8 text-center text-xs text-neutral-500">
              No matching stocks or ETFs found for "{query}".
            </div>
          ) : null}
        </div>

        {/* Search Footer */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Live data from Yahoo Finance provider</span>
          <span>Press <kbd className="px-1 py-0.5 bg-white border border-neutral-200 rounded text-neutral-500">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
