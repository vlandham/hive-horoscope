# Hive Horoscope: project notes

Personal project (Jim). A static, client-only web page that analyzes a person's NYT Spelling Bee history (words found, in found order) and presents analytical + astrology-style readings. Goal: shareable so others can run it on their own data, including from a phone.

## Layout
- `index.html`: the whole app (HTML, CSS, JS in one file, no build step). Loads `data/sample.json` if present.
- `export/export.js`: export script users run on nytimes.com (bookmarklet or console). Shows a progress panel, then opens the hosted page and hands the data over, or downloads it. Also embedded in index.html (`#export-src`); keep the two in sync. The page builds the bookmarklet from `#export-src` at runtime and swaps the hosted URL for its own when served elsewhere (e.g. localhost). Keep it ASCII and free of `</script`.
- Hosting: GitHub Pages from `main` at https://vallandingham.me/hive-horoscope/ (custom domain comes from the vlandham.github.io user site). `.nojekyll` skips Jekyll.
- Handoff: the export opens `<page>#from-nyt`; the page posts `{type:"hive-horoscope-ready"}` to `window.opener` (www.nytimes.com only) and accepts `{type:"spelling-bee-history", data}` only from that origin.
- Page state lives on `body[data-state]`: loading, empty (intro shown) or loaded (`.needs-data` sections shown).
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
1. Test the bookmarklet handoff end to end on desktop Chrome/Safari and on a phone (only tested against a mock page so far).
2. Themes: categorize found words (food, animals, etc.) via a word-category list or an LLM pass.
3. "Words you missed": match print_date to an answer archive.
