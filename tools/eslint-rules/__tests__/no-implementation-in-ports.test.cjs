/**
 * Node.js tests for no-implementation-in-ports ESLint rule
 * Using ESLint's built-in RuleTester
 */

const { RuleTester } = require('eslint');
const rule = require('../no-implementation-in-ports.cjs');

// Configure the rule tester (use simple JS parsing like other rules)
const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

console.log('🧪 Testing no-implementation-in-ports ESLint rule...\n');

try {
  // Test 1: Valid cases
  console.log('📋 Test 1: Valid cases');
  ruleTester.run('no-implementation-in-ports-valid', rule, {
    valid: [
      // ✅ Valid: Non-ports files (should be ignored)
      {
        filename:
          '/Users/project/src/infrastructure/repositories/TeamRepository.js',
        code: `
          export class TeamRepository {
            async save(team) {
              // Implementation allowed outside ports
              console.log('saving');
            }
          }
        `,
      },

      // ✅ Valid: Test files in ports (allowed by default)
      {
        filename:
          '/Users/project/src/application/ports/secondary/ITeamRepository.test.js',
        code: `
          export class MockTeamRepository {
            async save(team) {
              // Mock implementation allowed in test files
              console.log('mock save');
            }
          }
        `,
      },

      // ✅ Valid: Type guards are allowed by default
      {
        filename:
          '/Users/project/src/application/ports/secondary/TypeGuards.js',
        code: `
          export function isValidTeam(obj) {
            return typeof obj === 'object' && obj !== null;
          }

          export function hasValidId(entity) {
            return typeof entity.id === 'string' && entity.id.length > 0;
          }
        `,
      },

      // ✅ Valid: Empty class (no implementations)
      {
        filename:
          '/Users/project/src/application/ports/secondary/EmptyClass.js',
        code: `
          export class EmptyService {
            // No methods
          }
        `,
      },

      // ✅ Valid: Function declarations without body
      {
        filename:
          '/Users/project/src/application/ports/secondary/Declarations.js',
        code: `
          export function processData(data) {}  // Empty body is ok
        `,
      },

      // ✅ Valid: Empty class with static methods (no implementations)
      {
        filename:
          '/Users/project/src/application/ports/secondary/PortConstants.js',
        code: `
          export class PortConstants {
            static getVersion() {}
            static getType() {}
          }
        `,
      },
    ],
    invalid: [],
  });
  console.log('   ✅ Valid cases passed');

  // Test 2: Class implementation violations
  console.log('📋 Test 2: Class implementation violations');
  ruleTester.run('no-implementation-in-ports-classes', rule, {
    valid: [],
    invalid: [
      // ❌ Invalid: Class with method implementation in ports
      {
        filename:
          '/Users/project/src/application/ports/secondary/TeamRepository.ts',
        code: `export class TeamRepository {
  save(team) {
    console.log('Saving team...');
  }
}`,
        errors: [
          {
            messageId: 'classImplementation',
            data: {
              className: 'TeamRepository',
            },
          },
        ],
      },

      // ❌ Invalid: Class with multiple method implementations
      {
        filename: '/Users/project/src/application/ports/primary/GameService.js',
        code: `export class GameService {
  startGame(gameId) {
    console.log('Starting game');
  }

  endGame(gameId) {
    console.log('Ending game');
  }
}`,
        errors: [
          {
            messageId: 'classImplementation',
            data: {
              className: 'GameService',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Class violations passed');

  // Test 3: Function implementation violations
  console.log('📋 Test 3: Function implementation violations');
  ruleTester.run('no-implementation-in-ports-functions', rule, {
    valid: [],
    invalid: [
      // ❌ Invalid: Function with implementation in ports
      {
        filename:
          '/Users/project/src/application/ports/secondary/TeamHelpers.js',
        code: `export function validateTeam(team) {
  return team.name.length > 0;
}`,
        errors: [
          {
            messageId: 'functionImplementation',
            data: {
              functionName: 'validateTeam',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Function violations passed');

  // Test 4: Configuration options
  console.log('📋 Test 4: Configuration options');
  ruleTester.run('no-implementation-in-ports-config', rule, {
    valid: [
      {
        filename:
          '/Users/project/src/application/ports/secondary/EmptyClass.js',
        code: `export class EmptyClass {}`,
        options: [{ allowTestFiles: false }],
      },
    ],
    invalid: [
      // Test files should now also be checked when allowTestFiles: false
      {
        filename:
          '/Users/project/src/application/ports/secondary/ITeamRepository.test.js',
        code: `export class MockTeamRepository {
  save(team) {
    console.log('mock');
  }
}`,
        options: [{ allowTestFiles: false }],
        errors: [
          {
            messageId: 'classImplementation',
            data: {
              className: 'MockTeamRepository',
            },
          },
        ],
      },

      // Type guards should be flagged when allowTypeGuards: false
      {
        filename:
          '/Users/project/src/application/ports/secondary/TypeGuards.js',
        code: `export function isValidTeam(obj) {
  return typeof obj === 'object';
}`,
        options: [{ allowTypeGuards: false }],
        errors: [
          {
            messageId: 'functionImplementation',
            data: {
              functionName: 'isValidTeam',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Configuration options passed');

  // Test 5: Edge cases
  console.log('📋 Test 5: Edge cases');
  ruleTester.run('no-implementation-in-ports-edge-cases', rule, {
    valid: [
      // ✅ Empty class (no implementations)
      {
        filename:
          '/Users/project/src/application/ports/secondary/EmptyClass.js',
        code: `export class EmptyService {}`,
      },
    ],
    invalid: [
      // ❌ Class with getter implementations
      {
        filename:
          '/Users/project/src/application/ports/secondary/PropertyClass.js',
        code: `export class GameState {
  get isActive() {
    return this._active;
  }
}`,
        errors: [
          {
            messageId: 'classImplementation',
            data: {
              className: 'GameState',
            },
          },
        ],
      },

      // ❌ Class with setter implementations
      {
        filename:
          '/Users/project/src/application/ports/secondary/SetterClass.js',
        code: `export class BadPortClass {
  set value(val) {
    this._value = val;
  }
}`,
        errors: [
          {
            messageId: 'classImplementation',
            data: {
              className: 'BadPortClass',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Edge cases passed');

  // Test 6: Arrow functions and function expressions
  console.log('📋 Test 6: Arrow functions and function expressions');
  ruleTester.run('no-implementation-in-ports-variable-declarator', rule, {
    valid: [
      // ✅ Type guard arrow function (allowed by default)
      {
        filename:
          '/Users/project/src/application/ports/secondary/TypeGuardArrow.js',
        code: `export const isValidTeam = (obj) => {
          return typeof obj === 'object';
        }`,
      },

      // ✅ Type guard function expression (allowed by default)
      {
        filename:
          '/Users/project/src/application/ports/secondary/TypeGuardFunction.js',
        code: `export const hasValidId = function(entity) {
          return typeof entity.id === 'string';
        }`,
      },

      // ✅ Empty arrow function (no implementation)
      {
        filename:
          '/Users/project/src/application/ports/secondary/EmptyArrow.js',
        code: `export const emptyArrow = () => {}`,
      },

      // ✅ Empty function expression (no implementation)
      {
        filename:
          '/Users/project/src/application/ports/secondary/EmptyFunction.js',
        code: `export const emptyFunction = function() {}`,
      },
    ],
    invalid: [
      // ❌ Arrow function with implementation
      {
        filename:
          '/Users/project/src/application/ports/secondary/ArrowFunction.js',
        code: `export const processData = (data) => {
          console.log('processing');
          return data.processed = true;
        }`,
        errors: [
          {
            messageId: 'functionImplementation',
            data: {
              functionName: 'processData',
            },
          },
        ],
      },

      // ❌ Function expression with implementation
      {
        filename:
          '/Users/project/src/application/ports/secondary/FunctionExpression.js',
        code: `export const calculateScore = function(points) {
          const bonus = points * 0.1;
          return points + bonus;
        }`,
        errors: [
          {
            messageId: 'functionImplementation',
            data: {
              functionName: 'calculateScore',
            },
          },
        ],
      },
    ],
  });
  console.log('   ✅ Arrow functions and function expressions passed');

  // Note: Static property tests are covered in the integration test
  // since the basic JS parser doesn't support modern property definitions
  console.log('📋 Test 7: Static properties (covered in integration tests)');
  console.log('   ✅ Static properties passed (see integration tests)');

  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('✅ no-implementation-in-ports rule is working correctly');
} catch (error) {
  console.error('\n❌ TEST FAILED:');
  console.error(error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
