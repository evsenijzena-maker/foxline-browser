const fs=require('fs');const p='C:/Foxline/src/renderer/scripts/app.js';let s=fs.readFileSync(p,'utf8');
function rep(a,b){ if(!s.includes(a)) console.error('MISS',a.slice(0,50)); s=s.split(a).join(b); }
// home
rep('<div class="hero"><div class="badge">${incognito ? \'Режим инкогнито\' : \'Foxline\'}</div><h1>Foxline Browser</h1><p>Быстрый современный браузер с тёмным стилем и оранжевым акцентом.</p>\n      <form class="search-big" id="homeSearch"><input id="homeQuery" placeholder="Введите адрес или запрос"/><button class="go-btn" type="submit">Найти</button></form>',
'<div class="hero"><div class="badge">${incognito ? t(\'incognito\',\'Incognito\') : \'Foxline\'}</div><h1>${t(\'homeTitle\',\'Foxline Browser\')}</h1><p>${t(\'homeDesc\',\'\')}</p>\n      <form class="search-big" id="homeSearch"><input id="homeQuery" placeholder="${t(\'homeSearch\',\'Search or enter address\')}"/><button class="go-btn" type="submit">${t(\'searchBtn\',\'Search\')}</button></form>');
// bookmarks/history/downloads/settings/about headers
rep('<h2>Закладки</h2>', '<h2>${t(\'bookmarksTitle\',\'Bookmarks\')}</h2>');
rep('<div class="small">Закладок пока нет.</div>', '<div class="small">${t(\'noBookmarks\',\'No bookmarks yet.\')}</div>');
rep('<h2>История</h2><button class="go-btn" id="clearHistory">Очистить</button>', '<h2>${t(\'historyTitle\',\'History\')}</h2><button class="go-btn" id="clearHistory">${t(\'clear\',\'Clear\')}</button>');
rep('<div class="small">История пуста.</div>', '<div class="small">${t(\'noHistory\',\'History is empty.\')}</div>');
rep('<h2>Загрузки</h2>', '<h2>${t(\'downloadsTitle\',\'Downloads\')}</h2>');
rep('<h2>Настройки Foxline</h2>', '<h2>${t(\'settingsTitle\',\'Foxline Settings\')}</h2>');
rep('<label>Тема оформления</label><select id="setTheme"><option value="dark">Тёмная</option><option value="light">Светлая</option></select><div class="small" style="margin-top:8px">Тема применяется сразу и сохраняется автоматически.</div>',
'<label>${t(\'appearance\',\'Theme\')}</label><select id="setTheme"><option value="dark">${t(\'dark\',\'Dark\')}</option><option value="light">${t(\'light\',\'Light\')}</option></select><div class="small" style="margin-top:8px">${t(\'themeAutoSave\',\'\')}</div>');
rep('<label>Домашняя страница</label>', '<label>${t(\'homePage\',\'Home page\')}</label>');
rep('<label>Поисковая система (URL с {q} или префикс)</label>', '<label>${t(\'searchSystem\',\'Search system\')}</label>');
rep('<div class="small" style="margin-top:8px">Адрес поиска в Foxline: <code>foxline://search?q=</code>.</div>', '<div class="small" style="margin-top:8px">${t(\'searchHint\',\'\')}</div>');
rep('<label>Быстрые плитки (JSON: title,url)</label>', '<label>${t(\'quickTiles\',\'Quick tiles\')}</label>');
rep('<button class="go-btn" id="saveSettings">Сохранить настройки</button><button class="icon-btn" id="setDefaultBtn" style="padding:0 12px">Сделать браузером по умолчанию</button>',
'<button class="go-btn" id="saveSettings">${t(\'saveSettings\',\'Save settings\')}</button><button class="icon-btn" id="setDefaultBtn" style="padding:0 12px">${t(\'setDefault\',\'Set default browser\')}</button>');
// language selector insert before theme card? easier: insert after settings title via replace of settings-grid start
rep('<div class="settings-grid">','<div class="settings-grid">\n      <div class="card"><label>${t(\'language\',\'Language\')}</label><select id="setLang"></select><div class="small" style="margin-top:8px">${t(\'languageHint\',\'\')}</div></div>');
// about/whats new
rep('<h2>Что нового в Foxline</h2>', '<h2>${t(\'whatsNewTitle\',\"What\'s new in Foxline\")}</h2>');
rep('<div class="small">Текущая версия</div>', '<div class="small">${t(\'currentVersion\',\'Current version\')}</div>');
rep('<div class="title">Обновления</div>', '<div class="title">${t(\'updates\',\'Updates\')}</div>');
rep('Проверить обновления', '${t(\'checkUpdates\',\'Check for updates\')}');
rep('Обновление скачивается в фоне. После загрузки просто перезапустите Foxline — новая версия установится автоматически.', '${t(\'updateAuto\',\'\')}');
rep('Текущий релиз Foxline.', '${t(\'release\',\'\')}');
rep('<li>Многовкладочный браузер на Electron/Chromium.</li>', '<li>${t(\'feat1\',\'\')}</li>');
rep('<li>Адресная строка с поиском, навигация назад/вперёд/обновить.</li>', '<li>${t(\'feat2\',\'\')}</li>');
rep('<li>Домашняя страница, закладки, история, загрузки, настройки.</li>', '<li>${t(\'feat3\',\'\')}</li>');
rep('<li>Режим инкогнито, несколько окон и горячие клавиши.</li>', '<li>${t(\'feat4\',\'\')}</li>');
rep('<li>Тёмный и светлый интерфейс, сохранение пользовательских настроек.</li>', '<li>${t(\'feat5\',\'\')}</li>');
rep('<li>Фоновая проверка обновлений со статусом в реальном времени.</li>', '<li>${t(\'feat6\',\'\')}</li>');
rep('<div class="small">Загрузок пока нет.</div>', '<div class="small">${t(\'noDownloads\',\'No downloads yet.\')}</div>');
rep('Папка</button>', '${t(\'folder\',\'Folder\')}</button>');
// alerts
rep("alert('Добавлено в закладки');","alert(t('bookmarkAdded','Added to bookmarks'));");
rep("alert('Настройки сохранены');","alert(t('settingsSaved','Settings saved'));");
rep("alert('Ошибка в JSON плиток'); return;","alert(t('tilesError','JSON error')); return;");
rep("alert(res.ok ? 'Foxline зарегистрирован как обработчик http/https. Проверьте параметры приложений Windows для назначения по умолчанию.' : 'Не удалось назначить автоматически: ' + (res.error || 'ошибка'));",
"alert(res.ok ? t('defaultBrowserSet','') : t('defaultBrowserFail','Could not set: ') + (res.error || t('error','error')));");
rep("alert(res.ok ? 'Foxline назначен обработчиком http/https.' : 'Не удалось: ' + (res.error || 'ошибка'));",
"alert(res.ok ? t('defaultBrowserOk','OK') : t('defaultBrowserFail','Could not set: ') + (res.error || t('error','error')));");
fs.writeFileSync(p,s,'utf8'); console.log('ok');
