/* =========================================================
   HISTORIER: lastes fra .NET-API-et (Data/Stories/*.json)
   ========================================================= */
let STORIES = []; // hentes fra /api/stories ved oppstart

const DIFF_NAMES = ["", "LETT", "MIDDELS", "VANSKELIG"];
const TIER_NOTES = ["", "Byggfeil: kompilatoren sier fra, men peker ikke alltid riktig.", "Koden kjører, men gir feil svar.", "Alt ser riktig ut, og feilen dukker bare opp under spesielle forhold."];
const RANKS = ["ROOKIE", "KONSTABEL", "ETTERFORSKER", "OVERBETJENT", "LEGENDE"];
const STORE_KEY = "kodedetektiv-dotnet-v1";

/* =========================================================
   STATE
   ========================================================= */
function newRun(story) {
  return {
    hearts: story.hearts, score: 0, current: 0, finished: false,
    cases: story.cases.map(() => ({ phase: "investigate", selected: null, wrongLines: [], wrongMotives: [], msg: null, msgGood: false, penalties: 0 }))
  };
}
function validRuns(runs) {
  if (!runs || typeof runs !== "object") return {};
  const out = {};
  for (const s of STORIES) {
    const r = runs[s.id];
    if (r && Array.isArray(r.cases) && r.cases.length === s.cases.length && typeof r.hearts === "number") out[s.id] = r;
  }
  return out;
}
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return JSON.parse(raw); } catch (e) {}
  return null;
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ runs: state.runs })); } catch (e) {}
}
function initialState() {
  return { screen: "menu", story: null, runs: validRuns((load() || {}).runs) };
}
let state = null; // settes når historiene er lastet

const story = () => STORIES.find(s => s.id === state.story);
const run = () => state.runs[state.story];
const solved = r => r ? r.cases.filter(c => c.phase === "solved").length : 0;

/* =========================================================
   PIXEL ART
   ========================================================= */
