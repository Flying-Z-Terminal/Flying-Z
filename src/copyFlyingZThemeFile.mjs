import fs from 'fs';
import path from 'path';
import {
  RUN_SOLO,
  USER_CYGWIN_HOME,
  ASSETS_PATH,
  THEME_FILE_NAMES,
} from './constants.mjs';
import { grantUserOwnership } from './utils/index.mjs';
import { log } from './logger.mjs';

export async function copyFlyingZThemeFile() {
  log.info('copyFlyingZThemeFile');
  const FLYING_Z_HOME_DIR = path.join(USER_CYGWIN_HOME, '.flying-z');
  const THEME_DESTINATION_DIR = path.join(FLYING_Z_HOME_DIR, 'themes');

  fs.mkdirSync(THEME_DESTINATION_DIR, { recursive: true });
  // Pre-create the cache dir .zshrc's cached zoxide init writes into
  fs.mkdirSync(path.join(FLYING_Z_HOME_DIR, 'cache'), { recursive: true });

  for (const themeFileName of THEME_FILE_NAMES) {
    fs.copyFileSync(
      path.join(ASSETS_PATH, themeFileName),
      path.join(THEME_DESTINATION_DIR, themeFileName)
    );
  }

  await grantUserOwnership(FLYING_Z_HOME_DIR);
}

if (RUN_SOLO) copyFlyingZThemeFile();
