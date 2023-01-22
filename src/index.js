const { app, Menu, BrowserWindow } = require('electron');
const osUtils = require('os-utils');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let mainMenu;

const isMac = process.platform === 'darwin';

const createWindow = () => {
  const debug = false;
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 600,
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
    osUtils.cpuUsage(function(v) {
      if (mainWindow) {
        mainWindow.webContents.send('cpu', v*100);
        mainWindow.webContents.send('mem', osUtils.freememPercentage()*100);
        mainWindow.webContents.send('total-mem', osUtils.totalmem()/1024);
      }

      if (debug) {
        console.log('CPU Usage (%):' + v*100);
        console.log('Mem Usage (%):' + osUtils.freememPercentage()*100);
        console.log('Total Mem (GB):' + osUtils.totalmem()/1024);
      }
    });
  }, 1000);

  mainMenu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(mainMenu);
};

const setSubmenuStatusById = (submenuId, status) => {
  // console.log(`submenuId=${submenuId} status=${status}`);

  const submenuItem = mainMenu.getMenuItemById(submenuId);
  if (submenuItem) {
    // console.log(submenuItem);
    submenuItem.enabled = status;
  } else {
    console.log(`Couldn't fine the menu item`);
  }
};

const closeWindow = () => {
  console.log(`closeWindow`);

  if (!isMac) {
    app.quit();
  }
  mainWindow = null;
  
  setSubmenuStatusById("submenu-open", true);
  setSubmenuStatusById("submenu-close", false);
  setSubmenuStatusById("view-reload", false);
  setSubmenuStatusById("view-dev-tools", false);
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

const main_qualifier_key = isMac ? 'Command' : 'Ctrl';
const second_qualifier_key = isMac ? 'Alt' : 'Shift';

const menuTemplate = [
  {
    label: 'Monitor',
    id: "menu-monitor",
    submenu: [
      {
        label: 'Open',
        id: "submenu-open",
        accelerator: `${main_qualifier_key}+O`,
        enabled: false,
        click() {
          if (!mainWindow) {
            createWindow();
          }
        }
      },
      {
        label: 'Close',
        id: "submenu-close",
        role: isMac ? "close" : "quit"
      },     
      {
        label: 'Quit',
        visible: isMac,
        role: "quit"
      }         
    ]
  }
]

if (isMac) {
  menuTemplate.unshift(  {
    label: app.name,
    submenu: [
      {
        role: 'about'
      }       
    ]
  });
}

// Need to check if we use the following for other Operating Systems as well.
menuTemplate.push({
  label: 'View',
  submenu: [
    { role: 'resetZoom' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    { role: 'togglefullscreen' }
  ]      
});

menuTemplate.push({
  role: 'windowMenu'
});


// convention: 'production', 'development', 'staging', 'test'
if (process.env.NODE_ENV !== 'development') {
  menuTemplate.push({
    label: 'Developer',
    id: 'developer',
    enabled: true,
    submenu: [
      {
        id: "view-reload",
        role: 'reload',
      },
      {
        id: "view-dev-tools",
        label: 'Toggle Developer Tools',
        accelerator: `${main_qualifier_key}+${second_qualifier_key}+I`,
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        }
      }
    ]
  })
}

menuTemplate.push({
  role: 'help',
  submenu: [
    {
      label: 'Learn More',
      click: async () => {
        const { shell } = require('electron')
        await shell.openExternal('https://electronjs.org')
      }
    }
  ]    
});
