<div align="center">

# 🔐 SecureVault

### Enterprise Password Manager — 100% Offline. Zero Dependencies.

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![Offline](https://img.shields.io/badge/Offline-First-success)
![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red)

**🔒 Your passwords. Your device. Your responsibility.**

</div>

---

## 📖 About

> SecureVault is a 100% offline, static single-page password manager built with pure HTML5, CSS3, and vanilla JavaScript. Features multi-layer encryption (AES-GCM 256 + PBKDF2 100k + XOR + Base64), per-record 6-digit PIN protection, enterprise dashboard UI, CRUD, search, categories, import/export — zero dependencies, zero CDN, runs from a USB stick.

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🔐 Security Architecture](#-security-architecture)
- [🖼️ Screenshots](#️-screenshots)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [🛠️ Tech Stack](#️-tech-stack)
- [📖 How to Use](#-how-to-use)
- [🔑 Encryption Details](#-encryption-details)
- [🌐 Browser Support](#-browser-support)
- [⚠️ Important Warnings](#️-important-warnings)
- [📋 Changelog](#-changelog)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)
- [👨‍💻 Author](#-author)

---

## ✨ Features

### 🎨 UI / UX
- ✅ Enterprise dashboard layout with sidebar + topbar
- ✅ KPI cards (Total / Strong / Weak / Categories)
- ✅ Dark / Light theme toggle 🌗
- ✅ Fully responsive (mobile / tablet / desktop)
- ✅ Smooth animations and hover effects
- ✅ Toast notifications

### 🔐 Security
- ✅ **Multi-layer encryption** (AES-GCM 256 + XOR + Base64)
- ✅ **PBKDF2** key derivation (100,000 iterations)
- ✅ **6-digit PIN** protection per record
- ✅ PIN required for **View / Copy / Edit / Delete**
- ✅ **Auto-hide** passwords after 8 seconds
- ✅ Cryptographically secure password generator
- ✅ Real-time **password strength meter**
- ✅ File-level encryption for **Import / Export**

### ⚙️ Functionality
- ✅ Full **CRUD** operations
- ✅ Real-time **search** (website / user / category)
- ✅ **Categories**: Work, Personal, Bank, Social
- ✅ **Pagination** (5 / 10 / 25 / 50 rows)
- ✅ **Show / Hide / Copy** password
- ✅ **Refresh** with sample data
- ✅ **Import / Export** JSON (encrypted or plain)
- ✅ Custom modals (no native alert/confirm)
- ✅ ℹ️ About popup with full project details

### 🌐 Privacy
- ✅ **100% Offline** — works without internet
- ✅ **Zero dependencies** — no CDN, no libraries
- ✅ **Zero telemetry** — no tracking, no analytics
- ✅ **In-memory storage** — no localStorage, no cookies
- ✅ Runs from a **USB stick**

---

## 🔐 Security Architecture

SecureVault uses **3 layers of encryption** stacked together using the browser-native **Web Crypto API** — no external libraries.

```
┌─────────────────────────────────────────┐
│           Plain Password                │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Layer 1: AES-GCM 256-bit               │
│  • PBKDF2 (600,000 iterations)          │
│  • Random 16-byte salt                  │
│  • Random 12-byte IV                    │
│  • Authenticated encryption             │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Layer 2: XOR Cipher                    │
│  • SHA-256 derived secondary key        │
│  • Symmetric obfuscation                │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│  Layer 3: Base64 Encoding               │
│  • Safe text transport                  │
└────────────────┬────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│        Encrypted JSON Payload           │
│  { v, salt, iv, data }                  │
└─────────────────────────────────────────┘
```

### 🛡️ Defense Matrix

| Attack | Defense |
|--------|---------|
| 🔓 Brute force PIN | PBKDF2 100k iterations (~6 days per record) |
| 🎯 Rainbow tables | Random 16-byte salt per record |
| 🔁 Pattern analysis | Random 12-byte IV per encryption |
| ✂️ Tampering | AES-GCM authentication tag |
| 👀 Memory dump | RAM-only, cleared on tab close |
| 🌐 Network sniff | Zero network calls |
| 👁 Shoulder-surf | Auto-hide after 8 seconds |

---

## 🖼️ Screenshots

> _Coming soon — add your screenshots here_

| Dashboard (Dark) | Dashboard (Light) |
|:---:|:---:|
| `screenshots/dashboard-dark.png` | `screenshots/dashboard-light.png` |

| About Popup | PIN Modal |
|:---:|:---:|
| `screenshots/about.png` | `screenshots/pin.png` |

---

## 🚀 Quick Start

### Option 1: Direct Run (Recommended)

```bash
# 1. Clone or download the repo
git clone https://github.com/yourusername/securevault.git

# 2. Open in browser
cd securevault
# Double-click index.html
```

### Option 2: Local Server (Optional)

```bash
# Python 3
python -m http.server 8000

# Then open
http://localhost:8000
```

### Option 3: Portable USB

1. Copy 3 files (`index.html`, `styles.css`, `app.js`) to USB
2. Plug into any computer
3. Double-click `index.html`
4. ✅ Works on Windows / Mac / Linux

---

## 📁 Project Structure

```
securevault/
 ├── index.html          # Semantic HTML5 markup
 ├── styles.css          # All styling (CSS variables, themes)
 ├── app.js              # All logic + encryption
 ├── README.md           # This file
 └── LICENSE             # MIT License
```

**Total size:** ~30 KB · **Zero external requests**

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| 📝 Markup | **HTML5** (semantic, accessible) |
| 🎨 Styling | **CSS3** (variables, grid, flexbox, animations) |
| ⚙️ Logic | **JavaScript ES6+** (vanilla, async/await, modules) |
| 🔐 Crypto | **Web Crypto API** (browser-native) |
| 📦 Storage | **In-memory variable** (`let data = []`) |
| 🚫 Build Tools | **None** (no Webpack, no Vite, no npm) |
| 🚫 Frameworks | **None** (no React, no Vue, no jQuery) |

---

## 📖 How to Use

### 1️⃣ Add a Credential
1. Fill in **Website**, **User ID**, **Password**, **Category**
2. Optionally click **⚙️ Generate** for a secure password
3. Click **💾 Save**
4. Choose: **🔐 Encrypt with PIN?** → Yes / No
5. If Yes → enter a **6-digit PIN**

### 2️⃣ View an Encrypted Password
1. Click **👁** icon in the password column
2. Enter your **6-digit PIN**
3. Password reveals for **8 seconds** then auto-hides

### 3️⃣ Copy a Password
1. Click **📋** icon
2. Enter PIN (if encrypted)
3. Password copied to clipboard

### 4️⃣ Edit / Delete
1. Click **✏️** or **🗑️**
2. Enter PIN (if encrypted)
3. Edit form opens / confirm delete modal appears

### 5️⃣ Search & Filter
- Type in **🔍 search bar** → filters in real-time
- Click sidebar categories → filter by type
- Use pagination → 5 / 10 / 25 / 50 rows

### 6️⃣ Import / Export
- **⬇️ Export** → enter encryption key → download `securevault.enc.json`
- **⬆️ Import** → select file → enter key (if encrypted)

### 7️⃣ Theme & Refresh
- 🌗 Toggle Light / Dark theme (topbar)
- 🔄 Refresh → loads 8 sample records

### 8️⃣ About
- Click **ℹ️** icon → view full project info & warnings

---

## 🔑 Encryption Details

### Encryption Flow

```javascript
// Encrypt
async function encryptData(plain, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));

  // Layer 1: AES-GCM
  const aesKey = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, aesKey, encoded
  );

  // Layer 2: XOR
  const xorKey = await deriveXorKey(passphrase);
  const xored  = xorCipher(new Uint8Array(cipher), xorKey);

  // Layer 3: Base64
  return JSON.stringify({
    v: "SV-3LAYER-v1",
    salt: bufToB64(salt),
    iv:   bufToB64(iv),
    data: bufToB64(xored)
  });
}
```

### Test in Browser Console

```javascript
const enc = await encryptData("HelloWorld", "123456");
console.log("Encrypted:", enc);

const dec = await decryptData(enc, "123456");
console.log("Decrypted:", dec);  // → "HelloWorld"
```

---

## 🌐 Browser Support

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| 🟢 Chrome | 60+ | ✅ Fully Supported |
| 🟢 Edge | 79+ | ✅ Fully Supported |
| 🟢 Firefox | 57+ | ✅ Fully Supported |
| 🟢 Safari | 11+ | ✅ Fully Supported |
| 🟢 Opera | 47+ | ✅ Fully Supported |
| 🟢 Brave | All | ✅ Fully Supported |
| 🔴 IE 11 | — | ❌ Not supported |

> **Required APIs:** Web Crypto, Clipboard, FileReader, Blob (all standard since ~2018)

---

## ⚠️ Important Warnings

> 🚨 **READ CAREFULLY BEFORE USE**

| Warning | Detail |
|---------|--------|
| 🚨 **Use at your own risk** | Demo / personal-use tool, provided **AS-IS** |
| 🔑 **No password recovery** | Forgotten PIN = **permanent data loss** |
| 🛑 **No backdoor** | No "Forgot PIN", no email reset — by cryptographic design |
| 💾 **Memory-only storage** | Closing/refreshing tab erases everything unless exported |
| 📥 **Backup is your duty** | Always export your encrypted JSON regularly |
| 🔐 **Safeguard your PIN** | Write it down in a safe physical place |
| 👤 **You are responsible** | For data security, PIN, and exported files |
| 🚫 **No liability** | Author NOT liable for any loss, breach, or damage |

---

## 📋 Changelog

### 🆕 v2.1.0 — June 2026 (Current)
- ✨ Added **About popup** (ℹ️ icon in topbar)
- ⚠️ Added prominent **risk warning & disclaimer** box
- 🚫 Added "No password recovery" notice
- 📜 Added License & liability disclaimer
- 🔒 Updated tagline: _"Your passwords. Your device. Your responsibility."_

### v2.0.0 — June 2026
- 🔐 Multi-layer encryption (AES-GCM + XOR + Base64)
- 🔢 Per-record 6-digit PIN protection
- 🔒 PIN required for view/copy/edit/delete
- ⏱ Auto-hide passwords after 8 seconds
- ⬇️⬆️ File-level encryption for import/export

### v1.0.0 — June 2026
- 🎨 Enterprise dashboard UI
- 📊 KPI cards, sidebar layout
- 🗂 Categories with filters
- 🔍 Search, pagination
- 🌗 Dark/Light theme
- ⬇️⬆️ Plain JSON import/export

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contribution
- 🔐 Master password lock screen
- 🔍 Advanced search filters
- 📊 Password expiry tracking
- 🗃️ Multiple vault support
- 🌍 Internationalization (i18n)
- 🎨 More themes (Solarized, Dracula)

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2026 Boopathi Subramanian

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

---

## 👨‍💻 Author

**Boopathi Subramanian**

- 💼 Role: Software Engineer
- 📍 Location: Bengaluru, India
- 🔗 GitHub: [@boopathiskv](https://github.com/boopathiskv/SecureVault)
- 💬 LinkedIn: [linkedin.com/in/boopathiskv](https://linkedin.com/in/boopathiskv)

---

## 🙏 Acknowledgments

- 🌐 **Web Crypto API** — for browser-native encryption
- 🎨 **Modern CSS** — for variables, grid, and flexbox
- 🔐 **NIST** — for AES-GCM standard
- 💡 **The open-source community** — for inspiration

---

## ⭐ Show Your Support

If this project helped you, give it a ⭐ on GitHub!

---

<div align="center">

### 🔒 Your passwords. Your device. Your responsibility.

**Built with ❤️ using nothing but HTML, CSS, and JavaScript.**

© 2026 SecureVault • All Rights Reserved

</div>
