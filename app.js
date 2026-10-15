/* ═══════════════════════════════════════════════════════════
   OUR JOURNAL — app.js  (Kunwar & Jasmin)
   Features: Supabase sync, rich text toolbar (toggle-based),
   moods, stickers, floating notes, star, search, random,
   voices, daily quote, last visited, checklist toggle
═══════════════════════════════════════════════════════════ */

/* ── MOODS ─────────────────────────────── */
const MOODS = [
  {emoji:"😊",label:"Happy"},      {emoji:"🥰",label:"In Love"},
  {emoji:"🥺",label:"Soft"},       {emoji:"😌",label:"Peaceful"},
  {emoji:"😢",label:"Sad"},        {emoji:"😤",label:"Frustrated"},
  {emoji:"😴",label:"Sleepy"},     {emoji:"🤩",label:"Excited"},
  {emoji:"😇",label:"Grateful"},   {emoji:"🥳",label:"Celebrating"},
  {emoji:"😰",label:"Anxious"},    {emoji:"😔",label:"Lonely"},
  {emoji:"💭",label:"Thoughtful"}, {emoji:"🤒",label:"Unwell"},
  {emoji:"😎",label:"Confident"},  {emoji:"😏",label:"Playful"},
  {emoji:"🌧️",label:"Gloomy"},   {emoji:"☀️",label:"Bright"},
  {emoji:"🌙",label:"Late Night"}, {emoji:"💪",label:"Strong"},
  {emoji:"😮",label:"Surprised"},  {emoji:"🤗",label:"Warm"},
  {emoji:"🫶",label:"Caring"},     {emoji:"🌸",label:"Blooming"},
];

/* ── DAILY QUOTES ───────────────────────── */
const QUOTES = [
  "In all the world, there is no heart for me like yours.",
  "I love you without knowing how, or when, or from where. — Pablo Neruda",
  "The best thing to hold onto in life is each other. — Audrey Hepburn",
  "You are my today and all of my tomorrows.",
  "Whatever our souls are made of, his and mine are the same. — Emily Brontë",
  "I would rather spend one lifetime with you, than face all the ages of this world alone.",
  "You are the finest, loveliest, tenderest, and most beautiful person I have ever known.",
  "Every love story is beautiful, but ours is my favourite.",
  "I carry your heart with me. I carry it in my heart. — E.E. Cummings",
  "My night has become a sunny dawn because of you.",
  "I love you as certain dark things are to be loved — in secret, between the shadow and the soul.",
  "Distance means so little when someone means so much.",
  "When I saw you, I fell in love, and you smiled because you knew.",
  "I am who I am because of you.",
  "Grow old with me, the best is yet to be.",
  "You are my sunshine when skies are grey.",
  "Two souls, one heart.",
  "Wherever you are, it feels like home.",
  "You make me want to be a better person.",
  "For it was not into my ear you whispered, but into my heart.",
  "You are the last thought in my mind before I drift off to sleep.",
  "In your smile I see something more beautiful than the stars.",
  "I love you a little more than yesterday, a little less than tomorrow.",
];

/* ── EMOJI STICKERS ─────────────────────── */
const EMOJI_STICKERS = [
  "🌸","💌","✨","🎀","🍂","☕","🌙","⭐","🌹","💐",
  "🫀","🤍","🌊","🍓","🎵","💫","🦋","🌿","🍀","🫧",
  "🕯️","📜","🎐","🧸","🫐","🍵","🌺","💝","🎶","🌛",
];


/* ── STORAGE ────────────────────────────── */
const LS_KEY       = "kj_journal_notes";
const LS_VISIT_KEY = "kj_last_visited";
const SUPABASE_READY = (
  typeof sb !== "undefined" && sb &&
  typeof SUPABASE_URL !== "undefined" &&
  SUPABASE_URL !== "YOUR_SUPABASE_URL_HERE"
);

