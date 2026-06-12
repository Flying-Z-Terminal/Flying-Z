import fs from 'fs';
import path from 'path';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import unzipper from 'unzipper';
import Downloader from 'nodejs-file-downloader';
import { log } from '../logger.mjs';

const execFileAsync = promisify(execFile);

// The installer runs elevated, so anything it creates with Node's fs APIs is
// owned by BUILTIN\Administrators, and the user only gets read access via the
// inherited Everyone ACE. (Cygwin-created files don't have this problem: the
// token's user SID stays the real user under elevation, and Cygwin stamps
// POSIX perms from it.) Result: the unelevated shell can't write to its own
// dotfiles -- e.g. `mkdir ~/.flying-z/cache` at zsh startup fails with
// "Permission denied" on every shell. Hand the files back to the user.
export async function grantUserOwnership(targetPath) {
  const user = process.env.USERNAME;
  const isDir = fs.statSync(targetPath).isDirectory();
  // /C continues past per-file errors; /Q quiets per-file success output;
  // /L acts on junctions/symlinks themselves, never their targets.
  const flags = [...(isDir ? ['/T'] : []), '/C', '/L', '/Q'];
  const grant = isDir ? `${user}:(OI)(CI)F` : `${user}:F`;
  await execFileAsync('icacls', [targetPath, '/setowner', user, ...flags]);
  await execFileAsync('icacls', [targetPath, '/grant', grant, ...flags]);
  log.info(`Granted ${user} ownership of ${targetPath}`);
}

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
