const tabsEl = document.getElementById('tabs');
const contentEl = document.getElementById('content');
const addressInput = document.getElementById('addressInput');
const addressForm = document.getElementById('addressForm');
const menu = document.getElementById('menu');
const downloadsPanel = document.getElementById('downloadsPanel');
const downloadsList = document.getElementById('downloadsList');

const params = new URLSearchParams(location.search);
const incognito = params.get('incognito') === '1';
let store = { bookmarks: [], history: [], settings: { theme: 'dark', homePage: 'foxline://home', searchEngine: 'https://www.google.com/search?q=', startupTiles: [] } };
let tabs = [];
let activeId = null;
let downloadItems = [];
let updateState = { status: 'idle', message: '' };

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function isUrl(input) { return /^(https?:\/\/|file:\/\/|foxline:\/\/)/i.test(input) || (/^[\w-]+\.[a-z]{2,}/i.test(input) && !input.includes(' ')); }
function normalize(input) {
  if (!input) return store.settings.homePage || 'foxline://home';
  if (input.startsWith('foxline://')) return input;
  if (/^https?:\/\//i.test(input)) return input;
  if (isUrl(input)) return 'https://' + input;
  return (store.settings.searchEngine || 'https://www.google.com/search?q=') + encodeURIComponent(input);
}
function titleFor(url) {
  if (url === 'foxline://home') return 'Р”РѕРјР°С€РЅСЏСЏ';
  if (url === 'foxline://settings') return 'РќР°СЃС‚СЂРѕР№РєРё';
  if (url === 'foxline://bookmarks') return 'Р—Р°РєР»Р°РґРєРё';
  if (url === 'foxline://history') return 'РСЃС‚РѕСЂРёСЏ';
  if (url === 'foxline://downloads') return 'Р—Р°РіСЂСѓР·РєРё';
  if (url === 'foxline://about') return 'Р§С‚Рѕ РЅРѕРІРѕРіРѕ';
  try { return new URL(url).hostname; } catch { return url; }
}
function currentTab() { return tabs.find(t => t.id === activeId); }

async function init() {
  store = await window.foxline.getData();
  document.body.classList.toggle('theme-light', store.settings.theme === 'light');
  document.body.classList.toggle('theme-dark', store.settings.theme !== 'light');
  if (incognito) document.title = 'Foxline вЂ” РРЅРєРѕРіРЅРёС‚Рѕ';
  bindUI();
  if (!incognito && Array.isArray(store.sessionTabs) && store.sessionTabs.length) {
    const active = store.sessionActiveTab;
    store.sessionTabs.forEach(u => { if (u && !String(u).startsWith('foxline://about?')) createTab(u); });
    if (!tabs.length) createTab(store.settings.homePage || 'foxline://home');
    const found = tabs.find(t => t.url === active);
    if (found) activateTab(found.id);
  } else {
    createTab(store.settings.homePage || 'foxline://home');
  }
}

function bindUI() {
  document.getElementById('newTabBtn').onclick = () => createTab(store.settings.homePage || 'foxline://home');
  document.getElementById('backBtn').onclick = () => nav('back');
  document.getElementById('forwardBtn').onclick = () => nav('forward');
  document.getElementById('reloadBtn').onclick = () => nav('reload');
  document.getElementById('homeBtn').onclick = () => loadInActive(store.settings.homePage || 'foxline://home');
  document.getElementById('bookmarkBtn').onclick = addCurrentBookmark;
  document.getElementById('downloadsBtn').onclick = () => downloadsPanel.classList.toggle('hidden');
  document.getElementById('menuBtn').onclick = () => menu.classList.toggle('hidden');
  document.querySelectorAll('[data-win]').forEach(b => b.onclick = () => window.foxline.windowControl(b.dataset.win));
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => document.getElementById(b.dataset.close).classList.add('hidden'));
  addressForm.onsubmit = (e) => { e.preventDefault(); loadInActive(normalize(addressInput.value.trim())); menu.classList.add('hidden'); };
  menu.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]'); if (!btn) return;
    const a = btn.dataset.action; menu.classList.add('hidden');
    if (a === 'new-tab') createTab(store.settings.homePage || 'foxline://home');
    if (a === 'new-window') window.foxline.newWindow(false);
    if (a === 'new-incognito') window.foxline.newWindow(true);
    if (a === 'bookmarks') loadInActive('foxline://bookmarks');
    if (a === 'history') loadInActive('foxline://history');
    if (a === 'downloads') { loadInActive('foxline://downloads'); downloadsPanel.classList.remove('hidden'); }
    if (a === 'settings') loadInActive('foxline://settings');
    if (a === 'about') loadInActive('foxline://about');
    if (a === 'set-default') {
      const res = await window.foxline.setDefaultBrowser();
      alert(res.ok ? 'Foxline Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ РєР°Рє РѕР±СЂР°Р±РѕС‚С‡РёРє http/https. РџСЂРѕРІРµСЂСЊС‚Рµ РїР°СЂР°РјРµС‚СЂС‹ РїСЂРёР»РѕР¶РµРЅРёР№ Windows РґР»СЏ РЅР°Р·РЅР°С‡РµРЅРёСЏ РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ.' : 'РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°Р·РЅР°С‡РёС‚СЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё: ' + (res.error || 'РѕС€РёР±РєР°'));
    }
  });
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('hidden') && !menu.contains(e.target) && e.target.id !== 'menuBtn') menu.classList.add('hidden');
  });
  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key.toLowerCase() === 't') { e.preventDefault(); createTab(store.settings.homePage || 'foxline://home'); }
    if (ctrl && e.key.toLowerCase() === 'w') { e.preventDefault(); closeTab(activeId); }
    if (ctrl && e.key.toLowerCase() === 'l') { e.preventDefault(); addressInput.focus(); addressInput.select(); }
    if (ctrl && e.key.toLowerCase() === 'r') { e.preventDefault(); nav('reload'); }
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); nav('back'); }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); nav('forward'); }
    if (ctrl && e.shiftKey && e.key.toLowerCase() === 'n') { e.preventDefault(); window.foxline.newWindow(true); }
    if (ctrl && e.key.toLowerCase() === 'n') { e.preventDefault(); window.foxline.newWindow(false); }
  });
  window.foxline.onOpenUrl((url) => createTab(normalize(url)));
  window.foxline.onDownloadUpdate((d) => {
    const i = downloadItems.findIndex(x => x.filename === d.filename && x.path === d.path);
    if (i >= 0) downloadItems[i] = d; else downloadItems.unshift(d);
    renderDownloads();
  });
  if (window.foxline.onUpdateStatus) window.foxline.onUpdateStatus((s) => { updateState = s || updateState; const t = currentTab(); if (t && t.url === 'foxline://about') bindInternal(t.view, t.url); });
  if (window.foxline.updateStatus) window.foxline.updateStatus().then(s => { if (s) updateState = s; }).catch(() => {});
}

