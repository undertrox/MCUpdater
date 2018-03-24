// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from "path";
import url from "url";
import { app, Menu } from "electron";
import { autoUpdater } from 'electron-updater'
import createWindow from "./helpers/window";

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";
app.on("ready", () => {
  Menu.setApplicationMenu(null);
  const mainWindow = createWindow("main", {
    width: 1000,
    height: 502
  });

  let version = require('../package.json').version;
  let windowTitle = "Minecraft Updater v" + version;
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.setTitle(windowTitle)
  });

  autoUpdater.on('checking-for-update', () => {
    mainWindow.setTitle(windowTitle + " - Checking for Updates...");
  })
  autoUpdater.on('update-available', (info) => {
    mainWindow.setTitle(windowTitle + ' - Update available.');
  })
  autoUpdater.on('update-not-available', (info) => {
    mainWindow.setTitle(windowTitle + ' - Update not available.');
  })
  autoUpdater.on('error', (err) => {
    mainWindow.setTitle(windowTitle + ' - Error in auto-updater. ' + err);
  })
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    mainWindow.setTitle(windowTitle + " - " + log_message);
  })
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.setTitle(windowTitle + ' - Update downloaded');
  });



  autoUpdater.checkForUpdatesAndNotify();

  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "app.html"),
      protocol: "file:",
      slashes: true
    })
  );

  if (env.name === "development") {
    mainWindow.openDevTools();
  }
});

app.on("window-all-closed", () => {
  app.quit();
});
