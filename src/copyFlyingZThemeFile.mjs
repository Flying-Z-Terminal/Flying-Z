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
  const THEME_FILE_SOURCE = path.join(ASSETS_PATH, THEME_FILE_NAME);
  const THEME_FILE_DESTINATION = path.join(
    USER_CYGWIN_HOME,
    '.oh-my-zsh',
    'custom',
    'themes',
    THEME_FILE_NAME
  );
  fs.copyFileSync(THEME_FILE_SOURCE, THEME_FILE_DESTINATION);
}

if (RUN_SOLO) copyFlyingZThemeFile();
