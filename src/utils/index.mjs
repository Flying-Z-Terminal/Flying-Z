import { spawn } from 'child_process';
import { log } from '../logger.mjs';

export function easySpawn(command, args, options) {
  return new Promise((resolve, reject) => {
    const installer = spawn(command, args, options);

    installer.stdout.on('data', (data) => {
      log.info(data);
    });

    installer.stderr.on('data', (data) => {
      log.error(data);
    });

    installer.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Non-zero exit code: ${code}`));
      }
      log.info(code);
      resolve();
    });
  });
}
