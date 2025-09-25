import { exec } from 'child_process';
import { RUN_SOLO } from './constants.mjs';
import { log } from './logger.mjs';

async function isAdmin() {
  return new Promise((resolve) => {
    exec('net session', (error) => {
      resolve(!error);
    });
  });
}

export async function ensureAdmin() {
  const hasAdminRights = await isAdmin();

  if (hasAdminRights) {
    log.success('You have administrator privileges.');
  } else {
    log.error('Administrator privileges are required to run this script.');
  }
}

if (RUN_SOLO) ensureAdmin();
