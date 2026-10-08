// @ts-check
/**
 * Health check handler for InvestWise APIs
 * Can be imported directly or served via Express router
 */

export async function checkAllApisHealth(baseUrl = 'http://localhost:3000') {
  const startTime = Date.now();
  const checks = {
    quote: { status: 'pending', latencyMs: 0, details: null },
    search: { status: 'pending', latencyMs: 0, details: null },
    history: { status: 'pending', latencyMs: 0, details: null },
    fundamentals: { status: 'pending', latencyMs: 0, details: null },
    analyse: { status: 'pending', latencyMs: 0, details: null },
  };

  // Helper to time an async probe
  async function probe(name, fn) {
    const t0 = Date.now();
    try {
      const res = await fn();
      checks[name].status = res.ok ? 'operational' : 'degraded';
      checks[name].latencyMs = Date.now() - t0;
      checks[name].details = res.data;
    } catch (err) {
      checks[name].status = 'down';
      checks[name].latencyMs = Date.now() - t0;
      checks[name].error = err.message || String(err);
    }
  }

  // Probe Quote API
  await probe('quote', async () => {
    const res = await fetch(`${baseUrl}/api/market/quote?symbol=AAPL`);
    const data = await res.json();
    return { ok: res.ok && data?.symbol === 'AAPL', data: { symbol: data?.symbol, price: data?.price } };
  });

  // Probe Search API
  await probe('search', async () => {
    const res = await fetch(`${baseUrl}/api/market/search?q=Apple`);
    const data = await res.json();
    return { ok: res.ok && Array.isArray(data?.results), data: { count: data?.results?.length } };
  });

  // Probe History API
  await probe('history', async () => {
    const res = await fetch(`${baseUrl}/api/market/history?symbol=MSFT&range=1d`);
    const data = await res.json();
    return { ok: res.ok && Array.isArray(data?.data), data: { pointsCount: data?.data?.length } };
  });

  // Probe Fundamentals API
  await probe('fundamentals', async () => {
    const res = await fetch(`${baseUrl}/api/market/fundamentals?symbol=VOO`);
    const data = await res.json();
    return { ok: res.ok && data?.symbol === 'VOO', data: { symbol: data?.symbol, pe: data?.trailingPE } };
  });

  // Probe Analyse Engine API
  await probe('analyse', async () => {
    const res = await fetch(`${baseUrl}/api/analyse?riskProfile=Growth&symbols=AAPL,MSFT`);
    const data = await res.json();
    return {
      ok: res.ok && Array.isArray(data?.opportunities),
      data: { sentiment: data?.marketSentiment, opportunitiesCount: data?.opportunities?.length },
    };
  });

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
    services: checks,
  };
}

/**
 * Standard Node/Express handler
 */
export default async function handler(req, res) {
  const host = req.headers?.host || 'localhost:3000';
  const protocol = req.headers?.['x-forwarded-proto'] || 'http';
  const baseUrl = `${protocol}://${host}`;

  const report = await checkAllApisHealth(baseUrl);

  // Return HTML visual report if requested via browser
  const acceptHeader = req.headers?.accept || '';
  if (acceptHeader.includes('text/html') && !req.query?.format?.includes('json')) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>InvestWise API Health Status</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #F8F9FA; color: #111827; margin: 0; padding: 40px 20px; }
    .card { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #E5E7EB; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .badge-healthy { background: #DCFCE7; color: #15803D; }
    .badge-degraded { background: #FEF3C7; color: #B45309; }
    .badge-down { background: #FEE2E2; color: #B91C1C; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #F3F4F6; }
    .mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 13px; color: #4B5563; }
    .h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.02em; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
        <h1 class="h1">InvestWise API Health</h1>
        <div style="font-size: 13px; color: #6B7280;">System Latency & Status Monitor</div>
      </div>
      <span class="badge badge-${report.status}">${report.status}</span>
    </div>
    
    <div class="row">
      <span><strong>Overall Health</strong></span>
      <span class="mono">${report.totalDurationMs}ms total check time</span>
    </div>
    <div class="row">
      <span><strong>Quote API</strong> (/api/market/quote)</span>
      <span class="mono">${report.services.quote.status} (${report.services.quote.latencyMs}ms)</span>
    </div>
    <div class="row">
      <span><strong>Search API</strong> (/api/market/search)</span>
      <span class="mono">${report.services.search.status} (${report.services.search.latencyMs}ms)</span>
    </div>
    <div class="row">
      <span><strong>History API</strong> (/api/market/history)</span>
      <span class="mono">${report.services.history.status} (${report.services.history.latencyMs}ms)</span>
    </div>
    <div class="row">
      <span><strong>Fundamentals API</strong> (/api/market/fundamentals)</span>
      <span class="mono">${report.services.fundamentals.status} (${report.services.fundamentals.latencyMs}ms)</span>
    </div>
    <div class="row">
      <span><strong>Analyse Scoring API</strong> (/api/analyse)</span>
      <span class="mono">${report.services.analyse.status} (${report.services.analyse.latencyMs}ms)</span>
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; font-size: 12px; color: #9CA3AF;">
      <span>Uptime: ${report.uptimeSeconds}s · Memory: ${report.memoryUsageMb.rss}MB</span>
      <span>${report.timestamp}</span>
    </div>
  </div>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    return res.status(report.status === 'down' ? 503 : 200).send(html);
  }

  res.setHeader('Content-Type', 'application/json');
  return res.status(report.status === 'down' ? 503 : 200).json(report);
}
