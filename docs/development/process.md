# Development Process

This document outlines the comprehensive development workflow and procedures for the Breaking-Bat project.

## Phase Completion Checklist

When completing any development phase, ensure:

### 1. Code Quality

- [ ] All TypeScript compilation passes (`npm run type-check`)
- [ ] All tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is properly formatted

### 2. Documentation Updates

- [ ] Update README.md development status
- [ ] Update development documentation if architecture changes
- [ ] Add/update user stories or specs if needed
- [ ] Update API contracts if interfaces change

### 3. Commit Standards

- [ ] Use conventional commit format
- [ ] Include proper scope and description
- [ ] Reference related issues or specs
- [ ] Include breaking change notes if applicable

### 4. Testing Verification

- [ ] New features have corresponding tests
- [ ] Build process completes successfully (`npm run build`)
- [ ] PWA functionality works in development (`npm run dev`)

## Git Workflow

### 1. Feature Development

```bash
git checkout -b feat/feature-name
# Implement feature following Clean Architecture
npm run commit  # Use conventional commits
```

### 2. Commit Often Best Practice

Claude Code should commit progress frequently during development sessions:

- Commit after fixing configuration issues
- Commit after resolving test failures
- Commit after implementing complete features
- Commit before starting major refactoring
- Use descriptive commit messages following conventional format

### 3. Pre-commit Checks

- Husky automatically runs lint-staged
- Code is formatted with Prettier
- ESLint checks are applied
- Commit message is validated

## Comprehensive Phase Completion Process

Before completing any development phase, follow this comprehensive checklist:

### Code Quality Verification

- [ ] Run `npm run type-check` - all TypeScript compilation passes
- [ ] Run `npm run test` - all tests pass with adequate coverage
- [ ] Run `npm run lint` - all linting issues resolved
- [ ] Run `npm run build` - production build succeeds without warnings
- [ ] No console.log statements in production code
- [ ] All TODOs addressed or documented in TODO.md
- [ ] Code is properly formatted with Prettier

### Testing Completeness

- [ ] New features have corresponding unit tests
- [ ] Integration tests added for new workflows
- [ ] E2E tests cover critical user paths
- [ ] Test coverage meets minimum requirements (80%)
- [ ] All tests are deterministic and don't rely on external services

### Documentation Updates

- [ ] README.md development status reflects completed phase
- [ ] TODO.md updated with current task status
- [ ] User stories updated if requirements changed
- [ ] API contracts updated if interfaces changed
- [ ] Added JSDoc comments for new functions/classes
- [ ] Updated architectural diagrams if needed

### Architecture Compliance

- [ ] Clean Architecture principles maintained
- [ ] Domain layer doesn't depend on external frameworks
- [ ] Application layer orchestrates use cases correctly
- [ ] Infrastructure layer implements repository contracts
- [ ] Presentation layer only handles UI concerns
- [ ] Dependency inversion principle followed
- [ ] SOLID principles implemented correctly

### Feature Verification

- [ ] Feature works as described in user stories
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Offline functionality works (PWA requirement)
- [ ] Error handling is comprehensive
- [ ] Loading states provide good UX

### Performance & Build

- [ ] Development server starts without errors (`npm run dev`)
- [ ] Production build completes successfully (`npm run build`)
- [ ] PWA service worker generates correctly
- [ ] No performance regressions introduced
- [ ] Components are properly memoized where needed
- [ ] Bundle sizes are reasonable

### Commit Standards

- [ ] Use conventional commit format with proper scope
- [ ] Commit message clearly describes what was implemented
- [ ] Reference related user stories or specs
- [ ] Include breaking change notes if applicable

### Phase Sign-off

- [ ] All checklist items completed
- [ ] Documentation review completed
- [ ] Ready for next phase

## Final Commit Example

```bash
npm run commit

# Format: <type>(<scope>): <description>
# Types: feat | fix | docs | style | refactor | test | chore
# Scopes: team-management | game-setup | live-scoring | data-persistence |
#         ui | theme | pwa | domain | application | infrastructure | presentation

# Example:
# feat(tests): implement comprehensive test infrastructure fixes and achieve 80.5% pass rate
#
# - Fix TypeScript JSX namespace issues by removing incompatible JSX.Element return types
# - Resolve AtBat repository RBI validation logic and compound index queries
# - Update Game repository date filtering with manual approach vs problematic Dexie between()
# - Align all Zustand store mocks with actual implementation patterns
# - Fix Scoreboard component team display logic and CSS custom property assertions
# - Achieve 397/493 tests passing (80.5% pass rate) with 18/26 test suites passing
#
# Major testing infrastructure improvements completed - Ready for final cleanup phase.
```

**Important**: Only proceed to next phase after all checklist items are verified.

## Quality Gates

### Development Standards

Any stage failure blocks the merge. This is an automated, mandatory process:

1. **Lint & Format** (ESLint / Prettier)
2. **Static Analysis / Type-check** (TypeScript Compiler)
3. **Unit + Component Tests** (Coverage ≥ 85%)
4. **Integration + Contract Tests**
5. **End-to-End Tests**
6. **Build / Bundle Validation**
7. **Artifact Publish / Deploy**

### Success Criteria

- All TypeScript compilation passes
- All tests pass with adequate coverage
- All linting issues resolved
- Production build succeeds without warnings
- PWA functionality verified
- Documentation is complete and up-to-date
