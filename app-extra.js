/* ══════════════════════════════════════
   EXTRA FEATURES — Settings, Themes, Anniversary,
   Nav arrows, Print, Photos, Voice notes, Realtime
══════════════════════════════════════ */

/* ── Extra state ───────────────────────── */
let selectedPhotos    = [];
let selectedVoiceNote = null;
let mediaRecorder     = null;
let recordedChunks    = [];
let isRecording       = false;
let sortedNoteIds     = [];

/* ── Anniversary count-up ────────────────── */
function updateAnniversary() {
  const el = document.getElementById("anniversary");
  if (!el) return;
  const start = new Date("2026-06-08T00:00:00");
  const now   = new Date();
  const diff  = Math.max(0, now - start);
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days === 0) {
    el.textContent = hours < 1 ? "Together since today \u{1F90D}" : `Together \u00b7 ${hours}h`;
  } else {
    el.textContent = `Together \u00b7 ${days} day${days !== 1 ? "s" : ""} \u{1F90D}`;
  }
}

/* ── Themes ──────────────────────────────── */
function applySavedTheme() {
  const theme = localStorage.getItem("kj_theme") || "paper";
  setTheme(theme, false);
}

function setTheme(theme, save = true) {
  document.body.setAttribute("data-theme", theme);
  if (save) localStorage.setItem("kj_theme", theme);
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

/* ── Settings panel ──────────────────────── */
function openSettings() {
  const el = document.getElementById("settingsOverlay");
  if (!el) return;
  el.classList.add("open");
  document.querySelectorAll(".settings-fonts .font-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.font === (typeof selectedFont !== "undefined" ? selectedFont : "handwriting"));
  });
  const theme = localStorage.getItem("kj_theme") || "paper";
  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === theme);
  });
}

function closeSettings() {
  const el = document.getElementById("settingsOverlay");
  if (el) el.classList.remove("open");
}

function closeSettingsOnOverlay(e) {
  if (e.target === document.getElementById("settingsOverlay")) closeSettings();
}

/* ── Print ───────────────────────────────── */
function printJournal() {
  closeSettings();
  window.print();
}

function printCurrentNote() {
  window.print();
}

/* ── Prev / Next navigation ──────────────── */
function navigateNote(dir) {
  if (!viewingId || sortedNoteIds.length === 0) return;
  const idx = sortedNoteIds.indexOf(String(viewingId));
  if (idx === -1) return;
  const next = idx + dir;
  if (next < 0 || next >= sortedNoteIds.length) return;
  openView(sortedNoteIds[next]);
}

/* ── Photos ──────────────────────────────── */
function handlePhotoSelect(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    selectedPhotos.push({ url, file, isNew: true });
  });
  renderPhotoPreview();
  e.target.value = "";
}

function renderPhotoPreview() {
  const el = document.getElementById("photoPreview");
  if (!el) return;
  el.innerHTML = "";
  selectedPhotos.forEach((p, i) => {
    const wrap = document.createElement("div");
    wrap.className = "photo-thumb-wrap";
    wrap.innerHTML = `<img src="${p.url}" alt="photo"/><button class="photo-remove" onclick="removePhoto(${i})">\u2715</button>`;
    el.appendChild(wrap);
  });
}

function removePhoto(idx) {
  const p = selectedPhotos[idx];
  if (p && p.isNew && p.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
  selectedPhotos.splice(idx, 1);
  renderPhotoPreview();
}

/* ── Voice notes ─────────────────────────── */
async function toggleVoiceRecord() {
  const btn = document.getElementById("voiceRecordBtn");
  if (!btn) return;
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const url  = URL.createObjectURL(blob);
        selectedVoiceNote = { url, blob, isNew: true };
        renderVoicePreview();
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      isRecording = true;
      btn.classList.add("recording");
      btn.textContent = "\u23F9 Stop Recording";
    } catch (err) {
      alert("Microphone access needed for voice notes \u{1F3A4}");
    }
  } else {
    if (mediaRecorder) mediaRecorder.stop();
    isRecording = false;
    btn.classList.remove("recording");
    btn.textContent = "\u{1F3A4} Voice Note";
  }
}

