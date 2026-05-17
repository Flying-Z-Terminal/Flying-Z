import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import {
  BASH_LAUNCHER_BATCH_FILE,
  DEFAULT_ZSH_RC_PATH,
  RUN_SOLO,
  USER_CYGWIN_HOME,
} from './constants.mjs';
import { log } from './logger.mjs';

export async function copyZshConfig() {
  log.info('copyZshConfig');
  const ZSH_RC_INTENDED_PATH = path.join(USER_CYGWIN_HOME, '.zshrc');

  // IMPORTANT: Run Bash first so that the user's home folder will be created.
  // It must be created before the next steps.
  spawnSync(BASH_LAUNCHER_BATCH_FILE);

  const zshRcAlreadyExists = fs.existsSync(ZSH_RC_INTENDED_PATH);

  if (zshRcAlreadyExists) {
    log.error(
      '.zshrc file already exists. Backing up with extension .pre-flying-z'
    );
    const backupPath = path.join(
      USER_CYGWIN_HOME,
      `.zshrc-${Date.now()}.pre-flying-z`
    );
    fs.copyFileSync(ZSH_RC_INTENDED_PATH, backupPath);
  }

  fs.copyFileSync(DEFAULT_ZSH_RC_PATH, ZSH_RC_INTENDED_PATH);
}

if (RUN_SOLO) copyZshConfig();
