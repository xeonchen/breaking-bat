#!/usr/bin/env node
/**
 * Integration test script for application architecture ESLint rule
 * Creates test violation files and verifies they are detected correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testFiles = [
  {
    path: 'src/application/use-cases/test-violation-infrastructure.ts',
    content: `import { Repository } from '@/infrastructure/repositories/TeamRepository';
export class TestUseCase {}`,
    expectedError: 'infrastructure layer',
  },
  {
    path: 'src/application/services/test-violation-presentation.ts',
    content: `import { Component } from '@/presentation/components/Team';
export class TestService {}`,
    expectedError: 'presentation layer',
  },
  {
    path: 'src/application/handlers/test-violation-react.ts',
    content: `import React from 'react';
export class TestHandler {}`,
    expectedError: 'framework-specific code',
  },
  {
    path: 'src/application/services/test-violation-express.ts',
    content: `import express from 'express';
export class TestService {}`,
    expectedError: 'framework-specific code',
  },
  {
    path: 'src/application/utils/test-violation-relative.ts',
    content: `import { DatabaseClient } from '../infrastructure/database';
export class TestUtil {}`,
    expectedError: 'infrastructure layer',
  },
];

const falsePositiveTests = [
  {
    path: 'src/application/services/test-false-positive.ts',
    content: `import { Team } from '@/domain/entities/Team';
import { Result } from '@/application/common/Result';
import { uuid } from 'uuid';
import { utils } from '../application-infrastructure-bridge';
export class TestService {}`,
    shouldPass: true,
  },
];

console.log('🧪 Testing Application Architecture ESLint Rule');
console.log('===============================================\n');

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
  execSync('./node_modules/.bin/eslint src/application/ --format json', {
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
        if (message.ruleId === 'clean-architecture/no-application-violations') {
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
        output.includes('clean-architecture/no-application-violations')
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

// Test 5: Verify clean state
console.log('\n🏁 Verifying clean state...');
try {
  execSync('./node_modules/.bin/eslint src/application/', {
    stdio: 'pipe',
    encoding: 'utf8',
  });
  console.log('   ✓ No violations in clean application layer');
} catch (error) {
  const output = error.stdout || '';
  if (output.includes('clean-architecture/no-application-violations')) {
    console.log('   ❌ Still finding architecture violations after cleanup!');
    console.log('   Output:', output);
    allTestsPassed = false;
  } else {
    console.log('   ✓ Only expected linting warnings remain');
  }
}

// Final result
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ Application architecture rule is working correctly');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED!');
  console.log('🔧 Please check the rule implementation');
  process.exit(1);
}
