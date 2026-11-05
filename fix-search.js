const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
s=s.replace(/https:\/\/www\.google\.com\/search\?q=/g,'https://duckduckgo.com/?q=');
fs.writeFileSync(p,s,'utf8');console.log('ok')
