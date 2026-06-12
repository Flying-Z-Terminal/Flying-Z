import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { CYGWIN_ROOT, RUN_SOLO } from './constants.mjs';
import { log } from './logger.mjs';

const execFileAsync = promisify(execFile);

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
    // Target is the whole drive: never leave this junction unhardened.
    failClosed: true,
  },
];

const normalize = (p) => path.resolve(p).toLowerCase();

// Deny "List Folder" on the junction for Everyone (*S-1-1-0), the same
// hardening Windows applies to its own compat junctions like
// "C:\Documents and Settings". Opening a *named* path through the junction
// still works (traversal doesn't need list permission), but recursive
// deleters, backup tools, and scanners can't enumerate through it -- which
// prevents junction-following deleters like `del /s` and `robocopy /MIR`
// from descending into the target (for cygdrive\c the target is the whole
// drive!) and breaks the cygdrive\c -> C:\ cycle for naive directory walkers.
//
// Side effect: even `rmdir` of the junction itself is denied (the emptiness
// check needs List). The uninstaller must strip the ACE first:
//   icacls <junction> /remove:d *S-1-1-0  &&  rmdir <junction>
async function ensureDenyListAce(junction) {
  // This works even on a fresh non-inheriting object because we created the
  // junction: the creator owns it, and an owner always holds implicit
  // WRITE_DAC. Strip-then-add (instead of parsing icacls output, which is
  // localized) keeps re-runs from stacking duplicate ACEs.
  await execFileAsync('icacls', [junction, '/remove:d', '*S-1-1-0']);
  // Deny only RD: Windows' own compat junctions deny (S,RD), but denying
  // Synchronize breaks ordinary handle opens (even lstat on the junction),
  // and List Folder alone is what enumeration-based descent needs.
  await execFileAsync('icacls', [junction, '/deny', '*S-1-1-0:(RD)']);
  log.info(`Denied List Folder on ${junction} for Everyone`);
}

async function createJunction({ junction, target, failClosed }) {
  let existing;
  try {
    existing = await fs.lstat(junction);
  } catch {
    // Doesn't exist -- the happy path; fall through and create it.
  }

  if (existing) {
    let isOurs = false;
    if (existing.isSymbolicLink() || existing.isDirectory()) {
      try {
        const currentTarget = await fs.readlink(junction);
        isOurs = normalize(currentTarget) === normalize(target);
      } catch {
        // Plain directory, not a reparse point
      }
    }
    if (!isOurs) {
      log.warn(
        `${junction} already exists and is not a junction to ${target}; leaving it alone. POSIX paths under it won't resolve in native apps.`
      );
      return;
    }
  } else {
    // Recursive mkdir of a drive root throws EPERM on Windows; only create
    // the parent when it's a real subdirectory (i.e. C:\cygdrive).
    const parent = path.dirname(junction);
    if (parent !== path.parse(parent).root) {
      await fs.mkdir(parent, { recursive: true });
    }
    await fs.symlink(target, junction, 'junction');
    log.info(`Created junction ${junction} -> ${target}`);
  }

  try {
    await ensureDenyListAce(junction);
  } catch (err) {
    if (failClosed) {
      // An unhardened junction to the drive root lets junction-following
      // recursive deleters (del /s, robocopy /MIR) reach the whole drive.
      // Better to lose /cygdrive/<x> path resolution than to risk that.
      try {
        await fs.rmdir(junction);
        log.warn(
          `Could not harden ${junction} (${err.message}); removed it. /cygdrive paths won't resolve in native apps.`
        );
      } catch {
        log.error(
          `Could not harden ${junction} (${err.message}) and could not remove it. Remove it manually: rmdir "${junction}"`
        );
      }
    } else {
      log.warn(
        `Could not harden ${junction} against recursive deletes (${err.message}). It still works, but junction-following tools like \`del /s\` can reach ${target} through it.`
      );
    }
  }
}

export async function createRootJunctions() {
  log.info('createRootJunctions');
  for (const spec of JUNCTIONS) {
    await createJunction(spec);
  }
}

if (RUN_SOLO) createRootJunctions();
