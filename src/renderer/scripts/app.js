const tabsEl = document.getElementById('tabs');
const contentEl = document.getElementById('content');
const addressInput = document.getElementById('addressInput');
const addressForm = document.getElementById('addressForm');
const menu = document.getElementById('menu');
const downloadsPanel = document.getElementById('downloadsPanel');
const downloadsList = document.getElementById('downloadsList');

const params = new URLSearchParams(location.search);
const incognito = params.get('incognito') === '1';
let store = { bookmarks: [], history: [], settings: { theme: 'dark', homePage: 'foxline://home', searchEngine: 'https://www.google.com/search?q=', language: 'auto', startupTiles: [] } };
let tabs = [];
let activeId = null;
let downloadItems = [];
let updateState = { status: 'idle', message: '' };

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function detectLang(){ const n=(navigator.language||'en').toLowerCase(); const map=window.FOXLINE_LANGS||[['en','English']]; const exact=map.find(([c])=>c===n)||map.find(([c])=>n.startsWith(c+'-'))||map.find(([c])=>n.startsWith(c)); return exact?exact[0]:'en'; }
function lang(){ const l=store?.settings?.language; return (!l||l==='auto')?detectLang():(window.FOXLINE_I18N?.[l]?l:'en'); }
function t(key,fb){ const d=window.FOXLINE_I18N||{}; return d[lang()]?.[key] ?? d.en?.[key] ?? fb ?? key; }
function applyI18n(){ document.documentElement.lang=lang(); if(lang()==='ar') document.documentElement.dir='rtl'; else document.documentElement.dir='ltr';
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.getAttribute('data-i18n'); if(k) el.textContent=t(k,el.textContent); });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{ const k=el.getAttribute('data-i18n-title'); if(k) el.title=t(k,el.title); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ const k=el.getAttribute('data-i18n-placeholder'); if(k) el.placeholder=t(k,el.placeholder); });
}
const FOXLINE_SEARCH_URL = 'foxline://search?q=';

function displayAddress(url){ try{ const u=new URL(url); if(u.hostname.includes('google.') && u.pathname.startsWith('/search')) { const q=u.searchParams.get('q'); if(q) return 'https://www.foxline.com/search?q='+encodeURIComponent(q); } }catch{} if(!url||url==='foxline://home'||url==='foxline://home/'||url.startsWith('foxline://')) return ''; return url; }
function foxlineSearchTarget(q){ const provider = (store.settings.searchEngine || 'https://www.google.com/search?q='); return provider.includes('{q}') ? provider.replace('{q}', encodeURIComponent(q||'')) : (provider + encodeURIComponent(q||'')); }
function parseFoxlineSearch(url){ try{ const u=new URL(url); const h=u.hostname.toLowerCase(); if((h==='foxline.com'||h==='www.foxline.com'||h.endsWith('.foxline.com')) && u.pathname==='/search') return u.searchParams.get('q')??''; }catch{} return null; }
function foxlineSearchUrl(query) {
  return FOXLINE_SEARCH_URL + encodeURIComponent(query || '');
}

