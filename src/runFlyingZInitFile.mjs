import { spawnSync } from 'child_process';
import { INIT_FILE_DESTINATION_PATH, RUN_SOLO } from './constants.mjs';
import { log } from './logger.mjs';

// TODO -- Is this necessary? If so, document why
export async function runFlyingZInitFile() {
  log.info('runFlyingZInitFile');
  spawnSync(INIT_FILE_DESTINATION_PATH);
}

if (RUN_SOLO) runFlyingZInitFile();
