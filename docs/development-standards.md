# Development Standards & Workflow

This document defines the development standards, workflow, and quality gates for the Breaking-Bat project to ensure consistent, high-quality code and documentation.

## 🌿 Branch-Based Development Workflow

### Branch Strategy

We use a **feature branch workflow** with the following conventions:

```
main (production-ready code)
├── feat/feature-description     # New features
├── fix/bug-description         # Bug fixes
├── docs/documentation-updates  # Documentation only
├── refactor/code-improvements  # Code refactoring
├── test/testing-improvements   # Test updates
└── chore/maintenance-tasks     # Build, deps, etc.
```

### Branch Naming Convention

- **Features**: `feat/short-description`
  - Example: `feat/game-types-page`, `feat/data-export`
- **Bug Fixes**: `fix/issue-description`
  - Example: `fix/rule-matrix-validation`, `fix/mobile-layout`
- **Documentation**: `docs/doc-type`
  - Example: `docs/readme-update`, `docs/api-documentation`
- **Refactoring**: `refactor/area-or-component`
  - Example: `refactor/zustand-stores`, `refactor/clean-architecture`
- **Testing**: `test/test-area`
  - Example: `test/e2e-coverage`, `test/unit-domain-layer`
- **Maintenance**: `chore/task-description`
  - Example: `chore/dependency-updates`, `chore/build-optimization`

### Development Process

