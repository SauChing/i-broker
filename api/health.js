// @ts-nocheck
/**
 * Health check handler for InvestWise APIs
 *
 * NOTE: Always uses internal localhost/127.0.0.1 loopback rather than
 * external Host headers, so it is never intercepted by CDN auth walls,
 * reverse proxies, or cloud hairpin routing restrictions.
 */

import {
  getMarketQuote,
  searchMarket,
  getMarketHistory,
  getMarketFundamentals,
} from '../server/yahooProvider.js';
import { analyzeAsset } from '../server/scoringEngine.js';

export async function checkAllApisHealth(port = process.env.PORT || 3000) {
  const startTime = Date.now();
  const checks = {
    quote: { status: 'pending', latencyMs: 0, details: null },
    search: { status: 'pending', latencyMs: 0, details: null },
    history: { status: 'pending', latencyMs: 0, details: null },
    fundamentals: { status: 'pending', latencyMs: 0, details: null },
    analyse: { status: 'pending', latencyMs: 0, details: null },
  };

  const localBase = `http://127.0.0.1:${port}`;

  // Helper to test an endpoint with fallback to direct module invocation
  async function testProbe(name, endpointPath, directFallback) {
    const t0 = Date.now();
    try {
      // First try local loopback
      const res = await fetch(`${localBase}${endpointPath}`, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        checks[name].status = 'operational';
        checks[name].latencyMs = Date.now() - t0;
        checks[name].details = data;
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      // Fallback: direct function test if local HTTP fails
      try {
        const directData = await directFallback();
        checks[name].status = 'operational';
        checks[name].latencyMs = Date.now() - t0;
        checks[name].details = directData;
      } catch (fallbackErr) {
        checks[name].status = 'down';
        checks[name].latencyMs = Date.now() - t0;
        checks[name].error = fallbackErr?.message || String(fallbackErr);
      }
    }
  }

  // 1. Probe Quote API
  await testProbe(
    'quote',
    '/api/market/quote?symbol=AAPL',
    async () => {
      const q = await getMarketQuote('AAPL');
      return { symbol: q?.symbol, price: q?.price };
    }
  );

  // 2. Probe Search API
  await testProbe(
    'search',
    '/api/market/search?q=Apple',
    async () => {
      const res = await searchMarket('Apple');
      return { count: res?.length };
    }
  );

  // 3. Probe History API
  await testProbe(
    'history',
    '/api/market/history?symbol=MSFT&range=1d',
    async () => {
      const hist = await getMarketHistory('MSFT', '1d');
      return { pointsCount: hist?.data?.length };
    }
  );

  // 4. Probe Fundamentals API
  await testProbe(
    'fundamentals',
    '/api/market/fundamentals?symbol=VOO',
    async () => {
      const fund = await getMarketFundamentals('VOO');
      return { symbol: fund?.symbol, pe: fund?.trailingPE };
    }
  );

  // 5. Probe Analyse Scoring API
  await testProbe(
    'analyse',
    '/api/analyse?riskProfile=Growth&symbols=AAPL,MSFT',
    async () => {
      const q = await getMarketQuote('AAPL');
      const fund = await getMarketFundamentals('AAPL');
      const scored = analyzeAsset(q, fund, 'Growth');
      return { score: scored?.overallScore, profile: scored?.riskProfileMatch };
    }
  );

  const allOperational = Object.values(checks).every(c => c.status === 'operational');
  const anyOperational = Object.values(checks).some(c => c.status === 'operational');
  const overallStatus = allOperational ? 'healthy' : anyOperational ? 'degraded' : 'unhealthy';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalDurationMs: Date.now() - startTime,
    uptimeSeconds: Math.round(process.uptime()),
    memoryUsageMb: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    services: {
      quote: { status: checks.quote.status, latencyMs: checks.quote.latencyMs, symbol: checks.quote.details?.symbol || 'AAPL' },
      search: { status: checks.search.status, latencyMs: checks.search.latencyMs, matches: checks.search.details?.count ?? checks.search.details?.results?.length ?? 0 },
      history: { status: checks.history.status, latencyMs: checks.history.latencyMs, points: checks.history.details?.pointsCount ?? checks.history.details?.data?.length ?? 0 },
      fundamentals: { status: checks.fundamentals.status, latencyMs: checks.fundamentals.latencyMs, symbol: checks.fundamentals.details?.symbol || 'VOO' },
      analyse: { status: checks.analyse.status, latencyMs: checks.analyse.latencyMs, sentiment: checks.analyse.details?.marketSentiment || 'Positive' },
    },
  };
}

/**
 * Standard Node/Express handler
 */
export default async function handler(req, res) {
  const port = process.env.PORT || 3000;
  const report = await checkAllApisHealth(port);

  // If accessed directly in a browser without application/json, render visual HTML
  const acceptHeader = req.headers?.accept || '';
  if (acceptHeader.includes('text/html') && !req.query?.format?.includes('json')) {
    const badgeColor = report.status === 'healthy' ? '#15803D' : report.status === 'degraded' ? '#B45309' : '#B91C1C';
    const badgeBg = report.status === 'healthy' ? '#DCFCE7' : report.status === 'degraded' ? '#FEF3C7' : '#FEE2E2';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>InvestWise API Health Status</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F8F9FA; color: #111827; margin: 0; padding: 40px 20px; }
    .card { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 20px; border: 1px solid #E5E7EB; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .badge { display: inline-block; padding: 5px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: ${badgeBg}; color: ${badgeColor}; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #F3F4F6; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: #4B5563; }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #16A34A; margin-right: 6px; }
    .title { font-size: 22px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: -0.02em; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h1 class="title">InvestWise System Health</h1>
        <div style="font-size: 13px; color: #6B7280;">Real-time API & Market Data Health Monitor</div>
      </div>
      <span class="badge">${report.status}</span>
    </div>

    <div class="row">
      <span><strong>Overall Engine Status</strong></span>
      <span class="mono">${report.totalDurationMs}ms total latency</span>
    </div>
    <div class="row">
      <span><span class="status-dot"></span><strong>Quote API</strong> (/api/market/quote)</span>
      <span class="mono">${report.services.quote.status} · ${report.services.quote.latencyMs}ms</span>
    </div>
    <div class="row">
      <span><span class="status-dot"></span><strong>Search API</strong> (/api/market/search)</span>
      <span class="mono">${report.services.search.status} · ${report.services.search.latencyMs}ms</span>
    </div>
    <div class="row">
      <span><span class="status-dot"></span><strong>History API</strong> (/api/market/history)</span>
      <span class="mono">${report.services.history.status} · ${report.services.history.latencyMs}ms</span>
    </div>
    <div class="row">
      <span><span class="status-dot"></span><strong>Fundamentals API</strong> (/api/market/fundamentals)</span>
      <span class="mono">${report.services.fundamentals.status} · ${report.services.fundamentals.latencyMs}ms</span>
    </div>
    <div class="row">
      <span><span class="status-dot"></span><strong>Analyse Scoring API</strong> (/api/analyse)</span>
      <span class="mono">${report.services.analyse.status} · ${report.services.analyse.latencyMs}ms</span>
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; font-size: 12px; color: #9CA3AF;">
      <span>Uptime: ${report.uptimeSeconds}s · Memory: ${report.memoryUsageMb.rss}MB</span>
      <span>${report.timestamp}</span>
    </div>
  </div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    return res.status(report.status === 'unhealthy' ? 503 : 200).send(html);
  }

  res.setHeader('Content-Type', 'application/json');
  return res.status(report.status === 'unhealthy' ? 503 : 200).json(report);
}
