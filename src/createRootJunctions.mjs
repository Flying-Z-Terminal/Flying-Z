import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  CYGWIN_ROOT,
  CYGDRIVE_PREFIX,
  RUN_SOLO,
  ENABLE_ROOT_JUNCTIONS,
} from './constants.mjs';
import { log } from './logger.mjs';

const execFileAsync = promisify(execFile);

// Cygwin doesn't translate POSIX paths when exec'ing native Windows apps, so
// `subl ~/.zshrc` hands Sublime `/home/<user>/.zshrc`, which Windows resolves
// against the current drive as C:\home\<user>\.zshrc. Junctions at the drive
// root make that literal interpretation land on the real files, fixing path
// arguments for every native app at once:
//
//   C:\home   -> C:\Flying-Z\home   (covers /home/<user>/...)
//   C:\ɀ\c    -> C:\                 (covers /ɀ/c/...; ɀ = CYGDRIVE_PREFIX, the
//                                      same value installCygwin.mjs writes into
//                                      fstab, so the two can't drift)
//
// The drive-root junction (C:\ɀ\c -> C:\) is dangerous: a junction-following
// recursive deleter that *enumerates* through it (git clean, del /s,
// robocopy /MIR, Remove-Item -Recurse) would reach the whole drive. We defend
// every junction with an icacls deny-"List Folder" ACE (see ensureDenyListAce):
// opening a *named* path through it still works (traversal needs Traverse, not
// List), but enumeration-based descent is blocked. Per the hard requirement, we
// NEVER form a production junction unless we have first PROVEN on this machine
// that the deny ACE actually blocks enumeration and enumeration-based deletion
// (see proveHardeningCapability) -- and each junction is individually verified
// after creation, fail-closed.
//
// Limitation: a POSIX path is resolved against the *current* drive, so this
// only helps while the app's working directory is on the Cygwin root's drive.
//
// DANGER / OPT-IN: the C:\ɀ\c -> C:\ junction points at the WHOLE DRIVE. The
// icacls deny-List ACE is the ONLY thing stopping a junction-following
// recursive deleter (git clean, del /s, robocopy /MIR, rm -rf, Remove-Item
// -Recurse) from walking through it and destroying the entire C: drive. If that
// ACE is ever stripped or the junction is created without it, an ordinary
// recursive delete can nuke C:\. Because of that blast radius this whole feature
// is OPT-IN: it does nothing unless the installer is run with
// --enable-root-junctions (ENABLE_ROOT_JUNCTIONS). A user upgrades into it by
// re-running the installer with that flag; everything else works without it.

const DRIVE_ROOT = path.parse(CYGWIN_ROOT).root; // e.g. C:\
const DRIVE_LETTER = DRIVE_ROOT[0].toLowerCase();
const EVERYONE = '*S-1-1-0';

const JUNCTIONS = [
  {
    junction: path.join(DRIVE_ROOT, 'home'),
    target: path.join(CYGWIN_ROOT, 'home'),
  },
  {
    // C:\ɀ\c -> C:\ (the whole drive). Its parent C:\ɀ is a real subdirectory,
    // which lets createJunction pre-harden the parent and close the child's
    // unhardened window.
    junction: path.join(DRIVE_ROOT, CYGDRIVE_PREFIX, DRIVE_LETTER),
    target: DRIVE_ROOT,
  },
];

const normalize = (p) => path.resolve(p).toLowerCase();

// --- icacls deny-List helpers ------------------------------------------------

// Deny "List Folder" / "Read Data" (RD) for Everyone, the same hardening
// Windows applies to its own compat junctions like "C:\Documents and Settings".
// Deny only RD: denying Synchronize breaks ordinary handle opens (even lstat on
// the junction). Strip-then-add avoids stacking duplicate ACEs on re-runs (we
// don't parse icacls' localized text output, only its exit code).
async function denyListAce(target) {
  await execFileAsync('icacls', [target, '/remove:d', EVERYONE]);
  await execFileAsync('icacls', [target, '/deny', `${EVERYONE}:(RD)`]);
}

async function removeDenyAce(target) {
  await execFileAsync('icacls', [target, '/remove:d', EVERYONE]);
}

async function ensureDenyListAce(junction) {
  await denyListAce(junction);
  log.info(`Denied List Folder on ${junction} for Everyone`);
}

// Classify whether a path rejects enumeration the way a deny-List ACE makes it.
// Only EACCES/EPERM count as "blocked" (the access-denied signal); ENOENT or
// anything else is "error" -- a false-negative guard so a missing/broken path
// is never read as "protected".
async function enumerationState(dir) {
  try {
    await fs.readdir(dir);
    return 'allowed';
  } catch (err) {
    if (err.code === 'EACCES' || err.code === 'EPERM') return 'blocked';
    return 'error';
  }
}