1. **Create Feature Branch**:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature-name
   ```

2. **Development & Testing**:
   - Follow TDD practices where applicable
   - Ensure all tests pass: `npm run test`
   - Check coverage: `npm run test:coverage`
   - Verify types: `npm run type-check`
   - Run linting: `npm run lint:fix`

3. **Documentation Updates**:
   - Update relevant documentation in the same PR
   - Verify documentation accuracy
   - Update implementation status if needed

4. **Create Pull Request**:
   - Use the PR template checklist
   - Provide clear description and context
   - Link related issues
   - Request appropriate reviewers

5. **Code Review Process**:
   - Address all review feedback
   - Ensure CI checks pass
   - Maintain conversation until approved
   - Squash and merge when ready

## 🧪 Quality Gates & Enforcement

### Automated Quality Gates

All PRs must pass these automated checks:

#### 1. **Test Coverage Requirements**

- **Minimum Overall Coverage**: 75%
- **New Code Coverage**: 80% minimum
- **Critical Components**: 90% minimum (domain entities, use cases)
- **E2E Test Coverage**: Must cover all user story acceptance criteria

#### 2. **Code Quality Standards**

- TypeScript compilation: 0 errors
- ESLint violations: 0 errors, warnings acceptable with justification
- Test execution: All tests must pass
- Build process: Must complete successfully

#### 3. **Documentation Sync Validation**

- README.md statistics must match actual test results
- TODO.md must reflect current project status
- Implementation status must be current
- User stories must align with E2E tests

#### 4. **Architecture Compliance**

- Clean Architecture layer separation maintained
- Dependency inversion principle followed
- SOLID principles applied
- Repository pattern used for data access

### Manual Quality Gates

#### PR Review Checklist

- [ ] **Business Logic**: Correctly implements requirements
- [ ] **Test Quality**: Comprehensive test coverage with meaningful assertions
- [ ] **Documentation**: All relevant docs updated and accurate
- [ ] **Architecture**: Follows Clean Architecture principles
- [ ] **Security**: No sensitive data exposed, proper input validation
- [ ] **Performance**: No performance regressions introduced
- [ ] **UX**: Mobile-friendly, accessible, error handling implemented

### AI Agent Enforcement Mechanisms

The following mechanisms help AI agents (like Claude Code) automatically follow project standards:

#### 1. **CLAUDE.md Integration Rules**

- **Mandatory Coverage Check**: Before any code changes, AI must run `npm run test:coverage` and update README.md if coverage changes significantly
- **Documentation Update Trigger**: Any changes to `src/` automatically trigger documentation review and updates
- **Branch Creation Rule**: AI must create feature branches for all non-trivial changes (>10 lines or new features)
- **PR Creation Mandate**: AI must create PRs for all feature branches, never push directly to main

#### 2. **Automated Validation Hooks**

```bash
# AI agents must run these commands before any commit
npm run test:coverage     # Verify coverage and update docs if needed
npm run type-check       # Ensure TypeScript compliance
npm run lint             # Fix code quality issues
```

#### 3. **Documentation Sync Enforcement**

- **README.md Auto-Update**: When coverage changes >2%, AI must automatically update README.md statistics
- **TODO.md Status Sync**: Completed tasks must be marked as done, new priorities added
- **Implementation Status Updates**: When new features are implemented, status documents must be updated in same commit

#### 4. **Quality Gates for AI Agents**

- **Coverage Threshold**: AI cannot complete a feature if coverage drops below 75%
- **Test Requirement**: New code must include tests achieving 80%+ coverage
- **Documentation Completeness**: Feature PRs must include all required documentation updates
- **Architecture Compliance**: AI must verify Clean Architecture principles are maintained

#### 5. **Automated Compliance Checkers**

```javascript
// Example enforcement script for AI agents
const checkComplianceBeforeCommit = async () => {
  // 1. Run coverage and check against README.md
  const coverage = await runCoverageCheck();
  await syncCoverageWithReadme(coverage);

  // 2. Verify all tests pass
  const testResults = await runTests();
  if (!testResults.allPassing) throw new Error('Tests must pass');

  // 3. Check documentation currency
  await validateDocumentationSync();

  // 4. Verify branch strategy compliance
  if ((await isOnMainBranch()) && !isHotfix()) {
    throw new Error('Must use feature branch for changes');
  }
};
```

#### 6. **Optimized GitHub Actions Workflows**

Resource-efficient workflows that avoid redundancy:

**CI Pipeline Optimization:**

- Single Node.js version (20.x LTS) instead of matrix builds
- Conditional test execution - only when source code changes
- Smart workflow triggers based on file paths
- Reuse test results between jobs to avoid duplicate runs

**For AI Agents:**

- Coverage reporting with automatic README.md suggestions
- Documentation gap detection with specific update instructions
- Architecture violation detection with remediation guidance
- Streamlined PR template focused on essential quality gates

## 📋 Feature Development Standards

### Definition of Done

A feature is considered complete when:

#### Implementation

- [ ] **Code Complete**: All acceptance criteria implemented
- [ ] **Clean Architecture**: Follows domain/application/infrastructure/presentation layers
- [ ] **SOLID Principles**: Applied throughout implementation
- [ ] **Error Handling**: Comprehensive error scenarios covered
- [ ] **Loading States**: Async operations have appropriate UI feedback

#### Testing

- [ ] **Unit Tests**: ≥80% coverage for new code
- [ ] **Integration Tests**: Database operations and API integrations tested
- [ ] **E2E Tests**: User workflows covered end-to-end
- [ ] **Manual Testing**: Tested across device types and offline scenarios

#### Documentation

- [ ] **User Stories**: Updated if requirements changed
- [ ] **Implementation Status**: Current completion percentage documented
- [ ] **API Documentation**: JSDoc comments for public interfaces
- [ ] **README.md**: Updated if user-facing features added
- [ ] **Architecture Decisions**: Significant design decisions documented

#### Quality Assurance

- [ ] **Code Review**: Approved by at least one reviewer
- [ ] **CI/CD**: All automated checks passing
- [ ] **Performance**: No regressions in load times or memory usage
- [ ] **Security**: Input validation and data protection implemented
- [ ] **Accessibility**: WCAG guidelines followed for UI components

### New Feature Workflow

1. **Planning Phase**:
   - Create or update user story
   - Define acceptance criteria
   - Plan test coverage approach
   - Identify documentation updates needed

2. **Implementation Phase**:
   - Create feature branch
   - Implement following TDD where possible
   - Maintain clean architecture separation
   - Add comprehensive test coverage

3. **Documentation Phase**:
   - Update all relevant documentation
   - Verify implementation status accuracy
   - Update README if user-facing changes
   - Document architectural decisions

4. **Review Phase**:
   - Create PR with complete template checklist
   - Address all review feedback
   - Ensure all quality gates pass
   - Merge only when fully approved

## 📊 Coverage Standards & Monitoring

### Coverage Targets by Layer

| Layer          | Minimum Coverage | Target Coverage | Critical Components     |
| -------------- | ---------------- | --------------- | ----------------------- |
| Domain         | 85%              | 95%             | Entities, Value Objects |
| Application    | 80%              | 90%             | Use Cases, Services     |
| Infrastructure | 70%              | 85%             | Repositories, Database  |
| Presentation   | 70%              | 80%             | Components, Stores      |
| **Overall**    | **75%**          | **85%**         | **Entire Codebase**     |

### Coverage Monitoring

- **Daily**: Automated coverage reporting in CI
- **Weekly**: Coverage trend analysis and documentation updates
- **Per PR**: Coverage delta reporting and threshold enforcement
- **Release**: Comprehensive coverage audit before major releases

### Coverage Exceptions

Acceptable reasons for below-target coverage:

- Error handling code for rare edge cases
- Legacy code scheduled for refactoring
- External API integration code (with proper mocking)
- UI presentation code with complex styling logic

All exceptions must be:

- Documented in code comments
- Approved in code review
- Tracked in technical debt backlog
- Scheduled for future improvement

## 🚀 Release & Deployment Standards

### Pre-Release Checklist

- [ ] All feature branches merged to main
- [ ] Full test suite passing (unit + integration + E2E)
- [ ] Coverage targets met across all layers
- [ ] Documentation fully current and accurate
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] User acceptance testing completed

### Deployment Process

- All deployments via main branch
- Automated deployment pipeline
- Rollback plan documented and tested
- Post-deployment verification checklist

## 🔧 Development Tools & Setup

### Required Tools

- Node.js 18+ (LTS version)
- npm 8+
- VS Code (recommended) with suggested extensions
- Git with conventional commits setup

### Recommended VS Code Extensions

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Jest Runner
- GitLens
- Thunder Client (for API testing)

### Development Environment Setup

```bash
# Install dependencies
npm install

# Setup git hooks
npm run prepare

# Run development server
npm run dev

# Run all quality checks
npm run test && npm run type-check && npm run lint
```

## 🎯 Continuous Improvement

### Monthly Reviews

- Review and update development standards
- Analyze quality metrics and trends
- Update tooling and automation
- Team retrospective and process improvements

### Quality Metrics Tracking

- Test coverage trends
- Code review cycle time
- Defect detection rate
- Documentation currency score
- Developer experience feedback

This living document is updated regularly to reflect evolving best practices and team learnings.

---

**Last Updated**: Current Date
**Next Review**: Monthly during team retrospective
**Document Owner**: Development Team
