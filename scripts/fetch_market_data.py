#!/usr/bin/env python3
"""
InvestWise Market Data Puller (Python)
Pulls real-time market data directly from Yahoo Finance via query1.finance.yahoo.com
and query2.finance.yahoo.com, normalizes it for InvestWise, and commits/pushes to GitHub.
"""

import sys
import os
import json
import time
import subprocess
import urllib.request
import urllib.parse
import http.cookiejar
from datetime import datetime

DEFAULT_SYMBOLS = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA",
    "VOO", "QQQ", "SPY", "VTI"
]

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data", "market_data.json")

class YahooFinanceClient:
    def __init__(self):
        self.cookie_jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookie_jar))
        self.opener.addheaders = [
            ("User-Agent", USER_AGENT),
            ("Accept", "application/json"),
            ("Accept-Language", "en-US,en;q=0.9"),
        ]
        self.crumb = None
        self._init_session()

    def _init_session(self):
        try:
            # Step 1: obtain session cookie
            req = urllib.request.Request("https://fc.yahoo.com")
            try:
                self.opener.open(req)
            except urllib.error.HTTPError:
                pass  # Cookie is set despite redirect/404

            # Step 2: obtain crumb
            crumb_req = urllib.request.Request("https://query1.finance.yahoo.com/v1/test/getcrumb")
            crumb_resp = self.opener.open(crumb_req, timeout=6)
            self.crumb = crumb_resp.read().decode("utf-8").strip()
            print(f"[✓] Initialized Yahoo Finance session with crumb: {self.crumb}")
        except Exception as e:
            print(f"[!] Warning: Could not obtain crumb session: {e}. Falling back to chart endpoints.")

    def fetch_chart(self, symbol, range_period="1y", interval="1d"):
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{urllib.parse.quote(symbol)}?range={range_period}&interval={interval}"
        try:
            req = urllib.request.Request(url)
            with self.opener.open(req, timeout=8) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"  [!] Chart error for {symbol}: {e}")
        return None

    def fetch_summary(self, symbol):
        if not self.crumb:
            return None
        modules = "price,summaryDetail,defaultKeyStatistics,financialData,assetProfile"
        url = f"https://query2.finance.yahoo.com/v10/finance/quoteSummary/{urllib.parse.quote(symbol)}?crumb={urllib.parse.quote(self.crumb)}&modules={modules}"
        try:
            req = urllib.request.Request(url)
            with self.opener.open(req, timeout=8) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            # Silent fallback
            pass
        return None

    def get_asset(self, symbol):
        chart_data = self.fetch_chart(symbol)
        summary_data = self.fetch_summary(symbol)

        meta = {}
        history = []
        if chart_data and "chart" in chart_data and chart_data["chart"].get("result"):
            res = chart_data["chart"]["result"][0]
            meta = res.get("meta", {})
            timestamps = res.get("timestamp", [])
            quotes = res.get("indicators", {}).get("quote", [{}])[0]
            closes = quotes.get("close", [])
            for i in range(len(timestamps)):
                if i < len(closes) and closes[i] is not None:
                    history.append({
                        "timestamp": timestamps[i] * 1000,
                        "date": datetime.utcfromtimestamp(timestamps[i]).strftime("%Y-%m-%d"),
                        "price": round(closes[i], 2)
                    })

        qs = {}
        if summary_data and "quoteSummary" in summary_data and summary_data["quoteSummary"].get("result"):
            qs = summary_data["quoteSummary"]["result"][0]

        fin = qs.get("financialData", {})
        stats = qs.get("defaultKeyStatistics", {})
        summary = qs.get("summaryDetail", {})
        price = qs.get("price", {})
        profile = qs.get("assetProfile", {})

        current_price = meta.get("regularMarketPrice") or price.get("regularMarketPrice", {}).get("raw")
        prev_close = meta.get("chartPreviousClose") or meta.get("previousClose") or price.get("regularMarketPreviousClose", {}).get("raw")

        change = None
        change_pct = None
        if current_price and prev_close:
            change = round(current_price - prev_close, 2)
            change_pct = round(((current_price - prev_close) / prev_close) * 100, 2)

        is_etf = meta.get("instrumentType") == "ETF" or symbol in ["VOO", "QQQ", "SPY", "VTI"]

        quote_obj = {
            "symbol": symbol,
            "name": meta.get("longName") or meta.get("shortName") or price.get("longName") or price.get("shortName") or symbol,
            "price": round(current_price, 2) if current_price else None,
            "change": change,
            "changePercent": change_pct,
            "fiftyTwoWeekHigh": meta.get("fiftyTwoWeekHigh") or summary.get("fiftyTwoWeekHigh", {}).get("raw"),
            "fiftyTwoWeekLow": meta.get("fiftyTwoWeekLow") or summary.get("fiftyTwoWeekLow", {}).get("raw"),
            "dayHigh": meta.get("regularMarketDayHigh"),
            "dayLow": meta.get("regularMarketDayLow"),
            "marketCap": price.get("marketCap", {}).get("raw") or summary.get("marketCap", {}).get("raw"),
            "peRatio": summary.get("trailingPE", {}).get("raw"),
            "eps": stats.get("trailingEps", {}).get("raw"),
            "dividendYield": summary.get("dividendYield", {}).get("raw"),
            "beta": stats.get("beta", {}).get("raw") or (1.0 if is_etf else 1.1),
            "volume": meta.get("regularMarketVolume"),
            "avgVolume": summary.get("averageVolume", {}).get("raw"),
            "sector": profile.get("sector") or ("Diversified ETF" if is_etf else "US Equity"),
            "industry": profile.get("industry") or ("Index Fund" if is_etf else "General"),
            "currency": meta.get("currency", "USD"),
            "type": "etf" if is_etf else "stock",
            "lastUpdated": datetime.utcnow().isoformat() + "Z"
        }

        fundamentals_obj = {
            "symbol": symbol,
            "name": quote_obj["name"],
            "revenueGrowth": fin.get("revenueGrowth", {}).get("raw"),
            "profitMargin": fin.get("profitMargins", {}).get("raw"),
            "returnOnEquity": fin.get("returnOnEquity", {}).get("raw"),
            "debtToEquity": (fin.get("debtToEquity", {}).get("raw") / 100) if fin.get("debtToEquity", {}).get("raw") else None,
            "freeCashFlow": fin.get("freeCashflow", {}).get("raw"),
            "priceToBook": stats.get("priceToBook", {}).get("raw") or summary.get("priceToBook", {}).get("raw"),
            "forwardPE": summary.get("forwardPE", {}).get("raw"),
            "trailingPE": summary.get("trailingPE", {}).get("raw"),
            "trailingEps": stats.get("trailingEps", {}).get("raw"),
            "beta": quote_obj["beta"],
            "fiftyTwoWeekChange": stats.get("52WeekChange", {}).get("raw"),
            "summary": profile.get("longBusinessSummary"),
            "lastUpdated": datetime.utcnow().isoformat() + "Z"
        }

        return {
            "quote": quote_obj,
            "fundamentals": fundamentals_obj,
            "history": history
        }

