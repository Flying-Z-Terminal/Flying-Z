import fs from 'fs';
import path from 'path';
import {
  DOWNLOAD_PATH,
  CYGWIN_INSTALLER_NAME,
  CYGWIN_INSTALLER_ARGS,
  RUN_SOLO,
  CYGWIN_ROOT,
} from './constants.mjs';
import { log } from './logger.mjs';
import { easySpawn } from './utils/index.mjs';

// Replace /cygdrive with /ɀ
function customizeCygdrivePrefix() {
  const fstabFilePath = path.join(CYGWIN_ROOT, 'etc', 'fstab');
  const fstabContents = fs.readFileSync(fstabFilePath, 'utf8');
  const newContents = fstabContents.replace(/none \/cygdrive/, 'none /ɀ');
  fs.writeFileSync(fstabFilePath, newContents);
  log.info('Done customizing cygdrive prefix');
}

export async function installCygwin() {
  // Start Cygwin minimized
  log.info('Starting Cygwin install');
  await easySpawn(
    `start /min ${CYGWIN_INSTALLER_NAME} ${CYGWIN_INSTALLER_ARGS}`, // @TODO -- `start /min` prevents stdout logging
    [],
    {
      cwd: DOWNLOAD_PATH,
      shell: true,
    }
  );

  log.info('Done installing Cygwin');

  await customizeCygdrivePrefix();
}

if (RUN_SOLO) installCygwin();
