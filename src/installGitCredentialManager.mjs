import path from 'path';
import { downloadFile, extractZip } from './utils/index.mjs';
import { log } from './logger.mjs';
import { CYGWIN_ROOT, DOWNLOAD_PATH, RUN_SOLO } from './constants.mjs';

const DOWNLOAD_URL =
  'https://github.com/git-ecosystem/git-credential-manager/releases/download/v2.6.0/gcm-win-x86-2.6.0.zip';
const TEMP_ZIP_PATH = path.join(DOWNLOAD_PATH, 'temp-gcm-win-x86.zip');
const EXTRACT_PATH = path.join(CYGWIN_ROOT, 'usr', 'libexec', 'git-core');

async function downloadAndExtractZip(zipUrl, outputZipPath, extractPath) {
  try {
    await downloadFile(zipUrl, outputZipPath);
    await extractZip(outputZipPath, extractPath);
  } catch (err) {
    log.error(`Error: ${err.message}`);
  }
}

export async function installGitCredentialManager() {
  await downloadAndExtractZip(DOWNLOAD_URL, TEMP_ZIP_PATH, EXTRACT_PATH);
  log.success('Git Credential Manager installed');
}

if (RUN_SOLO) installGitCredentialManager();
