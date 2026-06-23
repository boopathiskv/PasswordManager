/* ===== In-memory variable (NO localStorage) ===== */
let data = [];
let editId = null, deleteId = null;
let currentCat = "all";
let currentPage = 1;

/* ===== Init ===== */
window.onload = () => {
  seedDemoData();
  render();
};

/* ===== Seed Sample Data ===== */
function seedDemoData() {
  const today = new Date().toISOString().split("T")[0];

}

/* ===== Refresh ===== */
function refreshData() {
  seedDemoData();
  currentCat = "all"; currentPage = 1;
  const sb = document.getElementById("searchBox");
  if (sb) sb.value = "";
  clearForm();
  render();
  toast("🔄 Data refreshed");
}

/* ===== Theme ===== */
function toggleTheme() {
  document.body.classList.toggle("light");
  document.getElementById("themeBtn").innerText =
    document.body.classList.contains("light") ? "☀️" : "🌙";
}

/* ===== Modal Helpers ===== */
function openGenerator() { document.getElementById("genModal").classList.add("show"); }
function closeModal(id)  { document.getElementById(id).classList.remove("show"); }

/* ===== Promise-based Yes/No Modal ===== */
function askYesNo(message) {
  return new Promise(resolve => {
    document.getElementById("yesNoMsg").innerText = message;
    document.getElementById("yesNoModal").classList.add("show");
    window._yesNoResolve = resolve;
  });
}
function answerYesNo(val) {
  document.getElementById("yesNoModal").classList.remove("show");
  if (window._yesNoResolve) { window._yesNoResolve(val); window._yesNoResolve = null; }
}

/* ===== Promise-based PIN Modal ===== */
function askPin(title) {
  return new Promise(resolve => {
    document.getElementById("pinTitle").innerText = "🔢 " + title;
    const inp = document.getElementById("pinInput");
    inp.value = "";
    document.getElementById("pinModal").classList.add("show");
    setTimeout(() => inp.focus(), 100);
    window._pinResolve = resolve;
  });
}
function submitPin() {
  const pin = document.getElementById("pinInput").value;
  if (!/^\d{6}$/.test(pin)) return toast("⚠️ PIN must be exactly 6 digits", "error");
  document.getElementById("pinModal").classList.remove("show");
  if (window._pinResolve) { window._pinResolve(pin); window._pinResolve = null; }
}
function cancelPin() {
  document.getElementById("pinModal").classList.remove("show");
  if (window._pinResolve) { window._pinResolve(null); window._pinResolve = null; }
}

/* ===== Password Generator ===== */
function generate() {
  const len = +document.getElementById("length").value || 14;
  const sym = document.getElementById("incSym").checked;
  const num = document.getElementById("incNum").checked;
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  if (num) chars += "0123456789";
  if (sym) chars += "!@#$%^&*()_+-=";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let pwd = "";
  for (let i = 0; i < len; i++) pwd += chars[arr[i] % chars.length];
  document.getElementById("password").value = pwd;
  updateStrength();
  closeModal("genModal");
}

/* ===== Show/Hide Password ===== */
function togglePwd(id) {
  const el = document.getElementById(id);
  el.type = el.type === "password" ? "text" : "password";
}

/* ===== Strength Meter ===== */
function updateStrength() {
  const p = document.getElementById("password").value;
  const bar = document.getElementById("strengthBar");
  const txt = document.getElementById("strengthText");
  const score = strengthOf(p);
  const colors = ["#dc2626","#ea580c","#facc15","#16a34a"];
  const labels = ["Very Weak","Weak","Medium","Strong"];
  bar.style.width = (score * 25) + "%";
  bar.style.background = colors[score - 1] || "#475569";
  txt.innerText = "Strength: " + (labels[score - 1] || "-");
}
function strengthOf(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

/* ============================================================
   🔐 MULTI-LAYER ENCRYPTION (Web Crypto API)
   Layer 1: AES-GCM 256 (PBKDF2 100k iterations + random salt + IV)
   Layer 2: XOR with SHA-256 derived secondary key
   Layer 3: Base64 encoding
   ============================================================ */
function bufToB64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
function b64ToBuf(b64) { return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }

async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt","decrypt"]
  );
}
async function deriveXorKey(passphrase) {
  const enc = new TextEncoder();
  const h = await crypto.subtle.digest("SHA-256", enc.encode(passphrase + "_layer2"));
  return new Uint8Array(h);
}
function xorCipher(bytes, key) {
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return out;
}