function isUrl(input) { return /^(https?:\/\/|file:\/\/|foxline:\/\/)/i.test(input) || (/^[\w-]+\.[a-z]{2,}/i.test(input) && !input.includes(' ')); }
function normalize(input) {
  if (!input) return store.settings.homePage || 'foxline://home';
  if (input.startsWith('foxline://search')) {
    const q = new URLSearchParams(input.split('?')[1] || '').get('q') || '';
    const provider = (store.settings.searchEngine || 'https://www.google.com/search?q=');
    return provider.includes('{q}') ? provider.replace('{q}', encodeURIComponent(q)) : (provider + encodeURIComponent(q));
  }
  if (input.startsWith('foxline://')) return input;
  if (/^https?:\/\//i.test(input)) return input;
  // treat as URL only if it has a dot-domain or localhost; otherwise search
  if (/^localhost(:\d+)?(\/|$)/i.test(input) || /^[\w-]+(\.[\w-]+)+([\/:?#]|$)/i.test(input)) return 'https://' + input;
  const provider = (store.settings.searchEngine || 'https://www.google.com/search?q=');
  return provider.includes('{q}') ? provider.replace('{q}', encodeURIComponent(input)) : (provider + encodeURIComponent(input));
}
function titleFor(url) {
  if (url === 'foxline://home' || url === 'http://foxline.com/') return t('home','Home');
  if (url.startsWith('foxline://search')) return t('search','Search');
  if (url === 'foxline://settings') return t('settings','Settings');
  if (url === 'foxline://bookmarks') return t('bookmarks','Bookmarks');
  if (url === 'foxline://history') return t('history','History');
  if (url === 'foxline://downloads') return t('downloads','Downloads');
  if (url === 'foxline://about') return t('whatsNew',"What's new");
  try { return new URL(url).hostname; } catch { return url; }
}
function currentTab() { return tabs.find(t => t.id === activeId); }

async function init() {
  store = await window.foxline.getData();
  document.body.classList.toggle('theme-light', store.settings.theme === 'light');
  if(!store.settings.language) store.settings.language='auto';
  applyI18n();
  document.body.classList.toggle('theme-dark', store.settings.theme !== 'light');
  if (incognito) document.title = 'Foxline — ' + t('incognito','Incognito');
  bindUI(); applyI18n();
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
  (() => { const b=document.getElementById('backBtn'); if(!b) return; const h=(e)=>{e.preventDefault();e.stopPropagation();nav('back');}; b.addEventListener('click',h); b.addEventListener('mousedown',(e)=>e.preventDefault()); })();
  (() => { const b=document.getElementById('forwardBtn'); if(!b) return; const h=(e)=>{e.preventDefault();e.stopPropagation();nav('forward');}; b.addEventListener('click',h); b.addEventListener('mousedown',(e)=>e.preventDefault()); })();
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
      alert(res.ok ? 'Foxline назначен обработчиком http/https. В Windows 10/11 выберите Foxline как браузер по умолчанию в Параметры → Приложения → Приложения по умолчанию.' : 'Не удалось назначить автоматически: ' + (res.error || 'ошибка'));
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
    el.title = tab.title || t('newTab','New tab');
    el.innerHTML = `<span class="tab-title">${escapeHtml(tab.title || 'Новая вкладка')}</span><button class="tab-close" type="button" title=${t("clear","Close")}>×</button>`;
    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('.tab-close')) { e.preventDefault(); e.stopPropagation(); closeTab(tab.id); }
    });
    el.addEventListener('click', (e) => {
      if (e.target.closest('.tab-close')) return;
      activateTab(tab.id);
    });
    tabsEl.appendChild(el);
  });
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function createTab(url, opts = {}) {
  const id = uid();
  const tab = { id, url: normalize(url), title: 'Новая вкладка', view: null };
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
  if (t) addressInput.value = displayAddress(t.url||'');
  saveSession();
  setTimeout(updateNavButtons, 0);
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
  const fq = parseFoxlineSearch(url);
  if (fq !== null) { return loadInTab(tab, foxlineSearchTarget(fq)); }
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
      // Don't overwrite a real page title with a loading placeholder
      renderTabs();
    });
    wv.addEventListener('did-stop-loading', () => {
      try { const t = wv.getTitle(); if (t) tab.title = t; else if (!tab.title) tab.title = titleFor(tab.url); } catch {}
      renderTabs();
      saveSession();
      updateNavButtons();
    });
    wv.addEventListener('page-title-updated', (e) => { tab.title = e.title || titleFor(tab.url); renderTabs(); saveSession(); });
    wv.addEventListener('did-navigate', (e) => updateNavState(tab, e.url));
    wv.addEventListener('did-navigate-in-page', (e) => updateNavState(tab, e.url));
    wv.addEventListener('dom-ready', () => {
      try { const t = wv.getTitle(); if (t) tab.title = t; } catch {}
      renderTabs();
      updateNavButtons();
    });
    wv.addEventListener('did-fail-load', (e) => {
      if (e && e.errorCode === -3) return; // aborted
      if (!tab.title) tab.title = titleFor(tab.url);
      renderTabs();
      updateNavButtons();
    });
    contentEl.appendChild(wv);
    tab.view = wv;
  }
  if (tab.id === activeId) addressInput.value = displayAddress(url);
  renderTabs();
}