const SPRITES = {
  detective: {
    pal: { h: "#333c57", b: "#b13e53", s: "#e8b88a", e: "#1a1c2c", c: "#9c6b3c", d: "#6b4426", m: "#94b0c2", g: "#73eff7" },
    rows: [
      ".....hhhhhh.....", "....hhhhhhhh....", "....hbbbbbbh....", "..hhhhhhhhhhhh..",
      ".....ssssss.....", ".....sesses.....", ".....ssssss.....", "......ssss......",
      "....cccccccc....", "...ccdccccdcc...", "...ccdccccdcc...", "...ccdccccdcmm..",
      "...ccccccccmggm.", "....cccccc.mggm.", "....dd..dd..mm..", "....dd..dd......"
    ]
  },
  chief: {
    pal: { m: "#94b0c2", s: "#e8b88a", e: "#1a1c2c", w: "#f4f4f4", r: "#ef7d57", k: "#29366f", b: "#ffcd75" },
    rows: [
      "................", ".....mmmmmm.....", "....mmmmmmmm....", "....mssssssm....",
      "....sesssses....", "....ssssssss....", "....swwwwwws....", ".....ssrrss.....",
      "......ssss......", "...kkkkkkkkkk...", "..kkkkwbbwkkkk..", "..kkkkkbbkkkkk..",
      "..kkkkkbbkkkkk..", "..kkkkkkkkkkkk..", "..kkkkkkkkkkkk..", "................"
    ]
  },
  bread: {
    pal: { c: "#d9a066", d: "#8f563b", w: "#f4d0a0", s: "#ffcd75" },
    rows: [
      "................", "................", "........s.......", ".......s........",
      ".....dddddd.....", "...ddccccccdd...", "..dccwccwccwcd..", ".dcccccccccccd..",
      ".dccwccwccwccd..", ".dcccccccccccd..", ".dddddddddddddd.", "................",
      "................", "................", "................", "................"
    ]
  },
  ticket: {
    pal: { g: "#ffcd75", k: "#b13e53", w: "#1a1c2c" },
    rows: [
      "................", "................", "................", "................",
      "..gggggggggggg..", "..gkkkkkkggwgg..", "...ggggggggwg...", "..gkkkkggggwgg..",
      "..gggggggggwgg..", "..gggggggggggg..", "................", "................",
      "................", "................", "................", "................"
    ]
  },
  train: {
    pal: { b: "#3b5dc9", c: "#73eff7", y: "#ffcd75", r: "#b13e53", m: "#566c86" },
    rows: [
      "................", "................", "....bbbbbbbb....", "...bbbbbbbbbb...",
      "...bccccccccb...", "...bccccccccb...", "...bbbbbbbbbb...", "...bybbbbbbyb...",
      "...bbbbbbbbbb...", "...brrrrrrrrb...", "....mm....mm....", ".mmmmmmmmmmmmmm.",
      "..m..m..m..m..m.", "................", "................", "................"
    ]
  },
  book: {
    pal: { w: "#f4f4f4", k: "#94b0c2", b: "#b13e53" },
    rows: [
      "................", "................", "................", "..wwwwww.wwwwww.",
      ".bwkkkkw.wkkkkwb", ".bwwwwww.wwwwwwb", ".bwkkkkw.wkkkkwb", ".bwwwwww.wwwwwwb",
      ".bwkkkww.wkkkkwb", ".bwwwwww.wwwwwwb", ".bbbbbbbbbbbbbbb", "................",
      "................", "................", "................", "................"
    ]
  },
  cat: {
    pal: { o: "#ef7d57", g: "#a7f070", p: "#b13e53", k: "#1a1c2c" },
    rows: [
      "................", "................", "..o..........o..", "..oo........oo..",
      "..ooo......ooo..", "..oooooooooooo..", ".oooooooooooooo.", ".ooggooooooggoo.",
      ".ooggooooooggoo.", ".oooooopppooooo.", "..oooookkkoooo..", "...oooooooooo...",
      ".....oooooo.....", "................", "................", "................"
    ]
  },
  dumbbell: {
    pal: { k: "#3b5dc9", m: "#94b0c2" },
    rows: [
      "................", "................", "................", "................",
      "................", ".kk..........kk.", "kkkk........kkkk", "kkkkmmmmmmmmkkkk",
      "kkkkmmmmmmmmkkkk", "kkkk........kkkk", ".kk..........kk.", "................",
      "................", "................", "................", "................"
    ]
  },
  tv: {
    pal: { k: "#5d275d", c: "#41a6f6", y: "#ffcd75", r: "#b13e53", m: "#94b0c2" },
    rows: [
      "................", "................", "......m..m......", ".......mm.......",
      "..kkkkkkkkkkkk..", "..kccccccccckk..", "..kcccccccccyk..", "..kccccccccckk..",
      "..kcccccccccrk..", "..kccccccccckk..", "..kkkkkkkkkkkk..", "....kk....kk....",
      "................", "................", "................", "................"
    ]
  },
  coin: {
    pal: { g: "#ffcd75", d: "#ef7d57" },
    rows: [
      "................", "................", "................", ".....gggggg.....",
      "...gggggggggg...", "..gddddddddddg..", "..gdggggggggdg..", "..gdggddddggdg..",
      "..gdggggggggdg..", "..gddddddddddg..", "...gggggggggg...", ".....gggggg.....",
      "................", "................", "................", "................"
    ]
  },
  rocket: {
    pal: { w: "#f4f4f4", c: "#41a6f6", r: "#b13e53", o: "#ef7d57", y: "#ffcd75" },
    rows: [
      "................", ".......rr.......", "......wwww......", ".....wwwwww.....",
      ".....wwccww.....", ".....wwccww.....", ".....wwwwww.....", ".....wwwwww.....",
      "....rwwwwwwr....", "...rrwwwwwwrr...", "...rr.wwww.rr...", "......oooo......",
      ".......yy.......", "................", "................", "................"
    ]
  }
};
function drawSprite(canvas, name) {
  const sp = SPRITES[name], ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 16, 16);
  sp.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (sp.pal[ch]) { ctx.fillStyle = sp.pal[ch]; ctx.fillRect(x, y, 1, 1); }
  }));
}
function paintSprites(root = document) {
  root.querySelectorAll("canvas[data-sprite]").forEach(cv => drawSprite(cv, cv.dataset.sprite));
}
const spriteCanvas = (name, cls = "") => `<canvas class="px ${cls}" width="16" height="16" data-sprite="${name}" aria-hidden="true"></canvas>`;

