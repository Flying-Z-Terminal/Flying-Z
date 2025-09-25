import { spawnSync } from 'child_process';

const SHARED_ARGS = [
  '/trustlevel:0x20000', // De-elevates the command
  'wt', // Run Windows Terminal, which defaults to Flying-Z
];

export async function runFlyingZTerminal() {
  // Run the command and capture output
  const { status } = spawnSync(
    'runas',
    [
      '/machine:amd64', // Helps with the `87: The parameter is incorrect` error on newer versions of Windows 11
      ...SHARED_ARGS,
    ],
    { shell: true }
  );

  if (status === 1) {
    // Run another command if there's any stdout
    spawnSync(
      'runas',
      [
        // '/machine:amd64', // Exclude /machine for Windows 11 21H2 because otherwise WT won't open
        ...SHARED_ARGS,
      ],
      { shell: true }
    );
  }
}
