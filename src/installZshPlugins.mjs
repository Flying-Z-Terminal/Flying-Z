import path from 'path';
import { CYGWIN_ROOT, RUN_SOLO } from './constants.mjs';
import { easySpawn } from './utils/index.mjs';
import { log } from './logger.mjs';

const CYGWIN_BIN_PATH = path.join(CYGWIN_ROOT, 'bin');
const BASH_EXE = path.join(CYGWIN_BIN_PATH, 'bash.exe');

export async function installZshPlugins() {
  log.info(BASH_EXE);
  await easySpawn(
    BASH_EXE,
    [
      '--login',
      '-i',
      '-c',
      'curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | bash && chmod +x ./.local/bin/zoxide.exe ; exit',
    ],
    {
      env: {
        ...process.env,
        PATH: CYGWIN_BIN_PATH + ';' + process.env.PATH,
      },
    }
  );
}

if (RUN_SOLO) installZshPlugins()