# Hive Horoscope: project notes

Personal project (Jim). A static, client-only web page that analyzes a person's NYT Spelling Bee history (words found, in found order) and presents analytical + astrology-style readings. Goal: shareable so others can run it on their own data, including from a phone.

## Layout
- `index.html`: the whole app (HTML, CSS, JS in one file, no build step). Loads `data/sample.json` if present.
- `export/export.js`: console script users run on nytimes.com to download their history. Also embedded in index.html (`#export-src`); keep the two in sync.
- `data/sample.json`: Jim's history in compact form `{compact:1,label,games:[[puzzle_id, unix_ts, print_date, rank, [words...]]]}`. Gitignored by default.
- `tools/quick_stats.py`: first-pass stats over a raw export file.

## What we learned about the data (undocumented NYT endpoints; may change)
- Read: `GET /svc/games/state/spelling_bee/latests?puzzle_ids=a,b,c` with the user's NYT cookies (same-origin fetch from nytimes.com). Max 25 IDs per request; 50+ returns 400.
- Each state: `{puzzle_id, timestamp, print_date, schema_version, game_data:{answers:[...], rank, isRevealed}}`. `answers` is in the ORDER FOUND. `timestamp` is the last save only; there is no per-word timing. Old states (schema 0.2.x/0.16) have empty `print_date` and may lack `rank`.
- Write (do not call): `POST /svc/games/state` saves progress.
- Puzzle IDs are NOT chronological (Oct 5–17 2026 spanned 14844–26032). Export sweeps IDs 1–32000 at 25/request, ~300ms apart.
- Many states have empty `answers` (opened, not played).
- Puzzle letters/full answer lists only come from `window.gameData` on the puzzle page, for roughly the last two weeks. Older answer lists would need a third-party archive matched by date.
- NYT account stats (`player.stats.spelling_bee`) report more words/pangrams than the saved states contain (4109 vs 2771 for Jim); treat states as the source for order, stats as official totals.

## Readings (in index.html)
- Sun = time bucket of last save (Night Moth, Dawn Forager, Morning Scout, Afternoon Drifter, Dusk Gatherer, Lamplight Hunter).
- Rising = first-word length vs overall average (Big Swing / Warm-Up / Steady Start).
- Moon = rate of a word extending/trimming the previous one (Builder ≥15%, Tinkerer ≥7%, Roamer).
- Houses: Element (word-length mix), Pangram timing, Ruling day, Resting rank, Totem word, Crown word.
- Pangram = word with 7 distinct letters (inferred; no letter data for old puzzles).
- Hive = 7 most-used letters.

## Constraints
- Never ask users for their NYT cookie or credentials; the export must run in their own signed-in browser.
- Keep everything client-side; no user data leaves the browser.
- Keep request rate slow.

## Next steps
1. Bookmarklet: run the export on nytimes.com, then open the hosted page and hand the data over via `postMessage` (index.html already listens for `{type:"spelling-bee-history", data}`). Needs a stable hosted origin, e.g. GitHub Pages.
2. Phone instructions (iOS Safari bookmarklet via editing a bookmark's URL; Android Chrome via typing the bookmark name).
3. Themes: categorize found words (food, animals, etc.) via a word-category list or an LLM pass.
4. "Words you missed": match print_date to an answer archive.
5. Empty state for visitors with no sample loaded.
