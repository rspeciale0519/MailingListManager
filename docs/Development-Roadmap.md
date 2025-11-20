# Development Roadmap & Task List

## Mailing List Manager SaaS Platform

**Version:** 1.0
**Last Updated:** November 20, 2025
**Status:** Phase 0 Complete ✅ | Phase 1 Core Authentication Complete ✅ | Phase 1 Advanced Features In Progress

---

## ⚠️ CRITICAL DEVELOPMENT RULES

### Code Modularization Requirements

**MANDATORY: NO FILE SHALL EXCEED 450 LINES OF CODE**

This is a non-negotiable requirement for maintainability, testability, and team collaboration.

**Rules:**

1. ✅ **Maximum 450 LOC per file** (including comments, blank lines)
2. ✅ **Extract functions/classes** when approaching limit
3. ✅ **Create utility modules** for shared logic
4. ✅ **Use composition** over monolithic components
5. ✅ **Split large components** into sub-components
6. ✅ **Separate concerns**: business logic, UI, API calls

**Before Committing Code:**

```bash
# Check file sizes (run from project root)
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 > 450 {print "❌ EXCEEDS LIMIT:", $2, "has", $1, "lines"}'
find src -name "*.ts" -o -name "*.tsx" | xargs wc -l | awk '$1 <= 450 {count++} END {print "✅", count, "files within limit"}'
```

**Example Refactoring:**

```typescript
// ❌ BAD: 800-line monolithic component
// components/ContactsTable.tsx (800 LOC)

// ✅ GOOD: Split into focused modules
// components/ContactsTable/
//   ├── ContactsTable.tsx           (200 LOC) - Main orchestrator
//   ├── ContactsTableHeader.tsx     (150 LOC) - Header logic
//   ├── ContactsTableRow.tsx        (180 LOC) - Row rendering
//   ├── ContactsTableFilters.tsx    (280 LOC) - Filter panel
//   ├── BulkActionsToolbar.tsx      (220 LOC) - Bulk operations
//   └── useContactsTable.ts         (180 LOC) - Table state hook
```

---

## Table of Contents

