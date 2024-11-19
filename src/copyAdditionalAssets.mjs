import fs from 'fs';
import path from 'path';
import {
  RUN_SOLO,
  INCLUDES_PATH,
  ASSETS_PATH,
  USER_WINDOWS_HOME,
  ICON_DESTINATION_FOLDER,
  USER_CYGWIN_HOME,
  CUSTOM_SCRIPTS_SOURCE_FOLDER,
} from './constants.mjs';
import { log } from './logger.mjs';

const TERMINAL_ICON = 'icon.ico';

const THEME_MODES = ['dark', 'light', 'bold'];

// @TODO -- cpSync theoretically simplifies a lot of this, but errors in pkg: `// fs.cpSync(ADDITIONAL_RC_FILES_SOURCE_DIR, USER_CYGWIN_HOME); // NOTE: cpSync is experimental as of July 2023 -- Errored for me with: `Error: ENOENT: no such file or directory, lstat '\\?\C:\snapshot\flying-z\assets\additional-rc-files'`

function createAssetsFolder() {
  THEME_MODES.forEach((mode) => {
    const target = path.join(ICON_DESTINATION_FOLDER, mode);
    fs.mkdirSync(target, { recursive: true });
  });
}

// NOTE: Due to an apparent Windows bug/limitation, the user must log in/out before the hotkey will take effect
function copyDesktopShortcut() {
  const SHORTCUT_FILE_NAME = 'Flying-Z.lnk';
  const SHORTCUT_FILE_SOURCE = path.join(
    INCLUDES_PATH,
    'custom-shortcuts',
    SHORTCUT_FILE_NAME
  );
  const SHORTCUT_FILE_DESTINATION = path.join(
    USER_WINDOWS_HOME,
    'Desktop',
    SHORTCUT_FILE_NAME
  );

  fs.copyFileSync(SHORTCUT_FILE_SOURCE, SHORTCUT_FILE_DESTINATION);
}

function copyTerminalIconFile() {
  THEME_MODES.forEach((mode) => {
    const ICON_SOURCE = path.join(ASSETS_PATH, 'icons', mode, TERMINAL_ICON);
    const ICON_DESTINATION = path.join(
      ICON_DESTINATION_FOLDER,
      mode,
      TERMINAL_ICON
    );
    if (fs.existsSync(ICON_SOURCE))
      fs.copyFileSync(ICON_SOURCE, ICON_DESTINATION);
  });
}

function copyAdditionalRCFiles() {
  const ADDITIONAL_RC_FILES_SOURCE_DIR = path.join(
    ASSETS_PATH,
    'additional-rc-files'
  );
  const rcFiles = fs.readdirSync(ADDITIONAL_RC_FILES_SOURCE_DIR);

  rcFiles.forEach((itemName) => {
    const sourcePath = path.join(ADDITIONAL_RC_FILES_SOURCE_DIR, itemName);
    const destPath = path.join(USER_CYGWIN_HOME, itemName);

    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

function copyCustomScripts() {
  const CUSTOM_SCRIPTS_DEST_FOLDER = path.join(
    USER_CYGWIN_HOME,
    '.local',
    'bin'
  );

  const customScripts = fs.readdirSync(CUSTOM_SCRIPTS_SOURCE_FOLDER);

  customScripts.forEach((scriptName) => {
    const sourcePath = path.join(CUSTOM_SCRIPTS_SOURCE_FOLDER, scriptName);
    const destPath = path.join(CUSTOM_SCRIPTS_DEST_FOLDER, scriptName);

    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

export async function copyAdditionalAssets() {
  createAssetsFolder();
  copyDesktopShortcut();
  copyTerminalIconFile();
  copyAdditionalRCFiles();
  copyCustomScripts();
}

if (RUN_SOLO) copyAdditionalAssets();