function pixelSvg(pattern, fill) {
  let r = "";
  pattern.forEach((row, y) => [...row].forEach((c, x) => { if (c === "x") r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }));
  return `<svg viewBox="0 0 ${pattern[0].length} ${pattern.length}" fill="${fill}" aria-hidden="true">${r}</svg>`;
}
const HEART = [".xx.xx.", "xxxxxxx", "xxxxxxx", ".xxxxx.", "..xxx..", "...x..."];
const GLASS = [".xxx...", "x...x..", "x...x..", "x...x..", ".xxxx..", "....xx.", ".....xx"];
const hintCost = s => Math.round(s.base / 4);
const STAR = ["..x..", ".xxx.", "xxxxx", ".xxx.", ".x.x."];
const stars = n => [1, 2, 3].map(i => pixelSvg(STAR, i <= n ? "var(--gold)" : "var(--line)")).join("");

/* =========================================================
   SYNTAX HIGHLIGHT
   ========================================================= */
const KW = new Set("public private protected static readonly class void return if else for foreach in var new int double decimal string bool using await async null true false this".split(" "));
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function hlLine(src) {
  const re = /(\/\/.*$)|(\$?"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)')|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/g;
  let out = "", last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    if (m[1]) out += `<span class="t-com">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="t-str">${esc(m[2])}</span>`;
    else if (m[3]) out += `<span class="t-num">${m[3]}</span>`;
    else {
      const w = m[4];
      if (KW.has(w)) out += `<span class="t-kw">${w}</span>`;
      else if (/^[A-Z]/.test(w)) out += `<span class="t-type">${w}</span>`;
      else out += w;
    }
    last = re.lastIndex;
  }
  return out + esc(src.slice(last));
}
const hl = src => src.split("\n").map(hlLine).join("\n");

/* =========================================================
   RENDER
   ========================================================= */
const $ = id => document.getElementById(id);
const pad2 = n => String(n).padStart(2, "0");

function renderStats() {
  const el = $("stats");
  if (state.screen === "menu" || !run()) {
    const total = STORIES.reduce((a, s) => a + solved(state.runs[s.id]), 0);
    const all = STORIES.reduce((a, s) => a + s.cases.length, 0);
    const pts = STORIES.reduce((a, s) => a + (state.runs[s.id]?.score || 0), 0);
    const rankIdx = Math.min(RANKS.length - 1, Math.floor(total / all * (RANKS.length - 1) + 0.0001));
    el.innerHTML = `
      <div class="stat"><span class="stat-label">SAKER</span><span class="stat-val">${total}/${all}</span></div>
      <div class="stat"><span class="stat-label">POENG</span><span class="stat-val">${pts}</span></div>
      <div class="stat"><span class="stat-label">GRAD</span><span class="stat-val">${RANKS[rankIdx]}</span></div>`;
    return;
  }
  const s = story(), r = run();
  el.innerHTML = `
    <div class="stat"><span class="stat-label">RYKTE</span><span class="hearts" aria-label="${r.hearts} av ${s.hearts} rykte igjen">${
      Array.from({ length: s.hearts }, (_, i) => pixelSvg(HEART, i < r.hearts ? "var(--red)" : "var(--panel-2)")).join("")}</span></div>
    <div class="stat"><span class="stat-label">POENG</span><span class="stat-val">${r.score}</span></div>
    <div class="stat"><span class="stat-label">SAKER</span><span class="stat-val">${solved(r)}/${s.cases.length}</span></div>`;
}

function renderMenu() {
  return `
    <section class="frame menu-head">
      <h2>VELG ETTERFORSKNING</h2>
      <p>Hver historie er fire saker som henger sammen. Vanskeligere historier gir færre hjerter, men flere poeng.</p>
    </section>
    ${[1, 2, 3].map(d => `
    <section class="tier">
      <div class="tier-head"><span class="tier-stars">${stars(d)}</span><span class="diff-label d${d}">${DIFF_NAMES[d]}</span><span class="tier-note">${TIER_NOTES[d]}</span></div>
      <div class="stories">${storyCards(STORIES.filter(s => s.difficulty === d))}</div>
    </section>`).join("")}`;
}

