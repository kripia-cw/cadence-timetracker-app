const { app, BrowserWindow, screen, ipcMain, dialog } = require('electron')
const fs = require('fs')
const path = require('path')

let win

function createWindow() {
  const display = screen.getPrimaryDisplay()
  const { width, height } = display.workAreaSize

  win = new BrowserWindow({
    width: 200,
    height: height,
    minWidth: 200,
    maxWidth: 600,
    x: width - 200,
    y: 0,
    alwaysOnTop: true,
    frame: false,
    resizable: true,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  // Highest practical level; relativeLevel helps vs other TOPMOST apps.
  win.setAlwaysOnTop(true, 'screen-saver', 1)
  win.setVisibleOnAllWorkspaces(true)

  const bumpAboveNeighbors = () => {
    if (!win || win.isDestroyed() || !win.isAlwaysOnTop()) return
    win.setAlwaysOnTop(true, 'screen-saver', 1)
    win.moveTop()
  }
  win.once('ready-to-show', bumpAboveNeighbors)
  win.on('focus', bumpAboveNeighbors)

  // Snap to anchor edge on resize or any attempted move
  const snapToAnchor = () => {
    const [w] = win.getSize()
    const { width: sw } = screen.getPrimaryDisplay().workAreaSize
    const x = anchorSide === 'left' ? 0 : sw - w
    win.setPosition(x, 0)
  }
  win.on('resize', snapToAnchor)
  win.on('move', snapToAnchor)

  win.loadFile('index.html')
}

let anchorSide = 'right' // default: right edge

ipcMain.on('resize-app', (event, mode) => {
  if (!win || win.isDestroyed()) return
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize
  const [, h] = win.getSize()
  const newW = mode === 'min' ? 200 : 600
  win.setSize(newW, h)
  const x = anchorSide === 'left' ? 0 : sw - newW
  win.setPosition(x, 0)
})

ipcMain.on('snap-to-edge', (event, side) => {
  if (!win || win.isDestroyed()) return
  anchorSide = side
  const [w] = win.getSize()
  const { width: sw } = screen.getPrimaryDisplay().workAreaSize
  const x = side === 'left' ? 0 : sw - w
  win.setPosition(x, 0)
})

ipcMain.handle('get-login-item', () => {
  return app.getLoginItemSettings({ path: process.execPath, args: [app.getAppPath()] }).openAtLogin
})

ipcMain.on('set-login-item', (event, enable) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    path: process.execPath,
    args: [app.getAppPath()]
  })
})

// always-on-top is permanently enabled — no toggle needed

ipcMain.handle('export-data', async (event, payload, filename) => {
  const filePath = path.join(app.getPath('downloads'), filename || 'cadence-export.json')
  fs.writeFileSync(filePath, payload, 'utf8')
  return { ok: true, filePath }
})

ipcMain.handle('import-data', async () => {
  const { filePaths } = await dialog.showOpenDialog(win, {
    title: 'Import time tracker data',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (!filePaths || !filePaths[0]) return { ok: false }
  const raw = fs.readFileSync(filePaths[0], 'utf8')
  return { ok: true, data: raw }
})

ipcMain.handle('backup-data', async (event, payload) => {
  try {
    const backupDir = path.join(app.getPath('documents'), 'Cadence Backups')
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })

    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const stamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}-${pad(now.getHours())}-00`
    const filename = `cadence-${stamp}.json`
    fs.writeFileSync(path.join(backupDir, filename), payload, 'utf8')

    // Keep only the 30 most recent backup files
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('cadence-') && f.endsWith('.json'))
      .sort()
    if (files.length > 30) {
      files.slice(0, files.length - 30).forEach(f => {
        fs.unlinkSync(path.join(backupDir, f))
      })
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
