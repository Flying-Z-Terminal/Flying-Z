import fs from 'fs';
import path from 'path';
import {
  RUN_SOLO,
  USER_CYGWIN_HOME,
  ASSETS_PATH,
  THEME_FILE_NAMES,
} from './constants.mjs';
import { log } from './logger.mjs';

export async function copyFlyingZThemeFile() {
  log.info('copyFlyingZThemeFile');
  const THEME_DESTINATION_DIR = path.join(
    USER_CYGWIN_HOME,
    '.flying-z',
    'themes'
  );
  fs.mkdirSync(THEME_DESTINATION_DIR, { recursive: true });
  for (const themeFileName of THEME_FILE_NAMES) {
    fs.copyFileSync(
      path.join(ASSETS_PATH, themeFileName),
      path.join(THEME_DESTINATION_DIR, themeFileName)
    );
  }
}

if (RUN_SOLO) copyFlyingZThemeFile();
