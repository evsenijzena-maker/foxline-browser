const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
// fix line ~290: t() is inside a JS string concatenated with || '...${t...}...' — must use string concat, not template interpolation inside single-quoted string
s = s.split("|| '<div class=\"small\">${t('noBookmarks','No bookmarks yet.')}</div>';").join("|| `<div class=\"small\">${t('noBookmarks','No bookmarks yet.')}</div>`;");
s = s.split("|| '<div class=\"small\">${t('noHistory','History is empty.')}</div>';").join("|| `<div class=\"small\">${t('noHistory','History is empty.')}</div>`;");
s = s.split("|| '<div class=\"small\">${t('noDownloads','No downloads yet.')}</div>';").join("|| `<div class=\"small\">${t('noDownloads','No downloads yet.')}</div>`;");
// fix feat2 which I botched with eval replacement
s = s.split('<li>${t(\'feat2\',\'\')}</li>').join('<li>${t("feat2","")}</li>');
fs.writeFileSync(p,s,'utf8'); console.log('ok');