def main():
    symbols = DEFAULT_SYMBOLS
    if len(sys.argv) > 1 and not sys.argv[1].startswith("--"):
        symbols = [s.strip().upper() for s in sys.argv[1].split(",") if s.strip()]

    print(f"\n=== InvestWise Market Pull via query1.finance.yahoo.com [{len(symbols)} tickers] ===")
    client = YahooFinanceClient()

    results = {}
    for sym in symbols:
        data = client.get_asset(sym)
        if data and data["quote"]["price"]:
            results[sym] = data
            q = data["quote"]
            print(f"  [+] {sym:<5} | Price: ${q['price']:<8} | Change: {q['changePercent']:>+5.2f}% | Name: {q['name']}")
        else:
            print(f"  [-] {sym:<5} | Could not fetch quote")
        time.sleep(0.3)

    payload = {
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "source": "query1.finance.yahoo.com",
        "totalAssets": len(results),
        "assets": results
    }

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"\n[✓] Saved {len(results)} assets to {OUTPUT_FILE}")

    # Push to GitHub if flag provided
    if "--push" in sys.argv:
        print("\n=== Pushing updated data to GitHub ===")
        try:
            repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            subprocess.run(["git", "add", OUTPUT_FILE], cwd=repo_root, check=True)
            commit_msg = f"chore(market-data): sync latest market snapshot from query1.finance.yahoo.com [{datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}]"
            subprocess.run(["git", "commit", "-m", commit_msg], cwd=repo_root, check=False)
            subprocess.run(["git", "push"], cwd=repo_root, check=True)
            print("[✓] Pushed live market data to GitHub successfully!")
        except Exception as e:
            print(f"[!] Git push warning: {e}")

if __name__ == "__main__":
    main()
