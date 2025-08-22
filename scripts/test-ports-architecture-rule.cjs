#!/usr/bin/env node
/**
 * Integration test script for ports architecture ESLint rule
 * Creates test violation files and verifies they are detected correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testFiles = [
  {
    path: 'src/application/ports/secondary/test-violation-class-implementation.ts',
    content: `export class TeamRepository {
  async save(team: Team): Promise<void> {
    console.log('Saving team');
    // Implementation not allowed in ports
  }
}`,
    expectedError: 'class implementations',
  },
  {
    path: 'src/application/ports/primary/test-violation-function-implementation.ts',
    content: `export function validateTeam(team: Team): boolean {
  return team.name.length > 0;
}`,
    expectedError: 'function implementations',
  },
  {
    path: 'src/application/ports/secondary/test-violation-method-implementation.ts',
    content: `export class GameService {
  startGame(gameId: string): void {
    console.log('Starting game');
  }

  endGame(gameId: string): void {
    console.log('Ending game');
  }
}`,
    expectedError: 'class implementations',
  },
  {
    path: 'src/application/ports/primary/test-violation-concrete-function.ts',
    content: `export function processGameData(data: GameData): ProcessedData {
  const processed = {
    ...data,
    processed: true,
    timestamp: Date.now()
  };
  return processed;
}`,
    expectedError: 'function implementations',
  },
  {
    path: 'src/application/ports/secondary/test-violation-helper-functions.ts',
    content: `export function calculateTeamStats(games: Game[]): TeamStats {
  return games.reduce((stats, game) => {
    stats.wins += game.isWin ? 1 : 0;
    stats.losses += game.isWin ? 0 : 1;
    return stats;
  }, { wins: 0, losses: 0 });
}

export function formatPlayerName(firstName: string, lastName: string): string {
  return \`\${firstName} \${lastName}\`;
}`,
    expectedError: 'function implementations',
  },
  {
    path: 'src/application/ports/secondary/test-violation-instance-properties.ts',
    content: `export class BadPortClass {
  // Instance properties with initializers should be flagged
  defaultValue = 'something';
  isEnabled = true;

  // Static properties are now allowed (regardless of naming)
  static counter = 0;
  static currentState = 'initial';
  static VERSION = '1.0';
  static readonly CONFIG = { debug: true };
}`,
    expectedError: 'class implementations',
  },
  {
    path: 'src/application/ports/primary/test-violation-getters-setters.ts',
    content: `export class StateManager {
  private _value: string = '';

  get value(): string {
    return this._value;
  }

  set value(val: string) {
    this._value = val;
  }
}`,
    expectedError: 'class implementations',
  },
  {
    path: 'src/application/ports/primary/test-violation-arrow-functions.ts',
    content: `// Arrow function implementations should be flagged
export const processData = (data: any) => {
  return data.processed = true;
};

export const validateInput = (input: string) => {
  console.log('validating input');
  return input.length > 0;
};`,
    expectedError: 'function implementations',
  },
  {
    path: 'src/application/ports/secondary/test-violation-function-expressions.ts',
    content: `// Function expression implementations should be flagged
export const calculateScore = function(points: number): number {
  const bonus = points * 0.1;
  return points + bonus;
};

export const formatResult = function(result: any) {
  return JSON.stringify(result);
};`,
    expectedError: 'function implementations',
  },
];

const falsePositiveTests = [
  {
    path: 'src/application/ports/secondary/test-false-positive-interfaces.ts',
    content: `export interface ITeamRepository {
  save(team: Team): Promise<void>;
  findById(id: string): Promise<Team | null>;
}

export interface IGameService {
  startGame(gameId: string): Promise<void>;
  endGame(gameId: string): Promise<void>;
}

export type CreateTeamCommand = {
  name: string;
  players: Player[];
};`,
    shouldPass: true,
  },
  {
    path: 'src/application/ports/secondary/test-false-positive-type-guards.ts',
    content: `export function isValidTeam(obj: unknown): obj is Team {
  return typeof obj === 'object' && obj !== null;
}

export function hasValidId(entity: { id?: string }): boolean {
  return typeof entity.id === 'string' && entity.id.length > 0;
}`,
    shouldPass: true,
  },
  {
    path: 'src/application/ports/primary/test-false-positive-enums.ts',
    content: `export enum GameStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export enum PlayerPosition {
  PITCHER = 'pitcher',
  CATCHER = 'catcher',
  FIRST_BASE = 'first_base'
}`,
    shouldPass: true,
  },
  {
    path: 'src/application/ports/secondary/test-false-positive-static-constants.ts',
    content: `export class PortConstants {
  static readonly VERSION = '1.0.0';
  static readonly TYPE = 'interface';
  static readonly MAX_RETRIES = 3;
  static readonly DEFAULT_TIMEOUT = 5000;
}

export class ApiConstants {
  // All static properties are allowed regardless of naming convention
  static version = 'v1';
  static BASE_URL = 'https://api.example.com';
  static timeout = 30000;
  static debug_mode = true;
  static CONFIG_OBJECT = { key: 'value' };
}`,
    shouldPass: true,
  },
  {
    path: 'src/application/ports/primary/test-false-positive-arrow-type-guards.ts',
    content: `// Type guard arrow functions should be allowed
export const isValidGame = (obj: unknown): obj is Game => {
  return typeof obj === 'object' && obj !== null;
};

export const hasTeamData = (data: any): boolean => {
  return data && typeof data.team === 'string';
};

// Empty arrow functions should be allowed
export const emptyArrow = () => {};
export const emptyArrowWithReturn = (): void => {};`,
    shouldPass: true,
  },
  {
    path: 'src/application/ports/secondary/test-false-positive-function-expressions.ts',
    content: `// Type guard function expressions should be allowed
export const isValidPlayer = function(obj: unknown): obj is Player {
  return typeof obj === 'object' && obj !== null;
};

export const canPlay = function(player: any): boolean {
  return player && player.isActive;
};

// Empty function expressions should be allowed
export const emptyFunctionExpression = function() {};`,
    shouldPass: true,
  },
];

console.log('🧪 Testing Ports Architecture ESLint Rule');
console.log('===========================================\n');

let allTestsPassed = true;

// Test 1: Create violation files and verify they are detected
console.log('📝 Creating test violation files...');
testFiles.forEach((testFile) => {
  const fullPath = path.join(process.cwd(), testFile.path);
  const dir = path.dirname(fullPath);

  // Ensure directory exists
  fs.mkdirSync(dir, { recursive: true });

  // Write test file
  fs.writeFileSync(fullPath, testFile.content);
  console.log(`   ✓ Created ${testFile.path}`);
});

// Test 2: Create false positive test files
console.log('\n📝 Creating false positive test files...');
falsePositiveTests.forEach((testFile) => {
  const fullPath = path.join(process.cwd(), testFile.path);
  const dir = path.dirname(fullPath);

  // Ensure directory exists
  fs.mkdirSync(dir, { recursive: true });

  // Write test file
  fs.writeFileSync(fullPath, testFile.content);
  console.log(`   ✓ Created ${testFile.path}`);
});

// Test 3: Run ESLint and check for expected violations
console.log('\n🔍 Running ESLint to detect violations...');
try {
  execSync('./node_modules/.bin/eslint src/application/ports/ --format json', {
    stdio: 'pipe',
    encoding: 'utf8',
  });

  // If no error thrown, that means no violations detected
  console.log('   ❌ ERROR: No violations detected when they should be!');
  allTestsPassed = false;
} catch (error) {
  const output = error.stdout || '';
  console.log('   ✓ Violations detected as expected');

  try {
    // Parse JSON output for more reliable parsing
    const results = JSON.parse(output);
    const archViolations = [];

    results.forEach((fileResult) => {
      fileResult.messages.forEach((message) => {
        if (
          message.ruleId === 'clean-architecture/no-implementation-in-ports'
        ) {
          archViolations.push({
            file: fileResult.filePath,
            message: message.message,
          });
        }
      });
    });

    // Check that each expected error is present
    testFiles.forEach((testFile) => {
      const fileName = path.basename(testFile.path);
      const hasExpectedViolation = archViolations.some((violation) =>
        violation.file.includes(fileName)
      );

      if (hasExpectedViolation) {
        console.log(
          `   ✓ Found expected "${testFile.expectedError}" violation in ${testFile.path}`
        );
      } else {
        console.log(
          `   ❌ Missing expected "${testFile.expectedError}" violation in ${testFile.path}`
        );
        allTestsPassed = false;
      }
    });

    // Check that false positives are NOT flagged with architecture violations
    falsePositiveTests.forEach((testFile) => {
      const fileName = path.basename(testFile.path);
      const hasArchViolation = archViolations.some((violation) =>
        violation.file.includes(fileName)
      );

      if (hasArchViolation) {
        console.log(
          `   ❌ False positive architecture violation detected in ${testFile.path}`
        );
        allTestsPassed = false;
      } else {
        console.log(
          `   ✓ No false positive architecture violation in ${testFile.path}`
        );
      }
    });
  } catch (parseError) {
    // Fallback to text parsing if JSON parsing fails
    console.log('   ⚠️  JSON parsing failed, using text parsing fallback');

    // Check that violations are mentioned in output
    testFiles.forEach((testFile) => {
      const fileName = path.basename(testFile.path);
      if (
        output.includes(fileName) &&
        output.includes('clean-architecture/no-implementation-in-ports')
      ) {
        console.log(
          `   ✓ Found expected "${testFile.expectedError}" violation in ${testFile.path}`
        );
      } else {
        console.log(
          `   ❌ Missing expected "${testFile.expectedError}" violation in ${testFile.path}`
        );
        allTestsPassed = false;
      }
    });

    // Check false positives using simpler text search
    falsePositiveTests.forEach((testFile) => {
      const fileName = path.basename(testFile.path);
      if (
        output.includes(fileName) &&
        output.includes('clean-architecture/no-implementation-in-ports')
      ) {
        console.log(
          `   ❌ False positive architecture violation detected in ${testFile.path}`
        );
        allTestsPassed = false;
      } else {
        console.log(
          `   ✓ No false positive architecture violation in ${testFile.path}`
        );
      }
    });
  }
}

// Test 4: Clean up test files
console.log('\n🧹 Cleaning up test files...');
[...testFiles, ...falsePositiveTests].forEach((testFile) => {
  const fullPath = path.join(process.cwd(), testFile.path);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`   ✓ Removed ${testFile.path}`);
  }
});

// Final result
console.log('\n' + '='.repeat(44));
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ Ports architecture rule is working correctly');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED!');
  console.log('🔧 Please check the rule implementation');
  process.exit(1);
}
