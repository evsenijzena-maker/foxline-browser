const { app, BrowserWindow, ipcMain, session, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
let autoUpdater = null;
try { ({ autoUpdater } = require('electron-updater')); } catch {}

const dataFile = path.join(app.getPath('userData'), 'foxline-data.json');
let mainWindows = new Set();
let downloadsBound = false;
let updateState = { status: 'idle', version: app.getVersion(), message: 'Автообновление готово к проверке.' };

function loadData() {
  try {
    if (fs.existsSync(dataFile)) return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch {}
  return {
    bookmarks: [],
    history: [],
    sessionTabs: [],
    sessionActiveTab: 'foxline://home',
    settings: {
      theme: 'dark',
      homePage: 'foxline://home',
      searchEngine: 'https://www.google.com/search?q=',
      startupTiles: [
        { title: 'Google', url: 'https://www.google.com' },
        { title: 'YouTube', url: 'https://www.youtube.com' },
        { title: 'Wikipedia', url: 'https://www.wikipedia.org' },
        { title: 'GitHub', url: 'https://github.com' },
        { title: 'News', url: 'https://news.google.com' },
        { title: 'Mail', url: 'https://mail.google.com' }
      ]
    }
  };
}

let store = loadData();
function saveData() {
  try { fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), 'utf8'); } catch {}
}

function bindDownloads() {
  if (downloadsBound) return;
  downloadsBound = true;
  session.defaultSession.on('will-download', (event, item, webContents) => {
    let senderWin = BrowserWindow.fromWebContents(webContents);
    try { if (!senderWin && webContents.hostWebContents) senderWin = BrowserWindow.fromWebContents(webContents.hostWebContents); } catch {}
    const savePath = dialog.showSaveDialogSync(senderWin || null, { defaultPath: item.getFilename() });
    if (!savePath) { item.cancel(); return; }
    item.setSavePath(savePath);
    const send = (state) => {
      if (!senderWin || senderWin.isDestroyed()) return;
      senderWin.webContents.send('download-update', {
        filename: item.getFilename(), received: item.getReceivedBytes(),
        total: item.getTotalBytes(), state, path: item.getSavePath()
      });
    };
    item.on('updated', (_, state) => send(state));
    item.once('done', (_, state) => send(state));
  });
}

function createWindow(opts = {}) {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#111318',
    title: 'Foxline',
    icon: path.join(__dirname, '../../build/icon.ico'),
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      webviewTag: true,
      spellcheck: true,
      partition: opts.incognito ? `incognito-${Date.now()}` : 'persist:foxline'
    }
  });
  mainWindows.add(win);
  win.on('closed', () => mainWindows.delete(win));
  bindDownloads();
  win.loadFile(path.join(__dirname, '../renderer/index.html'), { query: { incognito: opts.incognito ? '1' : '0' } });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (win && !win.isDestroyed()) win.webContents.send('open-url', url);
    return { action: 'deny' };
  });

  return win;
}

function broadcast(channel, payload) {
  for (const win of mainWindows) {
    try { if (!win.isDestroyed()) win.webContents.send(channel, payload); } catch {}
  }
}

function setupAutoUpdates() {
  if (!autoUpdater || !app.isPackaged) {
    updateState = { status: 'dev', version: app.getVersion(), message: 'Автообновление работает в установленной версии Foxline.' };
    return;
  }
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;
  const push = (patch) => { updateState = { ...updateState, version: app.getVersion(), ...patch }; broadcast('update-status', updateState); };
  autoUpdater.on('checking-for-update', () => push({ status: 'checking', message: 'Проверка обновлений…' }));
  autoUpdater.on('update-available', (info) => push({ status: 'available', message: `Найдено обновление ${info?.version || ''}. Загрузка в фоне…` }));
  autoUpdater.on('update-not-available', () => push({ status: 'latest', message: 'Установлена актуальная версия.' }));
  autoUpdater.on('download-progress', (p) => push({ status: 'downloading', progress: Math.round(p.percent || 0), message: `Загрузка обновления: ${Math.round(p.percent || 0)}%` }));
  autoUpdater.on('update-downloaded', (info) => push({ status: 'downloaded', message: `Обновление ${info?.version || ''} загружено. Оно установится после перезапуска Foxline.` }));
  autoUpdater.on('error', (e) => push({ status: 'error', message: `Автообновление: ${String(e?.message || e || 'ошибка')}` }));
  const check = () => { try { autoUpdater.checkForUpdates(); } catch (e) { push({ status: 'error', message: String(e?.message || e) }); } };
  setTimeout(check, 4000);
  setInterval(check, 15 * 60 * 1000);
}

app.setName('Foxline');
app.whenReady().then(() => {
  createWindow();
  setupAutoUpdates();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

ipcMain.handle('update-status', () => updateState);
ipcMain.handle('check-updates', async () => {
  if (!autoUpdater || !app.isPackaged) return { ...updateState, message: 'Проверка обновлений доступна в установленной версии Foxline.' };
  try { await autoUpdater.checkForUpdates(); } catch (e) { updateState = { ...updateState, status: 'error', message: String(e?.message || e) }; }
  return updateState;
});
ipcMain.handle('install-update', () => { if (autoUpdater && app.isPackaged) { try { autoUpdater.quitAndInstall(); } catch {} } });

ipcMain.handle('set-session', (_, data) => {
  if (data && Array.isArray(data.tabs)) store.sessionTabs = data.tabs.filter(Boolean).slice(0, 30);
  if (data && typeof data.activeTab === 'string') store.sessionActiveTab = data.activeTab;
  saveData();
  return { ok: true };
});

ipcMain.handle('get-data', () => store);
ipcMain.handle('set-settings', (_, settings) => { store.settings = { ...store.settings, ...settings }; saveData(); return store.settings; });
ipcMain.handle('add-bookmark', (_, bm) => {
  if (!store.bookmarks.find(b => b.url === bm.url)) store.bookmarks.unshift({ ...bm, id: Date.now().toString() });
  saveData(); return store.bookmarks;
});
ipcMain.handle('remove-bookmark', (_, id) => { store.bookmarks = store.bookmarks.filter(b => b.id !== id); saveData(); return store.bookmarks; });
ipcMain.handle('add-history', (_, item) => {
  if (item.url.startsWith('foxline://')) return store.history;
  store.history.unshift({ ...item, id: Date.now().toString(), at: new Date().toISOString() });
  store.history = store.history.slice(0, 500);
  saveData(); return store.history;
});
ipcMain.handle('clear-history', () => { store.history = []; saveData(); return []; });
ipcMain.handle('window-control', (e, action) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return;
  if (action === 'minimize') win.minimize();
  if (action === 'maximize') win.isMaximized() ? win.unmaximize() : win.maximize();
  if (action === 'close') win.close();
});
ipcMain.handle('new-window', (_, incognito) => createWindow({ incognito: !!incognito }));
ipcMain.handle('open-external', (_, url) => shell.openExternal(url));
ipcMain.handle('show-item', (_, p) => { if (p) shell.showItemInFolder(p); });
ipcMain.handle('set-default-browser', async () => {
  try {
    const ok = app.setAsDefaultProtocolClient('http') && app.setAsDefaultProtocolClient('https');
    return { ok };
  } catch (e) { return { ok: false, error: String(e) }; }
});
ipcMain.handle('app-info', () => ({ name: app.getName(), version: app.getVersion(), electron: process.versions.electron, chrome: process.versions.chrome, node: process.versions.node }));