function renderTabs() {
  tabsEl.innerHTML = '';
  tabs.forEach(tab => {
    const el = document.createElement('div');
    el.className = 'tab' + (tab.id === activeId ? ' active' : '');
    el.innerHTML = `<span class="tab-title">${escapeHtml(tab.title || 'РќРѕРІР°СЏ РІРєР»Р°РґРєР°')}</span><button class="tab-close" title="Р—Р°РєСЂС‹С‚СЊ">вњ•</button>`;
    el.onclick = (e) => { if (e.target.classList.contains('tab-close')) closeTab(tab.id); else activateTab(tab.id); };
    tabsEl.appendChild(el);
  });
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function createTab(url, opts = {}) {
  const id = uid();
  const tab = { id, url: normalize(url), title: 'РќРѕРІР°СЏ РІРєР»Р°РґРєР°', view: null };
  tabs.push(tab);
  renderTabs();
  activateTab(id);
  loadInTab(tab, tab.url);
  if (!opts.skipSave) saveSession();
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id); if (idx < 0) return;
  const tab = tabs[idx];
  if (tab.view) tab.view.remove();
  tabs.splice(idx, 1);
  saveSession();
  if (!tabs.length) return createTab(store.settings.homePage || 'foxline://home');
  if (activeId === id) activateTab(tabs[Math.max(0, idx - 1)].id); else renderTabs();
}

function activateTab(id) {
  activeId = id;
  tabs.forEach(t => { if (t.view) t.view.classList.toggle('hidden', t.id !== id); });
  renderTabs();
  const t = currentTab();
  if (t) addressInput.value = t.url.startsWith('foxline://') ? '' : t.url;
  saveSession();
}

