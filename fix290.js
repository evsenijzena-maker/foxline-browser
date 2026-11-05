const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
// fix broken template literal injections: replace '${t('...')}' patterns that ended up with wrong quoting inside template strings
s=s.replace(/'\$\{t\('noBookmarks','No bookmarks yet\.'\)\}'/g,"'${t('noBookmarks','No bookmarks yet.')}'");
s=s.replace(/"\$\{t\('([^']+)','([^']*)'\)\}"/g,(m,k,d)=>'${t("'+k+'","'+d+'")}');
s=s.replace(/'\$\{t\('([^']+)','([^']*)'\)\}'/g,(m,k,d)=>"${t('"+k+"','"+d+"')}");
// simpler: use a function to fix all occurrences where we injected template syntax into template strings
s=s.replace(/\$\{t\('checkUpdates','Check for updates'\)\}/g,"'+t('checkUpdates','Check for updates')+'"); // inside template context in our render
fs.writeFileSync(p,s,'utf8'); console.log('ok');
