/* EXTRA FEATURES — Settings, Themes, Anniversary, Nav, Print, Photos, Voice */

var selectedPhotos = [];
var selectedVoiceNote = null;
var mediaRecorder = null;
var recordedChunks = [];
var isRecording = false;
var sortedNoteIds = [];

function updateAnniversary() {
  var el = document.getElementById("anniversary");
  if (!el) return;
  var start = new Date("2026-06-08T00:00:00");
  var now = new Date();
  var diff = Math.max(0, now - start);
  var days = Math.floor(diff / 86400000);
  if (days === 0) {
    el.textContent = "Together since today";
  } else {
    el.textContent = "Together \u00b7 " + days + (days === 1 ? " day" : " days");
  }
}

function applySavedTheme() {
  var theme = localStorage.getItem("kj_theme") || "paper";
  setTheme(theme, false);
}

function setTheme(theme, save) {
  if (save === undefined) save = true;
  document.body.setAttribute("data-theme", theme);
  if (save) localStorage.setItem("kj_theme", theme);
  var btns = document.querySelectorAll(".theme-btn");
  for (var i = 0; i < btns.length; i++) {
    if (btns[i].getAttribute("data-theme") === theme) {
      btns[i].classList.add("active");
    } else {
      btns[i].classList.remove("active");
    }
  }
}

function openSettings() {
  var el = document.getElementById("settingsOverlay");
  if (!el) {
    console.error("settingsOverlay not found");
    return;
  }
  el.classList.add("open");
  var theme = localStorage.getItem("kj_theme") || "paper";
  var btns = document.querySelectorAll(".theme-btn");
  for (var i = 0; i < btns.length; i++) {
    if (btns[i].getAttribute("data-theme") === theme) {
      btns[i].classList.add("active");
    } else {
      btns[i].classList.remove("active");
    }
  }
  var fontKey = (typeof selectedFont !== "undefined") ? selectedFont : "handwriting";
  var fbtns = document.querySelectorAll(".settings-fonts .font-btn");
  for (var j = 0; j < fbtns.length; j++) {
    if (fbtns[j].getAttribute("data-font") === fontKey) {
      fbtns[j].classList.add("active");
    } else {
      fbtns[j].classList.remove("active");
    }
  }
}

function closeSettings() {
  var el = document.getElementById("settingsOverlay");
  if (el) el.classList.remove("open");
}

function closeSettingsOnOverlay(e) {
  if (e.target && e.target.id === "settingsOverlay") closeSettings();
}

function printJournal() {
  closeSettings();
  window.print();
}

function printCurrentNote() {
  window.print();
}

function navigateNote(dir) {
  if (typeof viewingId === "undefined" || viewingId === null) return;
  if (!sortedNoteIds || sortedNoteIds.length === 0) {
    if (typeof notes !== "undefined" && notes.length) {
      sortedNoteIds = notes.slice().sort(function(a, b) {
        if (a.starred && !b.starred) return -1;
        if (!a.starred && b.starred) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }).map(function(n) { return String(n.id); });
    } else {
      return;
    }
  }
  var idx = sortedNoteIds.indexOf(String(viewingId));
  if (idx === -1) return;
  var next = idx + dir;
  if (next < 0 || next >= sortedNoteIds.length) return;
  if (typeof openView === "function") openView(sortedNoteIds[next]);
}

function handlePhotoSelect(e) {
  var files = e.target.files;
  if (!files) return;
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (!file.type || file.type.indexOf("image/") !== 0) continue;
    var url = URL.createObjectURL(file);
    selectedPhotos.push({ url: url, file: file, isNew: true });
  }
  renderPhotoPreview();
  e.target.value = "";
}

function renderPhotoPreview() {
  var el = document.getElementById("photoPreview");
  if (!el) return;
  el.innerHTML = "";
  for (var i = 0; i < selectedPhotos.length; i++) {
    var wrap = document.createElement("div");
    wrap.className = "photo-thumb-wrap";
    wrap.innerHTML = '<img src="' + selectedPhotos[i].url + '" alt="photo"/><button class="photo-remove" onclick="removePhoto(' + i + ')">X</button>';
    el.appendChild(wrap);
  }
}

