const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
const back="(() => { const b=document.getElementById('backBtn'); if(!b) return; const h=(e)=>{e.preventDefault();e.stopPropagation();nav('back');}; b.addEventListener('click',h); b.addEventListener('mousedown',(e)=>e.preventDefault()); })();";
const fwd="(() => { const b=document.getElementById('forwardBtn'); if(!b) return; const h=(e)=>{e.preventDefault();e.stopPropagation();nav('forward');}; b.addEventListener('click',h); b.addEventListener('mousedown',(e)=>e.preventDefault()); })();";
s=s.replace("document.getElementById('backBtn').onclick = () => nav('back');", back);
s=s.replace("document.getElementById('forwardBtn').onclick = () => nav('forward');", fwd);
fs.writeFileSync(p,s,'utf8'); console.log(s.includes("nav('back')")?'ok':'no');
