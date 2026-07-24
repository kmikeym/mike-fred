#!/usr/bin/env bash
# mike-fred-lmv-pull.sh
# Computes the LMV (Longform Media Velocity) input from public RSS — books from
# Goodreads, films from Letterboxd — so it stops being hand-keyed. Companion to
# vault-pull.sh / rescuetime-pull.sh (gather) and append-month.sh (write).
#
# Scoring (Mike's spreadsheet formula, canonical):
#   =IF(type="Movie", 1, IF(pages<200, 2, IF(pages<400, 3, IF(pages<600, 4, 5))))
#   films = 1 pt; books = 2-5 pts by length: <200p->2, 200-399->3, 400-599->4, >=600->5
#   (unknown page count -> 3 (middle), flagged in the output)
#
# Items are bucketed into a month by their READ/WATCH date:
#   films: <letterboxd:watchedDate>   books: <user_read_at>
# A book with no read date can't be attributed to a month — it's listed as
# "undated" and NOT counted (honest, rather than guessed).
#
# Freshness: Mike hand-logs both sources, so the script prints the latest entry
# date in each feed and warns if a feed looks behind — verify before trusting a
# recent month.
#
# This script does NOT edit any CSV or push. Usage:
#   ./scripts/mike-fred-lmv-pull.sh [YYYY-MM]   (DATA month; defaults to last month)
# LMV is release-lag: a data month lands in a row dated the following 1st.

set -euo pipefail

# Feed URLs (override in env if the accounts ever move).
LB_URL="${MIKE_FRED_LETTERBOXD_RSS:-https://letterboxd.com/kmikeym/rss/}"
GR_URL="${MIKE_FRED_GOODREADS_RSS:-https://www.goodreads.com/review/list_rss/3105910?shelf=read}"

if [ "${1:-}" != "" ]; then
  MONTH="$1"
else
  MONTH=$(date -v-1m +%Y-%m 2>/dev/null || date -d "last month" +%Y-%m)
fi

MONTH="$MONTH" LB_URL="$LB_URL" GR_URL="$GR_URL" python3 - <<'PY'
import os, sys, re, urllib.request, datetime, calendar
from email.utils import parsedate_to_datetime

month = os.environ["MONTH"]
y, m = (int(x) for x in month.split("-"))
today = datetime.date.today()

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")

def items(xml):
    return re.findall(r"<item>(.*?)</item>", xml, re.S)

def tag(block, name):
    mo = re.search(rf"<{name}>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</{name}>", block, re.S)
    return mo.group(1).strip() if mo else None

def book_points(pages):
    if pages is None: return 3, True
    if pages < 200: return 2, False
    if pages < 400: return 3, False
    if pages < 600: return 4, False
    return 5, False

# --- Films (Letterboxd) ---
film_pts = 0; films = []; lb_latest = None
try:
    for it in items(fetch(os.environ["LB_URL"])):
        wd = tag(it, "letterboxd:watchedDate")
        title = tag(it, "letterboxd:filmTitle") or tag(it, "title")
        if not wd: continue
        d = datetime.date.fromisoformat(wd)
        lb_latest = max(lb_latest, d) if lb_latest else d
        if d.year == y and d.month == m:
            films.append((wd, title)); film_pts += 1
    lb_err = None
except Exception as e:
    lb_err = str(e)

# --- Books (Goodreads) ---
book_pts = 0; books = []; undated = []; gr_latest = None
try:
    for it in items(fetch(os.environ["GR_URL"])):
        title = tag(it, "title"); pages = tag(it, "num_pages")
        pages = int(pages) if pages and pages.isdigit() else None
        ra = tag(it, "user_read_at")
        if not ra:
            undated.append(title); continue
        d = parsedate_to_datetime(ra).date()
        gr_latest = max(gr_latest, d) if gr_latest else d
        if d.year == y and d.month == m:
            pts, unknown = book_points(pages)
            book_pts += pts
            books.append((d.isoformat(), title, pages, pts, unknown))
    gr_err = None
except Exception as e:
    gr_err = str(e)

total = film_pts + book_pts
print(f"=== MIKE FRED LMV pull — data month: {month} ===\n")

print(f"FILMS (Letterboxd, 1 pt each): {len(films)} -> {film_pts} pts")
for wd, t in sorted(films): print(f"    {wd}  {t}")
if lb_err: print(f"    ⚠️ Letterboxd fetch failed: {lb_err}")

print(f"\nBOOKS (Goodreads, 2-5 pts by length): {len(books)} -> {book_pts} pts")
for d, t, pages, pts, unknown in sorted(books):
    pg = f"{pages}p" if pages else "??p"
    flag = "  (page count unknown -> default 3)" if unknown else ""
    print(f"    {d}  {t}  [{pg} -> {pts}pt]{flag}")
if gr_err: print(f"    ⚠️ Goodreads fetch failed: {gr_err}")

print(f"\nLMV TOTAL: {total} pts  (films {film_pts} + books {book_pts})")

# freshness — Mike hand-logs both
def fresh(label, latest, err):
    if err: return
    if latest is None:
        print(f"  {label}: no dated entries in feed."); return
    stale = (today - latest).days
    flag = "  ⚠️ feed may be behind — verify recent entries are logged" if stale > 10 else ""
    print(f"  {label}: latest entry {latest.isoformat()} ({stale}d ago){flag}")
print("\nFreshness (both are hand-logged by Mike):")
fresh("Letterboxd", lb_latest, lb_err)
fresh("Goodreads ", gr_latest, gr_err)
if undated:
    print(f"  Goodreads: {len(undated)} read book(s) have NO read date — not counted "
          f"(e.g. {undated[0][:40]})")

# release-lag row
row_date = (datetime.date(y, m, 1) + datetime.timedelta(days=32)).replace(day=1).isoformat()
print(f"\n  -> completion-rate.csv row (release-lag, dated {row_date}):")
print(f"     {row_date},{total},\"<note: N films + M books>\"")
PY