/* ── STATE ──────────────────────────────── */
let notes            = [];
let selectedVoice    = "Kunwar";
let selectedMood     = null;
let selectedStickers = [];
let editingId        = null;
let viewingId        = null;
let usingSupabase    = false;

/* ── Active format toggles ──────────────── */
const activeFormats = {
  bold: false, italic: false, underline: false, strike: false,
  size: "normal", align: "left",
};

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", async () => {
  renderDailyQuote();
  buildMoodGrid();
  buildStickerTray();
  setupSearch();
  setupToolbar();
  showLastVisited();
  await loadNotes();
  recordVisit();
  renderNotes();
});

/* ══════════════════════════════════════════
   SYNC STATUS
══════════════════════════════════════════ */
function setSyncStatus(state) {
  const el = document.getElementById("syncStatus");
  if (!el) return;
  const labels = { online:"● synced", offline:"● offline", syncing:"● syncing..." };
  el.className   = "sync-status " + state;
  el.title       = labels[state] || "";
  el.textContent = labels[state] || "●";
}

/* ══════════════════════════════════════════
   LOAD / SAVE
══════════════════════════════════════════ */
async function loadNotes() {
  const loadEl = document.getElementById("loadingState");
  if (loadEl) loadEl.style.display = "block";
  setSyncStatus("syncing");

  if (SUPABASE_READY) {
    const rows = await sb.getAll();
    if (rows !== null) {
      notes = rows.map(r => ({
        id: r.id, rawText: r.raw_text, voice: r.voice,
        mood: r.mood, stickers: r.stickers || [],
        starred: r.starred, createdAt: r.created_at, editedAt: r.edited_at,
      }));
      usingSupabase = true;
      setSyncStatus("online");
      localStorage.setItem(LS_KEY, JSON.stringify(notes));
    } else {
      loadFromLocalStorage();
      setSyncStatus("offline");
    }
  } else {
    loadFromLocalStorage();
    setSyncStatus("offline");
  }
  if (loadEl) loadEl.style.display = "none";
}

function loadFromLocalStorage() {
  try { const r = localStorage.getItem(LS_KEY); notes = r ? JSON.parse(r) : []; }
  catch { notes = []; }
  usingSupabase = false;
}

function saveLocalCache() {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}