// --- Capability proof --------------------------------------------------------

// PROVE, on THIS machine, that the deny-List ACE blocks both enumeration and
// enumeration-based recursive deletion through a junction -- before we form any
// real junction. Everything happens inside a throwaway scratch dir on the
// production volume (under CYGWIN_ROOT, so it's the same C: drive / NTFS
// semantics as the real junctions, and writable without writing at the drive
// root). The probe's own junction targets a dir *inside* the scratch tree, so
// it can never reach anything real. Returns true only if every assertion holds;
// any failure or throw -> false (caller then forms no junctions).
async function proveHardeningCapability() {
  const sentinelName = 'SENTINEL.txt';
  // Random nonce so a stale/leftover file can't masquerade as "survived".
  const nonce = `flying-z-${process.pid}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  let scratch;
  try {
    scratch = await fs.mkdtemp(
      path.join(CYGWIN_ROOT, 'flying-z-junction-probe-')
    );
  } catch (err) {
    log.warn(
      `Junction-hardening probe could not create a scratch dir under ${CYGWIN_ROOT}: ${err.message}`
    );
    return false;
  }

  const parent = path.join(scratch, 'parent'); // container for the delete test
  const linkA = path.join(parent, 'link'); // enumeration + deletion test link
  const linkB = path.join(scratch, 'teardown-link'); // uninstall-path test link
  const target = path.join(scratch, 'target');
  const sentinel = path.join(target, sentinelName);
  const sentinelThroughLink = path.join(linkA, sentinelName);

  try {
    await fs.mkdir(parent, { recursive: true });
    await fs.mkdir(target, { recursive: true });
    await fs.writeFile(sentinel, nonce);
    await fs.symlink(target, linkA, 'junction');

    // (1) Negative control: BEFORE hardening, enumeration must work and reveal
    // the sentinel, and the sentinel must read back as the nonce. Otherwise the
    // setup is invalid and a later "denied" would prove nothing.
    const preList = await fs.readdir(linkA).catch(() => null);
    if (!preList || !preList.includes(sentinelName)) {
      log.warn(
        'Junction-hardening probe: pre-harden enumeration did not work; cannot prove hardening.'
      );
      return false;
    }
    if ((await fs.readFile(sentinelThroughLink, 'utf8')) !== nonce) {
      log.warn(
        'Junction-hardening probe: pre-harden sentinel read mismatch; cannot prove hardening.'
      );
      return false;
    }

    // (2) Harden the link.
    await denyListAce(linkA);

    // (3) Positive enumeration test: readdir must be access-denied AND `dir`
    // must fail to list the sentinel.
    if ((await enumerationState(linkA)) !== 'blocked') {
      log.warn(
        'Junction-hardening probe: enumeration still allowed after deny ACE; NOT proven.'
      );
      return false;
    }
    try {
      const { stdout } = await execFileAsync('cmd', ['/c', 'dir', '/b', linkA]);
      // `dir` should have exited non-zero (access denied). It didn't, so it
      // enumerated the link -- hardening is not effective.
      log.warn(
        `Junction-hardening probe: \`dir\` did not fail on the hardened link${
          stdout.toLowerCase().includes(sentinelName.toLowerCase())
            ? ' (and revealed the sentinel)'
            : ''
        }; NOT proven.`
      );
      return false;
    } catch {
      // Expected: `dir` exits non-zero on access-denied.
    }

    // (4) Discriminating deletion test: aim enumeration-based recursive
    // deleters at the PARENT CONTAINER (never the link itself -- that would
    // just unlink the reparse point and prove nothing). They must enumerate
    // `parent`, find `link`, and try to recurse into it; the deny-List blocks
    // that, so the target's sentinel must survive. No backup-semantics tools
    // (robocopy /B), which bypass the DACL.
    await execFileAsync('cmd', [
      '/c',
      'del',
      '/s',
      '/q',
      path.join(parent, '*'),
    ]).catch(() => {});
    await execFileAsync('powershell', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      `Remove-Item -LiteralPath '${parent}' -Recurse -Force -ErrorAction SilentlyContinue`,
    ]).catch(() => {});
    if ((await fs.readFile(sentinel, 'utf8').catch(() => null)) !== nonce) {
      log.error(
        'Junction-hardening probe: a recursive delete reached through the junction; NOT proven.'
      );
      return false;
    }

    // (5) Teardown = proof of the uninstall path, on a fresh link to the
    // still-intact target: strip the ACE, rmdir the LINK, and confirm the link
    // is gone (ENOENT) but the target survives. (Done on linkB so the
    // destructive step (4) can't interfere.)
    await fs.symlink(target, linkB, 'junction');
    await denyListAce(linkB);
    await removeDenyAce(linkB);
    await fs.rmdir(linkB);
    const linkGone = await fs
      .lstat(linkB)
      .then(() => false)
      .catch((err) => err.code === 'ENOENT');
    const targetAlive =
      (await fs
        .lstat(target)
        .then((s) => s.isDirectory())
        .catch(() => false)) &&
      (await fs.readFile(sentinel, 'utf8').catch(() => null)) === nonce;
    if (!linkGone || !targetAlive) {
      log.error(
        'Junction-hardening probe: teardown removed the target rather than just the link; NOT proven.'
      );
      return false;
    }

    return true;
  } catch (err) {
    log.warn(`Junction-hardening probe failed: ${err.message}`);
    return false;
  } finally {
    // Strip any deny ACE left on the probe links so cleanup can remove them
    // (rmdir's emptiness check needs List), then remove the whole scratch tree.
    // Everything here lives under `scratch`; the probe junctions target a dir
    // inside it, so cleanup can never touch anything real.
    await removeDenyAce(linkA).catch(() => {});
    await removeDenyAce(linkB).catch(() => {});
    if (scratch) {
      await fs
        .rm(scratch, { recursive: true, force: true })
        .catch((err) =>
          log.warn(
            `Junction-hardening probe cleanup left residue at ${scratch}: ${err.message}`
          )
        );
    }
  }
}

