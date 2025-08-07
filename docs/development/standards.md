# Development Standards

This document outlines coding standards, practices, and conventions for the Breaking-Bat project.

## Commit Message Standards

This project uses **Conventional Commits** for consistent commit history and automated tooling.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat`: New feature for the user
- `fix`: Bug fix for the user
- `docs`: Changes to documentation
- `style`: Formatting, missing semicolons, etc; no production code change
- `refactor`: Refactoring production code, eg. renaming a variable
- `test`: Adding missing tests, refactoring tests; no production code change
- `chore`: Updating grunt tasks etc; no production code change
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts

### Scopes (Optional and Flexible)

Scopes are **optional** and can be any descriptive identifier. Common patterns that have emerged:

**Feature-based scopes:**

- `team-management`, `game-setup`, `live-scoring`, `data-persistence`

**Architecture-based scopes:**

- `domain`, `application`, `infrastructure`, `presentation`

**Component-based scopes:**

- `ui`, `theme`, `pwa`, `api`, `database`

**Maintenance scopes:**

- `deps`, `config`, `build`, `tests`, `docs`

**Guidelines:**

- Scopes are lowercase with hyphens (e.g., `live-scoring`)
- Keep scopes concise (under 30 characters)
- Let scopes emerge organically from your work
- No need to predefine or maintain a scope list

### Examples

```bash
feat(live-scoring): add batting result recording interface
fix(team-management): correct player jersey number validation
docs: reorganize development documentation structure
test(domain): add unit tests for Player entity
refactor(ui): extract scoreboard component for reusability
chore(deps): update dependencies to latest LTS versions
chore(config): modernize commit message rules
docs(api): update REST endpoint documentation
```

**Note**: Scopes are optional - `docs: update readme` is just as valid as `docs(readme): update readme`.

### Interactive Commit

```bash
npm run commit  # Uses commitizen for guided commit creation
```

## Component Structure

- Use **Chakra UI** components for consistency
- Follow **compound component pattern** for complex UI
- Implement **loading states** and **error boundaries**
- Optimize for **touch interfaces** (tablets/phones)

## State Management

- **Zustand stores** for application state
- **React Hook Form** for form state
- **Local state** for component-specific data
- **Persistent state** synced with IndexedDB

## Testing Strategy

- **Test-driven development** following specs
- **Unit tests** for domain logic and use cases
- **Integration tests** for repository implementations
- **E2E tests** for complete user workflows
- **Component tests** for UI behavior
- **Store tests** following Zustand persistence policies (see `docs/testing-policies.md`)

## Code Quality Guidelines

### Following Conventions

When making changes to files, first understand the file's code conventions. Mimic code style, use existing libraries and utilities, and follow existing patterns.

- **NEVER** assume that a given library is available, even if it is well known. Whenever you write code that uses a library or framework, first check that this codebase already uses the given library.
- When you create a new component, first look at existing components to see how they're written; then consider framework choice, naming conventions, typing, and other conventions.
- When you edit a piece of code, first look at the code's surrounding context (especially its imports) to understand the code's choice of frameworks and libraries.
- Always follow security best practices. Never introduce code that exposes or logs secrets and keys. Never commit secrets or keys to the repository.

### Code Style

- **IMPORTANT**: DO NOT ADD **_ANY_** COMMENTS unless asked
- Use TypeScript strict mode
- Follow existing naming conventions
- Implement proper error handling
- Use defensive coding practices
