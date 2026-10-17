# Hive Horoscope

A Spelling Bee "natal chart": reads the order, length and timing of the words you've found in the NYT Spelling Bee and turns them into astrology-style readings and charts.

## Run it

    python3 -m http.server 8000
    # open http://localhost:8000

`data/sample.json` loads as the demo if present. Anyone can drop their own export file on the page; nothing is uploaded.

## Get your data

Paste `export/export.js` into the DevTools console on https://www.nytimes.com/puzzles/spelling-bee while signed in. It takes about ten minutes and downloads a `.json` file.

## Quick stats

    python3 tools/quick_stats.py path/to/spelling-bee-history.json