function storyCards(list) {
  return list.map(s => {
      const r = state.runs[s.id];
      const n = solved(r);
      let prog = "IKKE STARTET", cls = "";
      if (r?.finished) { prog = `FULLFØRT · ${r.score} POENG`; cls = "done"; }
      else if (r && r.hearts <= 0) { prog = `HENLAGT · ${n}/${s.cases.length} SAKER`; }
      else if (r) { prog = `PÅGÅR · ${n}/${s.cases.length} SAKER`; }
      return `
      <button class="story frame" data-story="${s.id}">
        <div class="scene">${spriteCanvas(s.sprite)}<span class="diff" aria-label="Vanskelighetsgrad ${s.difficulty} av 3">${stars(s.difficulty)}</span></div>
        <div class="story-body">
          <span class="diff-label d${s.difficulty}">${DIFF_NAMES[s.difficulty]} · ${s.hearts} HJERTER</span>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.tagline)}</p>
          <div class="topics">${s.topics.map(t => `<span class="topic">${esc(t)}</span>`).join("")}</div>
          <span class="progress ${cls}">${prog}</span>
        </div>
      </button>`;
    }).join("");
}

function renderIntro() {
  const s = story(), r = run();
  const inProgress = r && !r.finished && r.hearts > 0 && solved(r) > 0;
  return `
    <section class="frame brief">
      ${spriteCanvas("chief")}
      <div class="brief-text">
        <span class="speaker">INSPEKTØR BIT</span>
        ${s.intro.map(p => `<p>${esc(p)}</p>`).join("")}
        <div class="brief-meta"><span class="diff-label d${s.difficulty}">${DIFF_NAMES[s.difficulty]}</span><span>${s.cases.length} saker</span><span>${s.hearts} hjerter</span><span>${s.base} poeng per sak</span></div>
        <div class="row">
          ${inProgress ? `<button class="btn go" data-act="continue">FORTSETT</button><button class="btn ghost" data-act="begin">START PÅ NYTT</button>`
                       : `<button class="btn go" data-act="begin">START ETTERFORSKNINGEN</button>`}
          <button class="btn ghost" data-act="menu">TILBAKE</button>
        </div>
      </div>
    </section>`;
}

function renderEnding() {
  const s = story(), r = run();
  return `
    <section class="frame brief">
      ${spriteCanvas("chief")}
      <div class="brief-text">
        <span class="speaker">INSPEKTØR BIT · SAKEN ER LUKKET</span>
        ${s.ending.map(p => `<p>${esc(p)}</p>`).join("")}
        <div class="brief-meta"><span>${r.score} poeng</span><span>${r.hearts} av ${s.hearts} hjerter igjen</span></div>
        <div class="row">
          <button class="btn go" data-act="menu">VELG NY HISTORIE</button>
          <button class="btn ghost" data-act="begin">SPILL IGJEN</button>
        </div>
      </div>
    </section>`;
}

function logHtml(log) {
  return log.map(l => `<span class="${esc(l.kind || "")}">${esc(l.text)}</span>`).join("\n");
}
const isGuilty = (c, n) => c.culprit.includes(n);
const unlocked = (r, i) => i === 0 || r.cases[i - 1].phase === "solved";

