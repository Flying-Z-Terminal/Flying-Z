import fs from 'fs';
import path from 'path';
import {
  RUN_SOLO,
  USER_CYGWIN_HOME,
  ASSETS_PATH,
  THEME_FILE_NAME,
} from './constants.mjs';
import { log } from './logger.mjs';

export async function copyFlyingZThemeFile() {
  log.info('copyFlyingZThemeFile');
  const THEME_FILE_SOURCE = path.join(ASSETS_PATH, THEME_FILE_NAME);
  const THEME_DESTINATION_DIR = path.join(
    USER_CYGWIN_HOME,
    '.flying-z',
    'themes'
  );
  const THEME_FILE_DESTINATION = path.join(
    THEME_DESTINATION_DIR,
    THEME_FILE_NAME
  );
  fs.mkdirSync(THEME_DESTINATION_DIR, { recursive: true });
  fs.copyFileSync(THEME_FILE_SOURCE, THEME_FILE_DESTINATION);
}

if (RUN_SOLO) copyFlyingZThemeFile();
