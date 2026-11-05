const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
s=s.replace(/Поиск в Foxline или адрес сайта/g,'Введите адрес или запрос');
s=s.replace(/Поиск в Foxline/g,'Поиск');
fs.writeFileSync(p,s,'utf8');console.log('ok');
