import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import unzipper from 'unzipper';
import Downloader from 'nodejs-file-downloader';
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

export async function downloadFile(url, outputPath) {
  const downloader = new Downloader({
    url: url,
    directory: path.dirname(outputPath),
    fileName: path.basename(outputPath),
  });

  try {
    await downloader.download();
    log.info(`Downloaded file to ${outputPath}`);
  } catch (err) {
    throw new Error(`Failed to download: ${err.message}`);
  }
}

export async function extractZip(zipPath, extractTo) {
  try {
    await fs
      .createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractTo }))
      .promise();
    log.info(`Extracted .zip file to ${extractTo}`);
  } catch (err) {
    throw new Error(`Failed to extract zip: ${err.message}`);
  }
}
