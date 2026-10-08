import React, { useState, useMemo } from 'react';
import type { HistoricalPriceData } from '../types/market';

interface StockChartProps {
  historyData: HistoricalPriceData | null;
  selectedRange: string;
  onRangeChange: (range: string) => void;
  isLoading?: boolean;
}

const RANGES = ['1D', '1W', '1M', '6M', '1Y', '5Y'];

export const StockChart: React.FC<StockChartProps> = ({
  historyData,
  selectedRange,
  onRangeChange,
  isLoading = false,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = useMemo(() => historyData?.data || [], [historyData]);

  const stats = useMemo(() => {
    if (!points.length) return null;
    const prices = points.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const startPrice = points[0].price;
    const currentPrice = points[points.length - 1].price;
    const isPositive = currentPrice >= startPrice;
    return { min, max, startPrice, currentPrice, isPositive };
  }, [points]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : (points.length ? points[points.length - 1] : null);

  // SVG coordinate calculations
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingY = 20;

  const svgPath = useMemo(() => {
    if (!points.length || !stats) return '';
    const rangeY = (stats.max - stats.min) || 1;

    return points
      .map((p, idx) => {
        const x = (idx / (points.length - 1)) * chartWidth;
        const normalizedY = (p.price - stats.min) / rangeY;
        const y = chartHeight - paddingY - normalizedY * (chartHeight - paddingY * 2);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points, stats]);

  const areaPath = useMemo(() => {
    if (!svgPath || !points.length) return '';
    return `${svgPath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;
  }, [svgPath, points]);

  const activeCoord = useMemo(() => {
    if (!activePoint || !points.length || !stats) return null;
    const idx = hoverIndex !== null ? hoverIndex : points.length - 1;
    const x = (idx / (points.length - 1)) * chartWidth;
    const rangeY = (stats.max - stats.min) || 1;
    const normalizedY = (activePoint.price - stats.min) / rangeY;
    const y = chartHeight - paddingY - normalizedY * (chartHeight - paddingY * 2);
    return { x, y };
  }, [activePoint, points, stats, hoverIndex]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const fraction = relativeX / rect.width;
    const idx = Math.round(fraction * (points.length - 1));
    setHoverIndex(idx);
  };

  const strokeColor = stats?.isPositive ? '#16A34A' : '#DC2626';
  const fillColor = stats?.isPositive ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)';

  return (
    <div className="w-full">
      {/* Top Header with Price readout and Range buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono-numbers text-neutral-950">
              {activePoint ? `$${activePoint.price.toFixed(2)}` : '—'}
            </span>
            {stats && (
              <span
                className={`text-xs font-mono font-medium ${
                  stats.isPositive ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {stats.isPositive ? '+' : ''}
                {(((activePoint?.price || stats.currentPrice) - stats.startPrice) / stats.startPrice * 100).toFixed(2)}%
              </span>
            )}
          </div>
          <div className="text-xs text-neutral-600 mt-0.5">
            {activePoint ? new Date(activePoint.timestamp).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }) : 'Historical performance'}
          </div>
        </div>

        {/* Range Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          {RANGES.map((rng) => {
            const isSelected = selectedRange.toUpperCase() === rng;
            return (
              <button
                key={rng}
                onClick={() => onRangeChange(rng.toLowerCase())}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white text-neutral-950 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {rng}
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive SVG Chart Container */}
      <div className="relative w-full h-[220px] bg-neutral-50/50 rounded-xl overflow-hidden border border-neutral-100 select-none">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10 text-xs text-neutral-500">
            Updating chart data...
          </div>
        )}

        {points.length > 1 && stats ? (
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-full cursor-crosshair overflow-visible"
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.16" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            <line x1="0" y1={paddingY} x2={chartWidth} y2={paddingY} stroke="#E5E7EB" strokeDasharray="3 3" />
            <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#E5E7EB" strokeDasharray="3 3" />
            <line x1="0" y1={chartHeight - paddingY} x2={chartWidth} y2={chartHeight - paddingY} stroke="#E5E7EB" strokeDasharray="3 3" />

            {/* Shaded Area */}
            <path d={areaPath} fill="url(#chartGradient)" />

            {/* Price Line */}
            <path
              d={svgPath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Hover Cursor */}
            {activeCoord && (
              <g>
                <line
                  x1={activeCoord.x}
                  y1={0}
                  x2={activeCoord.x}
                  y2={chartHeight}
                  stroke="#9CA3AF"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r="4"
                  fill={strokeColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">
            Historical data currently unavailable for this range
          </div>
        )}
      </div>

      {/* Chart Footer Bounds */}
      {stats && (
        <div className="flex items-center justify-between text-[11px] text-neutral-600 mt-2 font-mono">
          <span>Low: ${stats.min.toFixed(2)}</span>
          <span>High: ${stats.max.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};
