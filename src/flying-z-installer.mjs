import { addFlyingZToWindowsTerminalJSON } from './addFlyingZToWindowsTerminalJSON.mjs';
import { copyZshConfig } from './copyZshConfig.mjs';
import { downloadCygwin } from './downloadCygwin.mjs';
import { writeFlyingZInitFile } from './writeFlyingZInitFile.mjs';
import { runFlyingZInitFile } from './runFlyingZInitFile.mjs';
import { copyFlyingZThemeFile } from './copyFlyingZThemeFile.mjs';
import { installCygwin } from './installCygwin.mjs';
import { createRootJunctions } from './createRootJunctions.mjs';
import { copyAdditionalAssets } from './copyAdditionalAssets.mjs';
import { installFonts } from './installFonts.mjs';
import { installZoxide } from './installZoxide.mjs';
import { ensureAdmin } from './ensureAdmin.mjs';
import { runFlyingZTerminal } from './runFlyingZTerminal.mjs';
import { installGitCredentialManager } from './installGitCredentialManager.mjs';
import { log } from './logger.mjs';

// @TODO -- Should probably call pauseUponFailure in uncaughtException and unhandledRejection
const pauseUponFailure = () => {
  console.log('\nPress any key to exit...');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', () => process.exit(0));
};

// No top level await because no simple & popular build systems support it (ESBuild and pkg both have problems)
(async () => {
  try {
    // 1. Ensure admin
    // Admin is required for cygwin and font installation, at minimum
    await ensureAdmin();

    // 2. Cygwin stuff
    await downloadCygwin(); // @TODO -- When this fails, we should not proceed to installCygwin, but removing its internal try/catch closes the executable upon failure. Why?
    await installCygwin();
    // Junction C:\home and C:\cygdrive\c at the drive root so POSIX paths
    // passed to native Windows apps (e.g. `subl ~/.zshrc`) resolve correctly.
    await createRootJunctions();

    // 3. Set up the ZSH terminal: write the launcher, install the Flying-Z
    //    .zshrc + theme, then run the init file once to seed the env.
    await writeFlyingZInitFile();
    await copyZshConfig();
    await copyFlyingZThemeFile();
    await runFlyingZInitFile();

    // 4. Install Caskaydia Cove Nerd Font for Powerline icons -- Do this before we run addFlyingZToWindowsTerminalJSON to avoid any possible error messages about font not existing
    await installFonts();

    // 5. Install to terminal
    await addFlyingZToWindowsTerminalJSON();

    // 6. Install additional assets and zoxide
    await installZoxide();
    await copyAdditionalAssets();

    // 7. Install GCM
    await installGitCredentialManager();

    // 8. Install cygserver as a service and generate config file (this will need to be tested on a fresh machine) -- https://superuser.com/questions/738105/how-to-install-cygserver
    /* 

    Nice to haves:
      - Uninstaller
      - Option to not make Flying-Z the default/not integrate with contextMenu
      - A way to prevent history from being mangled on resize

  */
    log.warn(
      'Logout/reboot required for Ctrl+Alt+T hotkey to work. Deleting desktop shortcut will break this feature.'
    );
    log.success('Flying-Z installed successfully. Have fun!');

    // 9. Launch Flying-Z
    await runFlyingZTerminal();
  } catch (err) {
    log.error(err);
    log.error(
      'Installation failed. Please ensure your firewall is not blocking the installer'
    );
    pauseUponFailure();
  }
})();
