const { app, BrowserWindow, dialog } = require("electron");
const { exec } = require("child_process");
const waitOn = require("wait-on");

let mainWindow;
let splash;

function createSplashScreen() {

  splash = new BrowserWindow({
    width: 500,
    height: 500,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    center: true,
    backgroundColor: "#000000",
    title: "Atharv AI",

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const splashHTML = `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8" />

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 100vw;
  height: 100vh;
  background: #000000;
  color: #ffffff;
  overflow: hidden;
  font-family: 'JetBrains Mono', monospace;
  display: flex;
  flex-direction: column;
}

.topbar {
  height: 34px;
  border-bottom: 1px solid #1f1f1f;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: #050505;
  flex-shrink: 0;
}

.window-title {
  font-size: 12px;
  opacity: 0.55;
  letter-spacing: 0.5px;
}

.terminal {
  flex: 1;
  padding: 16px;
  font-size: 13px;
  line-height: 1.45;

  overflow-y: auto;
  overflow-x: hidden;

  scroll-behavior: smooth;

  /* Hide scrollbar - Firefox */
  scrollbar-width: none;

  /* Hide scrollbar - IE/Edge */
  -ms-overflow-style: none;
}

/* Hide scrollbar - Chrome/Safari */
.terminal::-webkit-scrollbar {
  display: none;
}

.line {
  margin-bottom: 4px;
  word-break: break-word;
}

.dim {
  opacity: 0.55;
}

.success {
  color: #ffffff;
}

.info {
  color: #d4d4d4;
}

.warning {
  color: #9f9f9f;
}

.error {
  color: #ffffff;
}

.loader {
  display: inline-block;
  width: 11px;
  height: 11px;
  border: 2px solid #2a2a2a;
  border-top: 2px solid #ffffff;
  border-radius: 50%;
  margin-right: 8px;
  transform: translateY(2px);
  animation: spin 0.8s linear infinite;
}

.cursor {
  display: inline-block;
  width: 7px;
  height: 13px;
  background: #ffffff;
  animation: blink 1s infinite;
  transform: translateY(2px);
}

.log-container {
  margin-top: 10px;
}

@keyframes spin {
  to {
    transform: translateY(2px) rotate(360deg);
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

</style>
</head>

<body>

<div class="topbar">
  <div class="window-title">
    atharv-ai-terminal
  </div>
</div>

<div class="terminal">

  <div class="line success">
    > Atharv AI runtime initialized
  </div>

  <div class="line dim">
    > Electron environment ready
  </div>

  <div class="log-container" id="logs">

    <div class="line info" id="status-line">
      <span class="loader"></span>
      Checking Docker environment...
    </div>

  </div>

  <div class="line" style="margin-top: 8px;">
    >
    <span class="cursor"></span>
  </div>

</div>

<script>

function addLog(text, type = "info") {

  const logs = document.getElementById("logs");

  const div = document.createElement("div");

  div.className = "line " + type;

  div.innerHTML = text;

  logs.appendChild(div);

  logs.scrollTop = logs.scrollHeight;
}

function updateStatus(text, type = "info") {

  const line = document.getElementById("status-line");

  line.className = "line " + type;

  let icon = "";

  if (type === "info") {
    icon = '<span class="loader"></span>';
  }

  if (
    type === "success" ||
    type === "warning" ||
    type === "error"
  ) {
    icon = '> ';
  }

  line.innerHTML = icon + text;
}

window.updateSplashStatus = updateStatus;
window.addSplashLog = addLog;

</script>

</body>
</html>
`;

  splash.loadURL(
    "data:text/html;charset=UTF-8," +
    encodeURIComponent(splashHTML)
  );
}

function updateSplashStatus(message, type = "info") {

  if (!splash || splash.isDestroyed()) return;

  splash.webContents.executeJavaScript(`
    window.updateSplashStatus(
      ${JSON.stringify(message)},
      ${JSON.stringify(type)}
    );
  `).catch(() => {});
}

function addSplashLog(message, type = "info") {

  if (!splash || splash.isDestroyed()) return;

  splash.webContents.executeJavaScript(`
    window.addSplashLog(
      ${JSON.stringify(message)},
      ${JSON.stringify(type)}
    );
  `).catch(() => {});
}

function createMainWindow() {

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    show: false,
    backgroundColor: "#0f0f0f",
    title: "Atharv AI",

    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://localhost:3000");

  mainWindow.webContents.setZoomFactor(1);

  // CTRL + Mouse Wheel zoom
  mainWindow.webContents.on("zoom-changed", (event, zoomDirection) => {

    const currentZoom = mainWindow.webContents.getZoomFactor();

    if (zoomDirection === "in") {
      mainWindow.webContents.setZoomFactor(currentZoom + 0.1);
    }

    if (zoomDirection === "out") {
      mainWindow.webContents.setZoomFactor(currentZoom - 0.1);
    }
  });

  // Keyboard shortcuts
  mainWindow.webContents.on("before-input-event", (event, input) => {

    const currentZoom = mainWindow.webContents.getZoomFactor();

    // CTRL +
    if (input.control && input.key === "=") {
      event.preventDefault();
      mainWindow.webContents.setZoomFactor(currentZoom + 0.1);
    }

    // CTRL -
    if (input.control && input.key === "-") {
      event.preventDefault();
      mainWindow.webContents.setZoomFactor(currentZoom - 0.1);
    }

    // CTRL 0
    if (input.control && input.key === "0") {
      event.preventDefault();
      mainWindow.webContents.setZoomFactor(1);
    }

    // CTRL SHIFT I
    if (
      input.control &&
      input.shift &&
      input.key.toLowerCase() === "i"
    ) {
      event.preventDefault();
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.once("ready-to-show", () => {

    if (splash && !splash.isDestroyed()) {
      splash.close();
    }

    mainWindow.show();
    mainWindow.maximize();
  });
}

function startDocker() {

  return new Promise((resolve, reject) => {

    exec(
      "docker compose up -d",
      {
        cwd: __dirname,
      },
      (error, stdout, stderr) => {

        if (error) {
          reject(error);
          return;
        }

        console.log(stdout);

        resolve();
      }
    );

  });
}

function waitForDocker() {

  return new Promise((resolve) => {

    let hasShownWaitingState = false;

    const interval = setInterval(() => {

      exec("docker info", (error) => {

        // Docker NOT running
        if (error) {

          if (!hasShownWaitingState) {

            updateSplashStatus(
              "[ERROR] Docker daemon unavailable",
              "error"
            );

            addSplashLog(
              "> Waiting for Docker Desktop...",
              "warning"
            );

            addSplashLog(
              "> Start Docker Desktop to continue",
              "dim"
            );

            hasShownWaitingState = true;
          }

          return;
        }

        // Docker running again
        clearInterval(interval);

        updateSplashStatus(
          "Docker environment detected",
          "success"
        );

        addSplashLog(
          "> Docker Desktop connected",
          "success"
        );

        resolve();
      });

    }, 2000);

  });
}

function pullModel() {

  return new Promise((resolve, reject) => {

    exec(
      "docker exec ollama ollama list",
      (error, stdout) => {

        if (error) {
          reject(error);
          return;
        }

        // Model already exists
        if (stdout.includes("qwen2.5:3b")) {

          addSplashLog("> Model already cached locally", "success");

          resolve();
          return;
        }

        addSplashLog("> Downloading qwen2.5:3b model...", "info");

        exec(
          "docker exec ollama ollama pull qwen2.5:3b",
          (pullError) => {

            if (pullError) {
              reject(pullError);
              return;
            }

            resolve();
          }
        );
      }
    );

  });
}

async function launchApp() {

  createSplashScreen();

  try {
    updateSplashStatus("Checking Docker environment...");
    await waitForDocker();

    addSplashLog("> Docker environment detected", "success");

    updateSplashStatus("Starting Docker containers...");

    addSplashLog("> Downloading Open WebUI container if required", "dim");
    addSplashLog("> Downloading Ollama container if required", "dim");

    await startDocker();

    addSplashLog("> Open WebUI container ready", "success");
    addSplashLog("> Ollama container ready", "success");

    updateSplashStatus("Waiting for Open WebUI server...");

    addSplashLog("> Booting inference runtime", "dim");

    await waitOn({
      resources: ["http://localhost:3000"],
      timeout: 120000,
    });

    addSplashLog("> Open WebUI server online", "success");

    updateSplashStatus("Checking AI model cache...");

    await new Promise(resolve => setTimeout(resolve, 800));

    addSplashLog("> Verifying qwen2.5:3b model", "dim");

    updateSplashStatus("Downloading AI model if required...");

    await pullModel();

    addSplashLog("> qwen2.5:3b model ready", "success");

    updateSplashStatus("Launching desktop interface...", "success");

    await new Promise(resolve => setTimeout(resolve, 1000));

    createMainWindow();

  } catch (error) {
    console.error(error);

    updateSplashStatus(
      "[ERROR] Failed to launch runtime",
      "error"
    );

    addSplashLog(
      "> Unexpected startup failure",
      "error"
    );
    
  }
}

app.whenReady().then(() => {
  launchApp();
});

app.on("window-all-closed", () => {
  app.quit();
});