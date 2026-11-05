const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
s=s.replace(/store\.settings\.searchEngine\|\|'https:\/\/duckduckgo\.com\/\?q='/g,"store.settings.searchEngine||'https://www.google.com/search?igu=1&q='");
s=s.replace(/Foxline по умолчанию использует адрес <code>foxline:\/\/search\?q=<\/code>\. Здесь задаётся источник результатов \(например Brave\)\./g,'Адрес поиска в Foxline: <code>foxline://search?q=</code>.');
fs.writeFileSync(p,s,'utf8');console.log('ok');
