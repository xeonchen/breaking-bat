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

### no-infrastructure-violations

Ensures that the Infrastructure layer only imports from Domain and Application layers.

**Configuration**: `error` level (blocks commits)

**What it checks**:

- Infrastructure files (`src/infrastructure/`) cannot import from:
  - Presentation layer (`@/presentation` or `../presentation`)

**What is allowed**:

- Domain layer imports (`@/domain/entities`, `@/domain/values`, etc.)
- Application layer imports, especially ports (`@/application/ports`, `@/application/services/interfaces`)
- Infrastructure internal imports (`@/infrastructure/database`, etc.)
- External libraries (database drivers, utility libraries)

**Exceptions**:

- Test files (`*.test.ts`, `*.spec.ts`, `__tests__/`) are allowed by default

### no-presentation-violations

Ensures that the Presentation layer only imports from Domain and Application layers.

**Configuration**: `error` level (blocks commits)

**What it checks**:

- Presentation files (`src/presentation/`) cannot import from:
  - Infrastructure layer (`@/infrastructure` or `../infrastructure`)

**What is allowed**:

- Domain layer imports (`@/domain/entities`, `@/domain/values`, etc.)
- Application layer imports (`@/application/use-cases`, `@/application/services`)
- Presentation internal imports (`@/presentation/stores`, `@/presentation/components`)
- UI framework imports (React, Vue, Angular)
- UI library imports (@mui/material, antd, etc.)

**Exceptions**:

- Test files (`*.test.ts`, `*.spec.ts`, `__tests__/`) are allowed by default

## Usage

### Check architecture violations

```bash
npm run lint:architecture                  # Check all files
npm run lint:architecture:domain           # Check only domain layer
npm run lint:architecture:application      # Check only application layer
npm run lint:architecture:infrastructure   # Check only infrastructure layer
npm run lint:architecture:presentation     # Check only presentation layer
```

### Run tests for the rule

```bash
npm run test:eslint-rules                      # Run unit tests for all rules (direct Node.js execution)
npm run test:domain-architecture-rule         # Run domain layer integration tests
npm run test:application-architecture-rule     # Run application layer integration tests
npm run test:infrastructure-architecture-rule  # Run infrastructure layer integration tests
npm run test:presentation-architecture-rule    # Run presentation layer integration tests
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

### Infrastructure Layer Violations

```typescript
// ❌ Infrastructure importing from Presentation layer
import { TeamStore } from '@/presentation/stores/teamStore';
import { TeamComponent } from '@/presentation/components/Team';
import { PresentationTypes } from '@/presentation/types';

// ✅ Valid infrastructure imports
import { Team } from '@/domain/entities/Team';
import { ITeamRepository } from '@/application/ports/secondary/ITeamRepository';
import { DatabaseConfig } from '@/infrastructure/config/DatabaseConfig';
import { openDB } from 'idb'; // External library
```

### Presentation Layer Violations

```typescript
// ❌ Presentation importing from Infrastructure layer
import { DomainAdapter } from '@/infrastructure/adapters/DomainAdapter';
import { IndexedDBRepository } from '@/infrastructure/repositories';
import { DatabaseConnection } from '@/infrastructure/database';

// ✅ Valid presentation imports
import { Team } from '@/domain/entities/Team';
import { CreateTeamUseCase } from '@/application/use-cases';
import { TeamStore } from '@/presentation/stores/teamStore';
import React from 'react'; // UI framework
import { Button } from '@mui/material'; // UI library
```

## Configuration

All rules can be configured in `eslint.config.js`:

```javascript
// Domain layer rule configuration
'clean-architecture/no-domain-violations': ['error', {
  allowTestFiles: false  // Also check test files for violations
}]

// Application layer rule configuration
'clean-architecture/no-application-violations': ['error', {
  allowTestFiles: false  // Also check test files for violations
}]

// Infrastructure layer rule configuration
'clean-architecture/no-infrastructure-violations': ['error', {
  allowTestFiles: false  // Also check test files for violations
}]

// Presentation layer rule configuration
'clean-architecture/no-presentation-violations': ['error', {
  allowTestFiles: false  // Also check test files for violations
}]
```

## Implementation Details

### Domain Layer Rule

- **Rule file**: `tools/eslint-rules/no-domain-violations.cjs`
- **Unit tests**: `tools/eslint-rules/__tests__/no-domain-violations.test.cjs`
- **Integration tests**: `scripts/test-domain-architecture-rule.cjs`

### Application Layer Rule

- **Rule file**: `tools/eslint-rules/no-application-violations.cjs`
- **Unit tests**: `tools/eslint-rules/__tests__/no-application-violations.test.cjs`
- **Integration tests**: `scripts/test-application-architecture-rule.cjs`

### Infrastructure Layer Rule

- **Rule file**: `tools/eslint-rules/no-infrastructure-violations.cjs`
- **Unit tests**: `tools/eslint-rules/__tests__/no-infrastructure-violations.test.cjs`
- **Integration tests**: `scripts/test-infrastructure-architecture-rule.cjs`

### Presentation Layer Rule

- **Rule file**: `tools/eslint-rules/no-presentation-violations.cjs`
- **Unit tests**: `tools/eslint-rules/__tests__/no-presentation-violations.test.cjs`
- **Integration tests**: `scripts/test-presentation-architecture-rule.cjs`

### Common Properties

- **Rule type**: Error (blocks builds and commits)
- **Detection method**: Precise path-based analysis with false positive prevention
- **Framework detection**: Pattern matching for common web frameworks
- **Performance**: ~50-100ms for full codebase

## Future Enhancements

Current implementation covers all four Clean Architecture layers. Future versions could add:

1. Port vs implementation distinction
2. Dependency graph visualization
3. Custom framework pattern configuration
4. Architectural dependency metrics and reporting