function renderVoicePreview() {
  const el = document.getElementById("voicePreview");
  if (!el) return;
  if (!selectedVoiceNote) { el.innerHTML = ""; return; }
  el.innerHTML = `<audio controls src="${selectedVoiceNote.url}"></audio>
    <button class="media-btn" style="margin-left:8px" onclick="clearVoiceNote()">Remove</button>`;
}

function clearVoiceNote() {
  if (selectedVoiceNote && selectedVoiceNote.isNew && selectedVoiceNote.url.startsWith("blob:")) {
    URL.revokeObjectURL(selectedVoiceNote.url);
  }
  selectedVoiceNote = null;
  renderVoicePreview();
}

/* ── Custom sticker upload ───────────────── */
function handleStickerUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file || !file.type.startsWith("image/")) return;
  const url = URL.createObjectURL(file);
  if (typeof IMAGE_STICKERS !== "undefined") {
    IMAGE_STICKERS.push({ src: url, alt: "custom", file, isNew: true });
    if (typeof buildStickerTray === "function") buildStickerTray();
    if (typeof selectedStickers !== "undefined") {
      selectedStickers.push(`img_${IMAGE_STICKERS.length - 1}`);
    }
  }
  e.target.value = "";
}

/* ── Realtime polling ────────────────────── */
let realtimeTimer = null;
function startRealtime() {
  if (realtimeTimer) clearInterval(realtimeTimer);
  realtimeTimer = setInterval(async () => {
    if (typeof usingSupabase === "undefined" || !usingSupabase || document.hidden) return;
    if (typeof sb === "undefined" || typeof notes === "undefined") return;
    try {
      const rows = await sb.getAll();
      if (!rows) return;
      if (rows.length !== notes.length ||
          (rows[0] && notes[0] && String(rows[0].id) !== String(notes[0].id))) {
        notes = rows.map(r => ({
          id: r.id, rawText: r.raw_text, voice: r.voice,
          mood: r.mood, stickers: r.stickers || [],
          starred: r.starred, createdAt: r.created_at, editedAt: r.edited_at,
          font: r.font || "handwriting",
          photos: r.photos || [],
          voiceNote: r.voice_note || null,
        }));
        if (typeof saveLocalCache === "function") saveLocalCache();
        if (typeof renderNotes === "function") renderNotes();
      }
    } catch {}
  }, 45000);
}

/* ── Hook into existing openView for nav list + media display ── */
(function patchOpenView() {
  if (typeof openView !== "function") return;
  const _openView = openView;
  window.openView = function(id) {
    _openView(id);
    if (typeof notes !== "undefined") {
      sortedNoteIds = notes
        .slice()
        .sort((a, b) => {
          if (a.starred && !b.starred) return -1;
          if (!a.starred && b.starred) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
        .map(n => String(n.id));
    }
    const note = (typeof notes !== "undefined") ? notes.find(n => String(n.id) === String(id)) : null;
    const photosEl = document.getElementById("viewPhotos");
    if (photosEl) {
      photosEl.innerHTML = "";
      ((note && note.photos) || []).forEach(url => {
        const img = document.createElement("img");
        img.src = url; img.alt = "photo";
        img.onclick = () => window.open(url, "_blank");
        photosEl.appendChild(img);
      });
    }
    const voiceEl = document.getElementById("viewVoice");
    if (voiceEl) {
      voiceEl.innerHTML = (note && note.voiceNote)
        ? `<audio controls src="${note.voiceNote}"></audio>`
        : "";
    }
  };
})();

/* ── Init extras when DOM is ready ───────── */
document.addEventListener("DOMContentLoaded", () => {
  updateAnniversary();
  applySavedTheme();
  startRealtime();
  setInterval(updateAnniversary, 3600000);
});
