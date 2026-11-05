const fs=require('fs'); const p='C:/Foxline/src/renderer/scripts/app.js'; let s=fs.readFileSync(p,'utf8');
s = s.replace("let store = { bookmarks: [], history: [], settings: { theme: 'dark', homePage: 'foxline://home', searchEngine: 'https://search.brave.com/search?q=', startupTiles: [] } };",
"let store = { bookmarks: [], history: [], settings: { theme: 'dark', homePage: 'http://foxline.com', searchEngine: 'https://www.google.com/search?q=', language: 'auto', startupTiles: [] } };");
s = s.replace("const FOXLINE_SEARCH_URL = 'foxline://search?q=';\n\nfunction foxlineSearchUrl(query) {\n  return FOXLINE_SEARCH_URL + encodeURIComponent(query || '');\n}\n", "function foxlineSearchUrl(query){ return 'https://www.google.com/search?q=' + encodeURIComponent(query||''); }\n");
s = s.replace(/if \(url\.startsWith\('foxline:\/\/search'\)\) \{[\s\S]*?return `<div class="hero"><div class="badge">Foxline<\/div><h1>Поиск<\/h1><p class="small">Открываю результаты…<\/p><\/div>`;\n  }\n/,'');
// add i18n helpers near top after uid
if(!s.includes('function detectLang')){
  s = s.replace('function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }',
`function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function detectLang(){ const n=(navigator.language||'en').toLowerCase(); const map=window.FOXLINE_LANGS||[['en','English']]; const exact=map.find(([c])=>c===n)||map.find(([c])=>n.startsWith(c+'-'))||map.find(([c])=>n.startsWith(c)); return exact?exact[0]:'en'; }
function lang(){ const l=store?.settings?.language; return (!l||l==='auto')?detectLang():(window.FOXLINE_I18N?.[l]?l:'en'); }
function t(key,fb){ const d=window.FOXLINE_I18N||{}; return d[lang()]?.[key] ?? d.en?.[key] ?? fb ?? key; }
function applyI18n(){ document.documentElement.lang=lang(); if(lang()==='ar') document.documentElement.dir='rtl'; else document.documentElement.dir='ltr';
  document.querySelectorAll('[data-i18n]').forEach(el=>{ const k=el.getAttribute('data-i18n'); if(k) el.textContent=t(k,el.textContent); });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{ const k=el.getAttribute('data-i18n-title'); if(k) el.title=t(k,el.title); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{ const k=el.getAttribute('data-i18n-placeholder'); if(k) el.placeholder=t(k,el.placeholder); });
}`);
}
s = s.replace("if (!input) return store.settings.homePage || 'foxline://home';","if (!input) return store.settings.homePage || 'http://foxline.com';");
s = s.replace(/foxline:\/\/home/g,'http://foxline.com');
s = s.replace(/https:\/\/search\.brave\.com\/search\?q=/g,'https://www.google.com/search?q=');
s = s.replace(/https:\/\/duckduckgo\.com\/\?q=/g,'https://www.google.com/search?q=');
fs.writeFileSync(p,s,'utf8'); console.log('ok', s.includes('detectLang'));