1. [Project Setup & Infrastructure](#phase-0-project-setup--infrastructure)
2. [Authentication & Authorization](#phase-1-authentication--authorization)
3. [Core Data Management](#phase-2-core-data-management)
4. [Import Pipeline](#phase-3-import-pipeline)
5. [Deduplication System](#phase-4-deduplication-system)
6. [Export & Enrichment](#phase-5-export--enrichment)
7. [Advanced Features](#phase-6-advanced-features)
8. [Testing & Quality Assurance](#phase-7-testing--quality-assurance)
9. [Deployment & DevOps](#phase-8-deployment--devops)
10. [Post-Launch](#phase-9-post-launch)

---

## Phase 0: Project Setup & Infrastructure

### GitHub Repository Setup

- [x] **0.1 Create GitHub Repository** ✅ COMPLETE
  - [x] Initialize repository: `mailing-list-manager`
  - [x] Set repository visibility (private during development)
  - [x] Add repository description and topics
  - [x] Configure repository settings:
    - [x] Require pull request reviews (1 approval)
    - [x] Require status checks to pass
    - [x] Require branches to be up to date
    - [x] Enable delete branch on merge
    - [x] Disable force push to main
    - [x] Disable merge commits (use squash or rebase)

- [x] **0.2 Repository Structure** ✅ COMPLETE
  - [x] Create `.github/` directory structure:
    ```
    .github/
    ├── ISSUE_TEMPLATE/
    │   ├── bug_report.md
    │   ├── feature_request.md
    │   └── task.md
    ├── PULL_REQUEST_TEMPLATE.md
    ├── workflows/
    │   ├── ci.yml
    │   ├── deploy-staging.yml
    │   └── deploy-production.yml
    └── dependabot.yml
    ```
  - [x] Add CODEOWNERS file
  - [x] Add CONTRIBUTING.md
  - [x] Add CODE_OF_CONDUCT.md
  - [x] Add SECURITY.md

- [x] **0.3 Branch Strategy** ✅ COMPLETE
  - [x] Create protected branches:
    - [x] `main` (production)
    - [x] `staging` (pre-production)
    - [x] `develop` (active development)
  - [x] Configure branch protection rules:
    - [x] Require 1 approval for PRs to main
    - [x] Require passing CI checks
    - [x] Require linear history
  - [x] Document branching workflow in README

- [x] **0.4 Git Hooks & Pre-commit** ✅ COMPLETE
  - [x] Install Husky for Git hooks
  - [x] Add pre-commit hook:
    - [x] Run linter (ESLint)
    - [x] Run formatter (Prettier)
    - [x] Check file size limits (450 LOC)
    - [x] Run type check (TypeScript)
  - [x] Add commit-msg hook:
    - [x] Enforce conventional commits (commitlint)
  - [x] Add pre-push hook:
    - [x] Run unit tests

- [x] **0.5 Project Labels** ✅ COMPLETE
  - [x] Create issue labels:
    - [x] `priority: critical` (red)
    - [x] `priority: high` (orange)
    - [x] `priority: medium` (yellow)
    - [x] `priority: low` (green)
    - [x] `type: bug` (red)
    - [x] `type: feature` (blue)
    - [x] `type: enhancement` (purple)
    - [x] `type: refactor` (grey)
    - [x] `type: task` (dark blue)
    - [x] `type: docs` (light green)
    - [x] `status: blocked` (black)
    - [x] `status: in-progress` (yellow)
    - [x] `status: needs-review` (orange)
    - [x] `status: ready` (blue)
    - [x] `phase-0` through `phase-9` (numbered labels with distinct colors)
    - [x] Additional: `dependencies`, `good first issue`, `help wanted`, `performance`, `security`

- [x] **0.6 GitHub Projects** ✅ COMPLETE
  - [x] Create project board: "Mailing List Manager Development"
  - [x] Configure columns/fields:
    - [x] Status (Backlog, To Do, In Progress, In Review, Done, Blocked)
    - [x] Priority (Low, Medium, High, Critical)
    - [x] Phase (Phase 0-9)
    - [x] Assignees
    - [x] Due Date
  - [x] Create Kanban Board view grouped by Status
  - [x] Link project to repository

### Development Environment

- [x] **0.7 Initialize Monorepo Structure**
  - [x] **Git: Create feature branch** `git checkout -b setup/monorepo-structure`
  - [x] Create root `package.json` with workspaces
  - [x] Initialize frontend workspace: `apps/frontend`
  - [x] Initialize backend workspace: `apps/backend`
  - [x] Initialize shared workspace: `packages/shared`
  - [x] Configure TypeScript project references
  - [x] ⚠️ **Code Modularization Check**: Set up ESLint rule to warn on files >450 LOC
  - [x] **Git: Commit changes** `git add . && git commit -m "feat: initialize monorepo structure"`
  - [x] **Git: Push branch** `git push -u origin setup/monorepo-structure`
  - [x] **GitHub: Create PR** to `develop` branch with description
  - [ ] **GitHub: Request review** from team member
  - [ ] **GitHub: Address review comments** (if any)
  - [ ] **GitHub: Merge PR** to `develop` using squash merge
  - [ ] **Git: Delete feature branch** locally and remotely
  - [ ] **Git: Update local develop** `git checkout develop && git pull`

- [x] **0.8 Backend Setup (Node.js + TypeScript)**
  - [x] **Git: Create feature branch** `git checkout -b setup/backend-foundation`
  - [x] Initialize Node.js project
  - [x] Install dependencies:
    - [x] Fastify (web framework)
    - [x] Prisma (ORM)
    - [x] Zod (validation)
    - [x] BullMQ (job queue)
    - [x] Socket.io (WebSocket)
  - [x] Configure TypeScript (`tsconfig.json`)
  - [x] Set up folder structure (see Technical Architecture doc)
  - [x] Configure ESLint + Prettier
  - [x] ⚠️ **Create pre-commit script** to check file LOC limits
  - [x] **Git: Commit** `git commit -m "feat(backend): initialize Node.js backend with TypeScript"`
  - [x] **Git: Push** `git push -u origin setup/backend-foundation`
  - [x] **GitHub: Create PR** to `develop`
  - [x] **GitHub: Merge after approval**
  - [x] **Git: Cleanup** branches and sync develop

- [x] **0.9 Frontend Setup (React + Vite)**
  - [x] **Git: Create feature branch** `git checkout -b setup/frontend-foundation`
  - [x] Initialize Vite project with React + TypeScript
  - [x] Install dependencies:
    - [x] React Router v6
    - [x] Zustand (state management)
    - [x] React Query (server state)
    - [x] TailwindCSS + shadcn/ui
    - [x] TanStack Table
    - [x] React Hook Form + Zod
  - [x] Configure TypeScript
  - [x] Configure TailwindCSS
  - [x] Set up folder structure (see Frontend Component Structure doc)
  - [x] ⚠️ **Add file size linting** to prevent >450 LOC components
  - [x] **Git: Commit** `git commit -m "feat(frontend): initialize React app with Vite"`
  - [x] **Git: Push & Create PR** to `develop`
  - [x] **GitHub: Merge after approval**

- [x] **0.10 Database Setup (PostgreSQL)**
  - [x] Install PostgreSQL 15+
  - [x] Create development database
  - [x] Initialize Prisma schema
  - [x] Configure connection pooling
  - [x] Set up database migrations folder
  - [ ] Document database setup in README

- [x] **0.11 Redis Setup** ✅ COMPLETE
  - [x] Install Redis 7+ (Alpine image in docker-compose)
  - [x] Configure Redis connection
  - [x] Set up Redis for:
    - [x] Session storage
    - [x] Job queue (BullMQ)
    - [x] Cache layer
  - [x] Document Redis setup

- [x] **0.12 Environment Configuration**
  - [x] Create `.env.example` files for backend and frontend
  - [x] Set up environment variables:
    - [x] Database URLs
    - [ ] Redis URLs
    - [x] JWT secrets
    - [ ] AWS credentials (S3, KMS)
    - [x] API keys (Stripe, AccuZip, etc.)
  - [x] Configure dotenv loading
  - [x] Add `.env` to `.gitignore`

- [x] **0.13 Docker Setup** ✅ COMPLETE
  - [x] Create `Dockerfile` for backend (multi-stage, Node.js 18 Alpine)
  - [x] Create `Dockerfile` for frontend (multi-stage, nginx Alpine)
  - [x] Create `docker-compose.yml` for local development:
    - [x] PostgreSQL service (15-Alpine)
    - [x] Redis service (7-Alpine)
    - [x] Backend service
    - [x] Frontend service
  - [x] Create nginx.conf for SPA routing and security headers
  - [x] Create .dockerignore for optimized builds
  - [x] Test Docker setup

- [x] **0.14 Development Scripts**
  - [x] Add npm scripts to root `package.json`:
    - [x] `dev`: Start all services
    - [x] `build`: Build all packages
    - [ ] `test`: Run all tests
    - [x] `lint`: Lint all packages
    - [x] `format`: Format all code
    - [x] `check-file-sizes`: Verify 450 LOC limit
  - [ ] Document scripts in README

### CI/CD Pipeline

- [x] **0.15 GitHub Actions Workflow: CI** ✅ COMPLETE
  - [x] Create `.github/workflows/ci.yml`
  - [x] Configure triggers: push to develop, PR to main/develop
  - [x] Add CI steps:
    - [x] Checkout code
    - [x] Setup Node.js
    - [x] Install dependencies
    - [x] **Check file sizes (450 LOC limit)**
    - [x] Run linter (ESLint)
    - [x] Run type check (TypeScript)
    - [x] Run unit tests (placeholder)
    - [x] Build frontend
    - [x] Build backend
    - [x] Upload coverage reports (placeholder)

- [x] **0.16 GitHub Actions Workflow: Deploy Staging** ✅ COMPLETE
  - [x] Create `.github/workflows/deploy-staging.yml`
  - [x] Configure trigger: push to staging branch
  - [x] Add deployment steps:
    - [x] Run CI checks
    - [x] Build Docker images
    - [x] Push to container registry (GHCR)
    - [x] Deploy to staging environment (placeholder)
    - [x] Run smoke tests (placeholder)

- [x] **0.17 GitHub Actions Workflow: Deploy Production** ✅ COMPLETE
  - [x] Create `.github/workflows/deploy-production.yml`
  - [x] Configure trigger: push to main branch
  - [x] Add deployment steps (same as staging)
  - [x] Add manual approval gate (environment: production-approval)
  - [x] Add rollback capability (placeholder)
  - [x] Create GitHub releases and git tags

- [x] **0.18 Code Quality Tools** ✅ COMPLETE
  - [x] Configure Dependabot for dependency updates
  - [x] Set up Dependabot auto-merge capability
  - [x] Configure ESLint with TypeScript support
  - [x] Configure Prettier for code formatting
  - [x] Set up file size checking in pre-commit and CI

### Documentation

- [x] **0.19 README.md** ✅ COMPLETE
  - [x] Project overview
  - [x] Features list
  - [x] Tech stack
  - [x] Prerequisites
  - [x] Installation instructions
  - [x] Development workflow
  - [x] **Code modularization guidelines (450 LOC rule)**
  - [x] Testing guidelines
  - [x] Deployment process
  - [x] Contributing guidelines
  - [x] License information
  - [x] Phase completion status

- [x] **0.20 API Documentation** ✅ COMPLETE
  - [x] Set up OpenAPI/Swagger documentation (@fastify/swagger)
  - [x] Install Swagger UI (@fastify/swagger-ui)
  - [x] Configure OpenAPI 3.0 specification
  - [x] API docs available at `/docs` endpoint
  - [x] OpenAPI spec available at `/openapi.json`

**Phase 0 Checkpoint: 100% COMPLETE ✅**

- ✅ GitHub repo configured with proper branch protection (main/develop/staging)
- ✅ Development environment running locally via Docker
- ✅ CI/CD pipeline functional (ci, deploy-staging, deploy-production)
- ✅ **File size checks in place (pre-commit + CI + GitHub Actions)**
- ✅ Git hooks enforced (pre-commit, commit-msg, pre-push)
- ✅ Issue labels created and organized (30+ labels)
- ✅ GitHub Projects board with Kanban view created
- ✅ All team members can clone and run project
- ✅ Conventional Commits enforced via commitlint
- ✅ API documentation (Swagger/OpenAPI) configured

---

## GitHub Workflow Pattern (Apply to All Tasks)

**For EVERY development task from Phase 1 onwards, follow this workflow:**

### 1. Before Starting Work

```bash
# Always start from develop
git checkout develop
git pull origin develop

# Create feature branch with descriptive name
# Pattern: {type}/{phase}-{task-name}
# Examples:
#   - feature/auth-login-endpoint
#   - feature/contacts-table-component
#   - fix/import-validation-bug
#   - refactor/split-large-service
git checkout -b feature/auth-login-endpoint
```

### 2. During Development

```bash
# Make focused, atomic commits
# Follow conventional commit format:
# type(scope): description
#
# Types: feat, fix, refactor, test, docs, style, chore
# Scope: component/feature name
# Examples:
#   - feat(auth): add login endpoint
#   - fix(contacts): resolve search pagination bug
#   - refactor(import): split parser into modules (<450 LOC)
#   - test(dedup): add clustering service tests

# Commit frequently
git add .
git commit -m "feat(auth): implement JWT token generation"

# Verify file sizes before committing
npm run check-file-sizes

# If file exceeds 450 LOC, refactor immediately:
git reset --soft HEAD~1  # Undo last commit
# Split the file into smaller modules
git add .
git commit -m "refactor(auth): split auth service into modules"

# Push to remote regularly
git push origin feature/auth-login-endpoint
```

### 3. Creating Pull Request

```bash
# Before creating PR, ensure branch is up to date
git checkout develop
git pull origin develop
git checkout feature/auth-login-endpoint
git rebase develop  # or git merge develop

# Resolve any conflicts
# Run all checks
npm run lint
npm run type-check
npm run test
npm run check-file-sizes

# Push final changes
git push origin feature/auth-login-endpoint --force-with-lease  # if rebased
```

**GitHub PR Template:**

```markdown
## Description

Brief description of what this PR does.

Closes #[issue-number]

## Type of Change

- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation update

## Changes Made

- Added login endpoint at POST /auth/login
- Created JWT token generation utility
- Added unit tests for auth service
- **Verified all files <450 LOC**

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] File size limits verified

## Screenshots (if UI changes)

[Add screenshots]

## Checklist

- [ ] Code follows style guidelines (ESLint passed)
- [ ] Self-reviewed code
- [ ] **No file exceeds 450 LOC**
- [ ] Added/updated tests
- [ ] Tests pass locally
- [ ] Added/updated documentation
- [ ] No console logs or debugging code
```

### 4. Code Review Process

**For Reviewers:**

- [ ] Check that all files are under 450 LOC
- [ ] Verify code follows project conventions
- [ ] Check test coverage
- [ ] Look for potential bugs or edge cases
- [ ] Verify documentation is updated
- [ ] Request changes or approve

**For Author:**

- [ ] Address all review comments
- [ ] Make requested changes in new commits
- [ ] Push updates: `git push origin feature/auth-login-endpoint`
- [ ] Re-request review
- [ ] Resolve conversations when addressed

### 5. Merging

```bash
# After approval, merge via GitHub UI using "Squash and merge"
# This keeps develop history clean

# GitHub will automatically:
# 1. Squash all commits into one
# 2. Merge to develop
# 3. Delete the feature branch (if configured)

# Locally, sync develop
git checkout develop
git pull origin develop

# Delete local feature branch
git branch -d feature/auth-login-endpoint
```

### 6. Hotfix Workflow (for production bugs)

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-issue

# Make fix
git add .
git commit -m "fix(auth): patch critical security vulnerability"

# Create PR to main (not develop)
git push origin hotfix/critical-security-issue

# After merging to main:
# 1. Deploy to production immediately
# 2. Create another PR to merge main → develop
# 3. This keeps develop in sync with production
```

### 7. Release Workflow

```bash
# When ready to deploy to staging
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# This triggers deploy-staging.yml workflow
# Monitor deployment and run smoke tests

# When ready for production
git checkout main
git pull origin main
git merge staging
git push origin main

# This triggers deploy-production.yml workflow
# Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

---

## Git Commands Quick Reference

```bash
# Branch Management
git branch                          # List local branches
git branch -a                       # List all branches (including remote)
git branch -d branch-name           # Delete local branch (safe)
git branch -D branch-name           # Force delete local branch
git push origin --delete branch-name # Delete remote branch

# Syncing
git fetch origin                    # Fetch updates without merging
git pull origin develop             # Fetch and merge develop
git pull --rebase origin develop    # Fetch and rebase on develop

# Stashing (save work in progress)
git stash                           # Save current changes
git stash list                      # List stashes
git stash pop                       # Apply and remove latest stash
git stash apply stash@{0}           # Apply specific stash

# Undoing Changes
git reset --soft HEAD~1             # Undo last commit, keep changes staged
git reset --hard HEAD~1             # Undo last commit, discard changes
git checkout -- file.txt            # Discard changes to file
git clean -fd                       # Remove untracked files and directories

# Viewing History
git log --oneline                   # Compact log
git log --graph --oneline --all     # Visual branch graph
git show commit-hash                # Show commit details

# Rebasing (Advanced)
git rebase -i HEAD~3                # Interactive rebase last 3 commits
git rebase --continue               # Continue after resolving conflicts
git rebase --abort                  # Cancel rebase

# Cherry-picking
git cherry-pick commit-hash         # Apply specific commit to current branch
```

---

## Conventional Commit Examples

```bash
# Features
git commit -m "feat(auth): add OAuth2 login support"
git commit -m "feat(contacts): implement bulk edit functionality"
git commit -m "feat(import): add column mapping auto-detection"

# Fixes
git commit -m "fix(dedup): correct confidence score calculation"
git commit -m "fix(ui): resolve mobile responsive layout issues"

# Refactoring (Code <450 LOC)
git commit -m "refactor(import): split parser service into modules"
git commit -m "refactor(contacts): extract table hooks from component"
git commit -m "refactor(export): modularize export service (<450 LOC each)"

# Tests
git commit -m "test(auth): add unit tests for JWT service"
git commit -m "test(contacts): add integration tests for search API"

# Documentation
git commit -m "docs(api): update endpoint documentation"
git commit -m "docs(readme): add setup instructions"

# Chores
git commit -m "chore(deps): update dependencies to latest versions"
git commit -m "chore(ci): add file size check to pipeline"
```

---

## Handling Merge Conflicts

```bash
# When you encounter conflicts during merge or rebase:

# 1. See which files have conflicts
git status

# 2. Open conflicted files and look for markers:
<<<<<<< HEAD
(your changes)
=======
(incoming changes)
>>>>>>> branch-name

# 3. Manually resolve by editing the file
# Remove the markers and keep the correct code

# 4. Mark as resolved
git add resolved-file.txt

# 5. Continue the merge/rebase
git rebase --continue   # if rebasing
git commit              # if merging

# If you want to abort
git rebase --abort      # cancel rebase
git merge --abort       # cancel merge
```

---

## GitHub CLI (Optional but Recommended)

Install GitHub CLI for faster workflow:

```bash
# Install (macOS)
brew install gh

# Install (Windows)
winget install --id GitHub.cli

# Authenticate
gh auth login

# Create PR from command line
gh pr create --title "feat(auth): add login endpoint" --body "Description here"

# View PRs
gh pr list

# Check PR status
gh pr status

# Checkout PR locally for review
gh pr checkout 123

# Merge PR
gh pr merge 123 --squash

# View issues
gh issue list
```

---

## Daily Development Workflow Example

**Morning:**

```bash
# Sync with team changes
git checkout develop
git pull origin develop

# Check assigned issues
gh issue list --assignee @me

# Start new feature
git checkout -b feature/contacts-inline-edit
```

**During Day:**

```bash
# Regular commits as you work
git add .
git commit -m "feat(contacts): add inline edit trigger"
# ... continue working ...
git commit -m "feat(contacts): implement save on blur"

# Push frequently (backup + visibility)
git push origin feature/contacts-inline-edit
```

**Before Lunch/End of Day:**

```bash
# Push latest work
git push origin feature/contacts-inline-edit

# Update PR draft or create if ready
gh pr create --draft
```

**When Feature Complete:**

```bash
# Final checks
npm run lint
npm run test
npm run check-file-sizes  # ← CRITICAL

# Update from develop (in case others merged)
git fetch origin develop
git rebase origin/develop

# Push and mark PR ready
git push origin feature/contacts-inline-edit --force-with-lease
gh pr ready  # Mark draft PR as ready for review
```

**After PR Approved:**

```bash
# GitHub merges via UI (squash)
# Sync locally
git checkout develop
git pull origin develop
git branch -d feature/contacts-inline-edit
```

---

## Best Practices Summary

1. **Always work in feature branches**, never commit directly to `develop` or `main`
2. **One feature per branch**, don't mix unrelated changes
3. **Commit early and often**, don't wait for "perfect" code
4. **Write clear commit messages** following conventional commits
5. **Keep PRs focused and small** (<500 lines changed ideally)
6. **Review your own PR first** before requesting reviews
7. **Respond to review feedback promptly**
8. **Keep develop in sync** - pull frequently
9. **Delete merged branches** to keep repo clean
10. **⚠️ Check file sizes before EVERY commit** - this is non-negotiable

---

## Phase 1: Authentication & Authorization

**📌 Git Workflow Reminder:** For each task below, follow the GitHub Workflow Pattern documented above. Branch → Commit → Push → PR → Review → Merge → Cleanup.

### User Authentication

**Phase 1A: Core Authentication (Complete ✅)**

- [x] **1.1 Database Schema: Users & Auth** ✅ COMPLETE
  - [x] **Git: Branch** `feature/auth-database-schema`
  - [x] Create `users` table migration
  - [x] Create `refresh_tokens` table migration
  - [x] Add indexes for email, oauth_provider
  - [x] Run migrations
  - [x] **Verify migration file <450 LOC** (split if needed)
  - [x] **Git: Commit & Push** `feat(db): add users and refresh_tokens tables`
  - [x] **GitHub: PR to develop** → Review → Merge

- [x] **1.2 Password Hashing** ✅ COMPLETE
  - [x] **Git: Branch** `feature/auth-password-hashing`
  - [x] Install bcrypt
  - [x] Create password hashing utility (<200 LOC)
  - [x] Create password verification utility (<100 LOC)
  - [x] Write unit tests
  - [x] **Git: Commit & Push** `feat(auth): implement password hashing utilities`
  - [x] **GitHub: PR → Merge**

- [x] **1.3 JWT Token Generation** ✅ COMPLETE
  - [x] **Git: Branch** `feature/auth-jwt-tokens`
  - [x] Create JWT utility module (<250 LOC):
    - [x] `generateAccessToken()`
    - [x] `generateRefreshToken()`
    - [x] `verifyToken()`
  - [x] Configure token expiry (15min access, 30d refresh)
  - [x] Write unit tests
  - [x] **Git: Commit** `feat(auth): add JWT token generation and verification`
  - [x] **GitHub: PR → Merge**

- [x] **1.4 Registration Endpoint** ✅ COMPLETE
  - [x] **Git: Branch** `feature/auth-registration`
  - [x] Create `/auth/register` route (<100 LOC)
  - [x] Create registration controller (<200 LOC)
  - [x] Create user service with `createUser()` (<250 LOC)
  - [x] Add email validation
  - [x] Add password strength validation (Zod schema)
  - [x] Send verification email (stub for now)
  - [x] Write integration tests
  - [x] **Verify all files <450 LOC**
  - [x] **Git: Commit** `feat(auth): implement user registration endpoint`
  - [x] **GitHub: PR → Review → Merge**

- [x] **1.5 Login Endpoint** ✅ COMPLETE
  - [x] **Git: Branch** `feature/auth-login`
  - [x] Create `/auth/login` route (<100 LOC)
  - [x] Create login controller (<200 LOC)
  - [x] Verify credentials
  - [x] Generate tokens
  - [x] Store refresh token in database
  - [x] Write integration tests
  - [x] **Git: Commit & Push**
  - [x] **GitHub: PR → Merge**

- [x] **1.6 Refresh Token Endpoint** ✅ COMPLETE
  - [x] **Git: Branch** `feature/auth-refresh-token`
  - [x] Create `/auth/refresh` route (<100 LOC)
  - [x] Create refresh controller (<150 LOC)
  - [x] Validate refresh token
  - [x] Generate new access token
  - [x] Rotate refresh token
  - [x] Write integration tests
  - [x] **Git: Commit & Push → PR → Merge**

**📌 Note:** Continue following the Git workflow pattern (Branch → Code → Commit → Push → PR → Review → Merge) for all remaining tasks in Phase 1 and beyond. This pattern is assumed for brevity in the remaining tasks.

- [x] **1.7 Logout Endpoint** ✅ COMPLETE
  - [x] Create `/auth/logout` route (<50 LOC)
  - [x] Create logout controller (<100 LOC)
  - [x] Revoke refresh token
  - [x] Write integration tests

- [x] **1.8 Authentication Middleware** ✅ COMPLETE
  - [x] Create `auth.middleware.ts` (<200 LOC)
  - [x] Extract JWT from Authorization header
  - [x] Verify token signature and expiry
  - [x] Attach user to request object
  - [x] Handle token refresh on expiry
  - [x] Write unit tests

### Multi-Factor Authentication (MFA)

- [x] **1.9 MFA Setup** ✅ COMPLETE
  - [x] Install OTP library (otplib)
  - [x] Create MFA service (113 LOC):
    - [x] `setupMFA()` - generates secret and QR code URI
    - [x] `enableMFA()` - verifies code and enables MFA
    - [x] `disableMFA()` - disables MFA for user
  - [x] Create `/auth/mfa/setup` endpoint (returns QR code URI and secret)
  - [x] Create `/auth/mfa/enable` endpoint (verifies code with ±1 window tolerance)
  - [x] Generate QR code for authenticator app using otplib keyuri()
  - [x] Written and passing tests

- [x] **1.10 MFA Verification** ✅ COMPLETE
  - [x] Create `/auth/mfa/verify` endpoint (standalone verification endpoint)
  - [x] Create `/auth/mfa/disable` endpoint (revoke MFA)
  - [x] Modify login flow to check MFA status (returns `requiresMfa: true` if enabled)
  - [x] Add MFA code validation with TOTP algorithm (30-second time steps)
  - [x] Written and passing tests

### OAuth Integration

- [x] **1.11 OAuth Setup (Google)** ✅ COMPLETE
  - [x] Install google-auth-library (@google-auth-library/oauth2-client)
  - [x] Create oauth.service.ts (214 LOC) with Google OAuth strategy
  - [x] Create oauth.routes.ts (118 LOC) with callback endpoint
  - [x] Link or create user account on OAuth callback
  - [x] Verify ID token signature using Google certificates
  - [x] Generate JWT access/refresh tokens
  - [x] Written and passing integration tests

- [ ] **1.12 OAuth Setup (Microsoft)**
  - [ ] Install passport-microsoft strategy
  - [ ] Configure Microsoft OAuth (<200 LOC)
  - [ ] Create callback endpoint (<150 LOC)
  - [ ] Write integration tests

### Frontend: Authentication UI

**Phase 1A: Core Authentication UI (Complete ✅)**

- [x] **1.13 Auth Pages** ✅ COMPLETE
  - [x] Create `LoginPage.tsx` (<200 LOC)
  - [x] Create `RegisterPage.tsx` (<200 LOC)
  - [x] Create `ForgotPasswordPage.tsx` (<150 LOC)
  - [x] Add OAuth buttons
  - [x] **Ensure no component >450 LOC**

- [x] **1.14 Auth Forms** ✅ COMPLETE
  - [x] Create `LoginForm.tsx` (<250 LOC)
  - [x] Create `RegisterForm.tsx` (<300 LOC)
  - [x] Add client-side validation (Zod + React Hook Form)
  - [x] Add error handling
  - [x] Add loading states

- [x] **1.15 Auth Store (Zustand)** ✅ COMPLETE
  - [x] Create `authStore.ts` (<200 LOC)
  - [x] Implement login/logout actions
  - [x] Persist tokens to localStorage
  - [x] Auto-refresh on token expiry

- [x] **1.16 Auth API Client** ✅ COMPLETE
  - [x] Create `auth.api.ts` (<300 LOC)
  - [x] Implement API methods:
    - [x] `login()`
    - [x] `register()`
    - [x] `refresh()`
    - [x] `logout()`
  - [x] Add token interceptor to Axios

- [x] **1.17 Protected Routes** ✅ COMPLETE
  - [x] Create `ProtectedRoute` component (<150 LOC)
  - [x] Redirect to login if not authenticated
  - [x] Show loading spinner during auth check

### Password Reset

- [ ] **1.18 Password Reset Backend**
  - [ ] Create `/auth/forgot-password` endpoint (<150 LOC)
  - [ ] Generate reset token
  - [ ] Send reset email (stub)
  - [ ] Create `/auth/reset-password` endpoint (<150 LOC)
  - [ ] Validate reset token
  - [ ] Update password
  - [ ] Write tests

- [x] **1.19 Password Reset Frontend** ✅
  - [x] Create `ResetPasswordPage.tsx` (146 LOC)
  - [x] Create reset password form with validation
  - [x] Integrate with `/auth/reset-password` endpoint

**Phase 1A Checkpoint: Core Authentication (COMPLETE ✅)**

- ✅ Users can register and login
- ✅ JWT authentication working (15min access token, 30d refresh token)
- ✅ Token refresh endpoint operational
- ✅ Logout with token revocation working
- ✅ Authentication middleware protecting routes
- ✅ Frontend auth UI complete (Login, Register, Protected Routes)
- ✅ Auth store with token persistence
- ✅ 47 passing backend tests covering all core auth
- ✅ **All auth-related files <450 LOC verified**

**Phase 1B: Advanced Authentication Features (In Progress)**

- ✅ MFA optional setup available - COMPLETE
- ✅ OAuth login with Google - COMPLETE
- [ ] OAuth login with Microsoft (low priority - can be added later)
- [ ] Password reset flow (HIGH PRIORITY - essential user functionality)

---

## Phase 2: Core Data Management

### Multi-Tenancy & Organizations

- [ ] **2.1 Database Schema: Organizations**
  - [ ] Create `orgs` table migration (<200 LOC)
  - [ ] Create `org_memberships` table migration (<200 LOC)
  - [ ] Add indexes
  - [ ] Run migrations

- [ ] **2.2 Organization Service**
  - [ ] Create `org.service.ts` (<400 LOC):
    - [ ] `createOrg()`
    - [ ] `updateOrg()`
    - [ ] `deleteOrg()`
    - [ ] `getUserOrgs()`
  - [ ] Write unit tests

- [ ] **2.3 Row-Level Security (RLS)**
  - [ ] Create RLS policies for tenant isolation (<200 LOC)
  - [ ] Create `tenant.middleware.ts` (<200 LOC):
    - [ ] Extract org_id from request
    - [ ] Verify user membership
    - [ ] Set `app.org_id` in database session
  - [ ] Write integration tests

- [ ] **2.4 Organization Endpoints**
  - [ ] `GET /orgs` (<100 LOC)
  - [ ] `GET /orgs/:org_id` (<100 LOC)
  - [ ] `PATCH /orgs/:org_id` (<150 LOC)
  - [ ] `DELETE /orgs/:org_id` (<100 LOC)
  - [ ] Write tests

### Permissions System

- [ ] **2.5 Permissions Schema**
  - [ ] Define permission structure in constants (<200 LOC)
  - [ ] Create permission presets (Viewer, Editor, etc.)
  - [ ] Document permissions in README

- [ ] **2.6 Policy Engine**
  - [ ] Create `policy.service.ts` (<400 LOC):
    - [ ] `evaluate()` - check if action allowed
    - [ ] `loadPermissions()` - get user permissions
    - [ ] `evaluateRBAC()` - role-based check
    - [ ] `evaluateABAC()` - attribute-based check
  - [ ] Implement caching layer
  - [ ] Write unit tests

- [ ] **2.7 RBAC Middleware**
  - [ ] Create `rbac.middleware.ts` (<200 LOC)
  - [ ] `requirePermission(action)` decorator
  - [ ] Write integration tests

- [ ] **2.8 Team Member Management**
  - [ ] `GET /orgs/:org_id/members` (<100 LOC)
  - [ ] `POST /orgs/:org_id/members/invite` (<200 LOC)
  - [ ] `PATCH /orgs/:org_id/members/:id` (<150 LOC)
  - [ ] `DELETE /orgs/:org_id/members/:id` (<100 LOC)
  - [ ] Send invitation emails
  - [ ] Write tests

### Lists & Contacts

- [ ] **2.9 Database Schema: Lists & Contacts**
  - [ ] Create `lists` table migration (<150 LOC)
  - [ ] Create `contacts` table migration (<300 LOC)
  - [ ] Create `tags` table migration (<100 LOC)
  - [ ] Add indexes (email_hash, phone_hash, tags, FTS)
  - [ ] Run migrations
  - [ ] **Split into multiple migration files if >450 LOC total**

- [ ] **2.10 Field Encryption**
  - [ ] Create `crypto.ts` utility (<300 LOC):
    - [ ] `encrypt()`
    - [ ] `decrypt()`
    - [ ] `generateHash()` - for searchable fields
  - [ ] Integrate with AWS KMS
  - [ ] Write unit tests

- [ ] **2.11 Data Formatters**
  - [ ] Create `formatters/` module:
    - [ ] `email.formatter.ts` (<200 LOC)
    - [ ] `phone.formatter.ts` (<250 LOC)
    - [ ] `address.formatter.ts` (<400 LOC)
    - [ ] `name.formatter.ts` (<300 LOC)
    - [ ] `company.formatter.ts` (<250 LOC)
  - [ ] Write comprehensive unit tests
  - [ ] **Ensure each formatter <450 LOC**

- [ ] **2.12 Contact Service**
  - [ ] Create `contact.service.ts` (split into modules <450 LOC each):
    - [ ] `contacts.create.service.ts` (<250 LOC)
    - [ ] `contacts.update.service.ts` (<300 LOC)
    - [ ] `contacts.search.service.ts` (<400 LOC)
    - [ ] `contacts.bulk.service.ts` (<400 LOC)
  - [ ] Apply encryption on create/update
  - [ ] Apply formatting on save
  - [ ] Write unit tests

- [ ] **2.13 List Endpoints**
  - [ ] `GET /orgs/:org_id/lists` (<100 LOC)
  - [ ] `POST /orgs/:org_id/lists` (<150 LOC)
  - [ ] `GET /orgs/:org_id/lists/:list_id` (<100 LOC)
  - [ ] `PATCH /orgs/:org_id/lists/:list_id` (<100 LOC)
  - [ ] `DELETE /orgs/:org_id/lists/:list_id` (<100 LOC)
  - [ ] Write integration tests

- [ ] **2.14 Contact Endpoints**
  - [ ] `GET /orgs/:org_id/contacts` with filters (<200 LOC)
  - [ ] `POST /orgs/:org_id/contacts/search` (<250 LOC)
  - [ ] `POST /orgs/:org_id/contacts` (<150 LOC)
  - [ ] `GET /orgs/:org_id/contacts/:id` (<100 LOC)
  - [ ] `PATCH /orgs/:org_id/contacts/:id` (<150 LOC)
  - [ ] `DELETE /orgs/:org_id/contacts/:id` (<100 LOC)
  - [ ] Write integration tests

- [ ] **2.15 Bulk Operations**
  - [ ] Create `POST /orgs/:org_id/contacts/bulk` (<200 LOC)
  - [ ] Implement bulk actions:
    - [ ] Add/remove tags
    - [ ] Delete
    - [ ] Move to list
    - [ ] Update fields
  - [ ] Queue long-running operations
  - [ ] Write tests

### Frontend: Data Management UI

- [ ] **2.16 Organization Selector**
  - [ ] Create `OrgSelector.tsx` (<150 LOC)
  - [ ] Load user's orgs
  - [ ] Switch between orgs
  - [ ] Store current org in Zustand

- [ ] **2.17 Lists Page**
  - [ ] Create `ListsPage.tsx` (<250 LOC)
  - [ ] Create `ListCard.tsx` (<150 LOC)
  - [ ] Create `ListForm.tsx` (<200 LOC)
  - [ ] Add list CRUD operations
  - [ ] **Verify all components <450 LOC**

- [ ] **2.18 Contacts Table**
  - [ ] Create `ContactsTable/` module:
    - [ ] `ContactsTable.tsx` (<400 LOC) - main orchestrator
    - [ ] `ContactsTableHeader.tsx` (<150 LOC)
    - [ ] `ContactsTableRow.tsx` (<200 LOC)
    - [ ] `ContactsTableFilters.tsx` (<300 LOC)
    - [ ] `useContactsTable.ts` (<200 LOC) - table hook
  - [ ] Implement virtualized scrolling (TanStack Table)
  - [ ] Add column resizing, reordering, hide/show
  - [ ] **Critical: Split components to stay <450 LOC each**

- [ ] **2.19 Contact Detail Panel**
  - [ ] Create `ContactDetailPanel.tsx` (<350 LOC)
  - [ ] Show all contact fields
  - [ ] Add edit mode
  - [ ] Add audit history

- [ ] **2.20 Inline Contact Editing**
  - [ ] Create `InlineContactEditor.tsx` (<250 LOC)
  - [ ] Implement click-to-edit cells
  - [ ] Add validation
  - [ ] Optimistic UI updates
  - [ ] Error handling and rollback

- [ ] **2.21 Tag Management**
  - [ ] Create `TagManager.tsx` (<250 LOC)
  - [ ] Create `TagPill.tsx` (<100 LOC)
  - [ ] Create `TagPillEditor.tsx` (<150 LOC)
  - [ ] Add tag CRUD
  - [ ] Add tag filtering

- [ ] **2.22 Search & Filters**
  - [ ] Create `SearchBar.tsx` (<150 LOC)
  - [ ] Create `FilterBuilder.tsx` (<400 LOC)
  - [ ] Add debounced search
  - [ ] Add advanced filters (AND/OR logic)
  - [ ] Save filters to URL query params

- [ ] **2.23 Bulk Actions Toolbar**
  - [ ] Create `BulkActionsToolbar.tsx` (<250 LOC)
  - [ ] Add selection UI
  - [ ] Add bulk action buttons
  - [ ] Add confirmation dialogs

**Phase 2 Checkpoint:**

- ✅ Multi-tenant org system working
- ✅ Permission system enforcing access control
- ✅ Lists and contacts CRUD complete
- ✅ Field encryption implemented
- ✅ Data formatting applied consistently
- ✅ **All modules <450 LOC verified**
- ✅ Frontend can view/edit contacts

---

## Phase 3: Import Pipeline

### Backend: Import System

- [ ] **3.1 Database Schema: Imports**
  - [ ] Create `imports` table migration (<200 LOC)
  - [ ] Create `import_rows` table migration (<200 LOC)
  - [ ] Add indexes
  - [ ] Run migrations

- [ ] **3.2 File Upload Handler**
  - [ ] Create `upload.middleware.ts` (<200 LOC)
  - [ ] Configure multipart/form-data parsing
  - [ ] Add file size validation
  - [ ] Add virus scanning (ClamAV integration)
  - [ ] Upload to S3 with pre-signed URLs
  - [ ] Write tests

- [ ] **3.3 File Parser**
  - [ ] Create `parsers/` module:
    - [ ] `csv.parser.ts` (<300 LOC)
    - [ ] `xlsx.parser.ts` (<300 LOC)
    - [ ] `json.parser.ts` (<200 LOC)
  - [ ] Detect encoding
  - [ ] Parse first N rows for preview
  - [ ] Write unit tests
  - [ ] **Ensure each parser <450 LOC**

- [ ] **3.4 Column Mapping System**
  - [ ] Create `column-mapper/` module:
    - [ ] `synonym-matcher.ts` (<300 LOC) - match headers to targets
    - [ ] `confidence-scorer.ts` (<250 LOC) - score match confidence
    - [ ] `conflict-resolver.ts` (<200 LOC) - resolve duplicates
    - [ ] `mapping-memory.ts` (<250 LOC) - remember past mappings
  - [ ] Build synonym dictionary
  - [ ] Write comprehensive tests

- [ ] **3.5 Import Service**
  - [ ] Create `import.service.ts` (split into modules):
    - [ ] `import.parse.service.ts` (<350 LOC)
    - [ ] `import.validate.service.ts` (<400 LOC)
    - [ ] `import.commit.service.ts` (<350 LOC)
  - [ ] Coordinate import pipeline stages
  - [ ] Write tests

- [ ] **3.6 Import Workers**
  - [ ] Create `workers/import.worker.ts` (split into jobs):
    - [ ] `parseJob()` (<250 LOC)
    - [ ] `validateJob()` (<350 LOC)
    - [ ] `normalizeJob()` (<300 LOC)
    - [ ] `commitJob()` (<350 LOC)
  - [ ] Implement checkpointing for resume
  - [ ] Add error handling and retries
  - [ ] Write worker tests

- [ ] **3.7 Import Endpoints**
  - [ ] `POST /orgs/:org_id/imports` - start import (<150 LOC)
  - [ ] `GET /orgs/:org_id/imports/:id` - status (<100 LOC)
  - [ ] `GET /orgs/:org_id/imports/:id/preview` - preview rows (<150 LOC)
  - [ ] `POST /orgs/:org_id/imports/:id/mapping` - confirm mapping (<200 LOC)
  - [ ] `POST /orgs/:org_id/imports/:id/cancel` - cancel import (<150 LOC)
  - [ ] `GET /orgs/:org_id/imports` - list imports (<100 LOC)
  - [ ] Write integration tests

- [ ] **3.8 Import Progress WebSocket**
  - [ ] Emit real-time progress updates
  - [ ] Send stage changes (upload → parse → validate → commit)
  - [ ] Send row counts and error summaries

### Frontend: Import UI

- [ ] **3.9 Import Wizard**
  - [ ] Create `ImportWizard/` module:
    - [ ] `ImportWizard.tsx` (<300 LOC) - wizard orchestrator
    - [ ] `FileUploadStep.tsx` (<200 LOC)
    - [ ] `ColumnMappingStep.tsx` (<400 LOC)
    - [ ] `ValidationStep.tsx` (<250 LOC)
    - [ ] `ProgressStep.tsx` (<200 LOC)
  - [ ] Add step navigation
  - [ ] Add validation between steps
  - [ ] **Verify all <450 LOC**

- [ ] **3.10 Column Mapper UI**
  - [ ] Create `ColumnMapper.tsx` (<350 LOC)
  - [ ] Show source → target mapping
  - [ ] Drag-and-drop interface
  - [ ] Confidence badges
  - [ ] Conflict resolution UI
  - [ ] Create new custom field option

- [ ] **3.11 Mapping Preview**
  - [ ] Create `MappingPreview.tsx` (<250 LOC)
  - [ ] Show first 50 rows
  - [ ] Show validation badges per cell
  - [ ] Hover for transform details

- [ ] **3.12 Import Progress**
  - [ ] Create `ImportProgress.tsx` (<200 LOC)
  - [ ] Connect to WebSocket for real-time updates
  - [ ] Show stage progress bars
  - [ ] Show row counts (valid/invalid/total)
  - [ ] Show ETA
  - [ ] Add cancel button with options (reverse/keep)

- [ ] **3.13 Import History**
  - [ ] Create `ImportsPage.tsx` (<200 LOC)
  - [ ] List past imports
  - [ ] Show import stats
  - [ ] Link to created contacts

**Phase 3 Checkpoint:**

- ✅ Users can upload CSV/XLSX files
- ✅ Smart column mapping works accurately
- ✅ Validation catches errors
- ✅ Import commits to database
- ✅ Real-time progress updates
- ✅ Cancel with reverse capability
- ✅ **All import modules <450 LOC**

---

## Phase 4: Deduplication System

### Backend: Dedup Engine

- [ ] **4.1 Database Schema: Dedup**
  - [ ] Create `dedup_runs` table migration (<150 LOC)
  - [ ] Create `dedup_clusters` table migration (<200 LOC)
  - [ ] Create `dedup_merges` table migration (<200 LOC)
  - [ ] Add indexes
  - [ ] Run migrations

- [ ] **4.2 Dedup Service**
  - [ ] Create `dedup/` module:
    - [ ] `dedup.clustering.service.ts` (<400 LOC) - cluster duplicates
    - [ ] `dedup.scoring.service.ts` (<300 LOC) - confidence scoring
    - [ ] `dedup.merge.service.ts` (<400 LOC) - merge contacts
    - [ ] `dedup.undo.service.ts` (<250 LOC) - unmerge
  - [ ] Write unit tests
  - [ ] **Ensure each service <450 LOC**

- [ ] **4.3 Matching Algorithms**
  - [ ] Create `matchers/` module:
    - [ ] `exact-matcher.ts` (<200 LOC) - exact field match
    - [ ] `fuzzy-matcher.ts` (<300 LOC) - fuzzy string matching
    - [ ] `composite-matcher.ts` (<250 LOC) - multi-field scoring
  - [ ] Implement trigram similarity
  - [ ] Implement Jaro-Winkler distance
  - [ ] Write tests

- [ ] **4.4 Dedup Worker**
  - [ ] Create `workers/dedup.worker.ts` (split into jobs):
    - [ ] `clusteringJob()` (<400 LOC)
    - [ ] `mergeJob()` (<350 LOC)
  - [ ] Parallelize clustering for large datasets
  - [ ] Add progress tracking
  - [ ] Write tests

- [ ] **4.5 Dedup Endpoints**
  - [ ] `POST /orgs/:org_id/dedup/runs` - start dedup (<200 LOC)
  - [ ] `GET /orgs/:org_id/dedup/runs/:id` - status (<100 LOC)
  - [ ] `GET /orgs/:org_id/dedup/runs/:id/clusters` - get clusters (<200 LOC)
  - [ ] `POST /orgs/:org_id/dedup/runs/:id/apply` - apply merges (<250 LOC)
  - [ ] `POST /orgs/:org_id/dedup/merges/:id/undo` - undo merge (<150 LOC)
  - [ ] Write integration tests

### Frontend: Dedup UI

- [ ] **4.6 Dedup Wizard**
  - [ ] Create `DedupWizard/` module:
    - [ ] `DedupWizard.tsx` (<250 LOC)
    - [ ] `CriteriaStep.tsx` (<300 LOC) - define match rules
    - [ ] `ReviewClustersStep.tsx` (<400 LOC) - review clusters
    - [ ] `ApplyStep.tsx` (<200 LOC) - apply merges
  - [ ] Add preset rules (email, phone, etc.)
  - [ ] **Verify all <450 LOC**

- [ ] **4.7 Cluster Review UI**
  - [ ] Create `ClusterCard.tsx` (<300 LOC)
  - [ ] Show side-by-side contact comparison
  - [ ] Add survivor selection (radio buttons)
  - [ ] Show confidence score and reasons
  - [ ] Add quick action presets

- [ ] **4.8 Merge Preview**
  - [ ] Create `MergePreview.tsx` (<200 LOC)
  - [ ] Show resulting merged contact
  - [ ] Show field provenance (which source)
  - [ ] Allow field-level override

- [ ] **4.9 Bulk Cluster Actions**
  - [ ] Select multiple clusters
  - [ ] Apply rule to all (keep most complete, etc.)
  - [ ] Review exceptions manually

**Phase 4 Checkpoint:**

- ✅ Deduplication detects duplicates accurately
- ✅ Users can review clusters manually
- ✅ Survivor selection works
- ✅ Merges are reversible (undo)
- ✅ **All dedup modules <450 LOC**

---

## Phase 5: Export & Enrichment

### Backend: Export System

- [ ] **5.1 Database Schema: Exports**
  - [ ] Create `exports` table migration (<150 LOC)
  - [ ] Add indexes
  - [ ] Run migration

- [ ] **5.2 Export Service**
  - [ ] Create `export/` module:
    - [ ] `export.create.service.ts` (<300 LOC)
    - [ ] `export.generate.service.ts` (<400 LOC)
  - [ ] Support CSV, XLSX, JSON, vCard formats
  - [ ] Write tests
  - [ ] **Ensure <450 LOC per module**

- [ ] **5.3 Export Worker**
  - [ ] Create `workers/export.worker.ts` (<350 LOC)
  - [ ] Generate file in chunks
  - [ ] Upload to S3
  - [ ] Generate pre-signed download URL
  - [ ] Write tests

- [ ] **5.4 Export Endpoints**
  - [ ] `POST /orgs/:org_id/exports` - create export (<200 LOC)
  - [ ] `GET /orgs/:org_id/exports/:id` - status (<100 LOC)
  - [ ] `GET /orgs/:org_id/exports` - list exports (<100 LOC)
  - [ ] Write integration tests

### Backend: Address Validation (AccuZip)

**📖 Implementation Reference:** [AccuZIP API Integration Guide](API-AccuZip.md)

- [ ] **5.5 Database Schema: Validation**
  - [ ] Create `validation_jobs` table migration (<150 LOC)
  - [ ] Add indexes
  - [ ] Run migration
  - [ ] **Reference:** See [Database-Schema.md](Database-Schema.md) for schema details

- [ ] **5.6 AccuZip Integration**
  - [ ] Create `integrations/accuzip.client.ts` (<300 LOC)
  - [ ] Implement batch validation API calls
  - [ ] Add retry logic with backoff
  - [ ] **Reference:** [API-AccuZip.md Section 6](API-AccuZip.md#6-workflow-steps-for-mailing-list-validation-and-filtering) for upload/processing workflow
  - [ ] **Reference:** [API-AccuZip.md Section 4](API-AccuZip.md#4-api-rate-limits-and-file-constraints) for rate limits
  - [ ] Write tests

- [ ] **5.7 Validation Service**
  - [ ] Create `validation.service.ts` (<400 LOC)
  - [ ] Batch contacts for validation
  - [ ] **Implement field mapping:** MLM contacts → AccuZIP format (see [API-AccuZip.md Section 18.1](API-AccuZip.md#181-batch-upload-mlm-contacts--accuzip-csv))
  - [ ] Parse AccuZIP responses (see [API-AccuZip.md Section 19](API-AccuZip.md#19-response-transformation-examples))
  - [ ] Write results back to contacts
  - [ ] **Reference:** [API-AccuZip.md Section 5](API-AccuZip.md#5-real-time-single-address-validation-point-of-entry-api) for Point-of-Entry validation
  - [ ] Write tests

- [ ] **5.8 Validation Worker**
  - [ ] Create `workers/validate.worker.ts` (<350 LOC)
  - [ ] Process validation jobs
  - [ ] Track progress
  - [ ] **Reference:** [API-AccuZip.md Section 6.2](API-AccuZip.md#step-2-retrieve-data-quality-results-and-counts) for DQ results parsing
  - [ ] Write tests

- [ ] **5.9 Validation Endpoints**
  - [ ] `POST /orgs/:org_id/validate/start` (<200 LOC)
  - [ ] `GET /orgs/:org_id/validate/:job_id` (<100 LOC)
  - [ ] `POST /orgs/:org_id/validate/:job_id/cancel` (<100 LOC)
  - [ ] **Reference:** [API-Specification.md Validation Endpoints](API-Specification.md#validation-endpoints)
  - [ ] **Reference:** [API-AccuZip.md Section 12](API-AccuZip.md#12-webhook-implementation) for webhook setup
  - [ ] Write tests

### Backend: Skip Trace

- [ ] **5.10 Database Schema: Skip Trace**
  - [ ] Create `skiptrace_jobs` table migration (<150 LOC)
  - [ ] Add indexes
  - [ ] Run migration

- [ ] **5.11 Skip Trace Provider Integration**
  - [ ] Create `integrations/skiptrace.client.ts` (<300 LOC)
  - [ ] Support pluggable providers (Spokeo, etc.)
  - [ ] Implement API calls
  - [ ] Write tests

- [ ] **5.12 Skip Trace Service**
  - [ ] Create `skiptrace.service.ts` (<400 LOC)
  - [ ] Batch contacts for enrichment
  - [ ] Parse provider responses
  - [ ] Write results to contacts
  - [ ] Write tests

- [ ] **5.13 Skip Trace Worker**
  - [ ] Create `workers/skiptrace.worker.ts` (<350 LOC)
  - [ ] Process skip trace jobs
  - [ ] Track progress and costs
  - [ ] Write tests

- [ ] **5.14 Skip Trace Endpoints**
  - [ ] `POST /orgs/:org_id/skiptrace/start` (<200 LOC)
  - [ ] `GET /orgs/:org_id/skiptrace/:job_id` (<100 LOC)
  - [ ] `POST /orgs/:org_id/skiptrace/:job_id/cancel` (<100 LOC)
  - [ ] Write tests

### Frontend: Export & Enrichment UI

- [ ] **5.15 Export Dialog**
  - [ ] Create `ExportDialog.tsx` (<300 LOC)
  - [ ] Column selector
  - [ ] Format selector
  - [ ] Options (headers, formatted, etc.)
  - [ ] Cost estimate (if applicable)

- [ ] **5.16 Export Progress**
  - [ ] Create `ExportProgress.tsx` (<150 LOC)
  - [ ] Show generation progress
  - [ ] Show download link when ready

- [ ] **5.17 Validation Panel**
  - [ ] Create `ValidationPanel.tsx` (<300 LOC)
  - [ ] Select contacts to validate
  - [ ] Show cost estimate
  - [ ] Confirm and start
  - [ ] Show progress

- [ ] **5.18 Skip Trace Panel**
  - [ ] Create `SkipTracePanel.tsx` (<300 LOC)
  - [ ] Input field mapping
  - [ ] Cost estimate
  - [ ] Confirm and start
  - [ ] Show progress

**Phase 5 Checkpoint:**

- ✅ Users can export contacts in multiple formats
- ✅ Address validation via AccuZip working
- ✅ Skip trace enrichment operational
- ✅ Cost tracking accurate
- ✅ **All export/enrichment modules <450 LOC**

---

## Phase 6: Advanced Features

### Segments & Dynamic Lists

- [ ] **6.1 Database Schema: Segments**
  - [ ] Create `segments` table migration (<150 LOC)
  - [ ] Add indexes
  - [ ] Run migration

- [ ] **6.2 Segment Service**
  - [ ] Create `segment.service.ts` (<400 LOC)
  - [ ] Evaluate filter definitions
  - [ ] Cache segment results
  - [ ] Auto-update on data changes
  - [ ] Write tests

- [ ] **6.3 Segment Endpoints**
  - [ ] `GET /orgs/:org_id/segments` (<100 LOC)
  - [ ] `POST /orgs/:org_id/segments` (<150 LOC)
  - [ ] `GET /orgs/:org_id/segments/:id` (<100 LOC)
  - [ ] `GET /orgs/:org_id/segments/:id/contacts` (<150 LOC)
  - [ ] `PATCH /orgs/:org_id/segments/:id` (<100 LOC)
  - [ ] `DELETE /orgs/:org_id/segments/:id` (<100 LOC)
  - [ ] Write tests

- [ ] **6.4 Segment Builder UI**
  - [ ] Create `SegmentBuilder.tsx` (<350 LOC)
  - [ ] Visual filter builder (AND/OR groups)
  - [ ] Preview contact count
  - [ ] Save segment

### Custom Fields

- [ ] **6.5 Database Schema: Custom Fields**
  - [ ] Create `custom_fields` table migration (<150 LOC)
  - [ ] Add indexes
  - [ ] Run migration

- [ ] **6.6 Custom Fields Service**
  - [ ] Create `custom-fields.service.ts` (<300 LOC)
  - [ ] Create custom field definitions
  - [ ] Validate custom field data
  - [ ] Backfill existing contacts
  - [ ] Write tests

- [ ] **6.7 Custom Fields Endpoints**
  - [ ] `GET /orgs/:org_id/schema/fields` (<100 LOC)
  - [ ] `POST /orgs/:org_id/schema/fields` (<200 LOC)
  - [ ] `PATCH /orgs/:org_id/schema/fields/:id` (<150 LOC)
  - [ ] `DELETE /orgs/:org_id/schema/fields/:id` (<100 LOC)
  - [ ] Write tests

- [ ] **6.8 In-Table Column Creation**
  - [ ] Add "+ Column" button to data grid
  - [ ] Quick add: name + type
  - [ ] Advanced add: validation, formula, PII flag
  - [ ] Backfill in background

### Audit Log

- [ ] **6.9 Database Schema: Audit**
  - [ ] Verify `events_audit` table from Phase 2
  - [ ] Ensure comprehensive coverage

- [ ] **6.10 Audit Service**
  - [ ] Create `audit.service.ts` (<300 LOC)
  - [ ] Log all significant actions
  - [ ] Capture before/after state
  - [ ] Support impersonation context
  - [ ] Write tests

- [ ] **6.11 Audit Middleware**
  - [ ] Create `audit.middleware.ts` (<200 LOC)
  - [ ] Auto-log all mutating operations
  - [ ] Capture request context (IP, user agent)

- [ ] **6.12 Audit Endpoints**
  - [ ] `GET /orgs/:org_id/audit` with filters (<200 LOC)
  - [ ] `GET /orgs/:org_id/audit/:id` (<100 LOC)
  - [ ] Write tests

- [ ] **6.13 Audit Log UI**
  - [ ] Create `AuditPage.tsx` (<250 LOC)
  - [ ] Create `AuditEventDetail.tsx` (<200 LOC)
  - [ ] Show filterable log
  - [ ] Show JSON diff for changes
  - [ ] Export audit logs

### Settings & Billing

- [ ] **6.14 Database Schema: Billing**
  - [ ] Create `billing_subscriptions` table migration (<150 LOC)
  - [ ] Create `usage_counters` table migration (<150 LOC)
  - [ ] Run migrations

- [ ] **6.15 Stripe Integration**
  - [ ] Install Stripe SDK
  - [ ] Create `integrations/stripe.client.ts` (<350 LOC)
  - [ ] Create checkout sessions
  - [ ] Handle webhooks
  - [ ] Write tests

- [ ] **6.16 Billing Service**
  - [ ] Create `billing.service.ts` (<400 LOC)
  - [ ] Sync subscriptions
  - [ ] Track usage
  - [ ] Enforce quotas
  - [ ] Write tests

- [ ] **6.17 Billing Endpoints**
  - [ ] `POST /orgs/:org_id/billing/checkout` (<150 LOC)
  - [ ] `POST /orgs/:org_id/billing/portal` (<100 LOC)
  - [ ] `GET /orgs/:org_id/billing/subscription` (<100 LOC)
  - [ ] `POST /webhooks/stripe` (<250 LOC)
  - [ ] Write tests

- [ ] **6.18 Settings Pages**
  - [ ] Create `SettingsPage.tsx` (<200 LOC)
  - [ ] Create `OrgSettingsPage.tsx` (<250 LOC)
  - [ ] Create `TeamPage.tsx` (<250 LOC)
  - [ ] Create `BillingPage.tsx` (<300 LOC)
  - [ ] Create `ProfilePage.tsx` (<200 LOC)
  - [ ] **Verify all <450 LOC**

- [ ] **6.19 Permissions Matrix UI**
  - [ ] Create `PermissionsMatrix.tsx` (<400 LOC)
  - [ ] Show toggles for all permissions
  - [ ] Add presets (Viewer, Editor, etc.)
  - [ ] Preview effective permissions

**Phase 6 Checkpoint:**

- ✅ Segments working with dynamic filters
- ✅ Custom fields can be added on-the-fly
- ✅ Audit log tracking all changes
- ✅ Billing integration with Stripe
- ✅ Settings UI complete
- ✅ **All advanced feature modules <450 LOC**

---

## Phase 7: Testing & Quality Assurance

### Unit Testing

- [ ] **7.1 Backend Unit Tests**
  - [ ] Achieve 80%+ code coverage
  - [ ] Test all services
  - [ ] Test all utilities
  - [ ] Test formatters thoroughly
  - [ ] Test encryption/decryption
  - [ ] **Verify test files <450 LOC** (split if needed)

- [ ] **7.2 Frontend Unit Tests**
  - [ ] Achieve 70%+ component coverage
  - [ ] Test all custom hooks
  - [ ] Test all utilities
  - [ ] Test Zustand stores
  - [ ] **Verify test files <450 LOC**

### Integration Testing

- [ ] **7.3 API Integration Tests**
  - [ ] Test all endpoints
  - [ ] Test authentication flow
  - [ ] Test permissions enforcement
  - [ ] Test multi-tenancy isolation
  - [ ] Test import pipeline end-to-end
  - [ ] Test dedup workflow
  - [ ] Test export generation
  - [ ] **Split large test files <450 LOC**

- [ ] **7.4 Database Tests**
  - [ ] Test RLS policies
  - [ ] Test migrations
  - [ ] Test rollbacks
  - [ ] Test data integrity

### End-to-End Testing

- [ ] **7.5 E2E Test Setup**
  - [ ] Configure Playwright
  - [ ] Set up test database
  - [ ] Set up test user accounts

- [ ] **7.6 Critical Path E2E Tests**
  - [ ] User registration and login
  - [ ] Create organization
  - [ ] Import contacts
  - [ ] Search and filter contacts
  - [ ] Run deduplication
  - [ ] Export contacts
  - [ ] Invite team member
  - [ ] Update permissions
  - [ ] **Verify test files <450 LOC**

### Performance Testing

- [ ] **7.7 Load Testing**
  - [ ] Test API endpoints under load (k6 or Artillery)
  - [ ] Test contact search with 100K+ records
  - [ ] Test import of 50K rows
  - [ ] Test dedup on 10K contacts
  - [ ] Identify and fix bottlenecks

- [ ] **7.8 Frontend Performance**
  - [ ] Test grid rendering with 1000+ rows
  - [ ] Measure initial page load time
  - [ ] Optimize bundle size
  - [ ] Enable code splitting
  - [ ] Add lazy loading

### Security Testing

- [ ] **7.9 Security Audit**
  - [ ] Run OWASP ZAP scan
  - [ ] Test SQL injection prevention
  - [ ] Test XSS prevention
  - [ ] Test CSRF protection
  - [ ] Test RLS bypass attempts
  - [ ] Test authentication bypass attempts

- [ ] **7.10 Penetration Testing**
  - [ ] Hire external security firm (optional)
  - [ ] Fix identified vulnerabilities
  - [ ] Re-test fixes

**Phase 7 Checkpoint:**

- ✅ 80%+ backend test coverage
- ✅ 70%+ frontend test coverage
- ✅ All critical paths covered by E2E tests
- ✅ Performance targets met
- ✅ Security vulnerabilities addressed
- ✅ **All test files <450 LOC**

---

## Phase 8: Deployment & DevOps

### Infrastructure Setup

- [ ] **8.1 Cloud Provider Setup**
  - [ ] Create AWS account (or GCP/Azure)
  - [ ] Set up billing alerts
  - [ ] Configure IAM roles and policies

- [ ] **8.2 Kubernetes Cluster**
  - [ ] Provision EKS/GKE/AKS cluster
  - [ ] Configure node pools
  - [ ] Set up auto-scaling
  - [ ] Configure persistent volumes

- [ ] **8.3 Database (RDS/Cloud SQL)**
  - [ ] Provision PostgreSQL instance
  - [ ] Configure backups (daily + PITR)
  - [ ] Set up read replicas (optional)
  - [ ] Configure connection pooling (RDS Proxy)

- [ ] **8.4 Redis (ElastiCache/MemoryStore)**
  - [ ] Provision Redis cluster
  - [ ] Configure persistence
  - [ ] Set up replication

- [ ] **8.5 Object Storage (S3)**
  - [ ] Create S3 buckets:
    - [ ] Uploads (temp)
    - [ ] Exports (24hr retention)
    - [ ] Backups (long-term)
  - [ ] Configure lifecycle policies
  - [ ] Enable versioning on backups

- [ ] **8.6 Secrets Management**
  - [ ] Set up AWS Secrets Manager or Vault
  - [ ] Store all secrets securely
  - [ ] Configure secret rotation
  - [ ] Update deployment configs to pull secrets

- [ ] **8.7 CDN (CloudFront/Cloudflare)**
  - [ ] Configure CDN for frontend
  - [ ] Set up SSL certificates
  - [ ] Configure caching rules

### Monitoring & Observability

- [ ] **8.8 Logging**
  - [ ] Set up centralized logging (CloudWatch/Loki)
  - [ ] Configure log aggregation
  - [ ] Set up log retention policies
  - [ ] Create log dashboards

- [ ] **8.9 Metrics**
  - [ ] Set up Prometheus + Grafana
  - [ ] Configure metric scraping
  - [ ] Create dashboards:
    - [ ] System metrics (CPU, memory, disk)
    - [ ] Application metrics (requests, errors, latency)
    - [ ] Business metrics (users, imports, exports)

- [ ] **8.10 Tracing**
  - [ ] Set up Jaeger or Tempo
  - [ ] Instrument API with OpenTelemetry
  - [ ] Create trace dashboards

- [ ] **8.11 Error Tracking**
  - [ ] Set up Sentry
  - [ ] Configure error alerts
  - [ ] Add source maps for frontend

- [ ] **8.12 Uptime Monitoring**
  - [ ] Set up Pingdom or UptimeRobot
  - [ ] Monitor critical endpoints
  - [ ] Configure alerts (PagerDuty/Slack)

### Deployment

- [ ] **8.13 Container Registry**
  - [ ] Set up container registry (ECR/GCR/GHCR)
  - [ ] Configure image retention policy

- [ ] **8.14 Helm Charts**
  - [ ] Create Helm chart for backend
  - [ ] Create Helm chart for frontend
  - [ ] Create Helm chart for workers
  - [ ] Parameterize all configs

- [ ] **8.15 Staging Environment**
  - [ ] Deploy to staging cluster
  - [ ] Run smoke tests
  - [ ] Verify all features working

- [ ] **8.16 Production Environment**
  - [ ] Deploy to production cluster
  - [ ] Run smoke tests
  - [ ] Verify DNS and SSL
  - [ ] Enable monitoring

- [ ] **8.17 Blue-Green Deployment**
  - [ ] Configure blue-green strategy
  - [ ] Test rollback procedure
  - [ ] Document deployment process

### Backup & Disaster Recovery

- [ ] **8.18 Backup Verification**
  - [ ] Test database restore from backup
  - [ ] Test S3 restore from backup
  - [ ] Document restore procedures

- [ ] **8.19 Disaster Recovery Plan**
  - [ ] Document DR procedures
  - [ ] Test multi-region failover (if applicable)
  - [ ] Create runbooks for common incidents

**Phase 8 Checkpoint:**

- ✅ Infrastructure fully provisioned
- ✅ Monitoring and logging operational
- ✅ Staging environment deployed and tested
- ✅ Production environment deployed
- ✅ Backups verified
- ✅ DR plan documented

---

## Phase 9: Post-Launch

### Launch Preparation

- [ ] **9.1 Final Security Review**
  - [ ] Review all secrets management
  - [ ] Verify SSL/TLS configuration
  - [ ] Check firewall rules
  - [ ] Review IAM permissions

- [ ] **9.2 Performance Optimization**
  - [ ] Enable CDN caching
  - [ ] Optimize database queries
  - [ ] Enable HTTP/2
  - [ ] Compress responses (gzip/brotli)

- [ ] **9.3 Legal & Compliance**
  - [ ] Add Terms of Service
  - [ ] Add Privacy Policy
  - [ ] Add Cookie Policy
  - [ ] Implement GDPR compliance (if applicable)
  - [ ] Implement CCPA compliance (if applicable)

- [ ] **9.4 Analytics**
  - [ ] Set up Google Analytics or PostHog
  - [ ] Track key metrics (signups, imports, exports)
  - [ ] Set up conversion funnels

- [ ] **9.5 Customer Support**
  - [ ] Set up support email
  - [ ] Create help documentation
  - [ ] Set up live chat (Intercom/Zendesk)
  - [ ] Create FAQ page

### Launch

- [ ] **9.6 Soft Launch**
  - [ ] Invite beta users
  - [ ] Collect feedback
  - [ ] Fix critical issues

- [ ] **9.7 Public Launch**
  - [ ] Announce on social media
  - [ ] Submit to Product Hunt
  - [ ] Write launch blog post
  - [ ] Email marketing list

### Post-Launch Monitoring

- [ ] **9.8 Monitor Metrics**
  - [ ] Daily active users (DAU)
  - [ ] Sign-up conversion rate
  - [ ] Error rates
  - [ ] Performance metrics

- [ ] **9.9 User Feedback**
  - [ ] Collect user feedback
  - [ ] Prioritize feature requests
  - [ ] Address bugs quickly

- [ ] **9.10 Iterate**
  - [ ] Plan Phase 2 features
  - [ ] Optimize based on usage patterns
  - [ ] Scale infrastructure as needed

**Phase 9 Checkpoint:**

- ✅ Application launched publicly
- ✅ Monitoring active and healthy
- ✅ User feedback loop established
- ✅ Support channels operational

---

## GitHub Issue Creation Template

For each task in this roadmap, create a GitHub issue using this template:

```markdown
**Title:** [Phase X.Y] Task Name

**Labels:**

- phase-X
- type:feature (or type:bug, type:refactor)
- priority:medium (or high/low)

**Description:**
Brief description of the task.

**Acceptance Criteria:**

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] **Code <450 LOC verified**

**Related Tasks:**

- Depends on: #issue-number
- Blocks: #issue-number

**Estimated Time:** X hours/days

**Technical Notes:**

- Any specific implementation details
- File size considerations
- Modularization approach if approaching 450 LOC
```

---

## Code Quality Checklist (Pre-Commit)

Before committing any code, verify:

- [ ] ✅ **No file exceeds 450 lines of code**
- [ ] ✅ ESLint passes with no errors
- [ ] ✅ TypeScript compiles with no errors
- [ ] ✅ Prettier formatting applied
- [ ] ✅ Unit tests pass
- [ ] ✅ Code reviewed (if in team)
- [ ] ✅ Commit message follows conventional commits

```bash
# Run this before every commit
npm run check-file-sizes
npm run lint
npm run type-check
npm run test
npm run format
```

---

## Pull Request Checklist

Before creating a PR:

- [ ] ✅ All code quality checks pass
- [ ] ✅ **File size limits verified (<450 LOC)**
- [ ] ✅ Tests added/updated
- [ ] ✅ Documentation updated (if needed)
- [ ] ✅ No merge conflicts
- [ ] ✅ Linked to issue(s)
- [ ] ✅ Screenshots added (for UI changes)
- [ ] ✅ Performance impact assessed

---

## Final Notes

**Development Timeline Estimate:**

- Phase 0: 1 week
- Phase 1: 2 weeks
- Phase 2: 3 weeks
- Phase 3: 2 weeks
- Phase 4: 2 weeks
- Phase 5: 2 weeks
- Phase 6: 2 weeks
- Phase 7: 2 weeks
- Phase 8: 1 week
- Phase 9: Ongoing

**Total:** ~17 weeks (4+ months) for 1-2 developers

**Critical Success Factors:**

1. ✅ **Strict adherence to 450 LOC limit**
2. ✅ Comprehensive testing at each phase
3. ✅ Regular code reviews
4. ✅ Incremental deployment to staging
5. ✅ User feedback early and often

**Modularization Examples to Reference:**

- See `02-Technical-Architecture.md` for service splitting patterns
- See `05-Frontend-Component-Structure.md` for component splitting
- Use composition over inheritance
- Extract utilities aggressively
- Create hooks for complex logic
- Split controllers by CRUD operations

---

**End of Development Roadmap**

**Remember:** The 450 LOC limit is not a suggestion—it's a requirement for long-term maintainability!