async function encryptData(plain, passphrase) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveKey(passphrase, salt);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, enc.encode(plain));
  const xorKey = await deriveXorKey(passphrase);
  const xored = xorCipher(new Uint8Array(cipher), xorKey);
  return JSON.stringify({
    v: "SV-3LAYER-v1",
    salt: bufToB64(salt),
    iv:   bufToB64(iv),
    data: bufToB64(xored)
  });
}
async function decryptData(payloadJson, passphrase) {
  const obj = JSON.parse(payloadJson);
  if (obj.v !== "SV-3LAYER-v1") throw new Error("Unknown format");
  const salt = b64ToBuf(obj.salt);
  const iv   = b64ToBuf(obj.iv);
  const xored = b64ToBuf(obj.data);
  const xorKey = await deriveXorKey(passphrase);
  const cipher = xorCipher(xored, xorKey);
  const aesKey = await deriveKey(passphrase, salt);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, cipher);
  return new TextDecoder().decode(plainBuf);
}

/* ===== Helper: get decrypted password (asks PIN if needed) ===== */
async function getDecryptedPassword(item, actionLabel = "view") {
  if (!item.encrypted) return item.password;
  const pin = await askPin(`Enter PIN to ${actionLabel}`);
  if (!pin) { toast("❌ Cancelled", "error"); return null; }
  try {
    return await decryptData(item.password, pin);
  } catch {
    toast("❌ Wrong PIN", "error");
    return null;
  }
}

/* ===== CRUD ===== */
async function save() {
  const website  = document.getElementById("website").value.trim();
  const userId   = document.getElementById("userId").value.trim();
  const password = document.getElementById("password").value;
  const category = document.getElementById("category").value;
  if (!website || !userId || !password) return toast("⚠️ Fill all fields", "error");

  // Ask if user wants PIN encryption
  const wantsPin = await askYesNo("🔐 Do you want to set a 6-digit PIN to encrypt this password?");
  let finalPwd = password;
  let encrypted = false;

  if (wantsPin) {
    const pin = await askPin("Set 6-Digit PIN");
    if (!pin) return toast("❌ Save cancelled", "error");
    try {
      finalPwd = await encryptData(password, pin);
      encrypted = true;
    } catch {
      return toast("❌ Encryption failed", "error");
    }
  }

  const now = new Date().toISOString().split("T")[0];
  if (editId) {
    data = data.map(x => x.id === editId
      ? { ...x, website, userId, password: finalPwd, category, encrypted, updated: now }
      : x);
    toast(encrypted ? "✏️🔒 Updated (encrypted)" : "✏️ Updated");
    editId = null;
  } else {
    data.push({ id: Date.now(), website, userId, password: finalPwd, category, encrypted, created: now, updated: now });
    toast(encrypted ? "✅🔒 Added (encrypted)" : "✅ Added");
  }
  clearForm();
  render();
}

