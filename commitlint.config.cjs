module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // ✅ Standard conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'build', // Changes that affect the build system or external dependencies
        'chore', // Other changes that don't modify src or test files
        'ci', // Changes to CI configuration files and scripts
        'docs', // Documentation only changes
        'feat', // A new feature
        'fix', // A bug fix
        'perf', // A code change that improves performance
        'refactor', // A code change that neither fixes a bug nor adds a feature
        'revert', // Reverts a previous commit
        'style', // Changes that do not affect the meaning of the code
        'test', // Adding missing tests or correcting existing tests
      ],
    ],

    // ❌ Remove rigid scope enforcement - allow organic scope evolution
    'scope-enum': [0], // Disabled - allows any scope or no scope
    'scope-case': [2, 'always', 'lower-case'], // Light validation
    'scope-max-length': [2, 'always', 30],

    // ⚠️ Relax case enforcement (warning instead of error)
    'subject-case': [1, 'always', 'lower-case'], // Warning not error
    'subject-max-length': [2, 'always', 72], // Industry standard

    // ✅ Increase body line length for better descriptions
    'body-max-line-length': [2, 'always', 120], // More reasonable than 100

    // ➕ Add missing important formatting rules
    'header-max-length': [2, 'always', 100], // Prevent extremely long headers
    'body-leading-blank': [2, 'always'], // Blank line after subject for readability
    'footer-leading-blank': [2, 'always'], // Blank line before footers
    'subject-empty': [2, 'never'], // Require subject
    'type-empty': [2, 'never'], // Require type
  },
};