let saveSessionTimer = null;
function saveSession() {
  if (incognito || !window.foxline?.setSession) return;
  clearTimeout(saveSessionTimer);
  saveSessionTimer = setTimeout(() => {
    const urls = tabs.map(t => t.url).filter(Boolean);
    const active = currentTab()?.url || '';
    window.foxline.setSession({ tabs: urls.slice(0, 30), activeTab: active }).catch(() => {});
  }, 250);
}

function loadInActive(url) { const t = currentTab(); if (t) loadInTab(t, url); }

function loadInTab(tab, url) {
  tab.url = url;
  if (tab.view) tab.view.remove();
  if (url.startsWith('foxline://')) {
    const div = document.createElement('div');
    div.className = 'internal-view' + (tab.id === activeId ? '' : ' hidden');
    div.innerHTML = renderInternal(url);
    contentEl.appendChild(div);
    tab.view = div;
    tab.title = titleFor(url);
    bindInternal(div, url);
  } else {
    const wv = document.createElement('webview');
    wv.setAttribute('src', url);
    wv.setAttribute('allowpopups', '');
    wv.className = tab.id === activeId ? '' : 'hidden';
    tab.title = titleFor(url);
    renderTabs();
    wv.addEventListener('did-start-loading', () => {
      if (!tab.title || tab.title === titleFor(tab.url)) tab.title = 'Р—Р°РіСЂСѓР·РєР°вЂ¦';
      renderTabs();
    });
    wv.addEventListener('did-stop-loading', () => {
      if (tab.title === 'Р—Р°РіСЂСѓР·РєР°вЂ¦') tab.title = titleFor(tab.url);
      try { const t = wv.getTitle(); if (t) tab.title = t; } catch {}
      renderTabs();
      saveSession();
    });
    wv.addEventListener('page-title-updated', (e) => { tab.title = e.title || titleFor(tab.url); renderTabs(); saveSession(); });
    wv.addEventListener('did-navigate', (e) => updateNavState(tab, e.url));
    wv.addEventListener('did-navigate-in-page', (e) => updateNavState(tab, e.url));
    wv.addEventListener('new-window', (e) => { e.preventDefault?.(); createTab(normalize(e.url)); });
    contentEl.appendChild(wv);
    tab.view = wv;
  }
  if (tab.id === activeId) addressInput.value = url.startsWith('foxline://') ? '' : url;
  renderTabs();
}

async function updateNavState(tab, url) {
  tab.url = url;
  if (tab.id === activeId) addressInput.value = url;
  renderTabs();
  saveSession();
  if (!incognito) store.history = await window.foxline.addHistory({ url, title: tab.title || titleFor(url) });
}

function nav(action) {
  const t = currentTab(); if (!t || !t.view) return;
  if (t.view.tagName === 'WEBVIEW') {
    try { if (action === 'back') t.view.goBack(); if (action === 'forward') t.view.goForward(); } catch {}
    if (action === 'reload') t.view.reload();
  } else if (action === 'reload') loadInTab(t, t.url);
}

async function addCurrentBookmark() {
  const t = currentTab(); if (!t || t.url.startsWith('foxline://')) return;
  store.bookmarks = await window.foxline.addBookmark({ title: t.title || titleFor(t.url), url: t.url });
  alert('Р”РѕР±Р°РІР»РµРЅРѕ РІ Р·Р°РєР»Р°РґРєРё');
}

