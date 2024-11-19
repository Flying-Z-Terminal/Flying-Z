module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:unicorn/recommended',
    'plugin:sonarjs/recommended',
    'prettier',
  ],
  plugins: [
    // 'import',
    'unicorn',
    'sonarjs',
    'prettier',
  ],
  rules: {
    'unicorn/expiring-todo-comments': 'off', // Crashes with "Error: Failed to load plugin 'unicorn' declared in '.eslintrc.js': ENOENT: no such file or directory, open 'C:\Projects\flying-z\node_modules\read-pkg-up\node_modules\p-limit\index.js'"
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
      },
    ],
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'default-case': ['error', { commentPattern: '^no-default-case$' }],
    'class-methods-use-this': 'warn',
    'no-unneeded-ternary': 'warn',
    'require-atomic-updates': 'warn',

    // UNICORN
    'unicorn/no-this-assignment': 'error',
    // NOTE: catch-error-name is similar to prevent-abbreviations, but only for catch blocks -- https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1497
    'unicorn/catch-error-name': [
      'error',
      {
        name: 'err',
      },
    ],
    'unicorn/prevent-abbreviations': [
      'off',
      {
        extendDefaultReplacements: false,
        replacements: {},
      },
    ],
    'unicorn/expiring-todo-comments': 'off',
    'unicorn/no-process-exit': 'off',
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/no-null': 'off',
    'unicorn/no-array-reduce': 'off',
    'unicorn/prefer-spread': 'off', // NOTE: Must be set to 'off' because it tries to change someString.concat(otherString) to use spread operator, which is nonsensical. See: https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1064
    'unicorn/no-array-for-each': 'off', // IMPORTANT: Might break any forEach which relies on index `texts.forEach((t, i))` is changed to `for (const [i, t] of texts.entries())` (Or maybe I'm wrong - but in any event it's less readable: https://alligator.io/js/foreach-vs-for-loops#3-foreach-is-easier-to-read)
    'unicorn/prefer-module': 'off', // @TODO -- Eventually, turn this on
    'unicorn/prefer-add-event-listener': 'warn',
    'unicorn/prefer-string-replace-all': 'warn',
    'unicorn/prefer-at': 'warn',
    'unicorn/better-regex': [
      //  IMPORTANT: BETTER-REGEX RULE BREAKS CODE -- https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1505
      'off', // NOTE: 'off' because it conflicts with regexp/strict -- https://github.com/sindresorhus/eslint-plugin-unicorn/issues/1500
      {
        sortCharacterClasses: false,
      },
    ],
  },
  reportUnusedDisableDirectives: true,
};