async function edit(id) {
  const it = data.find(x => x.id === id);
  if (!it) return;
  const pwd = await getDecryptedPassword(it, "edit");
  if (pwd === null) return;

  document.getElementById("website").value  = it.website;
  document.getElementById("userId").value   = it.userId;
  document.getElementById("password").value = pwd;
  document.getElementById("category").value = it.category;
  editId = id;
  updateStrength();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function askDelete(id) {
  const it = data.find(x => x.id === id);
  if (!it) return;
  if (it.encrypted) {
    const pwd = await getDecryptedPassword(it, "delete");
    if (pwd === null) return;
  }
  deleteId = id;
  document.getElementById("confirmModal").classList.add("show");
}
function confirmDelete() {
  data = data.filter(x => x.id !== deleteId);
  closeModal("confirmModal");
  toast("🗑️ Deleted");
  render();
}

function clearForm() {
  ["website","userId","password"].forEach(i => document.getElementById(i).value = "");
  document.getElementById("category").value = "Work";
  editId = null;
  updateStrength();
}

/* ===== Copy (PIN aware) ===== */
async function copyPwd(id) {
  const it = data.find(x => x.id === id);
  if (!it) return;
  const pwd = await getDecryptedPassword(it, "copy");
  if (pwd === null) return;
  navigator.clipboard.writeText(pwd);
  toast("📋 Copied");
}

/* ===== Toggle Row Password (PIN aware) ===== */
async function toggleRowPwd(id) {
  const it = data.find(x => x.id === id);
  if (!it) return;
  const el = document.querySelector(`.pwd-mask[data-id="${id}"]`);
  if (!el) return;

  if (el.dataset.shown === "1") {
    el.innerText = it.encrypted ? "🔒 Encrypted" : "••••••••";
    el.dataset.shown = "0";
    return;
  }

  const pwd = await getDecryptedPassword(it, "view");
  if (pwd === null) return;
  el.innerText = pwd;
  el.dataset.shown = "1";

  // auto-hide after 8 seconds for security
  setTimeout(() => {
    if (el.dataset.shown === "1") {
      el.innerText = it.encrypted ? "🔒 Encrypted" : "••••••••";
      el.dataset.shown = "0";
    }
  }, 8000);
}

/* ===== Filter ===== */
function filterByCat(cat) {
  currentCat = cat;
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  if (event && event.currentTarget) event.currentTarget.classList.add("active");
  currentPage = 1;
  render();
}

/* ===== Render ===== */
function render() {
  const q = (document.getElementById("searchBox")?.value || "").toLowerCase();
  let list = data.filter(x =>
    (currentCat === "all" || x.category === currentCat) &&
    (x.website.toLowerCase().includes(q) ||
     x.userId.toLowerCase().includes(q) ||
     x.category.toLowerCase().includes(q))
  );

  // KPI (skip strength for encrypted)
  document.getElementById("kTotal").innerText  = data.length;
  document.getElementById("kStrong").innerText = data.filter(x => !x.encrypted && strengthOf(x.password) >= 3).length;
  document.getElementById("kWeak").innerText   = data.filter(x => !x.encrypted && strengthOf(x.password) < 2).length;
  document.getElementById("kCats").innerText   = new Set(data.map(x => x.category)).size;

  // Sidebar counts
  document.getElementById("cAll").innerText = data.length;
  ["Work","Personal","Bank","Social"].forEach(c =>
    document.getElementById("c" + c).innerText = data.filter(x => x.category === c).length);

  // Pagination
  const size = +document.getElementById("pageSize").value;
  const totalPages = Math.max(1, Math.ceil(list.length / size));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * size;
  const pageItems = list.slice(start, start + size);

  const tbody = document.getElementById("tbody");
  if (pageItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px;">No records found</td></tr>`;
  } else {
    tbody.innerHTML = pageItems.map(it => {
      const masked = it.encrypted ? "🔒 Encrypted" : "••••••••";
      const lockBadge = it.encrypted ? ' <span style="color:#facc15;font-size:11px;">🔒 PIN</span>' : '';
      return `
      <tr>
        <td>🌐 ${it.website}</td>
        <td>${it.userId}</td>
        <td>
          <span class="pwd-mask" data-id="${it.id}" data-shown="0">${masked}</span>
          ${lockBadge}
          <span style="cursor:pointer;margin-left:6px;" onclick="toggleRowPwd(${it.id})" title="View">👁</span>
          <span style="cursor:pointer;margin-left:4px;" onclick="copyPwd(${it.id})" title="Copy">📋</span>
        </td>
        <td><span class="badge b${it.category}">${it.category}</span></td>
        <td>${it.created || "-"}</td>
        <td>${it.updated || "-"}</td>
        <td>
          <button class="btn btn-info row-btn" onclick="edit(${it.id})">✏️</button>
          <button class="btn btn-danger row-btn" onclick="askDelete(${it.id})">🗑️</button>
        </td>
      </tr>`;
    }).join("");
  }

  const pg = document.getElementById("pagination");
  pg.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    pg.innerHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
}
function goPage(p) { currentPage = p; render(); }

/* ===== Import / Export (file-level encryption key) ===== */
async function exportJSON() {
  if (data.length === 0) return toast("⚠️ No data to export", "error");
  const key = prompt("🔐 Enter encryption key for export file:");
  if (!key) return toast("❌ Export cancelled", "error");
  if (key.length < 6) return toast("⚠️ Key must be at least 6 characters", "error");

  try {
    const plain = JSON.stringify(data, null, 2);
    const encrypted = await encryptData(plain, key);
    const blob = new Blob([encrypted], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "securevault.enc.json";
    a.click();
    toast("⬇️🔒 Exported & encrypted");
  } catch {
    toast("❌ Encryption failed", "error");
  }
}

function importJSON(e) {
  const f = e.target.files[0]; if (!f) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    const raw = ev.target.result;
    let isEncrypted = false;
    try {
      const o = JSON.parse(raw);
      if (o && o.v === "SV-3LAYER-v1") isEncrypted = true;
    } catch {}

    if (isEncrypted) {
      const key = prompt("🔐 Enter decryption key for import file:");
      if (!key) { e.target.value = ""; return toast("❌ Import cancelled", "error"); }
      try {
        const plain = await decryptData(raw, key);
        data = JSON.parse(plain);
        render();
        toast("⬆️🔓 Imported & decrypted");
      } catch {
        toast("❌ Wrong key or corrupted file", "error");
      }
    } else {
      try { data = JSON.parse(raw); render(); toast("⬆️ Imported (plain JSON)"); }
      catch { toast("❌ Invalid JSON", "error"); }
    }
    e.target.value = "";
  };
  reader.readAsText(f);
}

/* ===== Toast ===== */
function toast(msg, type) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.style.background = type === "error" ? "#dc2626" : "#16a34a";
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

/* ===== About Modal ===== */
function openAbout() {
  document.getElementById("aboutModal").classList.add("show");
}