async function updateNavState(tab, url) {
  tab.url = url;
  if (tab.id === activeId) addressInput.value = displayAddress(url);
  renderTabs();
  saveSession();
  updateNavButtons();
  if (!incognito) store.history = await window.foxline.addHistory({ url, title: tab.title || titleFor(url) });
}

function nav(action) {
  const t = currentTab(); if (!t || !t.view) return;
  if (t.view.tagName === 'WEBVIEW') {
    const wv = t.view;
    if (action === 'back') { try { wv.goBack(); } catch {} return; }
    if (action === 'forward') { try { wv.goForward(); } catch {} return; }
    if (action === 'reload') { try { wv.reload(); } catch {} return; }
  } else {
    if (action === 'reload') loadInTab(t, t.url);
  }
}

function updateNavButtons() {
  const back = document.getElementById('backBtn');
  const fwd = document.getElementById('forwardBtn');
  if (back) { back.disabled = false; back.style.pointerEvents = 'auto'; }
  if (fwd) { fwd.disabled = false; fwd.style.pointerEvents = 'auto'; }
}

async function addCurrentBookmark() {
  const t = currentTab(); if (!t || t.url.startsWith('foxline://')) return;
  store.bookmarks = await window.foxline.addBookmark({ title: t.title || titleFor(t.url), url: t.url });
  alert(t('bookmarkAdded','Added to bookmarks'));
}

