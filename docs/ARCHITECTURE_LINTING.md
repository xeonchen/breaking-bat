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

## Usage

### Check architecture violations

```bash
npm run lint:architecture        # Check all files
npm run lint:architecture:domain # Check only domain layer
```

### Run tests for the rule

```bash
npm run test:eslint-rules        # Run unit tests for the rule (direct Node.js execution)
npm run test:architecture-rule   # Run comprehensive integration tests with JSON parsing
```

**Note**: The unit tests use direct Node.js execution with ESLint's RuleTester. While not the typical Jest approach, this is intentional for this minimal implementation to avoid Jest configuration complexity.

### Pre-commit checks

Architecture violations are automatically checked on commit via `husky` + `lint-staged` (runs with regular ESLint).

## Example Violations

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

## Configuration

The rule can be configured in `eslint.config.js`:

```javascript
'clean-architecture/no-domain-violations': ['error', {
  allowTestFiles: false  // Also check test files for violations
}]
```

## Implementation Details

- **Rule file**: `tools/eslint-rules/no-domain-violations.cjs`
- **Unit tests**: `tools/eslint-rules/__tests__/no-domain-violations.test.cjs`
- **Integration tests**: `scripts/test-architecture-rule.cjs`
- **Rule type**: Error (blocks builds and commits)
- **Detection method**: Precise path-based analysis with false positive prevention
- **Performance**: ~50-100ms for full codebase

## Future Enhancements

This minimal implementation focuses on Domain layer violations. Future versions could add:

1. Application layer violation detection
2. Infrastructure layer violation detection
3. Presentation layer violation detection
4. Port vs implementation distinction
5. Dependency graph visualization
