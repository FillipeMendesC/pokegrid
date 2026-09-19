import { app, BrowserWindow, ipcMain, shell } from "electron";
import electronUpdater from "electron-updater";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { autoUpdater } = electronUpdater;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isMac = process.platform === "darwin";
let mainWindow = null;
let localServer = null;
let localOrigin = null;
let updaterConfigured = false;

const hasLock = app.requestSingleInstanceLock();
if (!hasLock) {
  app.quit();
}

function sendUpdateStatus(state, message, extra = {}) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("pokegrid:update-status", { state, message, ...extra });
}

function isPortableBuild() {
  return process.platform === "win32" && Boolean(process.env.PORTABLE_EXECUTABLE_FILE);
}

function compareVersions(left, right) {
  const a = String(left).replace(/^v/i, "").split(".").map((value) => Number(value) || 0);
  const b = String(right).replace(/^v/i, "").split(".").map((value) => Number(value) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] ?? 0) > (b[index] ?? 0)) return 1;
    if ((a[index] ?? 0) < (b[index] ?? 0)) return -1;
  }
  return 0;
}

async function checkPortableRelease() {
  const response = await fetch("https://api.github.com/repos/MatheusCamacho/pokegrid/releases/latest", {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": `POKEGRID/${app.getVersion()}`
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error(`GitHub update channel returned ${response.status}`);
  const release = await response.json();
  const latest = String(release.tag_name ?? "").replace(/^v/i, "");
  const current = app.getVersion();

  if (latest && compareVersions(latest, current) > 0) {
    const message = `POKÉGRID ${latest} is available. Portable builds update through the Releases page.`;
    sendUpdateStatus("available", message, { version: latest, portable: true });
    return { state: "available", message, version: latest, portable: true };
  }

  const message = `POKÉGRID ${current} is up to date.`;
  sendUpdateStatus("current", message, { version: current, portable: true });
  return { state: "current", message, version: current, portable: true };
}

function configureUpdater() {
  if (updaterConfigured || !app.isPackaged || isPortableBuild()) return;
  updaterConfigured = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on("checking-for-update", () => {
    sendUpdateStatus("checking", "Checking the GitHub release channel…");
  });

  autoUpdater.on("update-available", (info) => {
    sendUpdateStatus("available", `POKÉGRID ${info.version} is available. Downloading update…`, { version: info.version });
  });

  autoUpdater.on("update-not-available", (info) => {
    sendUpdateStatus("current", `POKÉGRID ${info.version ?? app.getVersion()} is up to date.`, { version: info.version ?? app.getVersion() });
  });

  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.max(0, Math.min(100, Math.round(progress.percent ?? 0)));
    sendUpdateStatus("downloading", `Downloading update… ${percent}%`, { percent });
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendUpdateStatus(
      "downloaded",
      `POKÉGRID ${info.version} is ready. It will install automatically when you close the app.`,
      { version: info.version }
    );
  });

  autoUpdater.on("error", (error) => {
    sendUpdateStatus("error", `Update check failed: ${error.message}`);
  });
}

async function checkForUpdates() {
  if (!app.isPackaged) {
    return { state: "development", message: "Update checks are disabled in development mode." };
  }

  if (isPortableBuild()) return checkPortableRelease();

  configureUpdater();
  sendUpdateStatus("checking", "Checking the GitHub release channel…");
  await autoUpdater.checkForUpdates();
  return { state: "checking", message: "Checking the GitHub release channel…" };
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
      preload: path.join(__dirname, "preload.mjs"),
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

ipcMain.handle("pokegrid:system-info", () => ({
  version: app.getVersion(),
  platform: process.platform,
  packaged: app.isPackaged,
  portable: isPortableBuild(),
  autoUpdateSupported: app.isPackaged && !isPortableBuild()
}));

ipcMain.handle("pokegrid:check-updates", async () => {
  try {
    return await checkForUpdates();
  } catch (error) {
    const message = `Update check failed: ${error.message}`;
    sendUpdateStatus("error", message);
    return { state: "error", message };
  }
});

if (hasLock) {
  app.enableSandbox();

  app.whenReady().then(async () => {
    if (process.platform === "win32") {
      app.setAppUserModelId("dev.matheuscamacho.pokegrid");
    }

    try {
      const origin = await startLocalServer();
      mainWindow = createWindow(origin);
      configureUpdater();

      if (app.isPackaged) {
        setTimeout(() => {
          void checkForUpdates().catch((error) => {
            sendUpdateStatus("error", `Automatic update check failed: ${error.message}`);
          });
        }, 4500).unref?.();
      }
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
