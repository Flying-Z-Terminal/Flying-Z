import path from 'path';
import os from 'os';

const isPackaged = process.pkg !== undefined;

// IMPORTANT: Casing of Flying-Z here must match the casing of the name in package.json AND the casing of the repo's root directory
const root = isPackaged ? 'C:\\snapshot\\Flying-Z' : process.cwd();

export const RUN_SOLO = process.argv.includes('--solo');

export const ASSETS_PATH = path.join(root, 'assets');
export const INCLUDES_PATH = path.join(root, 'includes');

export const CYGWIN_ROOT = 'C:\\Flying-Z';
export const BASH_LAUNCHER_BATCH_FILE = path.join(CYGWIN_ROOT, 'Cygwin.bat');
export const USER_CYGWIN_HOME = path.join(
  CYGWIN_ROOT,
  'home',
  process.env.USERNAME
);
export const USER_WINDOWS_HOME = process.env.USERPROFILE;
export const DOWNLOAD_PATH = path.join(
  os.tmpdir(),
  'flying-z-cygwin-download/'
);
export const INIT_FILE_NAME = 'flying-z-init.bat';
export const INIT_FILES_SOURCE_FOLDER = path.join(
  INCLUDES_PATH,
  'init-scripts'
);
export const INIT_FILE_SOURCE_PATH = path.join(
  INIT_FILES_SOURCE_FOLDER,
  INIT_FILE_NAME
);
export const INIT_FILE_DESTINATION_PATH = path.join(
  CYGWIN_ROOT,
  INIT_FILE_NAME
);

export const CYGWIN_INSTALLER_NAME = 'setup-x86_64.exe';
export const CYGWIN_INSTALLER_PATH = `${DOWNLOAD_PATH}/${CYGWIN_INSTALLER_NAME}`;
export const CYGWIN_PACKAGE_NAMES =
  '_autorebase,base-cygwin,base-files,bash-completion,bind-utils,bzip2,chere,curl,fzf-zsh,git,gnupg,nano,openssh,ping,procps-ng,subversion,unzip,vim,vim-minimal,wget,whois,zip,zsf-zsh-completion,zsh';
export const CYGWIN_INSTALLER_ARGS = `--quiet-mode --only-site --site https://mirrors.rit.edu/cygwin/ --arch x64 --root "${CYGWIN_ROOT}" --no-shortcuts --no-startmenu --no-desktop --packages ${CYGWIN_PACKAGE_NAMES}`; // TODO: Make installer truly silent https://silentinstallhq.com/cygwin-silent-install-how-to-guide/
export const WINDOWS_TERMINAL_JSON_PATH = path.join(
  process.env.LOCALAPPDATA,
  'Packages',
  'Microsoft.WindowsTerminal_8wekyb3d8bbwe',
  'LocalState',
  'settings.json'
);
export const DEFAULT_ZSH_RC_PATH = path.join(ASSETS_PATH, 'default.zshrc');
export const THEME_FILE_NAME = 'hapin-z.zsh-theme';

export const COPIED_ASSETS_PATH = path.join(CYGWIN_ROOT, 'assets');
export const ICON_DESTINATION_FOLDER = path.join(COPIED_ASSETS_PATH, 'icons');

export const CUSTOM_SCRIPTS_SOURCE_FOLDER = path.join(
  INCLUDES_PATH,
  'custom-scripts'
);
