/**
 * Node.js tests for no-infrastructure-violations ESLint rule
 * Using ESLint's built-in RuleTester
 */

const { RuleTester } = require('eslint');
const rule = require('../no-infrastructure-violations.cjs');

// Configure the rule tester
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

console.log('🧪 Testing no-infrastructure-violations ESLint rule...\n');

try {
  // Test 1: Valid cases
  console.log('📋 Test 1: Valid cases');
  ruleTester.run('no-infrastructure-violations-valid', rule, {
    valid: [
      // ✅ Valid: Infrastructure files importing from domain layer
      {
        filename:
          '/Users/project/src/infrastructure/repositories/TeamRepository.ts',
        code: `import { Team } from '@/domain/entities/Team';`,
      },
      {
        filename:
          '/Users/project/src/infrastructure/services/DatabaseService.ts',
        code: `import { Player } from '@/domain/entities';`,
      },

      // ✅ Valid: Infrastructure files importing from application ports
      {
        filename:
          '/Users/project/src/infrastructure/repositories/GameRepository.ts',
        code: `import { IGameRepository } from '@/application/ports/secondary/IGameRepository';`,
      },
      {
        filename: '/Users/project/src/infrastructure/adapters/TeamAdapter.ts',
        code: `import { TeamDto } from '@/application/services/interfaces/ITeamApplicationService';`,
      },

      // ✅ Valid: Infrastructure internal imports
      {
        filename: '/Users/project/src/infrastructure/database/Connection.ts',
        code: `import { DatabaseConfig } from '@/infrastructure/config/DatabaseConfig';`,
      },
      {
        filename:
          '/Users/project/src/infrastructure/repositories/BaseRepository.ts',
        code: `import { Connection } from '../database/Connection';`,
      },

      // ✅ Valid: External libraries are allowed
      {
        filename:
          '/Users/project/src/infrastructure/database/IndexedDBService.ts',
        code: `import { openDB } from 'idb';`,
      },

      // ✅ Valid: Non-infrastructure files (should be ignored)
      {
        filename: '/Users/project/src/domain/entities/Team.ts',
        code: `import { TeamComponent } from '@/presentation/components';`,
      },

      // ✅ Valid: Infrastructure test files (allowed by default)
      {
        filename:
          '/Users/project/src/infrastructure/repositories/TeamRepository.test.ts',
        code: `import { TeamComponent } from '@/presentation/components';`,
      },

      // ✅ Valid: Node.js built-ins and utilities are allowed
      {
        filename: '/Users/project/src/infrastructure/utils/FileUtil.ts',
        code: `import fs from 'fs';`,
      },

      // ✅ Valid: Should not flag false positives
      {
        filename: '/Users/project/src/infrastructure/services/DataService.ts',
        code: `import { utils } from '../infrastructure-presentation-bridge';`, // Contains 'presentation' but not actual violation
      },
    ],
    invalid: [],
  });
  console.log('   ✅ Valid cases passed');

  // Test 2: Presentation layer violations
  console.log('📋 Test 2: Presentation layer violations');
  ruleTester.run('no-infrastructure-violations-presentation', rule, {
    valid: [],
    invalid: [
      // ❌ Invalid: Infrastructure importing from presentation layer
      {
        filename: '/Users/project/src/infrastructure/bootstrap/AppBootstrap.ts',
        code: `import { TeamStore } from '@/presentation/stores/teamStore';`,
        errors: [
          {
            messageId: 'infrastructureViolation',
            data: {
              layer: 'presentation',
              importPath: '@/presentation/stores/teamStore',
            },
          },
        ],
      },

      // ❌ Invalid: Infrastructure importing presentation components
      {
        filename: '/Users/project/src/infrastructure/adapters/UIAdapter.ts',
        code: `import { TeamComponent } from '@/presentation/components/Team';`,
        errors: [
          {
            messageId: 'infrastructureViolation',
            data: {
              layer: 'presentation',
              importPath: '@/presentation/components/Team',
            },
          },
        ],
      },

      // ❌ Invalid: Relative imports to presentation
      {
        filename:
          '/Users/project/src/infrastructure/services/HydrationService.ts',
        code: `import { PresentationTypes } from '../presentation/types';`,
        errors: [
          {
            messageId: 'infrastructureViolation',
            data: {
              layer: 'presentation',
              importPath: '../presentation/types',
            },
          },
        ],
      },

      // ❌ Invalid: Going up multiple levels to presentation
      {
        filename: '/Users/project/src/infrastructure/nested/deep/Repository.ts',
        code: `import { UIHelpers } from '../../presentation/helpers';`,
        errors: [
          {
            messageId: 'infrastructureViolation',
            data: {
              layer: 'presentation',
              importPath: '../../presentation/helpers',
            },
          },
        ],
      },

      // ❌ Invalid: Direct src/ path imports to presentation
      {
        filename: '/Users/project/src/infrastructure/services/DataService.ts',
        code: `import { PresentationUtils } from 'src/presentation/utils';`,
        errors: [
          {
            messageId: 'infrastructureViolation',
            data: {
              layer: 'presentation',
              importPath: 'src/presentation/utils',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Presentation violations passed');

  // Test 3: Configuration options
  console.log('📋 Test 3: Configuration options');
  ruleTester.run('no-infrastructure-violations-config', rule, {
    valid: [
      {
        filename:
          '/Users/project/src/infrastructure/repositories/TeamRepository.ts',
        code: `import { Team } from '@/domain/entities/Team';`,
        options: [{ allowTestFiles: false }],
      },
    ],
    invalid: [
      // Test files should now also be checked when allowTestFiles: false
      {
        filename:
          '/Users/project/src/infrastructure/repositories/TeamRepository.test.ts',
        code: `import { TeamComponent } from '@/presentation/components';`,
        options: [{ allowTestFiles: false }],
        errors: [
          {
            messageId: 'infrastructureViolation',
            data: {
              layer: 'presentation',
              importPath: '@/presentation/components',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Configuration options passed');

  // Test 4: Edge cases and false positives
  console.log('📋 Test 4: Edge cases and false positives');
  ruleTester.run('no-infrastructure-violations-edge-cases', rule, {
    valid: [
      // ✅ Should not flag false positives with similar names
      {
        filename:
          '/Users/project/src/infrastructure/adapters/ServiceAdapter.ts',
        code: `import { utils } from '../infrastructure-presentation-utils';`, // Contains 'presentation' but not actual violation
      },
      {
        filename: '/Users/project/src/infrastructure/database/Connection.ts',
        code: `import { config } from '../../some-presentation-config';`, // Contains 'presentation' but not actual layer
      },

      // ✅ Valid application port imports
      {
        filename:
          '/Users/project/src/infrastructure/repositories/GameRepository.ts',
        code: `import { IGamePersistencePort } from '@/application/ports/secondary/IPersistencePorts';`,
      },
    ],
    invalid: [],
  });
  console.log('   ✅ Edge cases passed');

  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('✅ no-infrastructure-violations rule is working correctly');
} catch (error) {
  console.error('\n❌ TEST FAILED:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
