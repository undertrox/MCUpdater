// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from "path";
import url from "url";
import {app, Menu} from "electron";
import {autoUpdater} from "electron-updater";
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
  let t = "";
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.setTitle(t)
  });

  autoUpdater.on('checking-for-update', () => {
    mainWindow.setTitle(windowTitle + " - Checking for Updates...");
    t = mainWindow.getTitle()
  });
  autoUpdater.on('update-available', (info) => {
    mainWindow.setTitle(windowTitle + ' - Update available.');
    t = mainWindow.getTitle()
  });
  autoUpdater.on('update-not-available', (info) => {
    mainWindow.setTitle(windowTitle + ' - No Update available');
    t = mainWindow.getTitle()
  });
  autoUpdater.on('error', (err) => {
    mainWindow.setTitle(windowTitle + ' - Error in auto-updater. ' + err);
    t = mainWindow.getTitle()
  });
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Updating:" + Math.round(progressObj.percent * 100) / 100 + "% downloaded (" + progressObj.bytesPerSecond / 1000 + "KB/S)";
    mainWindow.setTitle(windowTitle + " - " + log_message);
    t = mainWindow.getTitle()
  });
  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.setTitle(windowTitle + ' - Update downloaded - Restart Program to update');
    t = mainWindow.getTitle()
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
