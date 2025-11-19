# Contributing to Mailing List Manager

Thank you for your interest in contributing to the Mailing List Manager! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+ (optional for development)
- Git

### Local Setup

1. **Fork and clone the repository**

```bash
git clone git@github.com:YOUR_USERNAME/MailingListManager.git
cd MailingListManager
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
# Edit .env files with your configuration
```

4. **Run database migrations**

```bash
cd apps/backend
npx prisma migrate dev
```

5. **Start development servers**

```bash
npm run dev
```

## Development Workflow

### Branch Strategy

We follow a Git Flow-inspired branching strategy:

- `main` - Production-ready code
- `staging` - Pre-production testing
- `develop` - Active development
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `refactor/*` - Code refactoring

### Starting New Work

```bash
# Always start from develop
git checkout develop
git pull origin develop

# Create a feature branch
git checkout -b feature/your-feature-name
```

### During Development

```bash
# Make focused, atomic commits
git add .
git commit -m "feat(scope): description"

# Push regularly
git push origin feature/your-feature-name
```

## Code Standards

### **CRITICAL: 450 Line of Code Limit**

**NO FILE SHALL EXCEED 450 LINES OF CODE**

This is a non-negotiable requirement. Before committing:

```bash
npm run check-file-sizes
```

If a file exceeds 450 LOC:

1. Extract functions/classes into separate modules
2. Create utility files for shared logic
3. Split components into sub-components
4. Separate business logic from UI

### Code Quality Checklist

Before committing:

- [ ] ✅ **No file exceeds 450 lines of code**
- [ ] ✅ ESLint passes (`npm run lint`)
- [ ] ✅ TypeScript compiles (`npm run type-check`)
- [ ] ✅ Tests pass (`npm run test`)
- [ ] ✅ Prettier formatting applied (`npm run format`)

### Testing Requirements

- Unit tests for all services and utilities
- Integration tests for API endpoints
- E2E tests for critical user flows
- Maintain >80% backend coverage, >70% frontend coverage

## Pull Request Process

### Before Creating PR

1. **Update from develop**

```bash
git checkout develop
git pull origin develop
git checkout feature/your-feature-name
git rebase develop
```

2. **Run all checks**

```bash
npm run lint
npm run type-check
npm run test
npm run check-file-sizes
```

3. **Push changes**

```bash
git push origin feature/your-feature-name --force-with-lease
```

### Creating the PR

1. Go to GitHub and create a Pull Request to `develop`
2. Fill out the PR template completely
3. Link related issues
4. Add screenshots for UI changes
5. Request review from maintainers

### PR Review Process

- Address all review comments
- Make changes in new commits
- Re-request review when ready
- Resolve conversations when addressed

### Merging

- PRs are merged using "Squash and merge"
- Ensure the squashed commit message is clear and descriptive
- Delete the feature branch after merge

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `test` - Adding tests
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `chore` - Maintenance tasks

### Examples

```bash
feat(auth): add JWT token refresh endpoint

Implements automatic token refresh when access token expires.
Includes unit tests and integration tests.

Closes #123

---

fix(contacts): resolve pagination bug on search

The search endpoint was not correctly handling page offsets
when filters were applied.

Closes #456

---

refactor(import): split parser service into modules

Parser service exceeded 450 LOC limit. Split into:
- csv.parser.ts (300 LOC)
- xlsx.parser.ts (300 LOC)
- json.parser.ts (200 LOC)
```

## Need Help?

- Check existing issues and documentation
- Ask questions in pull request comments
- Contact maintainers: rspeciale0519@github

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