function renderInternal(url) {
  if (url === 'foxline://home') {
    const tiles = (store.settings.startupTiles || []).map(tile => `<div class="tile" data-open="${escapeHtml(tile.url)}"><div class="title">${escapeHtml(tile.title)}</div><div class="small">${escapeHtml(tile.url)}</div></div>`).join('');
    return `<div class="hero"><div class="badge">${incognito ? 'Р РµР¶РёРј РёРЅРєРѕРіРЅРёС‚Рѕ' : 'Foxline'}</div><h1>Foxline Browser</h1><p>Р‘С‹СЃС‚СЂС‹Р№ СЃРѕРІСЂРµРјРµРЅРЅС‹Р№ Р±СЂР°СѓР·РµСЂ СЃ С‚С‘РјРЅС‹Рј СЃС‚РёР»РµРј Рё РѕСЂР°РЅР¶РµРІС‹Рј Р°РєС†РµРЅС‚РѕРј.</p>
      <form class="search-big" id="homeSearch"><input id="homeQuery" placeholder="РџРѕРёСЃРє РІ Google РёР»Рё Р°РґСЂРµСЃ СЃР°Р№С‚Р°"/><button class="go-btn" type="submit">РќР°Р№С‚Рё</button></form>
      <div class="card-grid">${tiles}</div></div>`;
  }
  if (url === 'foxline://bookmarks') {
    const rows = store.bookmarks.map(b => `<div class="row"><div class="meta"><div class="title" data-open="${escapeHtml(b.url)}" style="cursor:pointer">${escapeHtml(b.title)}</div><div class="url">${escapeHtml(b.url)}</div></div><button class="icon-btn" data-del-bookmark="${b.id}">вњ•</button></div>`).join('') || '<div class="small">Р—Р°РєР»Р°РґРѕРє РїРѕРєР° РЅРµС‚.</div>';
    return `<h2>Р—Р°РєР»Р°РґРєРё</h2><div class="list">${rows}</div>`;
  }
  if (url === 'foxline://history') {
    const rows = store.history.map(h => `<div class="row"><div class="meta"><div class="title" data-open="${escapeHtml(h.url)}" style="cursor:pointer">${escapeHtml(h.title||h.url)}</div><div class="url">${escapeHtml(h.url)}</div><div class="small">${escapeHtml(h.at||'')}</div></div></div>`).join('') || '<div class="small">РСЃС‚РѕСЂРёСЏ РїСѓСЃС‚Р°.</div>';
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2>РСЃС‚РѕСЂРёСЏ</h2><button class="go-btn" id="clearHistory">РћС‡РёСЃС‚РёС‚СЊ</button></div><div class="list">${rows}</div>`;
  }
  if (url === 'foxline://downloads') {
    return `<h2>Р—Р°РіСЂСѓР·РєРё</h2><div id="downloadsPage"></div>`;
  }
  if (url === 'foxline://settings') {
    return `<h2>РќР°СЃС‚СЂРѕР№РєРё Foxline</h2><div class="settings-grid">
      <div class="card"><label>РўРµРјР° РѕС„РѕСЂРјР»РµРЅРёСЏ</label><select id="setTheme"><option value="dark">РўС‘РјРЅР°СЏ</option><option value="light">РЎРІРµС‚Р»Р°СЏ</option></select><div class="small" style="margin-top:8px">РўРµРјР° РїСЂРёРјРµРЅСЏРµС‚СЃСЏ СЃСЂР°Р·Сѓ Рё СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.</div></div>
      <div class="card"><label>Р”РѕРјР°С€РЅСЏСЏ СЃС‚СЂР°РЅРёС†Р°</label><input id="setHome" type="text" value="${escapeHtml(store.settings.homePage||'foxline://home')}" /></div>
      <div class="card"><label>РџРѕРёСЃРєРѕРІР°СЏ СЃРёСЃС‚РµРјР° (РїСЂРµС„РёРєСЃ Р·Р°РїСЂРѕСЃР°)</label><input id="setSearch" type="text" value="${escapeHtml(store.settings.searchEngine||'https://www.google.com/search?q=')}" /></div>
      <div class="card"><label>Р‘С‹СЃС‚СЂС‹Рµ РїР»РёС‚РєРё (JSON: title,url)</label><textarea id="setTiles" style="width:100%;min-height:150px;border-radius:12px;border:1px solid var(--border);background:var(--bg2);color:var(--text);padding:12px">${escapeHtml(JSON.stringify(store.settings.startupTiles||[], null, 2))}</textarea></div>
      <div class="card actions"><button class="go-btn" id="saveSettings">РЎРѕС…СЂР°РЅРёС‚СЊ РЅР°СЃС‚СЂРѕР№РєРё</button><button class="icon-btn" id="setDefaultBtn" style="padding:0 12px">РЎРґРµР»Р°С‚СЊ Р±СЂР°СѓР·РµСЂРѕРј РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ</button></div>
    </div>`;
  }
  if (url === 'foxline://about') {
    const msg = escapeHtml(updateState?.message || 'РџСЂРѕРІРµСЂРєР° РѕР±РЅРѕРІР»РµРЅРёР№ РґРѕСЃС‚СѓРїРЅР° РІ СѓСЃС‚Р°РЅРѕРІР»РµРЅРЅРѕР№ РІРµСЂСЃРёРё Foxline.');
    const pct = typeof updateState?.progress === 'number' ? ` (${updateState.progress}%)` : '';
    return `<h2>Р§С‚Рѕ РЅРѕРІРѕРіРѕ РІ Foxline</h2>
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:12px"><img src="../../assets/foxline-avatar.png" alt="Foxline" style="width:42px;height:42px;border-radius:12px;object-fit:cover"/><div><div class="title">Foxline</div><div class="small">РўРµРєСѓС‰Р°СЏ РІРµСЂСЃРёСЏ</div></div></div>
          <div class="badge" id="verBadge">1.0.0</div>
        </div>
      </div>
      <div class="settings-grid" style="margin-top:14px">
        <div class="card">
          <div class="title">РћР±РЅРѕРІР»РµРЅРёСЏ</div>
          <div class="small" style="margin:8px 0 12px" id="updateMsg">${msg}${pct}</div>
          <div class="actions">
            <button class="go-btn" id="checkUpdatesBtn">РџСЂРѕРІРµСЂРёС‚СЊ РѕР±РЅРѕРІР»РµРЅРёСЏ</button>
            
          </div>
          <div class="small" style="margin-top:10px">РђРІС‚РѕРѕР±РЅРѕРІР»РµРЅРёРµ РїСЂРѕРІРµСЂСЏРµС‚ РЅРѕРІС‹Рµ РІРµСЂСЃРёРё РІ С„РѕРЅРѕРІРѕРј СЂРµР¶РёРјРµ Рё СЃРѕРѕР±С‰Р°РµС‚ СЃС‚Р°С‚СѓСЃ РІ СЂРµР°Р»СЊРЅРѕРј РІСЂРµРјРµРЅРё (РґР»СЏ СѓСЃС‚Р°РЅРѕРІР»РµРЅРЅРѕР№ РІРµСЂСЃРёРё СЃ СЃРµСЂРІРµСЂРѕРј РѕР±РЅРѕРІР»РµРЅРёР№).</div>
        </div>
        <div class="card">
          <div class="title">Р’РµСЂСЃРёСЏ 1.0.0</div>
          <div class="small" style="margin:6px 0 10px">РўРµРєСѓС‰РёР№ СЂРµР»РёР· Foxline.</div>
          <ul style="margin:0;padding-left:18px;line-height:1.7">
            <li>РњРЅРѕРіРѕРІРєР»Р°РґРѕС‡РЅС‹Р№ Р±СЂР°СѓР·РµСЂ РЅР° Electron/Chromium.</li>
            <li>РђРґСЂРµСЃРЅР°СЏ СЃС‚СЂРѕРєР° СЃ РїРѕРёСЃРєРѕРј С‡РµСЂРµР· Google, РЅР°РІРёРіР°С†РёСЏ РЅР°Р·Р°Рґ/РІРїРµСЂС‘Рґ/РѕР±РЅРѕРІРёС‚СЊ.</li>
            <li>Р”РѕРјР°С€РЅСЏСЏ СЃС‚СЂР°РЅРёС†Р°, Р·Р°РєР»Р°РґРєРё, РёСЃС‚РѕСЂРёСЏ, Р·Р°РіСЂСѓР·РєРё, РЅР°СЃС‚СЂРѕР№РєРё.</li>
            <li>Р РµР¶РёРј РёРЅРєРѕРіРЅРёС‚Рѕ, РЅРµСЃРєРѕР»СЊРєРѕ РѕРєРѕРЅ Рё РіРѕСЂСЏС‡РёРµ РєР»Р°РІРёС€Рё.</li>
            <li>РўС‘РјРЅС‹Р№ Рё СЃРІРµС‚Р»С‹Р№ РёРЅС‚РµСЂС„РµР№СЃ, СЃРѕС…СЂР°РЅРµРЅРёРµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊСЃРєРёС… РЅР°СЃС‚СЂРѕРµРє.</li>
            <li>Р¤РѕРЅРѕРІР°СЏ РїСЂРѕРІРµСЂРєР° РѕР±РЅРѕРІР»РµРЅРёР№ СЃРѕ СЃС‚Р°С‚СѓСЃРѕРј РІ СЂРµР°Р»СЊРЅРѕРј РІСЂРµРјРµРЅРё.</li>
          </ul>
        </div>
      </div>`;
  }
  return `<div class="card">РќРµРёР·РІРµСЃС‚РЅР°СЏ СЃС‚СЂР°РЅРёС†Р° Foxline.</div>`;
}

function bindInternal(root, url) {
  root.querySelectorAll('[data-open]').forEach(el => el.onclick = () => loadInActive(el.dataset.open));
  const homeSearch = root.querySelector('#homeSearch');
  if (homeSearch) homeSearch.onsubmit = (e) => { e.preventDefault(); loadInActive(normalize(root.querySelector('#homeQuery').value.trim())); };
  root.querySelectorAll('[data-del-bookmark]').forEach(btn => btn.onclick = async () => { store.bookmarks = await window.foxline.removeBookmark(btn.dataset.delBookmark); loadInTab(currentTab(), 'foxline://bookmarks'); });
  const clear = root.querySelector('#clearHistory'); if (clear) clear.onclick = async () => { store.history = await window.foxline.clearHistory(); loadInTab(currentTab(), 'foxline://history'); };
  if (url === 'foxline://downloads') renderDownloads(root.querySelector('#downloadsPage'));
  if (url === 'foxline://settings') {
    const themeEl = root.querySelector('#setTheme');
    const homeEl = root.querySelector('#setHome');
    const searchEl = root.querySelector('#setSearch');
    const tilesEl = root.querySelector('#setTiles');
    themeEl.value = store.settings.theme || 'dark';

    const save = async (patch, silent) => {
      try { store.settings = await window.foxline.setSettings({ ...store.settings, ...patch }); } catch {}
      document.body.classList.toggle('theme-light', store.settings.theme === 'light');
      document.body.classList.toggle('theme-dark', store.settings.theme !== 'light');
      if (!silent) alert('РќР°СЃС‚СЂРѕР№РєРё СЃРѕС…СЂР°РЅРµРЅС‹');
    };

    themeEl.onchange = async () => { await save({ theme: themeEl.value }, true); };
    const autoSave = async () => {
      let tiles = store.settings.startupTiles || [];
      try { tiles = JSON.parse(tilesEl.value || '[]'); } catch { return; }
      await save({ homePage: homeEl.value || 'foxline://home', searchEngine: searchEl.value || 'https://www.google.com/search?q=', startupTiles: Array.isArray(tiles) ? tiles : [] }, true);
    };
    homeEl.addEventListener('change', autoSave);
    searchEl.addEventListener('change', autoSave);
    tilesEl.addEventListener('change', autoSave);

    root.querySelector('#saveSettings').onclick = async () => {
      let tiles = store.settings.startupTiles || [];
      try { tiles = JSON.parse(tilesEl.value || '[]'); } catch { alert('РћС€РёР±РєР° РІ JSON РїР»РёС‚РѕРє'); return; }
      await save({ theme: themeEl.value, homePage: homeEl.value || 'foxline://home', searchEngine: searchEl.value || 'https://www.google.com/search?q=', startupTiles: Array.isArray(tiles) ? tiles : [] }, false);
    };
    root.querySelector('#setDefaultBtn').onclick = async () => {
      const res = await window.foxline.setDefaultBrowser();
      alert(res.ok ? 'Foxline Р·Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°РЅ РєР°Рє РѕР±СЂР°Р±РѕС‚С‡РёРє http/https.' : 'РќРµ СѓРґР°Р»РѕСЃСЊ: ' + (res.error || 'РѕС€РёР±РєР°'));
    };
  }
  if (url === 'foxline://about') {
    window.foxline.appInfo().then(info => {
      const badge = root.querySelector('#verBadge');
      if (badge) badge.textContent = info?.version || '1.0.0';
    }).catch(() => {});
    const check = root.querySelector('#checkUpdatesBtn');
    if (check) check.onclick = async () => { check.disabled = true; try { updateState = await window.foxline.checkUpdates() || updateState; } catch {} bindInternal(root, url); };
  }
}

function renderDownloads(target) {
  const html = downloadItems.map(d => `<div class="row"><div class="meta"><div class="title">${escapeHtml(d.filename)}</div><div class="small">${escapeHtml(d.state||'')} ${d.total?Math.round((d.received||0)/d.total*100)+'%':''}</div><div class="url">${escapeHtml(d.path||'')}</div></div><button class="icon-btn" data-show-item="${escapeHtml(d.path||'')}">РџР°РїРєР°</button></div>`).join('') || '<div class="small">Р—Р°РіСЂСѓР·РѕРє РїРѕРєР° РЅРµС‚.</div>';
  downloadsList.innerHTML = html;
  downloadsList.querySelectorAll('[data-show-item]').forEach(b => b.onclick = () => window.foxline.showItem(b.dataset.showItem));
  if (target) { target.innerHTML = html; target.querySelectorAll('[data-show-item]').forEach(b => b.onclick = () => window.foxline.showItem(b.dataset.showItem)); }
}

init();


