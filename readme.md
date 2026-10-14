# 📖 Our Journal — Kunwar & Jasmin

A private, aesthetic shared journal — like a real notebook, but digital.

---

## 📁 Folder Structure

```
journal/
├── index.html      ← Password login page
├── journal.html    ← Main journal
├── style.css       ← All styles
├── app.js          ← All logic
├── stickers/       ← Drop your Pinterest images here
└── README.md       ← This file
```

---

## 🔐 Changing the Password

Open `index.html` and find this line near the bottom:

```js
const SECRET_PASSWORD = "kunwarjasmin";
```

Change `"kunwarjasmin"` to whatever password you two decide on.

---

## 🎨 Adding Pinterest Sticker Images

1. Save your Pinterest images into the `stickers/` folder.
   Name them: `sticker-1.png`, `sticker-2.png`, etc.

2. Open `app.js` and find the `IMAGE_STICKERS` array:

```js
const IMAGE_STICKERS = [
  // { src: "stickers/sticker-1.png", alt: "heart" },
];
```

3. Un-comment and add your stickers like this:

```js
const IMAGE_STICKERS = [
  { src: "stickers/sticker-1.png", alt: "heart" },
  { src: "stickers/sticker-2.png", alt: "flower" },
  { src: "stickers/sticker-3.png", alt: "coffee" },
];
```

They'll automatically appear in the sticker tray inside the editor!

---

## ✍️ Formatting Syntax

| What you type | What it looks like |
|---|---|
| `*your text*` | **bold** |
| `_your text_` | underlined |
| `-your text-` | *italic* |

---

## 🚀 Deploying to Netlify

1. Drag the entire `journal/` folder into [Netlify Drop](https://app.netlify.com/drop)
2. Done! Share the link with Jasmin 🤍

---

## 📝 Notes

- All data is saved in **localStorage** in the browser — no server needed.
- Since it's localStorage, entries are saved per device/browser.
  If you want shared entries across devices, you'd need a small backend (Supabase free tier works great).
- The "last visited" feature tracks when the other person last opened the journal — based on which voice they write as.