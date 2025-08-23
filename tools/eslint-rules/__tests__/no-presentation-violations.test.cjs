/**
 * Node.js tests for no-presentation-violations ESLint rule
 * Using ESLint's built-in RuleTester
 */

const { RuleTester } = require('eslint');
const rule = require('../no-presentation-violations.cjs');

// Configure the rule tester
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

console.log('🧪 Testing no-presentation-violations ESLint rule...\n');

try {
  // Test 1: Valid cases
  console.log('📋 Test 1: Valid cases');
  ruleTester.run('no-presentation-violations-valid', rule, {
    valid: [
      // ✅ Valid: Presentation files importing from domain layer
      {
        filename:
          '/Users/project/src/presentation/components/TeamComponent.tsx',
        code: `import { Team } from '@/domain/entities/Team';`,
      },
      {
        filename: '/Users/project/src/presentation/mappers/PlayerMapper.ts',
        code: `import { Player, Position } from '@/domain/entities';`,
      },

      // ✅ Valid: Presentation files importing from application layer
      {
        filename: '/Users/project/src/presentation/stores/teamStore.ts',
        code: `import { CreateTeamUseCase } from '@/application/use-cases/CreateTeam';`,
      },
      {
        filename: '/Users/project/src/presentation/pages/GamePage.tsx',
        code: `import { GameDto } from '@/application/services/interfaces/IGameApplicationService';`,
      },

      // ✅ Valid: Presentation internal imports
      {
        filename: '/Users/project/src/presentation/components/PlayerCard.tsx',
        code: `import { TeamStore } from '@/presentation/stores/teamStore';`,
      },
      {
        filename: '/Users/project/src/presentation/hooks/useTeam.ts',
        code: `import { TeamMapper } from '../mappers/TeamMapper';`,
      },

      // ✅ Valid: UI framework imports are allowed (React, Vue, etc.)
      {
        filename: '/Users/project/src/presentation/components/Button.tsx',
        code: `import React from 'react';`,
      },
      {
        filename: '/Users/project/src/presentation/components/Modal.tsx',
        code: `import { useState, useEffect } from 'react';`,
      },

      // ✅ Valid: UI library imports are allowed
      {
        filename: '/Users/project/src/presentation/components/TeamForm.tsx',
        code: `import { Button, TextField } from '@mui/material';`,
      },

      // ✅ Valid: Non-presentation files (should be ignored)
      {
        filename: '/Users/project/src/domain/entities/Team.ts',
        code: `import { DatabaseConnection } from '@/infrastructure/database';`,
      },

      // ✅ Valid: Presentation test files (allowed by default)
      {
        filename:
          '/Users/project/src/presentation/components/TeamComponent.test.tsx',
        code: `import { IndexedDBRepository } from '@/infrastructure/repositories';`,
      },

      // ✅ Valid: Should not flag false positives
      {
        filename: '/Users/project/src/presentation/stores/gameStore.ts',
        code: `import { utils } from '../presentation-infrastructure-adapter';`, // Contains 'infrastructure' but not actual violation
      },
    ],
    invalid: [],
  });
  console.log('   ✅ Valid cases passed');

  // Test 2: Infrastructure layer violations
  console.log('📋 Test 2: Infrastructure layer violations');
  ruleTester.run('no-presentation-violations-infrastructure', rule, {
    valid: [],
    invalid: [
      // ❌ Invalid: Presentation importing from infrastructure layer
      {
        filename: '/Users/project/src/presentation/stores/gameStore.ts',
        code: `import { DomainAdapter } from '@/infrastructure/adapters/DomainAdapter';`,
        errors: [
          {
            messageId: 'presentationViolation',
            data: {
              layer: 'infrastructure',
              importPath: '@/infrastructure/adapters/DomainAdapter',
            },
          },
        ],
      },

      // ❌ Invalid: Presentation importing infrastructure repositories
      {
        filename: '/Users/project/src/presentation/pages/TeamPage.tsx',
        code: `import { IndexedDBTeamRepository } from '@/infrastructure/repositories/TeamRepository';`,
        errors: [
          {
            messageId: 'presentationViolation',
            data: {
              layer: 'infrastructure',
              importPath: '@/infrastructure/repositories/TeamRepository',
            },
          },
        ],
      },

      // ❌ Invalid: Presentation importing database connections
      {
        filename: '/Users/project/src/presentation/services/DataService.ts',
        code: `import { DatabaseConnection } from '@/infrastructure/database/Connection';`,
        errors: [
          {
            messageId: 'presentationViolation',
            data: {
              layer: 'infrastructure',
              importPath: '@/infrastructure/database/Connection',
            },
          },
        ],
      },

      // ❌ Invalid: Relative imports to infrastructure
      {
        filename: '/Users/project/src/presentation/components/TeamList.tsx',
        code: `import { DatabaseHelper } from '../infrastructure/helpers';`,
        errors: [
          {
            messageId: 'presentationViolation',
            data: {
              layer: 'infrastructure',
              importPath: '../infrastructure/helpers',
            },
          },
        ],
      },

      // ❌ Invalid: Going up multiple levels to infrastructure
      {
        filename: '/Users/project/src/presentation/nested/deep/Component.tsx',
        code: `import { RepositoryFactory } from '../../infrastructure/factories';`,
        errors: [
          {
            messageId: 'presentationViolation',
            data: {
              layer: 'infrastructure',
              importPath: '../../infrastructure/factories',
            },
          },
        ],
      },

      // ❌ Invalid: Direct src/ path imports to infrastructure
      {
        filename: '/Users/project/src/presentation/stores/dataStore.ts',
        code: `import { PersistenceAdapter } from 'src/infrastructure/adapters';`,
        errors: [
          {
            messageId: 'presentationViolation',
            data: {
              layer: 'infrastructure',
              importPath: 'src/infrastructure/adapters',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Infrastructure violations passed');

  // Test 3: Configuration options
  console.log('📋 Test 3: Configuration options');
  ruleTester.run('no-presentation-violations-config', rule, {
    valid: [
      {
        filename:
          '/Users/project/src/presentation/components/TeamComponent.tsx',
        code: `import { Team } from '@/domain/entities/Team';`,
        options: [{ allowTestFiles: false }],
      },
    ],
    invalid: [
      // Test files should now also be checked when allowTestFiles: false
      {
        filename:
          '/Users/project/src/presentation/components/TeamComponent.test.tsx',
        code: `import { IndexedDBRepository } from '@/infrastructure/repositories';`,
        options: [{ allowTestFiles: false }],
        errors: [
          {
            messageId: 'presentationViolation',
            data: {
              layer: 'infrastructure',
              importPath: '@/infrastructure/repositories',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Configuration options passed');

  // Test 4: Edge cases and false positives
  console.log('📋 Test 4: Edge cases and false positives');
  ruleTester.run('no-presentation-violations-edge-cases', rule, {
    valid: [
      // ✅ Should not flag false positives with similar names
      {
        filename: '/Users/project/src/presentation/components/DataGrid.tsx',
        code: `import { config } from '../presentation-infrastructure-config';`, // Contains 'infrastructure' but not actual violation
      },
      {
        filename: '/Users/project/src/presentation/hooks/useData.ts',
        code: `import { helper } from '../../some-infrastructure-utils';`, // Contains 'infrastructure' but not actual layer
      },

      // ✅ Valid application service imports
      {
        filename: '/Users/project/src/presentation/stores/gameStore.ts',
        code: `import { ApplicationFacade } from '@/application/facade/ApplicationFacade';`,
      },

      // ✅ Valid domain value object imports
      {
        filename: '/Users/project/src/presentation/mappers/PositionMapper.ts',
        code: `import { Position } from '@/domain/values/Position';`,
      },
    ],
    invalid: [],
  });
  console.log('   ✅ Edge cases passed');

  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('✅ no-presentation-violations rule is working correctly');
} catch (error) {
  console.error('\n❌ TEST FAILED:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
