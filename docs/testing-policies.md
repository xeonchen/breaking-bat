# Testing Policies for Zustand Stores with Persistence

This document outlines testing policies and best practices for testing Zustand stores with persistence middleware in the Breaking-Bat PWA.

## 🚨 Critical Issue: Zustand Persistence Test Pollution

**Root Cause**: Zustand stores with `persist` middleware save state to localStorage/sessionStorage. Standard Jest `clearAllMocks()` does **NOT** clear browser storage, causing test pollution where previous test data affects subsequent tests.

**Symptom**: Tests pass individually but fail when run as a suite due to contaminated persistent state.

## 📋 Mandatory Testing Policies

### 1. **Browser Storage Cleanup Policy**

**Rule**: ALL tests involving Zustand stores with `persist` middleware MUST clear localStorage and sessionStorage in `beforeEach`.

**Implementation**:

```typescript
import {
  clearZustandPersistence,
  resetZustandStore,
  getCleanStoreState,
} from '../../utils/storeTestUtils';

beforeEach(() => {
  jest.clearAllMocks();

  // Clear Zustand persistent storage and reset store state
  resetZustandStore(useStore, getCleanStoreState());

  // Initialize dependencies...
});
```

### 2. **Test-Specific Mock Configuration Policy**

**Rule**: Tests MUST override generic mock implementations with test-specific expectations to prevent mock contamination.

**Implementation**:

```typescript
it('should perform specific operation', async () => {
  // Override generic mocks with test-specific expectations
  mockService.method.mockResolvedValue(expectedTestResult);

  await act(async () => {
    await store.performOperation();
  });

  expect(result).toEqual(expectedTestResult);
});
```

### 3. **Test Isolation Verification Policy**

**Rule**: Critical tests MUST be verified to pass both in isolation and as part of the full suite.

**Verification Commands**:

```bash
# Test isolation verification
npm test -- --testNamePattern="specific test name"  # Must pass
npm test  # Full suite must also pass
```

## 🛠️ Required Test Utilities

### Store Test Utilities (`tests/utils/storeTestUtils.ts`)

All Zustand store tests must use these utilities:

- `clearZustandPersistence()` - Clears localStorage and sessionStorage
- `resetZustandStore()` - Resets store to clean initial state
- `getCleanStoreState()` - Returns clean initial state objects
- `validateStorageCleared()` - Validation helper for debugging

### Example Usage Pattern

```typescript
import { renderHook, act } from '@testing-library/react';
import { useStore, initializeStore } from '@/presentation/stores/store';
import {
  resetZustandStore,
  getCleanStoreState,
} from '../../utils/storeTestUtils';

beforeEach(() => {
  jest.clearAllMocks();

  // MANDATORY: Clear persistent storage and reset state
  resetZustandStore(useStore, getCleanStoreState());

  // Initialize dependencies
  initializeStore({
    repository: mockRepository,
    service: mockService,
  });
});

describe('Store Tests', () => {
  it('should perform operation correctly', async () => {
    // Override mocks for this specific test
    mockService.method.mockResolvedValue(expectedResult);

    const { result } = renderHook(() => useStore());

    await act(async () => {
      await result.current.performOperation();
    });

    expect(result.current.data).toEqual(expectedResult);
    expect(result.current.error).toBeNull();
  });
});
```

## 📊 Store Coverage Requirements

### Current Store Test Coverage Status

| Store        | Tests Created | Uses Persistence | Status                 |
| ------------ | ------------- | ---------------- | ---------------------- |
| `teamsStore` | ✅            | ✅               | Complete with fixes    |
| `gameStore`  | ✅            | ✅               | Complete with policies |
| `gamesStore` | ✅            | ✅               | Complete with policies |

### All Three Stores Use Persistence

**Important**: All primary stores (`teamsStore`, `gameStore`, `gamesStore`) use Zustand's `persist` middleware and therefore require the localStorage cleanup pattern.

## 🚫 Anti-Patterns to Avoid

### ❌ Insufficient Mock Reset

```typescript
beforeEach(() => {
  jest.clearAllMocks(); // NOT ENOUGH - doesn't clear localStorage
});
```

### ❌ Generic Mock Contamination

```typescript
// Generic mock that returns stale data from previous tests
mockService.method.mockImplementation((data) => data.map(...));
```

### ❌ Skipping Tests Instead of Fixing

```typescript
it.skip('should work correctly', () => {
  // Don't skip tests - fix the root cause!
});
```

## ✅ Best Practices

### 1. **Proper Test Structure**

- Clear storage in `beforeEach`
- Reset store state to clean initial values
- Override mocks for specific test scenarios
- Use flexible assertions (`expect.objectContaining()`) for timestamp-sensitive data

### 2. **Mock Configuration**

- Use `jest.MockedFunction<T>` typing for better TypeScript support
- Create test-specific mock implementations
- Verify mock calls with appropriate matchers

### 3. **Error Testing**

- Test both success and failure scenarios
- Verify loading states and error messages
- Test edge cases (missing data, network errors, validation failures)

## 🔍 Debugging Test Pollution

If you suspect test pollution:

1. **Run tests individually**: `npm test -- --testNamePattern="specific test"`
2. **Check localStorage**: Add `validateStorageCleared()` in `beforeEach`
3. **Verify mock isolation**: Ensure each test overrides mocks appropriately
4. **Review store persistence**: Check what data is being persisted by the store

## 🎯 Integration with CI/CD

These policies are enforced by:

- ESLint rules (future enhancement)
- Test isolation verification in CI pipeline
- Code review requirements
- Automated test coverage reporting

## 📚 Related Documentation

- **Store Architecture**: See `src/presentation/stores/README.md`
- **Domain Layer**: See `docs/architecture/clean-architecture.md`
- **Testing Framework**: Jest + Testing Library + Zustand
- **CI/CD Pipeline**: `.github/workflows/ci.yml`

## 🔄 Policy Updates

This document will be updated as new patterns emerge or when additional stores with persistence are added. All developers must follow these policies to maintain test reliability and prevent CI failures.

---

**Last Updated**: 2025-08-05
**Policy Version**: 1.0
**Applies To**: All Zustand stores with `persist` middleware