function removePhoto(idx) {
  var p = selectedPhotos[idx];
  if (p && p.isNew && p.url && p.url.indexOf("blob:") === 0) URL.revokeObjectURL(p.url);
  selectedPhotos.splice(idx, 1);
  renderPhotoPreview();
}

function toggleVoiceRecord() {
  var btn = document.getElementById("voiceRecordBtn");
  if (!btn) return;

  if (!isRecording) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Voice notes need a modern browser with microphone support.");
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
      recordedChunks = [];
      try {
        mediaRecorder = new MediaRecorder(stream);
      } catch (err) {
        alert("Could not start recorder on this browser.");
        stream.getTracks().forEach(function(t) { t.stop(); });
        return;
      }
      mediaRecorder.ondataavailable = function(e) {
        if (e.data && e.data.size > 0) recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = function() {
        var blob = new Blob(recordedChunks, { type: "audio/webm" });
        var url = URL.createObjectURL(blob);
        selectedVoiceNote = { url: url, blob: blob, isNew: true };
        renderVoicePreview();
        stream.getTracks().forEach(function(t) { t.stop(); });
      };
      mediaRecorder.start();
      isRecording = true;
      btn.classList.add("recording");
      btn.textContent = "Stop Recording";
    }).catch(function() {
      alert("Please allow microphone access for voice notes.");
    });
  } else {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    isRecording = false;
    btn.classList.remove("recording");
    btn.textContent = "Voice Note";
  }
}

function renderVoicePreview() {
  var el = document.getElementById("voicePreview");
  if (!el) return;
  if (!selectedVoiceNote) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = '<audio controls src="' + selectedVoiceNote.url + '"></audio> <button class="media-btn" onclick="clearVoiceNote()">Remove</button>';
}

function clearVoiceNote() {
  if (selectedVoiceNote && selectedVoiceNote.isNew && selectedVoiceNote.url && selectedVoiceNote.url.indexOf("blob:") === 0) {
    URL.revokeObjectURL(selectedVoiceNote.url);
  }
  selectedVoiceNote = null;
  renderVoicePreview();
}

function handleStickerUpload(e) {
  var file = e.target.files && e.target.files[0];
  if (!file || !file.type || file.type.indexOf("image/") !== 0) return;
  var url = URL.createObjectURL(file);
  if (typeof IMAGE_STICKERS !== "undefined") {
    IMAGE_STICKERS.push({ src: url, alt: "custom", file: file, isNew: true });
    if (typeof buildStickerTray === "function") buildStickerTray();
    if (typeof selectedStickers !== "undefined") {
      selectedStickers.push("img_" + (IMAGE_STICKERS.length - 1));
    }
  }
  e.target.value = "";
}

function setupOpenViewPatch() {
  if (typeof openView !== "function") return;
  if (window._viewPatched) return;
  window._viewPatched = true;
  var original = openView;
  window.openView = function(id) {
    original(id);
    if (typeof notes !== "undefined" && notes.length) {
      sortedNoteIds = notes.slice().sort(function(a, b) {
        if (a.starred && !b.starred) return -1;
        if (!a.starred && b.starred) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      }).map(function(n) { return String(n.id); });
    }
    var note = null;
    if (typeof notes !== "undefined") {
      for (var i = 0; i < notes.length; i++) {
        if (String(notes[i].id) === String(id)) { note = notes[i]; break; }
      }
    }
    var photosEl = document.getElementById("viewPhotos");
    if (photosEl) {
      photosEl.innerHTML = "";
      var photos = (note && note.photos) ? note.photos : [];
      for (var p = 0; p < photos.length; p++) {
        var img = document.createElement("img");
        img.src = photos[p];
        img.alt = "photo";
        photosEl.appendChild(img);
      }
    }
    var voiceEl = document.getElementById("viewVoice");
    if (voiceEl) {
      if (note && note.voiceNote) {
        voiceEl.innerHTML = '<audio controls src="' + note.voiceNote + '"></audio>';
      } else {
        voiceEl.innerHTML = "";
      }
    }
  };
}

function initExtras() {
  updateAnniversary();
  applySavedTheme();
  setupOpenViewPatch();
  setInterval(updateAnniversary, 3600000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initExtras);
} else {
  initExtras();
}
