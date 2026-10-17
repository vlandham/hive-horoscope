// Spelling Bee history export for Hive Horoscope
// Run on https://www.nytimes.com/puzzles/spelling-bee while signed in, from the Hive Horoscope
// bookmarklet or by pasting this into the DevTools console.
// Read-only: only asks for your saved games. Never changes anything.
// Shows a progress panel; when done, opens Hive Horoscope with your history or downloads it as a file.
void (async () => {
  const HIVE_URL = "https://vallandingham.me/hive-horoscope/";
  const ID_MIN = 1, ID_MAX = 32000, BATCH = 25, DELAY_MS = 300;
  if (location.hostname !== "www.nytimes.com") { alert("Open the Spelling Bee on nytimes.com, sign in, then run this again."); return; }
  if (document.getElementById("hive-export")) return;
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

  // Progress panel, in a shadow root so the NYT page styles don't reach it.
  const host = document.createElement("div");
  host.id = "hive-export";
  host.style.cssText = "position:fixed;z-index:2147483647;right:16px;bottom:16px;left:16px;display:flex;justify-content:flex-end;pointer-events:none";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `<style>
    .p { pointer-events:auto; position:relative; width:340px; max-width:100%; box-sizing:border-box; padding:18px 18px 16px; border-radius:14px;
      background:#1D1A2B; color:#ECE8F6; font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif; box-shadow:0 12px 40px rgba(0,0,0,.35); }
    b { display:block; font-size:16px; margin-bottom:6px; padding-right:28px; }
    p { margin:0 0 12px; color:#C9C3DB; }
    .bar { height:6px; border-radius:3px; background:#34304A; overflow:hidden; }
    .bar i { display:block; height:100%; width:0; background:#E6AA36; transition:width .3s; }
    .row { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
    .row[hidden] { display:none; }
    button { font:600 14px system-ui,-apple-system,sans-serif; border-radius:999px; padding:9px 14px; cursor:pointer; border:1px solid #4A4563; background:transparent; color:#ECE8F6; }
    button.main { background:#E6AA36; border-color:#E6AA36; color:#1D1A2B; }
    .x { position:absolute; top:10px; right:10px; padding:2px 9px; font-size:18px; border:0; }
  </style><div class="p" role="status"><b>Hive Horoscope export</b><p id="msg">Starting&hellip;</p><div class="bar"><i id="fill"></i></div>
    <div class="row" id="row" hidden><button class="main" id="open">Open my Hive Horoscope</button><button id="save">Download file</button></div>
    <button class="x" id="x" aria-label="Stop and close">&times;</button></div>`;
  document.body.appendChild(host);
  const $ = (id) => root.getElementById(id);
  const say = (m) => { $("msg").textContent = m; };
  let stopped = false;
  $("x").onclick = () => { stopped = true; host.remove(); };

  const states = new Map();
  const total = Math.ceil((ID_MAX - ID_MIN + 1) / BATCH);
  let n = 0;
  for (let lo = ID_MIN; lo <= ID_MAX && !stopped; lo += BATCH) {
    const ids = [];
    for (let id = lo; id < lo + BATCH && id <= ID_MAX; id++) ids.push(id);
    n++;
    try {
      const res = await fetch(url(ids), { credentials: "include" });
      if (res.status === 429) { say("NYT asked us to slow down. Waiting 30 seconds\u2026"); await sleep(30000); lo -= BATCH; n--; continue; }
      if (res.status === 401 || res.status === 403) { say("You're not signed in. Sign in to nytimes.com and run this again."); return; }
      if (res.ok) for (const s of collect(await res.json())) states.set(String(s.puzzle_id), s);
    } catch (e) { console.warn(`Error at ids ${ids[0]}-${ids[ids.length - 1]}`, e); }
    $("fill").style.width = `${(100 * n) / total}%`;
    say(`Reading your saved games: ${Math.round((100 * n) / total)}%, ${states.size} found. Takes about ten minutes; keep this tab open and in front.`);
    await sleep(DELAY_MS);
  }
  if (stopped) return;

  const output = { exported_at: new Date().toISOString(), puzzle_count: states.size, states: [...states.values()] };
  const played = output.states.filter((s) => s.game_data.answers.length).length;
  console.log(`Done: ${states.size} games exported.`);
  if (!played) { say("No played games found. Make sure you're signed in to the account you play on, then run this again."); return; }
  say(`Done: ${played} played games. Open them in Hive Horoscope, or download a copy to keep.`);
  $("fill").style.width = "100%";
  $("row").hidden = false;

  $("save").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(output)], { type: "application/json" }));
    a.download = `spelling-bee-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
  };
  // Hand the data to the Hive Horoscope tab once it says it's ready. Only that origin can receive it.
  $("open").onclick = () => {
    const origin = new URL(HIVE_URL).origin;
    const w = window.open(`${HIVE_URL}#from-nyt`, "_blank");
    if (!w) { say("Your browser blocked the new tab. Choose Download file, then drop the file on the Hive Horoscope page."); return; }
    const onMsg = (e) => {
      if (e.source !== w || e.origin !== origin || !e.data || e.data.type !== "hive-horoscope-ready") return;
      w.postMessage({ type: "spelling-bee-history", data: output }, origin);
      removeEventListener("message", onMsg);
      say("Sent to Hive Horoscope. You can close this panel.");
    };
    addEventListener("message", onMsg);
  };
})();
