# Hive Horoscope

A Spelling Bee "natal chart": reads the order, length and timing of the words you've found in the NYT Spelling Bee and turns them into astrology-style readings and charts.

Live at https://vallandingham.me/hive-horoscope/ (GitHub Pages, deployed from `main`).

## Run it

    python3 -m http.server 8000
    # open http://localhost:8000

`data/sample.json` loads as the demo if present (it's gitignored, so the hosted page shows the empty state instead). Anyone can drop their own export file on the page; nothing is uploaded.

## Get your data

The page offers a "Hive export" bookmarklet built from `export/export.js`. Run it on https://www.nytimes.com/puzzles/spelling-bee while signed in (or paste the script into the DevTools console). A panel shows progress for about ten minutes, then offers:

- **Open my Hive Horoscope**: opens the page and hands the history over with `postMessage` (the page says it's ready, the panel posts back; both sides check origins).
- **Download file**: a `.json` file to drop on the page later.

## Quick stats

    python3 tools/quick_stats.py path/to/spelling-bee-history.json
