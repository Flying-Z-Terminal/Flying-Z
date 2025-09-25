const exe = require('@angablue/exe');
const { version } = require('./package.json');
const path = require('path');

const buildPath = `./build/Flying-Z-Installer-${version}.exe`;

const build = async () => {
  console.log('Building the executable...');

  await exe({
    entry: './dist/dist.js',
    out: buildPath,
    pkg: ['--compress', 'Brotli', '--config', './package.json'],
    version: version,
    target: 'latest-win-x64',
    icon: './assets/icons/bold/icon.ico',
    executionLevel: 'requireAdministrator',
    properties: {
      FileDescription: 'Flying-Z Installer',
      ProductName: 'Flying-Z',
      LegalCopyright: '© 2024 Remie Smith',
      CompanyName: 'Remie Smith',
      OriginalFilename: `Flying-Z-${version}.exe`,
    },
  });
};

// Run the build
build().catch(console.error);
