#!/usr/bin/env python3
"""
Minimal CLI helper to fetch Google Trends via pytrends and emit JSON.

Usage:
  python3 pytrends_service/fetch.py ai beauty fitness

Outputs a JSON array of normalized trend topics to stdout.
"""
import json
import sys
from typing import List, Dict, Any

from pytrends.request import TrendReq


def normalize_trends(keywords: List[str], geo: str = "US", timeframe: str = "now 7-d", top_n: int = 15) -> List[Dict[str, Any]]:
    pytrends = TrendReq(hl="en-US", tz=360)
    topics: List[Dict[str, Any]] = []

    try:
        trending_df = pytrends.trending_searches(pn="united_states")
        for idx, row in trending_df.head(top_n).iterrows():
            term = str(row[0])
            topics.append(
                {
                    "name": term,
                    "platform": "google",
                    "category": None,
                    "description": "Trending search (US)",
                    "source": "pytrends",
                    "score": None,
                    "velocity": None,
                    "raw_data": {"rank": idx + 1},
                }
            )
    except Exception as exc:  # pragma: no cover - logging only
        print(f"trending_searches failed: {exc}", file=sys.stderr)

    if keywords:
        try:
            pytrends.build_payload(keywords, timeframe=timeframe, geo=geo)
            interest_df = pytrends.interest_over_time()
            if not interest_df.empty:
                for kw in keywords:
                    series = interest_df.get(kw)
                    if series is None or series.empty:
                        continue
                    current = float(series.iloc[-1])
                    prev = float(series.iloc[-2]) if len(series) > 1 else current
                    velocity = current - prev
                    topics.append(
                        {
                            "name": kw,
                            "platform": "google",
                            "category": None,
                            "description": f"Search interest over time for {kw}",
                            "source": "pytrends",
                            "score": current,
                            "velocity": velocity,
                            "raw_data": {
                                "latest_timestamp": str(series.index[-1]),
                                "current": current,
                                "previous": prev,
                            },
                        }
                    )
        except Exception as exc:  # pragma: no cover - logging only
            print(f"interest_over_time failed: {exc}", file=sys.stderr)

    return topics


def main():
    keywords = sys.argv[1:] or ["ai", "beauty", "fitness", "gaming", "finance"]
    topics = normalize_trends(keywords)
    print(json.dumps(topics))


if __name__ == "__main__":
    main()