// --- Stray-state reconcile ---------------------------------------------------

async function isReparsePoint(p) {
  // readlink succeeds only for symlinks/junctions; a plain dir/file throws.
  try {
    await fs.readlink(p);
    return true;
  } catch {
    return false;
  }
}

// Is `dir` purely empty mirror directories -- no files, no nested reparse
// points -- walking WITHOUT crossing any reparse point?
async function isEmptyMirrorTree(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isSymbolicLink()) return false; // foreign reparse point inside
    if (!e.isDirectory()) return false; // a real file -> not an empty mirror
    if (!(await isEmptyMirrorTree(path.join(dir, e.name)))) return false;
  }
  return true;
}

// Remove an empty mirror tree bottom-up with rmdir (which only removes empty
// dirs -- a safety net if a file appears after the check). NEVER fs.rm
// recursive/force here: it could cross a reparse point (the target is C:\).
async function removeEmptyMirrorTree(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && !e.isSymbolicLink()) {
      await removeEmptyMirrorTree(path.join(dir, e.name));
    }
  }
  await fs.rmdir(dir);
}

// A pre-existing stray PLAIN directory at the junction path (created by native
// apps under the old broken build, when /ɀ/c had no junction) would make
// createJunction's "already exists, not ours" branch skip creation forever.
// Clear it -- but only if safe: never touch a reparse point, and never delete
// real files (possible misplaced data); warn and leave those for the user.
async function reconcileStrayMirror(junction) {
  let stats;
  try {
    stats = await fs.lstat(junction);
  } catch {
    return; // missing -- nothing to reconcile
  }
  if (stats.isSymbolicLink() || (await isReparsePoint(junction))) {
    return; // a junction/symlink -- let the isOurs logic handle it
  }
  if (!stats.isDirectory()) {
    log.warn(`${junction} exists as a file; leaving it for manual review.`);
    return;
  }
  if (!(await isEmptyMirrorTree(junction))) {
    log.warn(
      `${junction} contains real files (possible misplaced data); leaving it for manual review. POSIX paths under /${CYGDRIVE_PREFIX} won't resolve until it's cleared.`
    );
    return;
  }
  await removeEmptyMirrorTree(junction);
  log.info(
    `Removed stray empty mirror at ${junction}; the junction will be (re)created.`
  );
}

// --- Junction creation -------------------------------------------------------

// Apply the deny-List ACE to a junction, then VERIFY enumeration is actually
// blocked. If hardening or verification fails, remove the junction. Fail-closed
// for ALL junctions -- an unverified junction is never left in place.
async function hardenAndVerify(junction, target) {
  try {
    await ensureDenyListAce(junction);
  } catch (err) {
    await failClosedRemove(junction, `could not harden it (${err.message})`);
    return;
  }
  if ((await enumerationState(junction)) !== 'blocked') {
    await failClosedRemove(
      junction,
      'enumeration is still allowed after hardening'
    );
    return;
  }
  log.success(`Junction ${junction} -> ${target} is hardened and verified.`);
}

async function failClosedRemove(junction, why) {
  log.error(`Fail-closed: ${junction} -- ${why}; removing it.`);
  try {
    await removeDenyAce(junction).catch(() => {});
    await fs.rmdir(junction);
    log.warn(
      `Removed unverified junction ${junction}. POSIX paths under it won't resolve in native apps.`
    );
  } catch (err) {
    log.error(
      `Could not remove unverified junction ${junction} (${err.message}). Remove it manually: icacls "${junction}" /remove:d ${EVERYONE} && rmdir "${junction}"`
    );
  }
}

