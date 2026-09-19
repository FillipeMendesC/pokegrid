import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

const isMac = process.platform === "darwin";
let mainWindow = null;
let localServer = null;
let localOrigin = null;

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
}

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
});

async function listen(server) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve(server.address());
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(0, "127.0.0.1");
  });
}

async function startLocalServer() {
  process.env.NODE_ENV = "production";
  process.env.POKEGRID_CACHE_DIR = path.join(app.getPath("userData"), "cache");

  const { createServer } = await import("../src/server.mjs");
  localServer = createServer();
  const address = await listen(localServer);

  if (!address || typeof address === "string") {
    throw new Error("Could not resolve the local POKÉGRID server address.");
  }

  localOrigin = `http://127.0.0.1:${address.port}`;
  return localOrigin;
}

function isAllowedInternalUrl(rawUrl) {
  if (!localOrigin) return false;
  try {
    return new URL(rawUrl).origin === localOrigin;
  } catch {
    return false;
  }
}

function isSafeExternalUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

async function openExternal(rawUrl) {
  if (isSafeExternalUrl(rawUrl)) await shell.openExternal(rawUrl);
}

function createWindow(origin) {
  const window = new BrowserWindow({
    title: "POKÉGRID — Field Research System",
    width: 1440,
    height: 920,
    minWidth: 980,
    minHeight: 680,
    backgroundColor: "#efede5",
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "win32" ? {
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: "#efede5",
        symbolColor: "#111111",
        height: 48
      }
    } : {}),
    ...(isMac ? { titleBarStyle: "hiddenInset" } : {}),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged
    }
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAllowedInternalUrl(url)) void openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (isAllowedInternalUrl(url)) return;
    event.preventDefault();
    void openExternal(url);
  });

  window.once("ready-to-show", () => {
    window.show();
    window.focus();
  });

  window.on("closed", () => {
    if (mainWindow === window) mainWindow = null;
  });

  void window.loadURL(origin);
  return window;
}

async function shutdownServer() {
  if (!localServer) return;
  const server = localServer;
  localServer = null;

  await new Promise((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections?.();
    setTimeout(resolve, 750).unref?.();
  });
}

if (hasLock) {
  app.enableSandbox();

  app.whenReady().then(async () => {
    if (process.platform === "win32") {
      app.setAppUserModelId("dev.matheuscamacho.pokegrid");
    }

    try {
      const origin = await startLocalServer();
      mainWindow = createWindow(origin);
    } catch (error) {
      console.error("POKÉGRID failed to start:", error);
      app.quit();
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0 && localOrigin) {
        mainWindow = createWindow(localOrigin);
      }
    });
  });

  app.on("window-all-closed", () => {
    if (!isMac) app.quit();
  });

  app.on("before-quit", () => {
    void shutdownServer();
  });
}
