#!/usr/bin/env python3
"""Pull public Codolio stats into data/practice.json.

No token. Codolio aggregates LeetCode, GFG, CodeChef, Codeforces,
HackerRank, InterviewBit and AtCoder. Days are IST (Asia/Kolkata).
"""
from __future__ import annotations

import json
import sys
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

USER = "soumyadeepdas"
URL = f"https://api.codolio.com/profile?userKey={USER}"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "practice.json"
IST = ZoneInfo("Asia/Kolkata")


def cal_day(ts: int) -> date:
    # Codolio keys are UTC midnight of the activity day — same calendar
    # date in IST as in UTC for these stamps.
    return datetime.fromtimestamp(int(ts), tz=timezone.utc).date()


def today_ist() -> date:
    return datetime.now(IST).date()


def streak_ending(days: set[date], end: date) -> int:
    n = 0
    d = end
    while d in days:
        n += 1
        d -= timedelta(days=1)
    return n


def max_streak(days: list[date]) -> int:
    if not days:
        return 0
    best = cur = 1
    for i in range(1, len(days)):
        if (days[i] - days[i - 1]).days == 1:
            cur += 1
            best = max(best, cur)
        else:
            cur = 1
    return best


def fetch() -> dict:
    req = urllib.request.Request(
        URL,
        headers={
            "User-Agent": "soumyadeep.space-practice-bot/1.0",
            "Accept": "application/json",
            "Referer": "https://codolio.com/",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        payload = json.loads(res.read().decode("utf-8"))
    if not payload.get("status", {}).get("success"):
        raise SystemExit(f"Codolio error: {payload.get('status')}")
    return payload["data"]


def build(data: dict) -> dict:
    profiles = (data.get("platformProfiles") or {}).get("platformProfiles") or []
    merged: dict[str, int] = {}
    days: set[date] = set()
    solved = 0
    platforms = []

    for p in profiles:
        name = p.get("platform") or "unknown"
        stats = p.get("totalQuestionStats") or {}
        count = stats.get("totalQuestionCounts") or 0
        solved += count
        platforms.append(name)
        cal = (p.get("dailyActivityStatsResponse") or {}).get("submissionCalendar") or {}
        for ts, n in cal.items():
            day = cal_day(ts)
            key = day.isoformat()
            merged[key] = merged.get(key, 0) + int(n)
            days.add(day)

    ordered = sorted(days)
    today = today_ist()
    end = today if today in days else today - timedelta(days=1)

    return {
        "updated": today.isoformat(),
        "profile": f"https://codolio.com/profile/{USER}",
        "solved": solved,
        "activeDays": len(days),
        "maxStreak": max_streak(ordered),
        "currentStreak": streak_ending(days, end),
        "platforms": platforms,
        "calendar": {k: merged[k] for k in sorted(merged)},
    }


def main() -> None:
    stats = build(fetch())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(stats, indent=2, ensure_ascii=False) + "\n"
    if OUT.exists() and OUT.read_text(encoding="utf-8") == text:
        print(f"unchanged: {stats['solved']} solved, {stats['currentStreak']} streak")
        return
    OUT.write_text(text, encoding="utf-8")
    print(
        f"wrote {OUT.relative_to(ROOT)} — "
        f"{stats['solved']} solved, {stats['activeDays']} days, "
        f"{stats['currentStreak']} current / {stats['maxStreak']} max streak"
    )


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"fetch failed: {exc}", file=sys.stderr)
        sys.exit(1)