function renderInternal(url) {
  if (url.startsWith('foxline://search')) {
    const q = new URLSearchParams(url.split('?')[1] || '').get('q') || '';
    const provider = (store.settings.searchEngine || 'https://www.google.com/search?q=');
    const target = provider.includes('{q}') ? provider.replace('{q}', encodeURIComponent(q)) : (provider + encodeURIComponent(q));
    // redirect internal search page to provider
    setTimeout(() => loadInActive(target), 0);
    return `<div class="hero"><div class="badge">Foxline</div><h1>Поиск</h1><p class="small">Открываю результаты…</p></div>`;
  }
  if (url === 'foxline://home') {
    const tiles = (store.settings.startupTiles || []).map(tile => `<div class="tile" data-open="${escapeHtml(tile.url)}"><div class="title">${escapeHtml(tile.title)}</div><div class="small">${escapeHtml(tile.url)}</div></div>`).join('');
    return `<div class="hero"><div class="badge">${incognito ? t('incognito','Incognito') : 'Foxline'}</div><h1>${t('homeTitle','Foxline Browser')}</h1><p>${t('homeDesc','')}</p>
      <form class="search-big" id="homeSearch"><input id="homeQuery" placeholder=${t("homeSearch","Search or enter address")}/><button class="go-btn" type="submit">${t('searchBtn','Search')}</button></form>
      <div class="card-grid">${tiles}</div></div>`;
  }
  if (url === 'foxline://bookmarks') {
    const rows = store.bookmarks.map(b => `<div class="row"><div class="meta"><div class="title" data-open="${escapeHtml(b.url)}" style="cursor:pointer">${escapeHtml(b.title)}</div><div class="url">${escapeHtml(b.url)}</div></div><button class="icon-btn" data-del-bookmark="${b.id}">×</button></div>`).join('') || `<div class="small">${t('noBookmarks','No bookmarks yet.')}</div>`;
    return `<h2>${t('bookmarksTitle','Bookmarks')}</h2><div class="list">${rows}</div>`;
  }
  if (url === 'foxline://history') {
    const rows = store.history.map(h => `<div class="row"><div class="meta"><div class="title" data-open="${escapeHtml(h.url)}" style="cursor:pointer">${escapeHtml(h.title||h.url)}</div><div class="url">${escapeHtml(h.url)}</div><div class="small">${escapeHtml(h.at||'')}</div></div></div>`).join('') || `<div class="small">${t('noHistory','History is empty.')}</div>`;
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><h2>${t('historyTitle','History')}</h2><button class="go-btn" id="clearHistory">${t('clear','Clear')}</button></div><div class="list">${rows}</div>`;
  }
  if (url === 'foxline://downloads') {
    return `<h2>${t('downloadsTitle','Downloads')}</h2><div id="downloadsPage"></div>`;
  }
  if (url === 'foxline://settings') {
    return `<h2>${t('settingsTitle','Foxline Settings')}</h2><div class="settings-grid">
      <div class="card"><label>${t('language','Language')}</label><select id="setLang"></select><div class="small" style="margin-top:8px">${t('languageHint','')}</div></div>
      <div class="card"><label>${t('appearance','Theme')}</label><select id="setTheme"><option value="dark">${t('dark','Dark')}</option><option value="light">${t('light','Light')}</option></select><div class="small" style="margin-top:8px">${t('themeAutoSave','')}</div></div>
      <div class="card"><label>${t('homePage','Home page')}</label><input id="setHome" type="text" value="${escapeHtml(store.settings.homePage||'foxline://home')}" /></div>
      <div class="card"><label>${t('searchSystem','Search system')}</label><input id="setSearch" type="text" value="${escapeHtml(store.settings.searchEngine||'https://www.google.com/search?q=')}" /><div class="small" style="margin-top:8px">${t('searchHint','')}</div></div>
      <div class="card"><label>${t('quickTiles','Quick tiles')}</label><textarea id="setTiles" style="width:100%;min-height:150px;border-radius:12px;border:1px solid var(--border);background:var(--bg2);color:var(--text);padding:12px">${escapeHtml(JSON.stringify(store.settings.startupTiles||[], null, 2))}</textarea></div>
      <div class="card actions"><button class="go-btn" id="saveSettings">${t('saveSettings','Save settings')}</button><button class="icon-btn" id="setDefaultBtn" style="padding:0 12px">${t('setDefault','Set default browser')}</button></div>
    </div>`;
  }
  if (url === 'foxline://about') {
    const msg = escapeHtml(updateState?.message || 'Проверка обновлений доступна в установленной версии Foxline.');
    const pct = typeof updateState?.progress === 'number' ? ` (${updateState.progress}%)` : '';
    return `<h2>${t('whatsNewTitle',"What's new in Foxline")}</h2>
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:12px"><img src="../../assets/foxline-avatar.png" alt="Foxline" style="width:42px;height:42px;border-radius:12px;object-fit:cover"/><div><div class="title">Foxline</div><div class="small">${t('currentVersion','Current version')}</div></div></div>
          <div class="badge" id="verBadge">1.0.0</div>
        </div>
      </div>
      <div class="settings-grid" style="margin-top:14px">
        <div class="card">
          <div class="title">${t('updates','Updates')}</div>
          <div class="small" style="margin:8px 0 12px" id="updateMsg">${msg}${pct}</div>
          <div class="actions">
            <button class="go-btn" id="checkUpdatesBtn">'+t('checkUpdates','Check for updates')+'</button>
            
          </div>
          <div class="small" style="margin-top:10px">${t('updateAuto','')}</div>
        </div>
        <div class="card">
          <div class="title">Версия 1.0.0</div>
          <div class="small" style="margin:6px 0 10px">${t('release','')}</div>
          <ul style="margin:0;padding-left:18px;line-height:1.7">
            <li>${t('feat1','')}</li>
            <li>Адресная строка с поиском через Foxline, навигация назад/вперёд/обновить.</li>
            <li>${t('feat3','')}</li>
            <li>${t('feat4','')}</li>
            <li>${t('feat5','')}</li>
            <li>${t('feat6','')}</li>
          </ul>
        </div>
      </div>`;
  }
  return `<div class="card">Неизвестная страница Foxline.</div>`;
}

function bindInternal(root, url) {
  const foxSearch = root.querySelector('#foxSearch');
  if (foxSearch) foxSearch.onsubmit = (e) => { e.preventDefault(); loadInActive(foxlineSearchUrl(root.querySelector('#foxQuery').value.trim())); };
  const openResults = root.querySelector('#openResults');
  if (openResults) openResults.onclick = () => {
    const q = new URLSearchParams((currentTab()?.url || '').split('?')[1] || '').get('q') || root.querySelector('#foxQuery')?.value || '';
    const qEnc = encodeURIComponent(q);
    const provider = (store.settings.searchEngine || 'https://www.google.com/search?q=');
    const target = provider.includes('{q}') ? provider.replace('{q}', qEnc) : (provider + qEnc);
    loadInActive(target);
  };
  const openHome = root.querySelector('#openHome');
  if (openHome) openHome.onclick = () => loadInActive(store.settings.homePage || 'foxline://home');
  const foxResults = root.querySelector('#foxResults');
  if (foxResults) {
    foxResults.addEventListener('did-navigate', (e) => { if (e.url && !e.url.includes('duckduckgo.com/html')) loadInActive(e.url); });
    foxResults.addEventListener('new-window', (e) => { e.preventDefault?.(); loadInActive(normalize(e.url)); });
  }
  root.querySelectorAll('[data-open]').forEach(el => el.onclick = () => loadInActive(el.dataset.open));
  const homeSearch = root.querySelector('#homeSearch');
  if (homeSearch) homeSearch.onsubmit = (e) => { e.preventDefault(); loadInActive(normalize(root.querySelector('#homeQuery').value.trim())); };
  root.querySelectorAll('[data-del-bookmark]').forEach(btn => btn.onclick = async () => { store.bookmarks = await window.foxline.removeBookmark(btn.dataset.delBookmark); loadInTab(currentTab(), 'foxline://bookmarks'); });
  const clear = root.querySelector('#clearHistory'); if (clear) clear.onclick = async () => { store.history = await window.foxline.clearHistory(); loadInTab(currentTab(), 'foxline://history'); };
  if (url === 'foxline://downloads') renderDownloads(root.querySelector('#downloadsPage'));
  if (url === 'foxline://settings') {
    const themeEl = root.querySelector('#setTheme');
    const langEl = root.querySelector('#setLang');
    if(langEl){ langEl.innerHTML = (window.FOXLINE_LANGS||[]).map(([c,n])=>`<option value="${c}">${n}</option>`).join(''); langEl.value = lang(); langEl.onchange = async ()=>{ store.settings = await window.foxline.setSettings({...store.settings, language: langEl.value}); applyI18n(); const tcur=currentTab(); if(tcur && tcur.url.startsWith('foxline://')) loadInTab(tcur,tcur.url); else { applyI18n(); renderTabs(); } }; }
    const homeEl = root.querySelector('#setHome');
    const searchEl = root.querySelector('#setSearch');
    const tilesEl = root.querySelector('#setTiles');
    themeEl.value = store.settings.theme || 'dark';

    const save = async (patch, silent) => {
      try { store.settings = await window.foxline.setSettings({ ...store.settings, ...patch }); } catch {}
      document.body.classList.toggle('theme-light', store.settings.theme === 'light');
      document.body.classList.toggle('theme-dark', store.settings.theme !== 'light');
      if (!silent) alert(t('settingsSaved','Settings saved'));
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
      try { tiles = JSON.parse(tilesEl.value || '[]'); } catch { alert(t('tilesError','JSON error')); return; }
      await save({ theme: themeEl.value, language: (root.querySelector('#setLang')?.value||store.settings.language||'auto'), homePage: homeEl.value || 'foxline://home', searchEngine: searchEl.value || 'https://www.google.com/search?q=', startupTiles: Array.isArray(tiles) ? tiles : [] }, false);
    };
    root.querySelector('#setDefaultBtn').onclick = async () => {
      const res = await window.foxline.setDefaultBrowser();
      alert(res.ok ? t('defaultBrowserOk','OK') : t('defaultBrowserFail','Could not set: ') + (res.error || t('error','error')));
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
  const html = downloadItems.map(d => `<div class="row"><div class="meta"><div class="title">${escapeHtml(d.filename)}</div><div class="small">${escapeHtml(d.state||'')} ${d.total?Math.round((d.received||0)/d.total*100)+'%':''}</div><div class="url">${escapeHtml(d.path||'')}</div></div><button class="icon-btn" data-show-item="${escapeHtml(d.path||'')}">${t('folder','Folder')}</button></div>`).join('') || `<div class="small">${t('noDownloads','No downloads yet.')}</div>`;
  downloadsList.innerHTML = html;
  downloadsList.querySelectorAll('[data-show-item]').forEach(b => b.onclick = () => window.foxline.showItem(b.dataset.showItem));
  if (target) { target.innerHTML = html; target.querySelectorAll('[data-show-item]').forEach(b => b.onclick = () => window.foxline.showItem(b.dataset.showItem)); }
}

init();



