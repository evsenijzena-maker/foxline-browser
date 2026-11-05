const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
s=s.replace(/<li>.*feat2.*<\/li>/, "<li>${t('feat2','Address bar search/navigation.')}</li>");
fs.writeFileSync(p,s,'utf8');console.log(s.includes("t('feat2'"));
