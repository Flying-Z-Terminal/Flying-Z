import fs from 'fs';
import {
  INIT_FILE_DESTINATION_PATH,
  CYGWIN_ROOT,
  RUN_SOLO,
} from './constants.mjs';
import { log } from './logger.mjs';

const createBatchFileContents = (installDir) => `
  @echo off

  rem Cygwin STARTING_DIR logic inspired by https://superuser.com/a/743579/

  set STARTING_DIR=%CD%

  rem If startingDir is system32, it was NOT launched from Explorer context menu
  if /I %STARTING_DIR%==%WINDIR%\\system32 (${installDir}\\bin\\zsh.exe --login -i) else (
      rem If startingDir is WindowsApps, it was launched with hotkey via desktop shortcut, but we don't want to 'cd' there
      if /I %STARTING_DIR%==%USERPROFILE%\\AppData\\Local\\Microsoft\\WindowsApps (${installDir}\\bin\\zsh.exe --login -i) else (
       ${installDir}\\bin\\bash.exe --login -c "export CD='%STARTING_DIR%'; cd "$CD"; exec zsh"
  ))
`;

export async function writeFlyingZInitFile() {
  log.info('writeFlyingZInitFile');
  fs.writeFileSync(
    INIT_FILE_DESTINATION_PATH,
    createBatchFileContents(CYGWIN_ROOT)
  );
  log.info('Wrote Flying-Z init file');
}

if (RUN_SOLO) writeFlyingZInitFile();
