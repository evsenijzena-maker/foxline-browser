const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
// wire language selector in settings
s=s.replace("const themeEl = root.querySelector('#setTheme');",
"const themeEl = root.querySelector('#setTheme');\n    const langEl = root.querySelector('#setLang');\n    if(langEl){ langEl.innerHTML = (window.FOXLINE_LANGS||[]).map(([c,n])=>`<option value=\"${c}\">${n}</option>`).join(''); langEl.value = lang(); langEl.onchange = async ()=>{ store.settings = await window.foxline.setSettings({...store.settings, language: langEl.value}); applyI18n(); const tcur=currentTab(); if(tcur && tcur.url.startsWith('foxline://')) loadInTab(tcur,tcur.url); else { applyI18n(); renderTabs(); } }; }");
// include language in saves
s=s.split("await save({ theme: themeEl.value, homePage: homeEl.value || 'http://foxline.com', searchEngine: searchEl.value || 'https://www.google.com/search?q=', startupTiles: Array.isArray(tiles) ? tiles : [] }, false);")
 .join("await save({ theme: themeEl.value, language: (root.querySelector('#setLang')?.value||store.settings.language||'auto'), homePage: homeEl.value || 'http://foxline.com', searchEngine: searchEl.value || 'https://www.google.com/search?q=', startupTiles: Array.isArray(tiles) ? tiles : [] }, false);");
s=s.replace(/bindUI\(\); applyI18n\(\);/,'bindUI();');
s=s.replace('bindUI();','bindUI(); applyI18n();');
// after store loaded apply i18n
s=s.replace('document.body.classList.toggle(\'theme-light\', store.settings.theme === \'light\');',
"document.body.classList.toggle('theme-light', store.settings.theme === 'light');\n  if(!store.settings.language) store.settings.language='auto';\n  applyI18n();");
fs.writeFileSync(p,s,'utf8'); console.log('ok');
