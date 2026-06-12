import fs from 'fs';
import path from 'path';
import {
  RUN_SOLO,
  USER_CYGWIN_HOME,
  ASSETS_PATH,
  OMZ_LIB_ASSETS_PATH,
  THEME_FILE_NAMES,
} from './constants.mjs';
import { grantUserOwnership } from './utils/index.mjs';
import { log } from './logger.mjs';

// Ships the ~/.flying-z payload: themes/, lib/ (vendored zsh libs sourced by
// .zshrc), and an empty cache/ for .zshrc's cached zoxide init.
export async function copyFlyingZHomeFiles() {
  log.info('copyFlyingZHomeFiles');
  const FLYING_Z_HOME_DIR = path.join(USER_CYGWIN_HOME, '.flying-z');
  const THEME_DESTINATION_DIR = path.join(FLYING_Z_HOME_DIR, 'themes');
  const LIB_DESTINATION_DIR = path.join(FLYING_Z_HOME_DIR, 'lib');

  fs.mkdirSync(THEME_DESTINATION_DIR, { recursive: true });
  fs.mkdirSync(LIB_DESTINATION_DIR, { recursive: true });
  fs.mkdirSync(path.join(FLYING_Z_HOME_DIR, 'cache'), { recursive: true });

  for (const themeFileName of THEME_FILE_NAMES) {
    fs.copyFileSync(
      path.join(ASSETS_PATH, themeFileName),
      path.join(THEME_DESTINATION_DIR, themeFileName)
    );
  }

  for (const libFileName of fs.readdirSync(OMZ_LIB_ASSETS_PATH)) {
    fs.copyFileSync(
      path.join(OMZ_LIB_ASSETS_PATH, libFileName),
      path.join(LIB_DESTINATION_DIR, libFileName)
    );
  }

  await grantUserOwnership(FLYING_Z_HOME_DIR);
}

if (RUN_SOLO) copyFlyingZHomeFiles();
