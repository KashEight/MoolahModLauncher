const { app, BrowserWindow } = require('electron');
const path = require("node:path");

const modParser = require('./mod_parser');
const { loadConfig, saveConfig, setConfigValue } = require('./config');
const {resolveInstall} = require('./installlocators');
const setup = require('./setup_win32');

if (require('electron-squirrel-startup')) app.quit();
require('update-electron-app')()

let mainWindow;

app.on('ready', () => {
    // Check if the app was launched with the -install or -uninstall argument
    const isInstall = process.argv.includes('--install');
    const isUninstall = process.argv.includes('--uninstall');
    const installPackages = process.argv.slice(1).filter(v => v !== '.' && !v.startsWith('--'));

    if (isInstall) {
        if (process.platform === 'win32') {
            setup.installShellExtension(app.getAppPath());
        }

        loadConfig();
        resolveInstall()
            .then(result => {
                console.log("Install dir:", result);
                setConfigValue("gameDirectory", result);
                saveConfig();
            })
            .catch(error => {
                console.error("Error:", error);
            });

    } else if (isUninstall) {
        if (process.platform === 'win32') {
            setup.uninstallShellExtension();
        } else {
            console.warn("Uninstall is NO-OP on non-windows platforms")
        }
        // After an uninstall we just quit
        app.quit();
    } else if (installPackages.length > 0) {
        for (let installPackage of installPackages) {
            // TODO: install
        }
    }

    // Check if our command line arguments include a path and install mod here
    // TESTING
    const metaJson = modParser.readAndExtractMeta("test.pd3mod");
    if (metaJson !== "ERROR") {
        console.log(metaJson.name);
    }
    // TESTING

    mainWindow = new BrowserWindow({
        width: 800, height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        },
        icon: 'assets/img/modloader' // FIXME: svg not supported
    });
    mainWindow.loadFile('assets/index.html')
        .catch(reason => console.error("Failed to load main window", reason));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
