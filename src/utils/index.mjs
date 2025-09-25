import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import unzipper from 'unzipper';
import Downloader from 'nodejs-file-downloader';
import { log } from '../logger.mjs';

export function easySpawn(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);

    child.once('error', (err) => {
      return reject(err);
    });

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        log.info(data.toString());
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        log.error(data.toString());
      });
    }

    child.once('close', (code, signal) => {
      if (signal) {
        return reject(new Error(`Process terminated by signal: ${signal}`));
      }
      if (code !== 0) {
        return reject(new Error(`Non-zero exit code: ${code}`));
      }
      log.info(`exit ${code}`);
      return resolve();
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