/* ══════════════════════════════════════════
   LAST VISITED
══════════════════════════════════════════ */
function showLastVisited() {
  try {
    const raw = localStorage.getItem(LS_VISIT_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const el   = document.getElementById("lastVisited");
    if (!el) return;
    const who  = data.user === "Kunwar" ? "Jasmin" : "Kunwar";
    el.textContent = `${who} was here ${formatRelativeTime(new Date(data.time))}`;
  } catch {}
}

function recordVisit() {
  const user = sessionStorage.getItem("kj_voice") || "Kunwar";
  localStorage.setItem(LS_VISIT_KEY, JSON.stringify({ user, time: new Date().toISOString() }));
}

function formatRelativeTime(date) {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 2)  return "just now";
  if (mins  < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hr${hours>1?"s":""} ago`;
  if (days  < 7)  return `${days} day${days>1?"s":""} ago`;
  return date.toLocaleDateString();
}

/* ══════════════════════════════════════════
   DAILY QUOTE
══════════════════════════════════════════ */
function renderDailyQuote() {
  const el  = document.getElementById("dailyQuote");
  const idx = new Date().getDate() % QUOTES.length;
  if (el) el.textContent = `"${QUOTES[idx]}"`;
}

/* ══════════════════════════════════════════
   MOOD GRID
══════════════════════════════════════════ */
function buildMoodGrid() {
  const grid = document.getElementById("moodGrid");
  if (!grid) return;
  grid.innerHTML = "";
  MOODS.forEach(mood => {
    const chip        = document.createElement("div");
    chip.className    = "mood-chip";
    chip.dataset.label = mood.label;
    chip.innerHTML    = `<span class="mood-emoji">${mood.emoji}</span><span>${mood.label}</span>`;
    chip.onclick      = () => {
      selectedMood = mood;
      document.querySelectorAll(".mood-chip").forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
    };
    grid.appendChild(chip);
  });
}

/* ══════════════════════════════════════════
   STICKER TRAY
══════════════════════════════════════════ */
function buildStickerTray() {
  const tray = document.getElementById("stickerTray");
  if (!tray) return;
  tray.innerHTML = "";
  IMAGE_STICKERS.forEach((s, i) => {
    const img       = document.createElement("img");
    img.src         = s.src; img.alt = s.alt;
    img.className   = "sticker-item";
    img.dataset.key = `img_${i}`;
    img.onclick     = () => toggleSticker(`img_${i}`, img);
    tray.appendChild(img);
  });
  EMOJI_STICKERS.forEach((emoji, i) => {
    const div       = document.createElement("div");
    div.className   = "sticker-emoji";
    div.textContent = emoji;
    div.dataset.key = `emoji_${i}`;
    div.onclick     = () => toggleSticker(`emoji_${i}`, div);
    tray.appendChild(div);
  });
}

function toggleSticker(key, el) {
  const idx = selectedStickers.indexOf(key);
  if (idx === -1) { selectedStickers.push(key); el.classList.add("selected-sticker"); }
  else            { selectedStickers.splice(idx, 1); el.classList.remove("selected-sticker"); }
}

function clearStickerSelections() {
  document.querySelectorAll(".sticker-item,.sticker-emoji")
    .forEach(el => el.classList.remove("selected-sticker"));
  selectedStickers = [];
}

/* ══════════════════════════════════════════
   VOICE SELECTOR
══════════════════════════════════════════ */
function selectVoice(name) {
  selectedVoice = name;
  sessionStorage.setItem("kj_voice", name);
  document.getElementById("voiceKunwar").classList.toggle("active", name === "Kunwar");
  document.getElementById("voiceJasmin").classList.toggle("active", name === "Jasmin");
  const ta = document.getElementById("editorTextarea");
  if (ta) ta.style.color = name === "Kunwar" ? "var(--ink-kunwar)" : "var(--ink-jasmin)";
}

/* ══════════════════════════════════════════
   TOOLBAR — TOGGLE-BASED REAL EDITOR
   Uses document.execCommand for inline formatting
   so it works exactly like a real text editor:
   select text → click bold → it goes bold.
   click bold again → it turns off.
   type while bold is active → text comes out bold.
══════════════════════════════════════════ */
function setupToolbar() {
  const toolbar = document.getElementById("editorToolbar");
  if (!toolbar) return;

  toolbar.querySelectorAll(".tb").forEach(btn => {
    btn.addEventListener("mousedown", e => {
      e.preventDefault(); // keep focus in editor
      handleToolbarClick(btn.dataset.action, btn);
    });
  });

  // Update toolbar button states when cursor moves
  const ta = document.getElementById("editorTextarea");
  if (ta) {
    ta.addEventListener("keyup",   updateToolbarState);
    ta.addEventListener("mouseup", updateToolbarState);
    ta.addEventListener("focus",   updateToolbarState);
  }
}

function handleToolbarClick(action, btn) {
  const ta = document.getElementById("editorTextarea");
  ta.focus();

  switch (action) {
    /* ── Inline toggles (execCommand handles on/off) ── */
    case "bold":
      document.execCommand("bold", false, null);
      break;
    case "italic":
      document.execCommand("italic", false, null);
      break;
    case "underline":
      document.execCommand("underline", false, null);
      break;
    case "strike":
      document.execCommand("strikeThrough", false, null);
      break;

    /* ── Font size ── */
    case "size-small":
      setFontSize("1");   // execCommand fontSize uses 1-7
      break;
    case "size-normal":
      setFontSize("3");
      break;
    case "size-large":
      setFontSize("5");
      break;
    case "size-huge":
      setFontSize("7");
      break;

    /* ── Headings (insert a styled block) ── */
    case "h1":
      insertStyledBlock("h1");
      break;
    case "h2":
      insertStyledBlock("h2");
      break;

    /* ── Lists ── */
    case "bullet":
      document.execCommand("insertUnorderedList", false, null);
      break;
    case "numbered":
      document.execCommand("insertOrderedList", false, null);
      break;
    case "checklist":
      insertChecklist();
      break;

    /* ── Alignment ── */
    case "align-left":
      document.execCommand("justifyLeft", false, null);
      break;
    case "align-center":
      document.execCommand("justifyCenter", false, null);
      break;
    case "align-right":
      document.execCommand("justifyRight", false, null);
      break;

    /* ── Extras ── */
    case "divider":
      document.execCommand("insertHorizontalRule", false, null);
      break;
    case "quote":
      insertQuoteBlock();
      break;
  }

  // Update active states on toolbar buttons
  updateToolbarState();
}

/* ── Font size via execCommand ── */
function setFontSize(size) {
  // execCommand fontSize wraps in <font size="N">
  // We then convert to a span with real CSS
  document.execCommand("fontSize", false, size);
  // Convert <font> tags to styled spans
  const ta = document.getElementById("editorTextarea");
  ta.querySelectorAll("font[size]").forEach(font => {
    const sizeMap = { "1":"0.75em","2":"0.875em","3":"1em","4":"1.15em","5":"1.35em","6":"1.6em","7":"2em" };
    const span = document.createElement("span");
    span.style.fontSize = sizeMap[font.getAttribute("size")] || "1em";
    span.innerHTML = font.innerHTML;
    font.replaceWith(span);
  });
}

/* ── Insert heading block ── */
function insertStyledBlock(tag) {
  const sel = window.getSelection();
  const selectedText = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).toString() : "";
  const text = selectedText || (tag === "h1" ? "Heading" : "Subheading");
  const sizes = { h1: "1.8em", h2: "1.35em" };
  const weights = { h1: "700", h2: "600" };
  document.execCommand("insertHTML", false,
    `<span style="font-size:${sizes[tag]};font-weight:${weights[tag]};display:block">${text}</span><br>`
  );
}

/* ── Insert checklist item ── */
function insertChecklist() {
  const sel = window.getSelection();
  const text = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).toString() : "checklist item";
  document.execCommand("insertHTML", false,
    `<span class="r-check" style="display:flex;align-items:center;gap:6px;cursor:pointer" onclick="this.classList.toggle('done');this.querySelector('.r-check-box').textContent=this.classList.contains('done')?'☑':'☐'">` +
    `<span class="r-check-box">☐</span>` +
    `<span class="r-check-text">${text || "item"}</span></span><br>`
  );
}

/* ── Insert blockquote ── */
function insertQuoteBlock() {
  const sel = window.getSelection();
  const text = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).toString() : "quote...";
  document.execCommand("insertHTML", false,
    `<span style="display:block;border-left:3px solid var(--accent);padding-left:10px;font-style:italic;opacity:0.85;margin:4px 0">${text}</span><br>`
  );
}

/* ── Update toolbar button active states ── */
function updateToolbarState() {
  const states = {
    bold:      document.queryCommandState("bold"),
    italic:    document.queryCommandState("italic"),
    underline: document.queryCommandState("underline"),
    strike:    document.queryCommandState("strikeThrough"),
    bullet:    document.queryCommandState("insertUnorderedList"),
    numbered:  document.queryCommandState("insertOrderedList"),
    "align-left":   document.queryCommandState("justifyLeft"),
    "align-center": document.queryCommandState("justifyCenter"),
    "align-right":  document.queryCommandState("justifyRight"),
  };

  const toolbar = document.getElementById("editorToolbar");
  if (!toolbar) return;

  toolbar.querySelectorAll(".tb").forEach(btn => {
    const action = btn.dataset.action;
    if (action in states) {
      btn.classList.toggle("active", states[action]);
    }
  });
}

/* ══════════════════════════════════════════
   EDITOR OPEN / CLOSE
══════════════════════════════════════════ */
function openEditor(noteId = null) {
  editingId = noteId;
  const overlay = document.getElementById("editorOverlay");
  const ta      = document.getElementById("editorTextarea");

  selectedMood = null;
  clearStickerSelections();
  document.querySelectorAll(".mood-chip").forEach(c => c.classList.remove("selected"));
  // Reset toolbar active states
  document.querySelectorAll(".tb").forEach(b => b.classList.remove("active"));

  if (noteId !== null) {
    const note = notes.find(n => n.id == noteId);
    if (!note) return;
    selectVoice(note.voice);
    if (note.mood) {
      selectedMood = note.mood;
      document.querySelectorAll(".mood-chip").forEach(c => {
        if (c.dataset.label === note.mood.label) c.classList.add("selected");
      });
    }
    (note.stickers || []).forEach(key => {
      selectedStickers.push(key);
      const el = document.querySelector(`[data-key="${key}"]`);
      if (el) el.classList.add("selected-sticker");
    });
    ta.innerHTML = note.rawText || "";
  } else {
    const lastVoice = sessionStorage.getItem("kj_voice") || "Kunwar";
    selectVoice(lastVoice);
    ta.innerHTML = "";
  }

  overlay.classList.add("open");
  setTimeout(() => { ta.focus(); updateToolbarState(); }, 120);
}

function closeEditor() {
  document.getElementById("editorOverlay").classList.remove("open");
  editingId = null;
}

function closeEditorOnOverlay(e) {
  if (e.target === document.getElementById("editorOverlay")) closeEditor();
}

/* ══════════════════════════════════════════
   SAVE ENTRY
══════════════════════════════════════════ */
async function saveEntry() {
  const ta   = document.getElementById("editorTextarea");
  const html = ta.innerHTML.trim();
  if (!html || html === "<br>") {
    ta.style.outline = "2px solid #c08080";
    setTimeout(() => ta.style.outline = "", 800);
    return;
  }

  setSyncStatus("syncing");

  if (editingId !== null) {
    const note = notes.find(n => n.id == editingId);
    if (note) {
      note.rawText  = html;
      note.voice    = selectedVoice;
      note.mood     = selectedMood;
      note.stickers = [...selectedStickers];
      note.editedAt = new Date().toISOString();
      if (usingSupabase) {
        await sb.update(note.id, {
          rawText: html, voice: note.voice, mood: note.mood,
          stickers: note.stickers, editedAt: note.editedAt,
        });
      }
    }
  } else {
    const newNote = {
      id: null, rawText: html, voice: selectedVoice,
      mood: selectedMood, stickers: [...selectedStickers],
      starred: false, createdAt: new Date().toISOString(), editedAt: null,
    };
    if (usingSupabase) {
      const row = await sb.insert(newNote);
      newNote.id        = row ? row.id        : Date.now();
      newNote.createdAt = row ? row.created_at : newNote.createdAt;
    } else {
      newNote.id = Date.now();
    }
    notes.unshift(newNote);
  }

  saveLocalCache();
  setSyncStatus(usingSupabase ? "online" : "offline");
  closeEditor();
  renderNotes();
}

/* ══════════════════════════════════════════
   RENDER NOTES (floating cards)
══════════════════════════════════════════ */
function renderNotes(filterText = "") {
  const canvas  = document.getElementById("notesCanvas");
  const emptyEl = document.getElementById("emptyState");
  canvas.querySelectorAll(".note-card").forEach(el => el.remove());

  let filtered = notes;
  if (filterText.trim()) {
    const q = filterText.toLowerCase();
    filtered = notes.filter(n => {
      const plain = getPlainText(n.rawText || "").toLowerCase();
      return plain.includes(q)
        || (n.voice || "").toLowerCase().includes(q)
        || (n.mood && n.mood.label.toLowerCase().includes(q));
    });
  }

  const sorted = [...filtered].sort((a, b) => {
    if (a.starred && !b.starred) return -1;
    if (!a.starred && b.starred) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  emptyEl.style.display = sorted.length === 0 ? "block" : "none";

  const canvasW = canvas.offsetWidth || window.innerWidth - 120;
  const CARD_W = 230, CARD_H = 205;
  const placed  = [];

  sorted.forEach((note, idx) => {
    const card   = document.createElement("div");
    const inkCls = note.voice === "Jasmin" ? "jasmin-ink" : "kunwar-ink";
    const rot    = getRotation(String(note.id));

    card.className = `note-card${note.starred ? " starred" : ""}`;
    card.style.setProperty("--rot", `${rot}deg`);
    card.style.animationDelay = `${(idx % 5) * 0.4}s`;

    const pos = findPosition(placed, canvasW, CARD_W, CARD_H, idx);
    card.style.left   = pos.x + "px";
    card.style.top    = pos.y + "px";
    card.style.zIndex = note.starred ? 10 : idx + 1;
    placed.push(pos);

    const snippet  = getPlainText(note.rawText || "").substring(0, 80);
    const moodStr  = note.mood
      ? `<div class="note-mood">${note.mood.emoji} ${note.mood.label}</div>` : "";

    let stickerHtml = "";
    if ((note.stickers || []).length > 0) {
      stickerHtml = '<div class="note-sticker-preview">';
      note.stickers.slice(0, 3).forEach(key => {
        if (key.startsWith("img_")) {
          const s = IMAGE_STICKERS[parseInt(key.replace("img_",""),10)];
          if (s) stickerHtml += `<img src="${s.src}" alt="${s.alt}"/>`;
        } else {
          const ei = parseInt(key.replace("emoji_",""),10);
          stickerHtml += `<span style="font-size:16px">${EMOJI_STICKERS[ei]}</span>`;
        }
      });
      stickerHtml += "</div>";
    }

    card.innerHTML = `
      ${note.starred ? '<div class="note-tag-star">⭐</div>' : ""}
      <div class="note-tag-voice ${note.voice==="Jasmin"?"jasmin":"kunwar"}">${note.voice}</div>
      ${moodStr}
      <div class="note-body ${inkCls}">${escapeHtml(snippet)}${snippet.length >= 80 ? "…" : ""}</div>
      <div class="note-date">${formatDate(note.createdAt)}</div>
      ${stickerHtml}
    `;

    card.onclick = () => openView(note.id);
    canvas.appendChild(card);
  });

  if (sorted.length > 0) {
    const maxY = placed.reduce((m, p) => Math.max(m, p.y + CARD_H), 0);
    canvas.style.minHeight = (maxY + 140) + "px";
  }
}

/* ── Helpers ── */
function getPlainText(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function findPosition(placed, canvasW, cardW, cardH, idx) {
  const margin = 20, pad = 70;
  const maxX   = Math.max(canvasW - cardW - margin, pad + 40);
  const maxY   = 900;
  for (let i = 0; i < 80; i++) {
    const x = pad + Math.random() * maxX;
    const y = margin + Math.random() * maxY;
    const ok = placed.every(p => Math.abs(p.x-x) > cardW*0.55 || Math.abs(p.y-y) > cardH*0.55);
    if (ok) return { x, y };
  }
  const cols = Math.max(1, Math.floor((canvasW - pad) / (cardW + margin)));
  return { x: pad + (idx % cols) * (cardW + margin), y: margin + Math.floor(idx / cols) * (cardH + margin) };
}

function getRotation(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return ((hash % 16) - 8);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})
    + " · " + d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
}

/* ══════════════════════════════════════════
   VIEW NOTE
══════════════════════════════════════════ */
function openView(id) {
  viewingId = id;
  const note = notes.find(n => n.id == id);
  if (!note) return;

  const overlay    = document.getElementById("viewOverlay");
  const metaEl     = document.getElementById("viewMeta");
  const contentEl  = document.getElementById("viewContent");
  const stickersEl = document.getElementById("viewStickers");
  const starBtn    = document.getElementById("viewStarBtn");
  const inkCls     = note.voice === "Jasmin" ? "jasmin-ink" : "kunwar-ink";

  const moodStr   = note.mood ? `<span>${note.mood.emoji} ${note.mood.label}</span>` : "";
  const editedStr = note.editedAt ? ` · edited ${formatDate(note.editedAt)}` : "";

  metaEl.innerHTML = `
    <span class="note-tag-voice ${note.voice==="Jasmin"?"jasmin":"kunwar"}" style="font-size:1rem">${note.voice}</span>
    ${moodStr}
    <span style="opacity:0.65;font-size:0.88rem">${formatDate(note.createdAt)}${editedStr}</span>
  `;

  contentEl.className = `view-content ${inkCls}`;
  contentEl.innerHTML = note.rawText || "";

  // Re-attach checklist handlers
  contentEl.querySelectorAll(".r-check").forEach(el => {
    el.style.cursor = "pointer";
    el.onclick = (e) => {
      e.stopPropagation();
      el.classList.toggle("done");
      const box = el.querySelector(".r-check-box");
      if (box) box.textContent = el.classList.contains("done") ? "☑" : "☐";
    };
  });

  // Stickers
  stickersEl.innerHTML = "";
  (note.stickers || []).forEach(key => {
    if (key.startsWith("img_")) {
      const s = IMAGE_STICKERS[parseInt(key.replace("img_",""),10)];
      if (s) { const img = document.createElement("img"); img.src=s.src; img.alt=s.alt; stickersEl.appendChild(img); }
    } else {
      const ei   = parseInt(key.replace("emoji_",""),10);
      const span = document.createElement("span");
      span.className   = "view-sticker-emoji";
      span.textContent = EMOJI_STICKERS[ei];
      stickersEl.appendChild(span);
    }
  });

  starBtn.className   = `btn-star-view${note.starred ? " is-starred" : ""}`;
  starBtn.textContent = note.starred ? "★ Starred" : "⭐ Star";

  overlay.classList.add("open");
}

function closeView() {
  document.getElementById("viewOverlay").classList.remove("open");
  viewingId = null;
}

function closeViewOnOverlay(e) {
  if (e.target === document.getElementById("viewOverlay")) closeView();
}

async function toggleStarFromView() {
  const note = notes.find(n => n.id == viewingId);
  if (!note) return;
  note.starred = !note.starred;
  if (usingSupabase) {
    setSyncStatus("syncing");
    await sb.update(note.id, { starred: note.starred });
    setSyncStatus("online");
  }
  saveLocalCache();
  renderNotes();
  const btn = document.getElementById("viewStarBtn");
  btn.className   = `btn-star-view${note.starred ? " is-starred" : ""}`;
  btn.textContent = note.starred ? "★ Starred" : "⭐ Star";
}

function editFromView() {
  const id = viewingId;
  closeView();
  setTimeout(() => openEditor(id), 100);
}

async function deleteFromView() {
  if (!confirm("Delete this memory? 💔")) return;
  const id = viewingId;
  if (usingSupabase) {
    setSyncStatus("syncing");
    await sb.remove(id);
    setSyncStatus("online");
  }
  notes = notes.filter(n => n.id != id);
  saveLocalCache();
  closeView();
  renderNotes();
}

/* ══════════════════════════════════════════
   RANDOM NOTE
══════════════════════════════════════════ */
function openRandomNote() {
  if (notes.length === 0) return;
  openView(notes[Math.floor(Math.random() * notes.length)].id);
}

/* ══════════════════════════════════════════
   SEARCH
══════════════════════════════════════════ */
function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  let debounce;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => renderNotes(input.value), 250);
  });
}
