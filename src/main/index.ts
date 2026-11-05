import { app, BrowserWindow, shell, nativeImage } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import { registerTerminalIpc } from './ipc/terminal.ipc'
import { ptyManager } from './core/pty-manager'

let mainWindow: BrowserWindow | null = null

function getAppIcon(): string {
  const isWin = process.platform === 'win32'
  const iconName = isWin ? 'icon.ico' : 'icon.png'

  const candidates = [
    join(__dirname, '../../resources', iconName),
    join(__dirname, '../../resources', 'icon.png'),
    join(process.resourcesPath || '', 'resources', iconName),
    join(process.resourcesPath || '', iconName),
    join(__dirname, '../../build', iconName)
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return candidates[0]
}

function createWindow(): void {
  const iconPath = getAppIcon()
  const appIcon = nativeImage.createFromPath(iconPath)

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#101216',
    title: 'iFlow',
    icon: appIcon.isEmpty() ? iconPath : appIcon,
    titleBarStyle: 'hidden',
    titleBarOverlay: process.platform === 'win32' ? {
      color: '#14171D',
      symbolColor: '#A0A6B2',
      height: 44
    } : false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Register IPC handlers
  registerTerminalIpc(() => mainWindow)

  // Load renderer
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.setName('iFlow')

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.minicurso.iflow')
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  ptyManager.killAll()
})
