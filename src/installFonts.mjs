import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { log } from './logger.mjs';
import { downloadFile, extractZip } from './utils/index.mjs';
import { DOWNLOAD_PATH, RUN_SOLO } from './constants.mjs';

const FONTS_URL =
  'https://github.com/ryanoasis/nerd-fonts/releases/download/v3.2.1/CascadiaCode.zip';
const TEMP_ZIP_PATH = path.join(DOWNLOAD_PATH, 'font-download.zip');
const EXTRACT_PATH = path.join(DOWNLOAD_PATH, 'font-extract');
const SYSTEM_FONTS_PATH = path.join(process.env.SystemRoot, 'fonts');

async function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        log.error(`exec error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) log.error(`stderr: ${stderr}`);
      resolve(stdout);
    });
  });
}

async function copyFontFile(src, dest) {
  try {
    await fs.promises.copyFile(src, dest);
    log.info(`Copied font: ${src} to ${dest}`);
  } catch (err) {
    log.error(`Failed to copy font: ${err}`);
    throw err;
  }
}

async function installSingleFont(fontPath) {
  const fontName = path.basename(fontPath);
  await copyFontFile(fontPath, path.join(SYSTEM_FONTS_PATH, fontName));

  const fontDisplayName = fontName.replace(/\.(ttf)$/i, '');
  await execCommand(
    `reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts" /v "${fontDisplayName}" /t REG_SZ /d "${fontName}" /f`
  );
}

async function doTheActualInstalling() {
  const fontFiles = await fs.promises.readdir(EXTRACT_PATH);
  for (const file of fontFiles) {
    const extension = path.extname(file).toLowerCase();
    if (extension === '.ttf' && file.toLowerCase().includes('mono')) {
      await installSingleFont(path.join(EXTRACT_PATH, file));
    }
  }
}

export async function installFonts() {
  try {
    await downloadFile(FONTS_URL, TEMP_ZIP_PATH);
    await extractZip(TEMP_ZIP_PATH, EXTRACT_PATH);
    await doTheActualInstalling();

    log.success('Fonts installed successfully (reboot may be required)');
  } catch (err) {
    log.error(`Error: ${err.message}`);
  }
}

if (RUN_SOLO) installFonts();
