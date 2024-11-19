import Downloader from 'nodejs-file-downloader';
import { promises as fs } from 'fs';
import { DOWNLOAD_PATH, RUN_SOLO } from './constants.mjs';
import { log } from './logger.mjs';

const openpgp = require('openpgp'); // NOTE: Must not import or bundle errors: `Uncaught Exception: The argument 'filename' must be a file URL object, file URL string, or absolute path string.`

const files = {
  setup: 'https://www.cygwin.com/setup-x86_64.exe',
  sig: 'https://www.cygwin.com/setup-x86_64.exe.sig',
  pubkey: 'https://www.cygwin.com/key/pubring.asc',
};

async function downloadFile(url, filename) {
  const downloader = new Downloader({
    url,
    directory: DOWNLOAD_PATH,
    fileName: filename,
    maxAttempts: 3,
  });
  const { filePath, downloadStatus } = await downloader.download();
  if (downloadStatus === 'ABORTED')
    throw new Error(`Download aborted for ${filename}`);
  return filePath;
}

// Verify PGP signature using openpgp
async function verifySignature({ publicKeyPath, signaturePath, filePath }) {
  // Read the public key as text
  const publicKeyArmored = await fs.readFile(publicKeyPath, 'utf8');

  // Load all keys from the armored keyring
  const publicKeys = await openpgp.readKeys({ armoredKeys: publicKeyArmored });

  // Read the signature as binary
  const signatureBinary = await fs.readFile(signaturePath);
  const signature = await openpgp.readSignature({
    binarySignature: signatureBinary,
  });

  // Read the file content as binary
  const fileContent = await fs.readFile(filePath);
  const message = await openpgp.createMessage({ binary: fileContent });

  // Verify the signature with all loaded public keys
  const verificationResult = await openpgp.verify({
    message,
    signature,
    verificationKeys: publicKeys,
  });

  const { verified } = verificationResult.signatures[0];
  await verified; // throws an error if signature is invalid

  log.success('PGP signature verification successful!');
}

export async function downloadCygwin() {
  try {
    log.info('Downloading Cygwin setup and related files...');

    const setupPath = await downloadFile(files.setup, 'setup-x86_64.exe');
    const sigPath = await downloadFile(files.sig, 'setup-x86_64.exe.sig');
    const pubkeyPath = await downloadFile(files.pubkey, 'pubring.asc');

    log.success('All files downloaded successfully.');

    // Verify the downloaded file
    await verifySignature({
      publicKeyPath: pubkeyPath,
      signaturePath: sigPath,
      filePath: setupPath,
    });
  } catch (err) {
    log.error(`Verification failed: ${err.message}`);
  }
}

if (RUN_SOLO) downloadCygwin();
