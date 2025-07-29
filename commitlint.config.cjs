module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Custom rules for our project
    'type-enum': [
      2,
      'always',
      [
        'build',    // Changes that affect the build system or external dependencies
        'chore',    // Other changes that don't modify src or test files
        'ci',       // Changes to CI configuration files and scripts
        'docs',     // Documentation only changes
        'feat',     // A new feature
        'fix',      // A bug fix
        'perf',     // A code change that improves performance
        'refactor', // A code change that neither fixes a bug nor adds a feature
        'revert',   // Reverts a previous commit
        'style',    // Changes that do not affect the meaning of the code
        'test',     // Adding missing tests or correcting existing tests
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        // Breaking-Bat specific scopes
        'team-management',
        'game-setup', 
        'live-scoring',
        'data-persistence',
        'ui',
        'theme',
        'pwa',
        'build',
        'deps',
        'docs',
        'tests',
        'domain',
        'application', 
        'infrastructure',
        'presentation',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
  },
};