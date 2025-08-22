/**
 * Node.js tests for no-application-violations ESLint rule
 * Using ESLint's built-in RuleTester
 */

const { RuleTester } = require('eslint');
const rule = require('../no-application-violations.cjs');

// Configure the rule tester
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

console.log('🧪 Testing no-application-violations ESLint rule...\n');

try {
  // Test 1: Valid cases
  console.log('📋 Test 1: Valid cases');
  ruleTester.run('no-application-violations-valid', rule, {
    valid: [
      // ✅ Valid: Application files importing from domain layer
      {
        filename: '/Users/project/src/application/use-cases/CreateTeam.ts',
        code: `import { Team } from '@/domain/entities/Team';`,
      },
      {
        filename: '/Users/project/src/application/services/TeamService.ts',
        code: `import { Player } from '@/domain/entities';`,
      },

      // ✅ Valid: Application internal imports
      {
        filename: '/Users/project/src/application/services/TeamService.ts',
        code: `import { Result } from '@/application/common/Result';`,
      },
      {
        filename: '/Users/project/src/application/use-cases/CreateTeam.ts',
        code: `import { BaseUseCase } from '../common/BaseUseCase';`,
      },

      // ✅ Valid: Utility libraries are allowed
      {
        filename: '/Users/project/src/application/services/IdService.ts',
        code: `import { v4 as uuid } from 'uuid';`,
      },
      {
        filename: '/Users/project/src/application/validation/Validator.ts',
        code: `import { z } from 'zod';`,
      },

      // ✅ Valid: Non-application files (should be ignored)
      {
        filename: '/Users/project/src/domain/entities/Team.ts',
        code: `import React from 'react';`,
      },

      // ✅ Valid: Application test files (allowed by default)
      {
        filename: '/Users/project/src/application/use-cases/CreateTeam.test.ts',
        code: `import { TeamComponent } from '@/presentation/components';`,
      },

      // ✅ Valid: Node.js built-ins are allowed
      {
        filename: '/Users/project/src/application/utils/FileUtil.ts',
        code: `import fs from 'fs';`,
      },
    ],
    invalid: [],
  });
  console.log('   ✅ Valid cases passed');

  // Test 2: Architecture violations
  console.log('📋 Test 2: Architecture violations');
  ruleTester.run('no-application-violations-architecture', rule, {
    valid: [],
    invalid: [
      // ❌ Invalid: Application importing from infrastructure layer
      {
        filename: '/Users/project/src/application/use-cases/CreateTeam.ts',
        code: `import { IndexedDBRepository } from '@/infrastructure/repositories';`,
        errors: [
          {
            messageId: 'applicationViolation',
            data: {
              layer: 'infrastructure',
              importPath: '@/infrastructure/repositories',
            },
          },
        ],
      },

      // ❌ Invalid: Application importing from presentation layer
      {
        filename: '/Users/project/src/application/services/TeamService.ts',
        code: `import { TeamComponent } from '@/presentation/components/Team';`,
        errors: [
          {
            messageId: 'applicationViolation',
            data: {
              layer: 'presentation',
              importPath: '@/presentation/components/Team',
            },
          },
        ],
      },

      // ❌ Invalid: Relative imports to infrastructure
      {
        filename: '/Users/project/src/application/use-cases/LoadData.ts',
        code: `import { DatabaseClient } from '../infrastructure/database';`,
        errors: [
          {
            messageId: 'applicationViolation',
            data: {
              layer: 'infrastructure',
              importPath: '../infrastructure/database',
            },
          },
        ],
      },

      // ❌ Invalid: Going up multiple levels to infrastructure
      {
        filename: '/Users/project/src/application/nested/deep/UseCase.ts',
        code: `import { ApiClient } from '../../infrastructure/api';`,
        errors: [
          {
            messageId: 'applicationViolation',
            data: {
              layer: 'infrastructure',
              importPath: '../../infrastructure/api',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Architecture violations passed');

  // Test 3: Framework violations
  console.log('📋 Test 3: Framework violations');
  ruleTester.run('no-application-violations-framework', rule, {
    valid: [],
    invalid: [
      // ❌ Invalid: React imports
      {
        filename: '/Users/project/src/application/use-cases/CreateTeam.ts',
        code: `import React from 'react';`,
        errors: [
          {
            messageId: 'frameworkViolation',
            data: {
              importPath: 'react',
            },
          },
        ],
      },

      // ❌ Invalid: Vue imports
      {
        filename: '/Users/project/src/application/services/TeamService.ts',
        code: `import { ref } from 'vue';`,
        errors: [
          {
            messageId: 'frameworkViolation',
            data: {
              importPath: 'vue',
            },
          },
        ],
      },

      // ❌ Invalid: Express imports
      {
        filename: '/Users/project/src/application/use-cases/ApiHandler.ts',
        code: `import express from 'express';`,
        errors: [
          {
            messageId: 'frameworkViolation',
            data: {
              importPath: 'express',
            },
          },
        ],
      },

      // ❌ Invalid: UI library imports
      {
        filename: '/Users/project/src/application/services/UIService.ts',
        code: `import { Button } from '@mui/material';`,
        errors: [
          {
            messageId: 'frameworkViolation',
            data: {
              importPath: '@mui/material',
            },
          },
        ],
      },

      // ❌ Invalid: HTTP client in application layer
      {
        filename: '/Users/project/src/application/services/DataService.ts',
        code: `import axios from 'axios';`,
        errors: [
          {
            messageId: 'frameworkViolation',
            data: {
              importPath: 'axios',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Framework violations passed');

  // Test 4: Configuration options
  console.log('📋 Test 4: Configuration options');
  ruleTester.run('no-application-violations-config', rule, {
    valid: [
      {
        filename: '/Users/project/src/application/use-cases/CreateTeam.ts',
        code: `import { Team } from '@/domain/entities/Team';`,
        options: [{ allowTestFiles: false }],
      },
    ],
    invalid: [
      // Test files should now also be checked when allowTestFiles: false
      {
        filename: '/Users/project/src/application/use-cases/CreateTeam.test.ts',
        code: `import { TeamComponent } from '@/presentation/components';`,
        options: [{ allowTestFiles: false }],
        errors: [
          {
            messageId: 'applicationViolation',
            data: {
              layer: 'presentation',
              importPath: '@/presentation/components',
            },
          },
        ],
      },

      // Framework violations should also apply to test files when enabled
      {
        filename: '/Users/project/src/application/services/TeamService.spec.ts',
        code: `import React from 'react';`,
        options: [{ allowTestFiles: false }],
        errors: [
          {
            messageId: 'frameworkViolation',
            data: {
              importPath: 'react',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Configuration options passed');

  // Test 5: Edge cases and false positives
  console.log('📋 Test 5: Edge cases and false positives');
  ruleTester.run('no-application-violations-edge-cases', rule, {
    valid: [
      // ✅ Should not flag false positives with similar names
      {
        filename: '/Users/project/src/application/use-cases/TeamUseCase.ts',
        code: `import { utils } from '../application-infrastructure-bridge';`, // Contains 'infrastructure' but not actual violation
      },
      {
        filename: '/Users/project/src/application/services/DataService.ts',
        code: `import { helper } from '../../some-presentation-utils';`, // Contains 'presentation' but not actual layer
      },

      // ✅ Valid external libraries that sound like frameworks but are allowed
      {
        filename:
          '/Users/project/src/application/validation/SchemaValidator.ts',
        code: `import { validate } from 'class-validator';`,
      },
    ],
    invalid: [],
  });
  console.log('   ✅ Edge cases passed');

  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('✅ no-application-violations rule is working correctly');
} catch (error) {
  console.error('\n❌ TEST FAILED:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