function renderBoard() {
  const s = story(), r = run();
  const tabs = `
    <nav class="tabs" aria-label="Saker">
      <button class="btn ghost" data-act="menu">‹ MENY</button>
      ${s.cases.map((c, i) => {
        const cs = r.cases[i], open = unlocked(r, i);
        return `<button class="tab" data-tab="${i}" aria-current="${i === r.current}" ${open ? "" : "disabled"}>SAK ${pad2(i + 1)}${
          cs.phase === "solved" ? '<span class="stamp">LØST</span>' : open ? "" : '<span class="lock">LÅST</span>'}</button>`;
      }).join("")}
      <span class="spacer"></span><span class="story-name">${esc(s.title.toUpperCase())}</span>
    </nav>`;

  if (r.hearts <= 0) {
    return tabs + `<section class="frame over">
      <div class="big">SAKEN ER HENLAGT</div>
      <p>For mange feil anklager. Inspektør Bit har tatt skiltet ditt. Du løste ${solved(r)} av ${s.cases.length} saker.</p>
      <div class="row"><button class="btn go" data-act="begin">PRØV IGJEN</button><button class="btn ghost" data-act="menu">VELG ANNEN HISTORIE</button></div></section>`;
  }

  const c = s.cases[r.current], cs = r.cases[r.current];
  const codeLines = c.lines.map((l, i) => {
    const n = i + 1;
    let cls = "ln";
    if (cs.phase !== "investigate" && n === cs.accused) cls += " guilty";
    else if (cs.selected === n) cls += " sel";
    else if (cs.wrongLines.includes(n)) cls += " wrong";
    return `<button class="${cls}" data-line="${n}" aria-label="Linje ${n}" ${cs.phase !== "investigate" ? "disabled" : ""}><span class="n">${n}</span><span>${hlLine(l) || " "}</span></button>`;
  }).join("");

  const chief = cs.msg ? `<div class="chief ${cs.msgGood ? "good" : ""}">${spriteCanvas("chief")}<div><div class="who">INSPEKTØR BIT</div><p>${esc(cs.msg)}</p></div></div>` : "";

  const hintBox = cs.hintUsed && cs.phase !== "solved"
    ? `<div class="tip"><span class="tip-label">TIPS · −${hintCost(s)} POENG</span><p>${esc(c.hint)}</p></div>` : "";

  let desk = "";
  if (cs.phase === "investigate") {
    desk = `<div class="row">
        <button class="btn" data-act="accuse" ${cs.selected ? "" : "disabled"}>${cs.selected ? `ANKLAG LINJE ${cs.selected}` : "VELG EN LINJE"}</button>
        <span class="hint-text">Klikk på kodelinjen du mistenker.</span>
      </div>${chief}`;
  } else if (cs.phase === "motive") {
    desk = `${chief}<div class="label">MOTIV · HVORFOR ER LINJE ${cs.accused} SKYLDIG?</div>
      <div class="motives">${c.motives.map((m, i) => {
        const no = cs.wrongMotives.includes(i);
        return `<button class="motive ${no ? "no" : ""}" data-motive="${i}" ${no ? "disabled" : ""}><span class="k">${"ABC"[i]}</span><span>${esc(m.text)}</span></button>`;
      }).join("")}</div>`;
  } else {
    const last = r.current === s.cases.length - 1;
    desk = `<div class="solved">
        <div class="big">SAK LØST · +${cs.earned} POENG</div>
        <p>${esc(c.explain)}</p>
        <pre class="fix">${hl(c.fix)}</pre>
        <p class="story-beat">${esc(c.after)}</p>
      </div>
      <div class="row">${last
        ? `<button class="btn go" data-act="finish">AVSLUTT HISTORIEN</button>`
        : `<button class="btn go" data-act="next">NESTE SAK</button>`}</div>`;
  }

  return tabs + `<main class="board">
    <section class="frame">
      <div class="pane-head"><h2>SAKSMAPPE ${pad2(r.current + 1)}</h2><span class="meta">${cs.phase === "solved" ? "Lukket" : "Åpen"}</span></div>
      <div class="pane-body">
        <h3>${esc(c.title)}</h3>
        <p class="situation">${esc(c.brief)}</p>
        <div><div class="label">VITNEFORKLARING</div>
          <div class="witness"><span class="who">${esc(c.witness.who)}:</span> «${esc(c.witness.text)}»</div></div>
        <div><div class="label">${c.logTitle}</div><pre class="log">${logHtml(c.log)}</pre></div>
      </div>
    </section>
    <section class="frame">
      <div class="pane-head"><h2>ÅSTED</h2><span class="pane-tools"><span class="meta">${esc(c.file)}</span>${
        cs.phase !== "solved" && c.hint && !cs.hintUsed
          ? `<button class="peek" data-act="hint" title="Be om hint (−${hintCost(s)} poeng)" aria-label="Be om hint, koster ${hintCost(s)} poeng">${pixelSvg(GLASS, "currentColor")}</button>` : ""}</span></div>
      <div class="code"><div class="code-inner">${codeLines}</div></div>
      <div class="desk">${hintBox}${desk}</div>
    </section>
  </main>`;
}

