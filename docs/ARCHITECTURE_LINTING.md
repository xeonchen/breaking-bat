# Architecture Linting

This project uses custom ESLint rules to enforce Clean Architecture principles.

## Rules

### no-domain-violations

Ensures that the Domain layer doesn't import from other layers (Application, Infrastructure, Presentation).

**Configuration**: `error` level (blocks commits)

**What it checks**:

- Domain files (`src/domain/`) cannot import from:
  - Application layer (`@/application` or `../application`)
  - Infrastructure layer (`@/infrastructure` or `../infrastructure`)
  - Presentation layer (`@/presentation` or `../presentation`)

**Exceptions**:

- Test files (`*.test.ts`, `*.spec.ts`, `__tests__/`) are allowed by default
- External libraries (npm packages) are allowed
- Internal domain imports are allowed

### no-application-violations

Ensures that the Application layer only imports from Domain layer and avoids framework-specific dependencies.

**Configuration**: `error` level (blocks commits)

**What it checks**:

- Application files (`src/application/`) cannot import from:
  - Infrastructure layer (`@/infrastructure` or `../infrastructure`)
  - Presentation layer (`@/presentation` or `../presentation`)
  - Framework-specific libraries (React, Vue, Express, etc.)

**What is allowed**:

- Domain layer imports (`@/domain/entities`, `@/domain/values`, etc.)
- Application internal imports (`@/application/common`, etc.)
- Utility libraries (uuid, lodash, zod, class-validator)
- Node.js built-in modules (fs, path, crypto)

**Exceptions**:

- Test files (`*.test.ts`, `*.spec.ts`, `__tests__/`) are allowed by default
- Utility libraries that don't violate Clean Architecture

## Usage

### Check architecture violations

```bash
npm run lint:architecture             # Check all files
npm run lint:architecture:domain      # Check only domain layer
npm run lint:architecture:application # Check only application layer
```

### Run tests for the rule

```bash
npm run test:eslint-rules                 # Run unit tests for both rules (direct Node.js execution)
npm run test:architecture-rule            # Run domain layer integration tests
npm run test:application-architecture-rule # Run application layer integration tests
```

**Note**: The unit tests use direct Node.js execution with ESLint's RuleTester. While not the typical Jest approach, this is intentional for this minimal implementation to avoid Jest configuration complexity.

### Pre-commit checks

Architecture violations are automatically checked on commit via `husky` + `lint-staged` (runs with regular ESLint).

## Example Violations

### Domain Layer Violations

```typescript
// ❌ Domain importing from Application layer
import { CreateTeamUseCase } from '@/application/use-cases';

// ❌ Domain importing from Infrastructure layer
import { IndexedDBRepository } from '@/infrastructure/repositories';

// ❌ Domain importing from Presentation layer
import { TeamComponent } from '@/presentation/components';

// ✅ Valid domain imports
import { Team } from './Team';
import { Player } from '../entities/Player';
import { uuid } from 'uuid'; // External library
```

### Application Layer Violations

```typescript
// ❌ Application importing from Infrastructure layer
import { IndexedDBRepository } from '@/infrastructure/repositories';

// ❌ Application importing from Presentation layer
import { TeamComponent } from '@/presentation/components';

// ❌ Application importing framework-specific code
import React from 'react';
import express from 'express';
import { Button } from '@mui/material';

// ✅ Valid application imports
import { Team } from '@/domain/entities/Team';
import { Result } from '@/application/common/Result';
import { uuid } from 'uuid'; // Utility library
import fs from 'fs'; // Node.js built-in
```

## Configuration

Both rules can be configured in `eslint.config.js`:

```javascript
// Domain layer rule configuration
'clean-architecture/no-domain-violations': ['error', {
  allowTestFiles: false  // Also check test files for violations
}]

// Application layer rule configuration
'clean-architecture/no-application-violations': ['error', {
  allowTestFiles: false  // Also check test files for violations
}]
```

## Implementation Details

### Domain Layer Rule

- **Rule file**: `tools/eslint-rules/no-domain-violations.cjs`
- **Unit tests**: `tools/eslint-rules/__tests__/no-domain-violations.test.cjs`
- **Integration tests**: `scripts/test-architecture-rule.cjs`

### Application Layer Rule

- **Rule file**: `tools/eslint-rules/no-application-violations.cjs`
- **Unit tests**: `tools/eslint-rules/__tests__/no-application-violations.test.cjs`
- **Integration tests**: `scripts/test-application-architecture-rule.cjs`

### Common Properties

- **Rule type**: Error (blocks builds and commits)
- **Detection method**: Precise path-based analysis with false positive prevention
- **Framework detection**: Pattern matching for common web frameworks
- **Performance**: ~50-100ms for full codebase

## Future Enhancements

Current implementation covers Domain and Application layers. Future versions could add:

1. Infrastructure layer violation detection
2. Presentation layer violation detection
3. Port vs implementation distinction
4. Dependency graph visualization
5. Custom framework pattern configuration
6. Architectural dependency metrics and reporting
