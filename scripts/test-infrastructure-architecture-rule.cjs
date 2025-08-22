#!/usr/bin/env node
/**
 * Integration test script for infrastructure architecture ESLint rule
 * Creates test violation files and verifies they are detected correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testFiles = [
  {
    path: 'src/infrastructure/repositories/test-violation-presentation.ts',
    content: `import { TeamStore } from '@/presentation/stores/teamStore';
export class TestRepository {}`,
    expectedError: 'presentation layer',
  },
  {
    path: 'src/infrastructure/adapters/test-violation-presentation-components.ts',
    content: `import { TeamComponent } from '@/presentation/components/Team';
export class TestAdapter {}`,
    expectedError: 'presentation layer',
  },
  {
    path: 'src/infrastructure/services/test-violation-presentation-types.ts',
    content: `import { PresentationTypes } from '@/presentation/types/TeamWithPlayers';
export class TestService {}`,
    expectedError: 'presentation layer',
  },
  {
    path: 'src/infrastructure/bootstrap/test-violation-relative.ts',
    content: `import { PresentationUtils } from '../presentation/utils';
export class TestBootstrap {}`,
    expectedError: 'presentation layer',
  },
  {
    path: 'src/infrastructure/database/test-violation-going-up.ts',
    content: `import { UIHelpers } from '../../presentation/helpers';
export class TestDatabase {}`,
    expectedError: 'presentation layer',
  },
];

const falsePositiveTests = [
  {
    path: 'src/infrastructure/adapters/test-false-positive.ts',
    content: `import { Team } from '@/domain/entities/Team';
import { ITeamRepository } from '@/application/ports/secondary/ITeamRepository';
import { DatabaseConfig } from '@/infrastructure/config/DatabaseConfig';
import { utils } from '../infrastructure-presentation-bridge';
export class TestAdapter {}`,
    shouldPass: true,
  },
];

console.log('🧪 Testing Infrastructure Architecture ESLint Rule');
console.log('==================================================\n');

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
  execSync('./node_modules/.bin/eslint src/infrastructure/ --format json', {
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
          message.ruleId === 'clean-architecture/no-infrastructure-violations'
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
      const hasExpectedViolation = archViolations.some(
        (violation) =>
          violation.file.includes(fileName) &&
          violation.message.includes(testFile.expectedError)
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

    // Check that each expected error is present
    testFiles.forEach((testFile) => {
      if (output.includes(testFile.expectedError)) {
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
        output.includes('clean-architecture/no-infrastructure-violations')
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
console.log('\n' + '='.repeat(55));
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ Infrastructure architecture rule is working correctly');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED!');
  console.log('🔧 Please check the rule implementation');
  process.exit(1);
}
