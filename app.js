'use strict';
/* ============================================================
   SecureVault – Hardened App Logic
   ============================================================ */
(() => {

  /* ===== Anti-clickjacking ===== */
  if (window.top !== window.self) {
    document.documentElement.style.display = 'none';
    try { window.top.location = window.self.location; } catch { /* cross-origin */ }
  }

  /* ===== State ===== */
  let data = [];
  let editId = null, deleteId = null;
  let currentCat = 'all';
  let currentPage = 1;
  let yesNoResolve = null;
  let pinResolve   = null;
  let keyResolve   = null;
  let clipboardTimer = null;

  /* ===== Safe DOM helpers ===== */
  function $(id) {
    const el = document.getElementById(id);
    if (!el) console.warn('⚠️ Missing element:', id);
    return el;
  }
  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
  function on(id, evt, fn)   { const el = $(id); if (el) el.addEventListener(evt, fn); }

  /* ===== Init ===== */
  document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    render();
    openAbout();
  });

  /* ===== Event Binding ===== */
  function bindEvents() {
    document.querySelectorAll('.nav-item[data-cat]').forEach(el => {
      el.addEventListener('click', () => filterByCat(el.dataset.cat, el));
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); filterByCat(el.dataset.cat, el); }
      });
    });

    on('btnRefresh', 'click', refreshData);
    on('btnExport',  'click', exportJSON);
    on('fileImport', 'change', importJSON);

    on('searchBox', 'input', render);
    on('topRefresh','click', refreshData);
    on('themeBtn',  'click', toggleTheme);
    on('aboutBtn',  'click', openAbout);

    on('password',     'input', updateStrength);
    on('togglePwdBtn', 'click', () => togglePwd('password'));
    on('togglePwdBtn', 'keydown', e => { if (e.key === 'Enter' || e.key === ' ') togglePwd('password'); });
    on('btnGen',   'click', openGenerator);
    on('btnClear', 'click', clearForm);
    on('pageSize', 'change', render);

    on('credForm', 'submit', e => { e.preventDefault(); save(); });

    on('btnGenerate',  'click', generate);
    on('btnGenCancel', 'click', () => closeModal('genModal'));

    on('btnConfirmDel',    'click', confirmDelete);
    on('btnConfirmCancel', 'click', () => closeModal('confirmModal'));

    on('btnYes', 'click', () => answerYesNo(true));
    on('btnNo',  'click', () => answerYesNo(false));

    on('pinForm',      'submit', e => { e.preventDefault(); submitPin(); });
    on('btnPinCancel', 'click', cancelPin);

    on('keyForm',      'submit', e => { e.preventDefault(); submitKey(); });
    on('btnKeyCancel', 'click', cancelKey);

    on('btnAboutClose',  'click', () => closeModal('aboutModal'));
    on('btnAboutCloseX', 'click', () => closeModal('aboutModal'));
    on('togglePinBtn', 'click', () => toggleModalPwd('pinInput', 'togglePinBtn'));
    on('togglePinBtn', 'keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleModalPwd('pinInput', 'togglePinBtn'); }
    });
    on('toggleKeyBtn', 'click', () => toggleModalPwd('keyInput', 'toggleKeyBtn'));
    on('toggleKeyBtn', 'keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleModalPwd('keyInput', 'toggleKeyBtn'); }
    });

    const tbody = $('tbody');
    if (tbody) tbody.addEventListener('click', onTableClick);
    const pag = $('pagination');
    if (pag) pag.addEventListener('click', onPagClick);
  }

  /* ===== Refresh ===== */
  function refreshData() {
    currentCat = 'all'; currentPage = 1;
    const sb = $('searchBox');
    if (sb) sb.value = '';
    clearForm();
    render();
    toast('🔄 Data refreshed');
  }

  /* ===== Theme ===== */
  function toggleTheme() {
    document.body.classList.toggle('light');
    setText('themeBtn', document.body.classList.contains('light') ? '☀️' : '🌙');
  }

  /* ===== Modal Helpers ===== */
  function openGenerator() { $('genModal')?.classList.add('show'); }
  function closeModal(id)  { $(id)?.classList.remove('show'); }
  function openAbout()     { $('aboutModal')?.classList.add('show'); }

  /* ===== Yes/No Modal ===== */
  function askYesNo(message) {
    return new Promise(resolve => {
      setText('yesNoMsg', message);
      const m = $('yesNoModal'); if (!m) { resolve(false); return; }
      m.classList.add('show');
      yesNoResolve = resolve;
    });
  }
  function answerYesNo(val) {
    closeModal('yesNoModal');
    if (yesNoResolve) { yesNoResolve(val); yesNoResolve = null; }
  }

  /* ===== PIN Modal ===== */
  function askPin(title) {
    return new Promise(resolve => {
      setText('pinTitle', '🔢 ' + title);
      const inp = $('pinInput'); const m = $('pinModal');
      if (!inp || !m) { resolve(null); return; }
      inp.value = '';
      m.classList.add('show');
      setTimeout(() => inp.focus(), 100);
      pinResolve = resolve;
    });
  }
  function submitPin() {
     resetModalEye('pinInput', 'togglePinBtn'); // 👈 add
    const inp = $('pinInput'); if (!inp) return;
    const pin = inp.value;
    if (!/^\d{6}$/.test(pin)) { toast('⚠️ PIN must be exactly 6 digits', 'error'); return; }
    closeModal('pinModal');
    inp.value = '';
    if (pinResolve) { pinResolve(pin); pinResolve = null; }
  }
  function cancelPin() {
    resetModalEye('keyInput', 'toggleKeyBtn'); // 👈 add
    resetModalEye('pinInput', 'togglePinBtn'); // 👈 add
    const inp = $('pinInput'); if (inp) inp.value = '';
    closeModal('pinModal');
    if (pinResolve) { pinResolve(null); pinResolve = null; }
  }

  /* ===== Passphrase Modal ===== */
  function askKey(title, msg) {
    return new Promise(resolve => {
      setText('keyTitle', title);
      setText('keyMsg', msg || 'Minimum 6 characters.');
      const inp = $('keyInput'); const m = $('keyModal');
      if (!inp || !m) { resolve(null); return; }
      inp.value = '';
      m.classList.add('show');
      setTimeout(() => inp.focus(), 100);
      keyResolve = resolve;
    });
  }
  function submitKey() {
    const inp = $('keyInput'); if (!inp) return;
    const k = inp.value;
    closeModal('keyModal');
    inp.value = '';
    if (keyResolve) { keyResolve(k || null); keyResolve = null; }
  }
  function cancelKey() {
    const inp = $('keyInput'); if (inp) inp.value = '';
    closeModal('keyModal');
    if (keyResolve) { keyResolve(null); keyResolve = null; }
  }

  /* ===== Generator ===== */
  function generate() {
    const len = Math.max(6, Math.min(64, +($('length')?.value) || 14));
    const sym = $('incSym')?.checked;
    const num = $('incNum')?.checked;
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    if (num) chars += '0123456789';
    if (sym) chars += '!@#$%^&*()_+-=';
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    let pwd = '';
    for (let i = 0; i < len; i++) pwd += chars[arr[i] % chars.length];
    const pf = $('password'); if (pf) pf.value = pwd;
    updateStrength();
    closeModal('genModal');
  }

  function togglePwd(id) {
    const el = $(id); if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
  }

  /* ===== Strength ===== */
  function updateStrength() {
    const p = $('password')?.value || '';
    const bar = $('strengthBar');
    const txt = $('strengthText');
    const score = strengthOf(p);
    const colors = ['#dc2626','#ea580c','#facc15','#16a34a'];
    const labels = ['Very Weak','Weak','Medium','Strong'];
    if (bar) {
      bar.style.width = (score * 25) + '%';
      bar.style.background = colors[score - 1] || '#475569';
    }
    if (txt) txt.textContent = 'Strength: ' + (labels[score - 1] || '-');
  }
  function strengthOf(p) {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }

  /* ===== Encryption ===== */
  const PBKDF2_ITER = 600000;
  function bufToB64(buf) { return btoa(String.fromCharCode(...new Uint8Array(buf))); }
  function b64ToBuf(b64) { return Uint8Array.from(atob(b64), c => c.charCodeAt(0)); }

  async function deriveKey(pass, salt) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey('raw', enc.encode(pass), { name:'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name:'PBKDF2', salt, iterations: PBKDF2_ITER, hash:'SHA-256' },
      baseKey, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']
    );
  }
  async function deriveXorKey(pass) {
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass + '_layer2'));
    return new Uint8Array(h);
  }
  function xorCipher(bytes, key) {
    const out = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
    return out;
  }
  async function encryptData(plain, pass) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await deriveKey(pass, salt);
    const cipher = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, aesKey, enc.encode(plain));
    const xorKey = await deriveXorKey(pass);
    const xored = xorCipher(new Uint8Array(cipher), xorKey);
    return JSON.stringify({ v:'SV-3LAYER-v2', salt:bufToB64(salt), iv:bufToB64(iv), data:bufToB64(xored) });
  }
  async function decryptData(json, pass) {
    const obj = JSON.parse(json);
    if (obj.v !== 'SV-3LAYER-v2' && obj.v !== 'SV-3LAYER-v1') throw new Error('Unknown format');
    const salt = b64ToBuf(obj.salt);
    const iv   = b64ToBuf(obj.iv);
    const xored = b64ToBuf(obj.data);
    const xorKey = await deriveXorKey(pass);
    const cipher = xorCipher(xored, xorKey);
    const aesKey = await deriveKey(pass, salt);
    const buf = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, aesKey, cipher);
    return new TextDecoder().decode(buf);
  }

  async function getDecryptedPassword(item, label = 'view') {
    if (!item.encrypted) return item.password;
    const pin = await askPin(`Enter PIN to ${label}`);
    if (!pin) { toast('❌ Cancelled', 'error'); return null; }
    try { return await decryptData(item.password, pin); }
    catch { toast('❌ Wrong PIN', 'error'); return null; }
  }

  /* ===== CRUD ===== */
  async function save() {
    const website  = $('website')?.value.trim() || '';
    const userId   = $('userId')?.value.trim() || '';
    const password = $('password')?.value || '';
    const category = $('category')?.value || 'Work';
    if (!website || !userId || !password) { toast('⚠️ Fill all fields', 'error'); return; }
    if (website.length > 200 || userId.length > 200 || password.length > 256) {
      return toast('⚠️ Field too long', 'error');
    }

    const wantsPin = await askYesNo('🔐 Do you want to set a 6-digit PIN to encrypt this password?');
    let finalPwd = password;
    let encrypted = false;
    if (wantsPin) {
      const pin = await askPin('Set 6-Digit PIN');
      if (!pin) return toast('❌ Save cancelled', 'error');
      try { finalPwd = await encryptData(password, pin); encrypted = true; }
      catch { return toast('❌ Encryption failed', 'error'); }
    }
    const now = new Date().toISOString().split('T')[0];
    if (editId) {
      data = data.map(x => x.id === editId
        ? { ...x, website, userId, password: finalPwd, category, encrypted, updated: now }
        : x);
      toast(encrypted ? '✏️🔒 Updated (encrypted)' : '✏️ Updated');
      editId = null;
    } else {
      data.push({ id: Date.now(), website, userId, password: finalPwd, category, encrypted, created: now, updated: now });
      toast(encrypted ? '✅🔒 Added (encrypted)' : '✅ Added');
    }
    clearForm();
    render();
  }

  async function edit(id) {
    const it = data.find(x => x.id === id);
    if (!it) return;
    const pwd = await getDecryptedPassword(it, 'edit');
    if (pwd === null) return;
    if ($('website'))  $('website').value  = it.website;
    if ($('userId'))   $('userId').value   = it.userId;
    if ($('password')) $('password').value = pwd;
    if ($('category')) $('category').value = it.category;
    editId = id;
    updateStrength();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function askDelete(id) {
    const it = data.find(x => x.id === id);
    if (!it) return;
    if (it.encrypted) {
      const pwd = await getDecryptedPassword(it, 'delete');
      if (pwd === null) return;
    }
    deleteId = id;
    $('confirmModal')?.classList.add('show');
  }
  function confirmDelete() {
    data = data.filter(x => x.id !== deleteId);
    closeModal('confirmModal');
    toast('🗑️ Deleted');
    render();
  }
  function clearForm() {
    ['website','userId','password'].forEach(i => { if ($(i)) $(i).value = ''; });
    if ($('category')) $('category').value = 'Work';
    editId = null;
    updateStrength();
  }

  /* ===== Copy ===== */
  async function copyPwd(id) {
    const it = data.find(x => x.id === id);
    if (!it) return;
    const pwd = await getDecryptedPassword(it, 'copy');
    if (pwd === null) return;
    try {
      await navigator.clipboard.writeText(pwd);
      if (clipboardTimer) clearTimeout(clipboardTimer);
      clipboardTimer = setTimeout(() => navigator.clipboard.writeText('').catch(()=>{}), 20000);
      toast('📋 Copied (clears in 20s)');
    } catch { toast('❌ Clipboard blocked', 'error'); }
  }

  async function toggleRowPwd(id) {
    const it = data.find(x => x.id === id);
    if (!it) return;
    const el = document.querySelector(`.pwd-mask[data-id="${id}"]`);
    if (!el) return;
    if (el.dataset.shown === '1') {
      el.textContent = it.encrypted ? '🔒 Encrypted' : '••••••••';
      el.dataset.shown = '0';
      return;
    }
    const pwd = await getDecryptedPassword(it, 'view');
    if (pwd === null) return;
    el.textContent = pwd;
    el.dataset.shown = '1';
    setTimeout(() => {
      if (el.dataset.shown === '1') {
        el.textContent = it.encrypted ? '🔒 Encrypted' : '••••••••';
        el.dataset.shown = '0';
      }
    }, 8000);
  }

  /* ===== Filter ===== */
  function filterByCat(cat, targetEl) {
    currentCat = cat;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (targetEl) targetEl.classList.add('active');
    currentPage = 1;
    render();
  }

  /* ===== Render ===== */
  function render() {
    const q = ($('searchBox')?.value || '').toLowerCase();
    let list = data.filter(x =>
      (currentCat === 'all' || x.category === currentCat) &&
      (x.website.toLowerCase().includes(q) ||
       x.userId.toLowerCase().includes(q)  ||
       x.category.toLowerCase().includes(q))
    );

    setText('kTotal',  data.length);
    setText('kStrong', data.filter(x => !x.encrypted && strengthOf(x.password) >= 3).length);
    setText('kWeak',   data.filter(x => !x.encrypted && strengthOf(x.password) < 2).length);
    setText('kCats',   new Set(data.map(x => x.category)).size);

    setText('cAll', data.length);
    ['Work','Personal','Bank','Social'].forEach(c =>
      setText('c' + c, data.filter(x => x.category === c).length));

    const size = +($('pageSize')?.value || 10);
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * size;
    const pageItems = list.slice(start, start + size);

    const tbody = $('tbody');
    if (tbody) {
      tbody.replaceChildren();
      if (pageItems.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7;
        td.className = 'empty-row';
        td.textContent = 'No records found';
        tr.appendChild(td);
        tbody.appendChild(tr);
      } else {
        pageItems.forEach(it => tbody.appendChild(buildRow(it)));
      }
    }

    const pg = $('pagination');
    if (pg) {
      pg.replaceChildren();
      for (let i = 1; i <= totalPages; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        if (i === currentPage) b.classList.add('active');
        b.dataset.page = i;
        b.textContent = i;
        pg.appendChild(b);
      }
    }
  }

  function buildRow(it) {
    const tr = document.createElement('tr');

    const tdWeb = document.createElement('td');
    tdWeb.textContent = '🌐 ' + it.website;
    tr.appendChild(tdWeb);

    const tdUser = document.createElement('td');
    tdUser.textContent = it.userId;
    tr.appendChild(tdUser);

    const tdPwd = document.createElement('td');
    const mask = document.createElement('span');
    mask.className = 'pwd-mask';
    mask.dataset.id = it.id;
    mask.dataset.shown = '0';
    mask.textContent = it.encrypted ? '🔒 Encrypted' : '••••••••';
    tdPwd.appendChild(mask);
    if (it.encrypted) {
      const badge = document.createElement('span');
      badge.className = 'pin-badge';
      badge.textContent = ' 🔒 PIN';
      tdPwd.appendChild(badge);
    }
    const eye = document.createElement('span');
    eye.className = 'row-icon';
    eye.title = 'View';
    eye.dataset.action = 'toggle';
    eye.dataset.id = it.id;
    eye.textContent = '👁';
    tdPwd.appendChild(eye);
    const cpy = document.createElement('span');
    cpy.className = 'row-icon row-icon-tight';
    cpy.title = 'Copy';
    cpy.dataset.action = 'copy';
    cpy.dataset.id = it.id;
    cpy.textContent = '📋';
    tdPwd.appendChild(cpy);
    tr.appendChild(tdPwd);

    const tdCat = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge b' + it.category;
    badge.textContent = it.category;
    tdCat.appendChild(badge);
    tr.appendChild(tdCat);

    const tdC = document.createElement('td'); tdC.textContent = it.created || '-'; tr.appendChild(tdC);
    const tdU = document.createElement('td'); tdU.textContent = it.updated || '-'; tr.appendChild(tdU);

    const tdAct = document.createElement('td');
    const eb = document.createElement('button');
    eb.type = 'button'; eb.className = 'btn btn-info row-btn';
    eb.dataset.action = 'edit'; eb.dataset.id = it.id;
    eb.textContent = '✏️';
    tdAct.appendChild(eb);
    const db = document.createElement('button');
    db.type = 'button'; db.className = 'btn btn-danger row-btn';
    db.dataset.action = 'delete'; db.dataset.id = it.id;
    db.textContent = '🗑️';
    tdAct.appendChild(db);
    tr.appendChild(tdAct);

    return tr;
  }

  function onTableClick(e) {
    const t = e.target.closest('[data-action][data-id]');
    if (!t) return;
    const id = Number(t.dataset.id);
    switch (t.dataset.action) {
      case 'edit':   edit(id); break;
      case 'delete': askDelete(id); break;
      case 'copy':   copyPwd(id); break;
      case 'toggle': toggleRowPwd(id); break;
    }
  }
  function onPagClick(e) {
    const b = e.target.closest('button[data-page]');
    if (!b) return;
    currentPage = Number(b.dataset.page);
    render();
  }

  /* ===== Import / Export ===== */
  async function exportJSON() {
    if (data.length === 0) return toast('⚠️ No data to export', 'error');
    const key = await askKey('🔐 Export Encryption Key', 'Enter a strong passphrase (min 6 chars)');
    if (!key) return toast('❌ Export cancelled', 'error');
    if (key.length < 6) return toast('⚠️ Key must be at least 6 characters', 'error');
    try {
      const plain = JSON.stringify(data, null, 2);
      const encrypted = await encryptData(plain, key);
      const blob = new Blob([encrypted], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'securevault.enc.json';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('⬇️🔒 Exported & encrypted');
    } catch { toast('❌ Encryption failed', 'error'); }
  }

  async function importJSON(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { e.target.value = ''; return toast('⚠️ File too large (max 5MB)', 'error'); }
    const reader = new FileReader();
    reader.onload = async ev => {
      const raw = ev.target.result;
      let isEncrypted = false;
      try {
        const o = JSON.parse(raw);
        if (o && (o.v === 'SV-3LAYER-v1' || o.v === 'SV-3LAYER-v2')) isEncrypted = true;
      } catch {}
      if (isEncrypted) {
        const key = await askKey('🔓 Decrypt Import File', "Enter the file's encryption passphrase");
        if (!key) { e.target.value = ''; return toast('❌ Import cancelled', 'error'); }
        try {
          const plain = await decryptData(raw, key);
          const parsed = JSON.parse(plain);
          if (!Array.isArray(parsed)) throw new Error('bad');
          data = parsed;
          render();
          toast('⬆️🔓 Imported & decrypted');
        } catch { toast('❌ Wrong key or corrupted file', 'error'); }
      } else {
        try {
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) throw new Error('bad');
          data = parsed;
          render();
          toast('⬆️ Imported (plain JSON)');
        } catch { toast('❌ Invalid JSON', 'error'); }
      }
      e.target.value = '';
    };
    reader.readAsText(f);
  }

  /* ===== Toast ===== */
  function toast(msg, type) {
    const t = $('toast'); if (!t) return;
    t.textContent = msg;
    t.style.background = type === 'error' ? '#dc2626' : '#16a34a';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ===== Modal Password Toggle (with icon swap + auto-hide) ===== */
  let modalPwdTimers = {};
  function toggleModalPwd(inputId, btnId) {
    const inp = $(inputId);
    const btn = $(btnId);
    if (!inp || !btn) return;
    if (inp.type === 'password') {
      inp.type = 'text';
      btn.textContent = '🙈';
      btn.setAttribute('aria-label', 'Hide');
      btn.title = 'Hide';
      // Auto-hide after 10s for security
      if (modalPwdTimers[inputId]) clearTimeout(modalPwdTimers[inputId]);
      modalPwdTimers[inputId] = setTimeout(() => {
        if (inp.type === 'text') {
          inp.type = 'password';
          btn.textContent = '👁';
          btn.setAttribute('aria-label', 'Show');
          btn.title = 'Show';
        }
      }, 10000);
    } else {
      inp.type = 'password';
      btn.textContent = '👁';
      btn.setAttribute('aria-label', 'Show');
      btn.title = 'Show';
      if (modalPwdTimers[inputId]) { clearTimeout(modalPwdTimers[inputId]); delete modalPwdTimers[inputId]; }
    }
  }
    function resetModalEye(inputId, btnId) {
    const inp = $(inputId);
    const btn = $(btnId);
    if (inp) inp.type = 'password';
    if (btn) {
      btn.textContent = '👁';
      btn.setAttribute('aria-label', 'Show');
      btn.title = 'Show';
    }
    if (modalPwdTimers[inputId]) { clearTimeout(modalPwdTimers[inputId]); delete modalPwdTimers[inputId]; }
  }

})();