function render() {
  const screens = { menu: renderMenu, intro: renderIntro, board: renderBoard, ending: renderEnding };
  try {
    renderStats();
    $("screen").innerHTML = (screens[state.screen] || renderMenu)();
  } catch (err) {
    console.error(err);
    state = { screen: "menu", story: null, runs: {} };
    renderStats();
    $("screen").innerHTML = renderMenu();
  }
  paintSprites($("screen"));
}

/* =========================================================
   ACTIONS
   ========================================================= */
function go(screen) { state.screen = screen; render(); window.scrollTo({ top: 0 }); }

document.addEventListener("click", e => {
  const t = e.target.closest("button");
  if (!t) return;

  if (t.dataset.story) { state.story = t.dataset.story; go("intro"); return; }

  const act = t.dataset.act;
  if (act === "menu") { go("menu"); return; }
  if (act === "begin") { state.runs[state.story] = newRun(story()); save(); go("board"); return; }
  if (act === "continue") { go("board"); return; }

  const s = story(), r = run();
  if (!r) return;
  const c = s.cases[r.current], cs = r.cases[r.current];

  if (t.dataset.tab) { r.current = +t.dataset.tab; save(); render(); return; }

  if (t.dataset.line && cs.phase === "investigate") {
    cs.selected = +t.dataset.line; render();
    document.querySelector(`[data-line="${cs.selected}"]`)?.focus();
    return;
  }

  if (act === "accuse" && cs.selected) {
    if (isGuilty(c, cs.selected)) {
      cs.phase = "motive"; cs.accused = cs.selected; cs.msgGood = true;
      cs.msg = `Linje ${cs.selected}, det er gjerningslinjen! Men en anklage uten motiv holder ikke i retten. Hvorfor er den skyldig?`;
    } else {
      r.hearts = Math.max(0, r.hearts - 1); cs.penalties++;
      if (!cs.wrongLines.includes(cs.selected)) cs.wrongLines.push(cs.selected);
      cs.msgGood = false;
      cs.msg = c.herrings[cs.selected] || "Den linjen har vanntett alibi. Les vitneforklaringen og loggen én gang til.";
      cs.selected = null;
    }
    save(); render(); return;
  }

  if (t.dataset.motive !== undefined && cs.phase === "motive") {
    const i = +t.dataset.motive;
    if (c.motives[i].correct) {
      cs.phase = "solved"; cs.msg = null;
      const q = Math.round(s.base / 4);
      cs.earned = Math.max(q, s.base - cs.penalties * q - (cs.hintUsed ? hintCost(s) : 0));
      r.score += cs.earned;
    } else {
      r.hearts = Math.max(0, r.hearts - 1); cs.penalties++; cs.wrongMotives.push(i); cs.msgGood = false;
      cs.msg = "Det motivet holder ikke. Tenk på hva som faktisk skjer når akkurat den linjen kjører.";
    }
    save(); render(); return;
  }

  if (act === "hint" && cs.phase !== "solved" && !cs.hintUsed) {
    cs.hintUsed = true; save(); render();
    document.querySelector(".tip")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return;
  }
  if (act === "next") { r.current++; save(); render(); window.scrollTo({ top: 0 }); return; }
  if (act === "finish") { r.finished = true; save(); go("ending"); }
});

// Når appen kjører med dotnet run, kommer historiene fra API-et.
// På GitHub Pages finnes ikke API-et, så da brukes stories.json fra den statiske eksporten.
// Relative stier, så det virker også når Pages ligger under /repo-navn/.
async function loadStories() {
  for (const url of ["api/stories", "stories.json"]) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) { /* prøv neste */ }
  }
  throw new Error("Fant verken api/stories eller stories.json");
}

async function boot() {
  drawSprite($("hero"), "detective");
  $("screen").innerHTML = `<section class="frame menu-head"><h2>LASTER SAKSMAPPER...</h2></section>`;
  try {
    STORIES = await loadStories();
  } catch (err) {
    console.error(err);
    $("screen").innerHTML = `<section class="frame menu-head"><h2>KUNNE IKKE LASTE HISTORIENE</h2><p>Sjekk at appen kjører med <code>dotnet run</code>, og last siden på nytt.</p></section>`;
    return;
  }
  state = initialState();
  render();
}

boot();