async function createJunction({ junction, target }) {
  // Clear a stray plain-dir mirror that would otherwise block creation.
  await reconcileStrayMirror(junction);

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
        isOurs = normalize(await fs.readlink(junction)) === normalize(target);
      } catch {
        // Plain directory, not a reparse point.
      }
    }
    if (isOurs) {
      // Re-assert hardening + verification on an already-correct junction.
      await hardenAndVerify(junction, target);
      return;
    }
    log.warn(
      `${junction} already exists and is not a junction to ${target}; leaving it alone. POSIX paths under it won't resolve in native apps.`
    );
    return;
  }

  const parent = path.dirname(junction);
  const parentIsRealSubdir = parent !== path.parse(parent).root;

  if (parentIsRealSubdir) {
    // Drive-root-class junction (e.g. C:\ɀ\c): create and deny-List the PARENT
    // (C:\ɀ) first, and verify enumeration of the parent is blocked, BEFORE
    // creating the child. Then no enumerator can discover the child junction
    // during its brief unhardened window. (Deny-List on the parent doesn't stop
    // us creating the child: it denies List/Read, not AddSubdirectory.)
    await fs.mkdir(parent, { recursive: true });
    try {
      await denyListAce(parent);
    } catch (err) {
      log.error(
        `Could not harden parent ${parent} (${err.message}); not creating ${junction}. POSIX paths under it won't resolve.`
      );
      return;
    }
    if ((await enumerationState(parent)) !== 'blocked') {
      log.error(
        `Parent ${parent} is still enumerable after hardening; not creating ${junction} (fail-closed).`
      );
      return;
    }
  }

  await fs.symlink(target, junction, 'junction');
  log.info(`Created junction ${junction} -> ${target}`);

  await hardenAndVerify(junction, target);
}

// The cygdrive prefix is now CYGDRIVE_PREFIX (/ɀ), so an old C:\cygdrive\c
// junction from a previous install is dead weight. Remove it -- but ONLY if
// it's our old junction (a reparse point whose target is the drive root), never
// a user's real cygdrive. Its deny-List ACE blocks rmdir's emptiness check, so
// strip the ACE first.
async function removeLegacyCygdriveJunction() {
  const legacy = path.join(DRIVE_ROOT, 'cygdrive', DRIVE_LETTER);
  try {
    if (normalize(await fs.readlink(legacy)) !== normalize(DRIVE_ROOT)) return;
  } catch {
    return; // not a reparse point / doesn't exist -- nothing to remove
  }
  try {
    await removeDenyAce(legacy).catch(() => {});
    await fs.rmdir(legacy);
    log.info(`Removed legacy junction ${legacy}.`);
    // Remove the now-empty C:\cygdrive folder if it's a plain empty dir.
    const legacyParent = path.dirname(legacy);
    if (!(await isReparsePoint(legacyParent))) {
      await fs.rmdir(legacyParent).catch(() => {}); // ignore ENOTEMPTY/EPERM
    }
  } catch (err) {
    log.warn(
      `Could not remove legacy junction ${legacy} (${err.message}). Remove it manually: icacls "${legacy}" /remove:d ${EVERYONE} && rmdir "${legacy}"`
    );
  }
}

export async function createRootJunctions() {
  log.info('createRootJunctions');

  // OPT-IN GATE: forming a junction to the whole C: drive is dangerous (see the
  // DANGER note at the top of this file), so do nothing unless the user
  // explicitly asked for it by re-running the installer with
  // --enable-root-junctions.
  if (!ENABLE_ROOT_JUNCTIONS) {
    log.info(
      'Root junctions are opt-in and were not requested; skipping. Native-app POSIX path resolution stays off. Re-run the installer with --enable-root-junctions to enable it.'
    );
    return;
  }

  // HARD REQUIREMENT: never form a production junction unless we've proven, on
  // THIS machine, that the deny-List ACE blocks enumeration and
  // enumeration-based deletion through a junction.
  const hardeningProven = await proveHardeningCapability();
  if (!hardeningProven) {
    log.warn(
      'Could not prove junction hardening on this system; creating NO root junctions. Native-app POSIX path resolution is disabled (this is the safe outcome).'
    );
    return;
  }
  log.success('Junction hardening proven; creating root junctions.');

  await removeLegacyCygdriveJunction();

  for (const spec of JUNCTIONS) {
    await createJunction(spec);
  }
}

if (RUN_SOLO) createRootJunctions();
