import fs from 'fs/promises';
import path from 'path';
import { CYGWIN_ROOT, RUN_SOLO } from './constants.mjs';
import { log } from './logger.mjs';

// Cygwin doesn't translate POSIX paths when exec'ing native Windows apps, so
// `subl ~/.zshrc` hands Sublime `/home/<user>/.zshrc`, which Windows resolves
// against the current drive as C:\home\<user>\.zshrc. Junctions at the drive
// root make that literal interpretation land on the real files, fixing path
// arguments for every native app at once:
//
//   C:\home        -> C:\Flying-Z\home   (covers /home/<user>/...)
//   C:\cygdrive\c  -> C:\                (covers /cygdrive/c/...)
//
// Limitation: a POSIX path is resolved against the *current* drive, so this
// only helps while the app's working directory is on the Cygwin root's drive.

const DRIVE_ROOT = path.parse(CYGWIN_ROOT).root; // e.g. C:\
const DRIVE_LETTER = DRIVE_ROOT[0].toLowerCase();

const JUNCTIONS = [
  {
    junction: path.join(DRIVE_ROOT, 'home'),
    target: path.join(CYGWIN_ROOT, 'home'),
  },
  {
    junction: path.join(DRIVE_ROOT, 'cygdrive', DRIVE_LETTER),
    target: DRIVE_ROOT,
  },
];

const normalize = (p) => path.resolve(p).toLowerCase();

async function createJunction({ junction, target }) {
  let existing;
  try {
    existing = await fs.lstat(junction);
  } catch {
    // Doesn't exist -- the happy path; fall through and create it.
  }

  if (existing) {
    if (existing.isSymbolicLink() || existing.isDirectory()) {
      try {
        const currentTarget = await fs.readlink(junction);
        if (normalize(currentTarget) === normalize(target)) return; // Already ours
      } catch {
        // Plain directory, not a reparse point
      }
    }
    log.warn(
      `${junction} already exists and is not a junction to ${target}; leaving it alone. POSIX paths under it won't resolve in native apps.`
    );
    return;
  }

  // Recursive mkdir of a drive root throws EPERM on Windows; only create
  // the parent when it's a real subdirectory (i.e. C:\cygdrive).
  const parent = path.dirname(junction);
  if (parent !== path.parse(parent).root) {
    await fs.mkdir(parent, { recursive: true });
  }
  await fs.symlink(target, junction, 'junction');
  log.info(`Created junction ${junction} -> ${target}`);
}

export async function createRootJunctions() {
  log.info('createRootJunctions');
  for (const spec of JUNCTIONS) {
    await createJunction(spec);
  }
}

if (RUN_SOLO) createRootJunctions();
