// Spelling Bee history export
// Run in the DevTools console on https://www.nytimes.com/puzzles/spelling-bee while signed in.
// Read-only: only asks for your saved games. Never changes anything.
// Downloads spelling-bee-history-YYYY-MM-DD.json when done.
(async () => {
  const ID_MIN = 1, ID_MAX = 32000, BATCH = 25, DELAY_MS = 300;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const url = (ids) => `/svc/games/state/spelling_bee/latests?puzzle_ids=${ids.join(",")}`;
  const collect = (node, out = []) => {
    if (Array.isArray(node)) node.forEach((n) => collect(n, out));
    else if (node && typeof node === "object") {
      if (node.game_data && Array.isArray(node.game_data.answers)) out.push(node);
      else Object.values(node).forEach((v) => collect(v, out));
    }
    return out;
  };
  const states = new Map();
  const total = Math.ceil((ID_MAX - ID_MIN + 1) / BATCH);
  let n = 0;
  for (let lo = ID_MIN; lo <= ID_MAX; lo += BATCH) {
    const ids = [];
    for (let id = lo; id < lo + BATCH && id <= ID_MAX; id++) ids.push(id);
    n++;
    try {
      const res = await fetch(url(ids), { credentials: "include" });
      if (res.status === 429) { console.warn("Rate limited; waiting 30s"); await sleep(30000); lo -= BATCH; n--; continue; }
      if (res.status === 401 || res.status === 403) { console.warn("Not signed in. Sign in and run again."); return; }
      if (res.ok) for (const s of collect(await res.json())) states.set(String(s.puzzle_id), s);
    } catch (e) { console.warn(`Error at ids ${ids[0]}-${ids[ids.length - 1]}`, e); }
    if (n % 40 === 0) console.log(`${n}/${total} requests, ${states.size} games found`);
    await sleep(DELAY_MS);
  }
  const output = { exported_at: new Date().toISOString(), puzzle_count: states.size, states: [...states.values()] };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(output)], { type: "application/json" }));
  a.download = `spelling-bee-history-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  console.log(`Done: ${states.size} games exported.`);
})();
