import fs from 'fs';
import path from 'path';
import editJsonFile from 'edit-json-file';
import stripJsonComments from 'strip-json-comments';
import {
  WINDOWS_TERMINAL_JSON_PATH,
  RUN_SOLO,
  CYGWIN_ROOT,
  ICON_DESTINATION_FOLDER,
} from './constants.mjs';
import { log } from './logger.mjs';

const FLYING_Z_ZSH_GUID = '51da12c1-c268-4a92-b993-adcd9eca5a66';
const FLYING_Z_BASH_GUID = '51da12c1-c268-4a92-b993-adcd9eca5a67';
const FORMATTED_ZSH_GUID = `{${FLYING_Z_ZSH_GUID}}`;
const FORMATTED_BASH_GUID = `{${FLYING_Z_BASH_GUID}}`;

const sharedProfileOptions = {
  colorScheme: 'zenwritten_dark_flying_z',
  font: {
    face: 'CaskaydiaCove Nerd Font Mono',
    weight: 'light',
  },
  hidden: false,
  icon: path.join(ICON_DESTINATION_FOLDER, 'dark', 'icon.ico'),
  intenseTextStyle: 'bright',
};

const FLYING_Z_ENTRY = {
  ...sharedProfileOptions,
  guid: FORMATTED_ZSH_GUID,
  commandline: path.join(CYGWIN_ROOT, 'flying-z-init.bat'),
  name: 'Flying-Z',
};

const FLYING_Z_BASH_ENTRY = {
  ...sharedProfileOptions,
  guid: FORMATTED_BASH_GUID,
  commandline: path.join(CYGWIN_ROOT, 'Cygwin.bat'),
  name: 'Bash (via Flying-Z)',
};

const PROFILES = [FLYING_Z_ENTRY, FLYING_Z_BASH_ENTRY];

const ACTIONS = [
  {
    command: {
      action: 'splitPane',
      split: 'auto',
      splitMode: 'duplicate',
    },
    keys: 'alt+shift+d',
  },
  {
    command: {
      action: 'closeTab',
    },
    keys: 'ctrl+shift+w',
  },
  {
    command: {
      action: 'copy',
      singleLine: false,
    },
    keys: 'ctrl+shift+c',
  },
  {
    command: 'paste',
    keys: 'ctrl+shift+v',
  },
  {
    command: 'find',
    keys: 'ctrl+shift+f',
  },
];

const zenwritten_dark_flying_z = {
  background: '#191919',
  black: '#191919',
  blue: '#6099C0',
  brightBlack: '#3D3839',
  brightBlue: '#66B4E6',
  brightCyan: '#6CC5CF',
  brightGreen: '#ADD982',
  brightPurple: '#D68BC8',
  brightRed: '#FA8D9A',
  brightWhite: '#FFFFFF',
  brightYellow: '#E0936C',
  cursorColor: '#C9C9C9',
  cyan: '#7BC7D1',
  foreground: '#BBBBBB',
  green: '#AACC8A',
  name: 'zenwritten_dark_flying_z',
  purple: '#D18EC4',
  red: '#E67280',
  selectionBackground: '#9C9C9C',
  white: '#E0E0E0',
  yellow: '#CC8C6F',
};

const one_half_light_z = {
  background: '#FAFAFA',
  black: '#444444',
  blue: '#0184BC',
  brightBlack: '#4F525E',
  brightBlue: '#61AAFF',
  brightCyan: '#56B6C2',
  brightGreen: '#55BBAA',
  brightPurple: '#C678DD',
  brightRed: '#E06C75',
  brightWhite: '#FFFFFF',
  brightYellow: '#E5C07B',
  cursorColor: '#99AAAA',
  cyan: '#0997B3',
  foreground: '#383A47',
  green: '#50717F',
  name: 'one_half_light_z',
  purple: '#A626A4',
  red: '#E45649',
  selectionBackground: '#BFCEE2',
  white: '#FAFAFA',
  yellow: '#C18401',
};

const FLYING_Z_SCHEMES = [zenwritten_dark_flying_z, one_half_light_z];

function stripCommentsFromFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const strippedContent = stripJsonComments(fileContent);
  fs.writeFileSync(filePath, strippedContent, 'utf8');
}

export async function addFlyingZToWindowsTerminalJSON({
  setAsDefault = true,
  setDelimitter = true,
  overwriteActions = true,
  overwriteSchemes = false,
} = {}) {
  fs.copyFileSync(
    WINDOWS_TERMINAL_JSON_PATH,
    `${WINDOWS_TERMINAL_JSON_PATH}-${Date.now()}.pre-flying-z`
  );

  await stripCommentsFromFile(WINDOWS_TERMINAL_JSON_PATH); // edit-json-file fails on comments
  const wtJson = editJsonFile(WINDOWS_TERMINAL_JSON_PATH);

  log.warn(JSON.stringify(wtJson));
  log.warn(wtJson.data);

  const { profiles, schemes } = wtJson.data;

  PROFILES.forEach((profile) => {
    const existingProfileIndex = profiles.list.findIndex(
      (p) => p.guid === profile.guid
    );

    if (existingProfileIndex === -1) {
      wtJson.append('profiles.list', profile);
    }
  });

  if (setAsDefault) wtJson.set('defaultProfile', FORMATTED_ZSH_GUID);

  //  Set selection wordDelimiters to only spaces, no other characters
  if (setDelimitter) wtJson.set('wordDelimiters', ' ');

  // Install terminal hotkeys
  if (overwriteActions) wtJson.set('actions', ACTIONS);

  FLYING_Z_SCHEMES.forEach((fzScheme) => {
    // Install terminal theme
    const existingScheme = schemes.find(
      (scheme) => scheme.name === fzScheme.name
    );

    if (overwriteSchemes || !existingScheme) {
      wtJson.append('schemes', fzScheme);
    }
  });

  wtJson.save();
}

if (RUN_SOLO) addFlyingZToWindowsTerminalJSON();
