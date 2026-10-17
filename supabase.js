/* ═══════════════════════════════════════
   SUPABASE CONFIG
═══════════════════════════════════════ */
const SUPABASE_URL  = "https://xjkmfoqaxyiqnfcmpdea.supabase.co";
const SUPABASE_KEY  = "sb_publishable_xF5GX7bBCZn5jRdNK3XH-A_8b3PO1Q_";

/* ═══════════════════════════════════════
   Tiny Supabase REST client (no SDK needed)
═══════════════════════════════════════ */
const sb = {
  async getAll() {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/journal_entries?order=created_at.desc`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (!res.ok) throw new Error("fetch failed");
      return await res.json();
    } catch(e) { console.warn("Supabase offline, using localStorage", e); return null; }
  },

  async insert(note) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/journal_entries`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json", Prefer: "return=representation"
        },
        body: JSON.stringify({
          raw_text:   note.rawText,
          voice:      note.voice,
          mood:       note.mood,
          stickers:   note.stickers,
          starred:    note.starred,
          font:       note.font || "handwriting",
          photos:     note.photos || [],
          voice_note: note.voiceNote || null,
          created_at: note.createdAt,
          edited_at:  note.editedAt || null
        })
      });
      if (!res.ok) throw new Error("insert failed");
      const rows = await res.json();
      return rows[0];
    } catch(e) { console.warn("Supabase insert failed", e); return null; }
  },

  async update(id, fields) {
    try {
      const body = {};
      if (fields.rawText   !== undefined) body.raw_text   = fields.rawText;
      if (fields.voice     !== undefined) body.voice      = fields.voice;
      if (fields.mood      !== undefined) body.mood       = fields.mood;
      if (fields.stickers  !== undefined) body.stickers   = fields.stickers;
      if (fields.starred   !== undefined) body.starred    = fields.starred;
      if (fields.font      !== undefined) body.font       = fields.font;
      if (fields.photos    !== undefined) body.photos     = fields.photos;
      if (fields.voiceNote !== undefined) body.voice_note = fields.voiceNote;
      if (fields.editedAt  !== undefined) body.edited_at  = fields.editedAt;
      const res = await fetch(`${SUPABASE_URL}/rest/v1/journal_entries?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json", Prefer: "return=representation"
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("update failed");
      const rows = await res.json();
      return rows[0];
    } catch(e) { console.warn("Supabase update failed", e); return null; }
  },

  async remove(id) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/journal_entries?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      return true;
    } catch(e) { console.warn("Supabase delete failed", e); return false; }
  },

  /* Upload a file to the journal-media bucket. Returns public URL or null. */
  async uploadFile(file, folder = "uploads") {
    try {
      const ext  = (file.name || "file").split(".").pop() || "bin";
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const res  = await fetch(
        `${SUPABASE_URL}/storage/v1/object/journal-media/${path}`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": file.type || "application/octet-stream",
            "x-upsert": "true"
          },
          body: file
        }
      );
      if (!res.ok) throw new Error("upload failed " + res.status);
      return `${SUPABASE_URL}/storage/v1/object/public/journal-media/${path}`;
    } catch (e) {
      console.warn("Upload failed", e);
      return null;
    }
  }
};
