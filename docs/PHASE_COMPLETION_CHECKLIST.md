# Phase Completion Checklist

Use this checklist when completing any development phase to ensure consistency and quality.

## Phase: [PHASE_NAME]

### ✅ Code Quality

- [ ] All TypeScript compilation passes (`npm run type-check`)
- [ ] All tests pass (`npm run test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is properly formatted with Prettier
- [ ] No console.log statements in production code
- [ ] All TODOs have been addressed or documented

### ✅ Documentation Updates

- [ ] README.md development status updated to reflect completed phase
- [ ] CLAUDE.md updated if architecture or commands changed
- [ ] User stories updated if requirements changed
- [ ] API contracts updated if interfaces changed
- [ ] Added JSDoc comments for new functions/classes
- [ ] Updated architectural diagrams if needed

### ✅ Testing

- [ ] New features have corresponding unit tests
- [ ] Integration tests added for new workflows
- [ ] E2E tests cover critical user paths
- [ ] Test coverage meets minimum requirements (80%)
- [ ] All tests are deterministic and don't rely on external services

### ✅ Commit Standards

- [ ] Used conventional commit format
- [ ] Included proper scope (e.g., `feat(live-scoring):`)
- [ ] Commit message clearly describes what was implemented
- [ ] Referenced related user stories or specs
- [ ] Included breaking change notes if applicable

### ✅ Build & Deployment

- [ ] Development server starts without errors (`npm run dev`)
- [ ] Production build completes successfully (`npm run build`)
- [ ] PWA service worker generates correctly
- [ ] No build warnings that need addressing
- [ ] Bundle sizes are reasonable

### ✅ Feature Verification

- [ ] Feature works as described in user stories
- [ ] Responsive design works on mobile/tablet
- [ ] Offline functionality works (if applicable)
- [ ] Error handling is comprehensive
- [ ] Loading states provide good UX

### ✅ Clean Architecture Compliance

- [ ] Domain layer doesn't depend on external frameworks
- [ ] Application layer orchestrates use cases correctly
- [ ] Infrastructure layer implements repository contracts
- [ ] Presentation layer only handles UI concerns
- [ ] Dependency inversion principle is followed

### ✅ Performance

- [ ] No performance regressions introduced
- [ ] Components are properly memoized where needed
- [ ] Large lists use virtualization
- [ ] Images are optimized
- [ ] Lazy loading implemented for routes

## Commit Template

```bash
npm run commit
```

**Type:** `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore`

**Scope:** `team-management` | `game-setup` | `live-scoring` | `data-persistence` | `ui` | `theme` | `pwa` | `domain` | `application` | `infrastructure` | `presentation`

**Example:**

```
feat(live-scoring): implement real-time scoreboard with inning tracking

- Add scoreboard component with live score updates
- Implement inning-by-inning score tracking
- Add baserunner state visualization
- Include current batter highlighting

Closes: #123
```

## Phase Sign-off

- [ ] All checklist items completed
- [ ] Phase lead review completed
- [ ] Documentation review completed
- [ ] Ready for next phase

**Completed by:** [NAME]  
**Date:** [DATE]  
**Phase Duration:** [X days]  
**Next Phase:** [NEXT_PHASE_NAME]
