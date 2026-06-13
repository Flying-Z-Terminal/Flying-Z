import fs from 'fs';
import path from 'path';
import {
  DOWNLOAD_PATH,
  CYGWIN_INSTALLER_NAME,
  CYGWIN_INSTALLER_ARGS,
  RUN_SOLO,
  CYGWIN_ROOT,
  CYGDRIVE_PREFIX,
} from './constants.mjs';
import { log } from './logger.mjs';
import { easySpawn } from './utils/index.mjs';

// Replace Cygwin's default `/cygdrive` mount prefix with `/${CYGDRIVE_PREFIX}`.
// The search side is Cygwin's own default; only the replacement comes from the
// shared CYGDRIVE_PREFIX constant, so this and the root junction in
// createRootJunctions.mjs always agree on the prefix.
function customizeCygdrivePrefix() {
  const fstabFilePath = path.join(CYGWIN_ROOT, 'etc', 'fstab');
  const fstabContents = fs.readFileSync(fstabFilePath, 'utf8');
  const replacement = `none /${CYGDRIVE_PREFIX}`;
  const newContents = fstabContents.replace(/none \/cygdrive/, replacement);

  // String.replace silently returns the input unchanged when nothing matches.
  // If neither the default line nor our prefix is present, the fstab format
  // changed under us: warn loudly (native-app path resolution will be off)
  // but don't hard-fail the install.
  if (newContents === fstabContents && !fstabContents.includes(replacement)) {
    log.warn(
      `Could not find "none /cygdrive" in ${fstabFilePath}; left the cygdrive prefix at its default. Native-app POSIX path resolution under /${CYGDRIVE_PREFIX} will not work.`
    );
    return;
  }

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
