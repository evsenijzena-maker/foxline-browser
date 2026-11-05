const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';
const lines=fs.readFileSync(p,'utf8').split(/\r?\n/);
for(let i=0;i<lines.length;i++){ if(lines[i].includes('nav')&&lines[i].includes('feat') || (i>325&&i<336)) console.log(i+1, JSON.stringify(lines[i])); }
