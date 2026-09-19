import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("pokegrid", {
  getSystemInfo: () => ipcRenderer.invoke("pokegrid:system-info"),
  checkForUpdates: () => ipcRenderer.invoke("pokegrid:check-updates"),
  onUpdateStatus: (listener) => {
    if (typeof listener !== "function") return () => {};
    const handler = (_event, payload) => listener(payload);
    ipcRenderer.on("pokegrid:update-status", handler);
    return () => ipcRenderer.removeListener("pokegrid:update-status", handler);
  }
});
