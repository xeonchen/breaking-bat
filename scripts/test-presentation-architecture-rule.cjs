#!/usr/bin/env node
/**
 * Integration test script for presentation architecture ESLint rule
 * Creates test violation files and verifies they are detected correctly
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testFiles = [
  {
    path: 'src/presentation/stores/test-violation-infrastructure.ts',
    content: `import { DomainAdapter } from '@/infrastructure/adapters/DomainAdapter';
export class TestStore {}`,
    expectedError: 'infrastructure layer',
  },
  {
    path: 'src/presentation/components/test-violation-infrastructure-repositories.tsx',
    content: `import { IndexedDBTeamRepository } from '@/infrastructure/repositories/TeamRepository';
export function TestComponent() { return null; }`,
    expectedError: 'infrastructure layer',
  },
  {
    path: 'src/presentation/services/test-violation-infrastructure-database.ts',
    content: `import { DatabaseConnection } from '@/infrastructure/database/Connection';
export class TestService {}`,
    expectedError: 'infrastructure layer',
  },
  {
    path: 'src/presentation/hooks/test-violation-relative.ts',
    content: `import { InfrastructureHelper } from '../infrastructure/helpers';
export function useTestHook() {}`,
    expectedError: 'infrastructure layer',
  },
  {
    path: 'src/presentation/pages/test-violation-going-up.tsx',
    content: `import { RepositoryFactory } from '../../infrastructure/factories';
export function TestPage() { return null; }`,
    expectedError: 'infrastructure layer',
  },
];

const falsePositiveTests = [
  {
    path: 'src/presentation/components/test-false-positive.tsx',
    content: `import { Team } from '@/domain/entities/Team';
import { CreateTeamUseCase } from '@/application/use-cases/CreateTeam';
import { TeamStore } from '@/presentation/stores/teamStore';
import React from 'react';
import { Button } from '@mui/material';
import { utils } from '../presentation-infrastructure-config';
export function TestComponent() { return null; }`,
    shouldPass: true,
  },
];

console.log('🧪 Testing Presentation Architecture ESLint Rule');
console.log('================================================\n');

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
  execSync('./node_modules/.bin/eslint src/presentation/ --format json', {
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
          message.ruleId === 'clean-architecture/no-presentation-violations'
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
        output.includes('clean-architecture/no-presentation-violations')
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
console.log('\n' + '='.repeat(52));
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED!');
  console.log('✅ Presentation architecture rule is working correctly');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED!');
  console.log('🔧 Please check the rule implementation');
  process.exit(1);
}
