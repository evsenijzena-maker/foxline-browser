const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
// normalize + titleFor + address display for foxline.com
s=s.split("if (url === 'http://foxline.com') return 'Домашняя';").join("if (url === 'http://foxline.com' || url === 'http://foxline.com/') return t('home','Home');");
s=s.replace(/return 'Поиск Foxline';/g,"return t('search','Search');");
s=s.replace(/return 'Настройки';/g,"return t('settings','Settings');");
s=s.replace(/return 'Закладки';/g,"return t('bookmarks','Bookmarks');");
s=s.replace(/return 'История';/g,"return t('history','History');");
s=s.replace(/return 'Загрузки';/g,"return t('downloads','Downloads');");
s=s.replace(/return 'Что нового';/g,"return t('whatsNew',\"What's new\");");
s=s.replace(/document\.title = 'Foxline — Инкогнито'/g,"document.title = 'Foxline — ' + t('incognito','Incognito')");
s=s.replace(/tab\.title = 'Новая вкладка'/g,"tab.title = t('newTab','New tab')");
s=s.replace(/el\.title = tab\.title \|\| 'Новая вкладка';/g,"el.title = tab.title || t('newTab','New tab');");
s=s.replace(/tab\.title \|\| 'Новая вкладка'\}\}<\//g,"(tab.title || t('newTab','New tab'))}</");
s=s.replace(/title=\"Закрыть\"/g,"title=\"${t('clear','Close')}\"");
// make address bar show blank for foxline.com home
s=s.replace(/if \(t\) addressInput\.value = t\.url\.startsWith\('foxline:\/\/search'\) \? \(new URLSearchParams\(t\.url\.split\('\?'\)\[1\]\|\|''\)\.get\('q'\) \|\| ''\) : \(t\.url\.startsWith\('foxline:\/\/'\) \? '' : t\.url\);/g,
"if (t) { const u=t.url||''; addressInput.value = (u==='http://foxline.com'||u==='http://foxline.com/'||u.startsWith('foxline://')) ? '' : u; }");
s=s.replace(/if \(tab\.id === activeId\) addressInput\.value = url\.startsWith\('foxline:\/\/search'\) \? \(new URLSearchParams\(url\.split\('\?'\)\[1\]\|\|''\)\.get\('q'\) \|\| ''\) : \(url\.startsWith\('foxline:\/\/'\) \? '' : url\);/g,
"if (tab.id === activeId) addressInput.value = (url==='http://foxline.com'||url==='http://foxline.com/'||url.startsWith('foxline://')) ? '' : url;");
// fix foxline.com being treated as "not a URL" in normalize? it has a dot, so it's fine.
fs.writeFileSync(p,s,'utf8'); console.log('ok');
