import { addFlyingZToWindowsTerminalJSON } from './addFlyingZToWindowsTerminalJSON.mjs';
import { installOhMyZsh } from './installOhMyZsh.mjs';
import { downloadCygwin } from './downloadCygwin.mjs';
import { writeFlyingZInitFile } from './writeFlyingZInitFile.mjs';
import { runFlyingZInitFile } from './runFlyingZInitFile.mjs';
import { copyFlyingZThemeFile } from './copyFlyingZThemeFile.mjs';
import { installCygwin } from './installCygwin.mjs';
import { copyAdditionalAssets } from './copyAdditionalAssets.mjs';
import { installFonts } from './installFonts.mjs';
import { installZshPlugins } from './installZshPlugins.mjs';
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

    // 3. Run a ZSH terminal & install oh-my-zsh with =>      sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
    // Create the script for Flying-Z init
    await writeFlyingZInitFile();
    await installOhMyZsh();
    await copyFlyingZThemeFile();
    await runFlyingZInitFile();

    // 4. Install Caskaydia Cove Nerd Font for Powerline icons -- Do this before we run addFlyingZToWindowsTerminalJSON to avoid any possible error messages about font not existing
    await installFonts();

    // 5. Install to terminal
    await addFlyingZToWindowsTerminalJSON();

    // 6. Install additional assets and plugins
    await installZshPlugins();
    await copyAdditionalAssets();

    // 7. Install GCM
    await installGitCredentialManager();

    // 8. Install cygserver as a service and generate config file (this will need to be tested on a fresh machine) -- https://superuser.com/questions/738105/how-to-install-cygserver
    /* 

    Nice to haves:
      - Uninstaller
      - Option to not make Flying-Z the default/not integrate with contextMenu
      - A way to prevent history from being mangled on resize
      - Less slowness in ZSH itself
      - Auto-install Git-Credential-Manager

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
