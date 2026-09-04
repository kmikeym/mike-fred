#!/usr/bin/env bash
# MIKE FRED — SCI (Social Capital Index) pull.
#
# SCI is a WEIGHTED MEAN of 11 platform follower counts (weights in lib/sci.ts,
# summing to 1), then indexed: index = raw_composite / 3041.9 * 100.
#
# This script retrieves the platforms that expose a public count and prints the
# rest as an explicit ask. It writes nothing: like the other pulls, it prints and
# you decide what lands.
#
# ⚠️ weightedComposite() THROWS on a missing platform rather than scoring it zero.
# All 11 counts are required. A partial pull is not a smaller pull.
set -uo pipefail

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
say() { printf "  %-30s %s\n" "$1" "$2"; }

echo "=== MIKE FRED SCI pull — $(date +%Y-%m-%d) ==="
echo
echo "AUTOMATED (public endpoints, no auth):"

# X — x.com does not expose the count to an unauthenticated fetch; the fxtwitter
# mirror does. Third-party dependency: if it dies, this line goes manual.
X=$(curl -s --max-time 15 -A "$UA" "https://api.fxtwitter.com/kmikeym" \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['user']['followers'])" 2>/dev/null)
say "X (@kmikeym)" "${X:-FAILED — get manually}"

# Instagram — count is in an og meta tag on the public profile.
IG=$(curl -s --max-time 15 -A "$UA" "https://www.instagram.com/kmikeym/" \
    | grep -oE 'content="[0-9,]+ Followers' | head -1 | grep -oE '[0-9,]+' | tr -d ,)
say "Instagram (@kmikeym)" "${IG:-FAILED — get manually}"

# YouTube — the channel is @mike-merrill, NOT @kmikeym (@kmikeym 404s).
# /user/kmikeym also resolves and redirects there.
YT=$(curl -s --max-time 15 -A "$UA" "https://www.youtube.com/@mike-merrill" \
    | grep -oE '"content":"[0-9.]+K? subscribers"' | head -1 | grep -oE '[0-9.]+K?')
say "YouTube (@mike-merrill)" "${YT:-FAILED — get manually}"

# Bluesky — public XRPC, no auth. Handle is kmikeym.com (kmikeym.bsky.social 404s).
BS=$(curl -s --max-time 15 "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=kmikeym.com" \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['followersCount'])" 2>/dev/null)
say "Bluesky (kmikeym.com)" "${BS:-FAILED — get manually}"

# Mastodon — public API. Verified mastodon.social/@kmikeym, created 2023-02-18.
MA=$(curl -s --max-time 15 "https://mastodon.social/api/v1/accounts/lookup?acct=kmikeym" \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['followers_count'])" 2>/dev/null)
say "Mastodon (mastodon.social)" "${MA:-FAILED — get manually}"

echo
echo "SEMI-AUTOMATED (retrievable but NOT precise):"
SS=$(curl -s --max-time 15 -A "$UA" "https://kmikeym.substack.com/" \
    | grep -oiE "[0-9,]+ subscribers" | head -1 | grep -oE '[0-9,]+' | tr -d ,)
say "Substack" "${SS:-FAILED} ⚠️ PUBLIC PAGE ROUNDS"
echo "     Substack's public page rounds (it shows '3,000', not the real figure)."
echo "     At weight 0.30 that rounding is material. Get the exact number from"
echo "     the Substack dashboard until an authenticated pull exists."

echo
echo "STILL NEEDED FROM MIKE (auth-walled or undefined):"
echo "     KmikeyM accounts          weight 0.35  = TOTAL USER ACCOUNTS (not shareholders!)"
echo "                                              ADMIN PANEL — Mike only, see ops#571"
echo "     LinkedIn (Mike)           weight 0.09  auth-walled"
echo "     KmikeyM LinkedIn (biz)    weight 0.01  auth-walled"
echo "     Facebook (personal)       weight 0.01  auth-walled"
echo "     KmikeyM Facebook (biz)    weight 0.01  auth-walled"
echo
echo "     ⚠️ 'KmikeyM accounts' is TOTAL USER ACCOUNTS on kmikeym.com, NOT the"
echo "        shareholder count. On 2026-09-04: 3,965 accounts vs 1,248"
echo "        shareholders. Using the wrong one moves the index by a third."
echo "        (Mike, 2026-09-04), read off /users/leaderboard. It is the single"
echo "        largest weight at 0.35, so it is never a guess and never an estimate."
echo "        The page requires a login and the MCP leaderboard tool caps at 50"
echo "        rows with no total, so there is no unauthenticated path to it."
echo "        Blocked in auto mode by operations#501 (the classifier stops the"
echo "        K5M.bot login itself). Until that is fixed: ask Mike, or capture it"
echo "        during any logged-in session."
echo
echo "Coverage: 5 of 11 platforms automated cleanly = 0.23 of index weight."
echo "          6 of 11 with Substack rounded        = 0.53 of index weight."
echo "          Remaining 0.47 needs Mike."
echo
echo "Then: index = weighted_mean(all 11) / 3041.9 * 100  ->  social-capital.csv"
echo "      row dated the RELEASE month (month N reports month N-1)."
