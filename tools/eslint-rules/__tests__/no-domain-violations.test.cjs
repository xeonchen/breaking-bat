/**
 * Node.js tests for no-domain-violations ESLint rule
 * Using ESLint's built-in RuleTester
 */

const { RuleTester } = require('eslint');
const rule = require('../no-domain-violations.cjs');

// Configure the rule tester
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

console.log('🧪 Testing no-domain-violations ESLint rule...\n');

try {
  // Test 1: Valid cases
  console.log('📋 Test 1: Valid cases');
  ruleTester.run('no-domain-violations-valid', rule, {
    valid: [
      // ✅ Valid: Domain files importing within domain layer
      {
        filename: '/Users/project/src/domain/entities/Team.ts',
        code: `import { Player } from './Player';`,
      },
      {
        filename: '/Users/project/src/domain/services/ScoringService.ts',
        code: `import { Team } from '../entities/Team';`,
      },

      // ✅ Valid: Domain files importing external libraries
      {
        filename: '/Users/project/src/domain/entities/Game.ts',
        code: `import { v4 as uuid } from 'uuid';`,
      },

      // ✅ Valid: Non-domain files (should be ignored by this rule)
      {
        filename: '/Users/project/src/application/use-cases/CreateTeam.ts',
        code: `import { Team } from '@/domain/entities/Team';`,
      },

      // ✅ Valid: Domain test files (allowed by default)
      {
        filename: '/Users/project/src/domain/entities/Team.test.ts',
        code: `import { CreateTeamUseCase } from '@/application/use-cases/';`,
      },

      // ✅ Valid: Should not flag false positives
      {
        filename: '/Users/project/src/domain/entities/Team.ts',
        code: `import { something } from '../domain-application-utils';`, // Contains 'application' but not actual violation
      },
    ],
    invalid: [],
  });
  console.log('   ✅ Valid cases passed');

  // Test 2: Invalid cases
  console.log('📋 Test 2: Invalid cases');
  ruleTester.run('no-domain-violations-invalid', rule, {
    valid: [],
    invalid: [
      // ❌ Invalid: Domain importing from application layer
      {
        filename: '/Users/project/src/domain/entities/Team.ts',
        code: `import { CreateTeamUseCase } from '@/application/use-cases/CreateTeam';`,
        errors: [
          {
            messageId: 'domainViolation',
            data: {
              layer: 'application',
              importPath: '@/application/use-cases/CreateTeam',
            },
          },
        ],
      },

      // ❌ Invalid: Domain importing from infrastructure layer
      {
        filename: '/Users/project/src/domain/services/ScoringService.ts',
        code: `import { IndexedDBRepository } from '@/infrastructure/repositories/';`,
        errors: [
          {
            messageId: 'domainViolation',
            data: {
              layer: 'infrastructure',
              importPath: '@/infrastructure/repositories/',
            },
          },
        ],
      },

      // ❌ Invalid: Domain importing via relative paths
      {
        filename: '/Users/project/src/domain/entities/Player.ts',
        code: `import { TeamService } from '../application/services';`,
        errors: [
          {
            messageId: 'domainViolation',
            data: {
              layer: 'application',
              importPath: '../application/services',
            },
          },
        ],
      },

      // ❌ Invalid: Should catch exact matches
      {
        filename: '/Users/project/src/domain/entities/Team.ts',
        code: `import { UseCase } from '../application/';`, // Exact match with trailing slash
        errors: [
          {
            messageId: 'domainViolation',
          },
        ],
      },
    ],
  });
  console.log('   ✅ Invalid cases passed');

  // Test 3: Configuration options
  console.log('📋 Test 3: Configuration options');
  ruleTester.run('no-domain-violations-config', rule, {
    valid: [
      {
        filename: '/Users/project/src/domain/entities/Team.ts',
        code: `import { Player } from './Player';`,
        options: [{ allowTestFiles: false }],
      },
    ],
    invalid: [
      // Test files should now also be checked when allowTestFiles: false
      {
        filename: '/Users/project/src/domain/entities/Team.test.ts',
        code: `import { CreateTeamUseCase } from '@/application/use-cases/';`,
        options: [{ allowTestFiles: false }],
        errors: [
          {
            messageId: 'domainViolation',
            data: {
              layer: 'application',
              importPath: '@/application/use-cases/',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Configuration options passed');

  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('✅ no-domain-violations rule is working correctly');
} catch (error) {
  console.error('\n❌ TEST FAILED:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
