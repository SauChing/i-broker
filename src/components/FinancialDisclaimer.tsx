import React from 'react';
import { Info } from 'lucide-react';

export const FinancialDisclaimer: React.FC = () => {
  return (
    <footer className="mt-20 pt-8 pb-16 border-t border-neutral-200/80 text-xs text-neutral-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 font-bold text-neutral-900 text-sm">
            <span>InvestWise</span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs font-normal text-neutral-500">Personalised Investment Discovery</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Powered by live market data from Yahoo Finance API provider
          </div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-100/60 border border-neutral-200/60 text-neutral-600 leading-relaxed text-[11px]">
          <p className="font-semibold text-neutral-800 mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-neutral-500" />
            <span>Important Educational Notice</span>
          </p>
          <p>
            InvestWise provides educational market analysis based on available market data. It is not personalised financial advice, and investment decisions involve risk. Past performance does not guarantee future results. All figures, ratios, and risk scores are derived from mathematical modeling and publicly accessible market statistics.
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-400">
          <div>© {new Date().getFullYear()} InvestWise. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span>Market Data Disclaimer</span>
            <span>Privacy & Terms</span>
            <span>Methodology</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
