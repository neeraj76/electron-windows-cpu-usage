const { app, Menu, BrowserWindow } = require('electron');
const os = require('os-utils');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  const debug = false;
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    icon: __dirname + '/icon.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  setInterval(() => {
    os.cpuUsage(function(v) {
      if (mainWindow) {
        mainWindow.webContents.send('cpu', v*100);
        mainWindow.webContents.send('mem', os.freememPercentage()*100);
        mainWindow.webContents.send('total-mem', os.totalmem()/1024);
      }

      if (debug) {
        console.log('CPU Usage (%):' + v*100);
        console.log('Mem Usage (%):' + os.freememPercentage()*100);      
        console.log('Total Mem (GB):' + os.totalmem()/1024);  
      }
    });
  }, 1000);

  const mainMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(mainMenu);
};

const closeWindow = () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  mainWindow = null;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', closeWindow);

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const main_qualifier_key = process.platform === 'darwin' ? 'Command' : 'Ctrl';
const second_qualifier_key = process.platform === 'darwin' ? 'Alt' : 'Shift';

const menuTemplate = [
  {
    label: 'Monitor',
    submenu: [
      {
        label: 'Open',
        accelerator: `${main_qualifier_key}+O`,
        click() {
          createWindow();
        }
      },
      {
        label: 'Quit',
        accelerator: `${main_qualifier_key}+Q`,
        click() {
          mainWindow.close();
        }
      }
    ]
  }
]

if (process.platform === 'darwin') {
  menuTemplate.unshift(  {
    label: 'Default'
  })
}

// convention: 'production', 'development', 'staging', 'test'
if (process.env.NODE_ENV !== 'production') {
  menuTemplate.push({
    label: 'View',
    submenu: [
      {
        role: 'reload',
      },
      {
        label: 'Toggle Developer Tools',
        accelerator: `${main_qualifier_key}+${second_qualifier_key}+I`,
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      }
    ]
  })
}