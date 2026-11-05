const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
s=s.replace(/Поиск в Google или адрес сайта/g,'Поиск в Foxline или адрес сайта');
s=s.replace(/Адресная строка с поиском через Google/g,'Адресная строка с поиском через Foxline');
fs.writeFileSync(p,s,'utf8');console.log('ok');
