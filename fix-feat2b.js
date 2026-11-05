const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';
const lines=fs.readFileSync(p,'utf8').split(/\r?\n/);
lines[334] = "            <li>${t('feat2','Address bar search/navigation: back, forward, reload.')}</li>";
fs.writeFileSync(p,lines.join('\n'),'utf8'); console.log('ok');
node --check not here
