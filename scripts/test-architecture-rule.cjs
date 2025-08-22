#!/usr/bin/env node
/**
 * Verification script for architecture ESLint rule
 * Creates test violation files and verifies they are detected correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testFiles = [
  {
    path: 'src/domain/entities/test-violation-app.ts',
    content: `import { UseCase } from '@/application/use-cases';
export class TestEntity {}`,
    expectedError: 'application layer',
  },
  {
    path: 'src/domain/services/test-violation-infra.ts',
    content: `import { Repository } from '@/infrastructure/repositories/';
export class TestService {}`,
    expectedError: 'infrastructure layer',
  },
  {
    path: 'src/domain/values/test-violation-presentation.ts',
    content: `import { Component } from '@/presentation/components';
export class TestValue {}`,
    expectedError: 'presentation layer',
  },
  {
    path: 'src/domain/aggregates/test-violation-relative.ts',
    content: `import { UseCase } from '../application/services';
export class TestAggregate {}`,
    expectedError: 'application layer',
  },
];

const falsPositiveTests = [
  {
    path: 'src/domain/entities/test-false-positive.ts',
    content: `import { utils } from '../domain-application-utils';
import { lib } from '../../some-application/lib';
export class TestEntity {}`,
    shouldPass: true,
  },
];

console.log('🧪 Testing Architecture ESLint Rule');
console.log('=====================================\n');

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
falsPositiveTests.forEach((testFile) => {
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
  execSync('./node_modules/.bin/eslint src/domain/ --format json', {
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
        if (message.ruleId === 'clean-architecture/no-domain-violations') {
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
    falsPositiveTests.forEach((testFile) => {
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
    falsPositiveTests.forEach((testFile) => {
      const fileName = path.basename(testFile.path);
      if (
        output.includes(fileName) &&
        output.includes('clean-architecture/no-domain-violations')
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
[...testFiles, ...falsPositiveTests].forEach((testFile) => {
  const fullPath = path.join(process.cwd(), testFile.path);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log(`   ✓ Removed ${testFile.path}`);
  }
});

// Test 5: Verify clean state
console.log('\n🏁 Verifying clean state...');
try {
  execSync('./node_modules/.bin/eslint src/domain/', {
    stdio: 'pipe',
    encoding: 'utf8',
  });
  console.log('   ✓ No violations in clean domain layer');
} catch (error) {
  const output = error.stdout || '';
  if (output.includes('clean-architecture/no-domain-violations')) {
    console.log('   ❌ Still finding architecture violations after cleanup!');
    console.log('   Output:', output);
    allTestsPassed = false;
  } else {
    console.log('   ✓ Only expected linting warnings remain');
  }
}

// Final result
console.log('\n' + '='.repeat(40));
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ Architecture rule is working correctly');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED!');
  console.log('🔧 Please check the rule implementation');
  process.exit(1);
}
