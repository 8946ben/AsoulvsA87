const path = require('node:path');
const { app, BrowserWindow, Menu } = require('electron');

// Portable build: keep web storage under save-data/ next to the exe, so every
// extracted copy starts from a clean state instead of reusing %APPDATA% leftovers.
// Dev runs (electron:start) keep the default profile via the isPackaged guard.
if (app.isPackaged) {
  app.setPath('userData', path.join(path.dirname(app.getPath('exe')), 'save-data'));
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 540,
    autoHideMenuBar: true,
    backgroundColor: '#dff7ff',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Menu.setApplicationMenu(null);
  window.once('ready-to-show', () => window.show());
  window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
