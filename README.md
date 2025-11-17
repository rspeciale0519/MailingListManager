# Mailing List Manager

> A comprehensive SaaS platform for importing, cleaning, organizing, and managing large-scale mailing list data with enterprise-grade security and powerful deduplication.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933)](https://nodejs.org/)

---

## 🚀 Overview

The **Mailing List Manager** is a multi-tenant SaaS application that helps businesses and organizations manage their contact lists with professional-grade tools for data import, validation, deduplication, and export. Built with modern technologies and designed for scalability, it supports from solo entrepreneurs to enterprise teams.

### Key Features

- ✅ **Smart Import System** - Intelligent column mapping with ML-assisted field detection
- ✅ **Advanced Deduplication** - Cluster-based duplicate detection with manual review
- ✅ **Field Encryption** - PII fields encrypted at rest with AWS KMS
- ✅ **Address Validation** - AccuZip/USPS integration for deliverability verification
- ✅ **Skip Trace Enrichment** - Add additional contact information from third-party providers
- ✅ **Dynamic Segments** - Create smart lists with complex filter criteria
- ✅ **Granular Permissions** - Role-based + attribute-based access control
- ✅ **Audit Logging** - Complete audit trail for compliance and security
- ✅ **Multi-Format Export** - Export to CSV, XLSX, JSON, vCard
- ✅ **Real-Time Progress** - WebSocket-powered live updates for long-running jobs

---

## 📋 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Architecture](#-architecture)
3. [Prerequisites](#-prerequisites)
4. [Installation](#-installation)
5. [Development Workflow](#-development-workflow)
6. [Code Standards](#-code-standards)
7. [Testing](#-testing)
8. [Deployment](#-deployment)
9. [Documentation](#-documentation)
10. [Contributing](#-contributing)
11. [License](#-license)

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (global state) + React Query (server state)
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: TailwindCSS 3+
- **Data Grid**: TanStack Table (React Table v8)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Fastify (high-performance REST API)
- **Database**: PostgreSQL 15+ (with Row-Level Security)
- **ORM**: Prisma
- **Job Queue**: BullMQ (Redis-backed)
- **WebSocket**: Socket.io
- **Validation**: Zod

### Infrastructure
- **Cache/Queue**: Redis 7+
- **Object Storage**: AWS S3 (or compatible)
- **Encryption**: AWS KMS
- **Container**: Docker + Docker Compose
- **Orchestration**: Kubernetes (production)
- **CI/CD**: GitHub Actions

### Monitoring & Observability
- **Logs**: Structured JSON logging
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry + Jaeger
- **Error Tracking**: Sentry
- **APM**: DataDog (optional)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│                      (React SPA + Mobile)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer + CDN                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        ┌────────────┐ ┌────────────┐ ┌────────────┐
        │ API Server │ │   Worker   │ │  WebSocket │
        │  (Fastify) │ │   Queue    │ │   Server   │
        │            │ │  (BullMQ)  │ │ (Socket.io)│
        └────────────┘ └────────────┘ └────────────┘
                │             │             │
                └─────────────┼─────────────┘
                              ▼
        ┌────────────┬────────────┬────────────┐
        │ PostgreSQL │   Redis    │    S3      │
        │  (Primary) │  (Cache)   │  (Files)   │
        └────────────┴────────────┴────────────┘
```

### Multi-Tenancy Model

- **Soft Multi-Tenancy**: All tenants share database with Row-Level Security (RLS)
- **Data Isolation**: `org_id` enforced on every query via RLS policies
- **Encryption**: Field-level encryption for PII using org-specific KMS keys
- **Optional**: Database-per-tenant for Enterprise customers

See [02-Technical-Architecture.md](./02-Technical-Architecture.md) for detailed architecture documentation.

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **npm** 10.x or higher (comes with Node.js)
- **Docker** 24.x or higher ([Download](https://www.docker.com/))
- **Docker Compose** v2.x or higher
- **Git** 2.x or higher
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (or use Docker)

### Optional Tools

- **GitHub CLI** (`gh`) for faster workflow
- **Postman** or **Insomnia** for API testing
- **pgAdmin** or **DBeaver** for database management

### Accounts Needed

- **AWS Account** (for S3, KMS, deployment)
- **Stripe Account** (for billing)
- **AccuZip Account** (for address validation)
- **GitHub Account** (for source control)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/mailing-list-manager.git
cd mailing-list-manager
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 3. Environment Configuration

Create environment files for backend and frontend:

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend
cp apps/frontend/.env.example apps/frontend/.env
```

Edit `.env` files with your configuration:

**Backend** (`apps/backend/.env`):
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mailing_list_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=mailing-list-uploads-dev
KMS_KEY_ID=alias/mailing-list-dev

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AccuZip
ACCUZIP_API_KEY=your-api-key

# Server
PORT=3000
NODE_ENV=development
```

**Frontend** (`apps/frontend/.env`):
```env
VITE_API_URL=http://localhost:3000/v1
VITE_WS_URL=http://localhost:3000
```

### 4. Start Development Services

Using Docker Compose (recommended):

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

Or install locally:
- [PostgreSQL Installation](https://www.postgresql.org/download/)
- [Redis Installation](https://redis.io/download)

### 5. Database Setup

```bash
# Run migrations
npm run db:migrate

# Seed database with sample data (optional)
npm run db:seed
```

### 6. Start Development Servers

```bash
# Start all services (backend + frontend + workers)
npm run dev

# Or start individually:
npm run dev:backend   # Backend API (port 3000)
npm run dev:frontend  # Frontend (port 5173)
npm run dev:workers   # Background workers
```

### 7. Verify Installation

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/health
- **API Docs**: http://localhost:3000/docs (Swagger UI)

**Default test account:**
- Email: `admin@example.com`
- Password: `password123`

---

## 💻 Development Workflow

### Branching Strategy

We use **Git Flow** with three main branches:

- `main` - Production code (protected)
- `staging` - Pre-production testing (protected)
- `develop` - Active development (protected)

### Feature Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   ```bash
   # Make your changes
   npm run lint      # Check code style
   npm run test      # Run tests
   npm run check-file-sizes  # Verify <450 LOC
   ```

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description of change"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `docs:` - Documentation changes
   - `chore:` - Maintenance tasks

4. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   
   # Create pull request (via GitHub CLI)
   gh pr create --title "feat: your feature name" --body "Description"
   ```

5. **Code Review & Merge**
   - Wait for CI checks to pass
   - Address review feedback
   - Merge using "Squash and merge"

See [06-Development-Roadmap.md](./06-Development-Roadmap.md) for comprehensive Git workflow documentation.

---

## 📏 Code Standards

### Critical Rule: 450 LOC Maximum

**⚠️ NO FILE SHALL EXCEED 450 LINES OF CODE**

This is a **non-negotiable** requirement for:
- Maintainability
- Testability
- Code review efficiency
- Team collaboration

**Enforcement:**
```bash
# Check file sizes before every commit
npm run check-file-sizes

# Pre-commit hook will reject commits with files >450 LOC
git commit  # Automatically checks file sizes
```

**How to Split Large Files:**

✅ **Good Example:**
```typescript
// ❌ BAD: 800 LOC monolithic file
// services/contact.service.ts (800 LOC)

// ✅ GOOD: Split into focused modules
// services/contacts/
//   ├── contact.create.service.ts    (200 LOC)
//   ├── contact.update.service.ts    (220 LOC)
//   ├── contact.search.service.ts    (380 LOC)
//   ├── contact.bulk.service.ts      (400 LOC)
//   └── index.ts                     (50 LOC - exports)
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced on commit
- **Prettier**: Auto-format on save
- **Naming Conventions**:
  - Components: PascalCase (`ContactsTable.tsx`)
  - Functions: camelCase (`getUserById`)
  - Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
  - Types/Interfaces: PascalCase (`User`, `ContactFilters`)

### File Organization

```
src/
├── api/              # API client functions
├── components/       # Feature components
├── shared/           # Reusable components
├── pages/            # Route components
├── hooks/            # Custom React hooks
├── store/            # Zustand stores
├── lib/              # Utility functions
├── types/            # TypeScript types
└── constants/        # App constants
```

Each module should be **self-contained** with clear responsibilities.

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run backend tests only
npm run test:backend

# Run frontend tests only
npm run test:frontend

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage Goals

- **Backend**: 80%+ code coverage
- **Frontend**: 70%+ component coverage
- **Integration**: All API endpoints
- **E2E**: All critical user paths

### Writing Tests

**Unit Test Example:**
```typescript
// formatters/email.formatter.test.ts
import { formatEmail } from './email.formatter';

describe('formatEmail', () => {
  it('should lowercase email', () => {
    expect(formatEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
  });

  it('should trim whitespace', () => {
    expect(formatEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('should validate format', () => {
    expect(() => formatEmail('invalid')).toThrow('Invalid email');
  });
});
```

**Integration Test Example:**
```typescript
// auth.test.ts
import request from 'supertest';
import { app } from '../src/app';

describe('POST /auth/login', () => {
  it('should return tokens for valid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);

    expect(response.body.data).toHaveProperty('access_token');
    expect(response.body.data).toHaveProperty('refresh_token');
  });
});
```

### E2E Testing

We use **Playwright** for end-to-end tests:

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Generate E2E test report
npm run test:e2e:report
```

---

## 🚢 Deployment

### Environments

- **Development**: Local Docker setup
- **Staging**: Kubernetes cluster (auto-deploy from `staging` branch)
- **Production**: Kubernetes cluster (manual deploy from `main` branch)

### Deployment Process

1. **Deploy to Staging**
   ```bash
   git checkout staging
   git merge develop
   git push origin staging
   # Triggers deploy-staging.yml workflow
   ```

2. **Run Smoke Tests**
   ```bash
   npm run test:smoke:staging
   ```

3. **Deploy to Production**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   # Triggers deploy-production.yml workflow (requires approval)
   ```

4. **Tag Release**
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

### Manual Deployment (Emergency)

```bash
# Build Docker images
docker build -t mailing-list-api:latest -f apps/backend/Dockerfile .
docker build -t mailing-list-frontend:latest -f apps/frontend/Dockerfile .

# Push to registry
docker push your-registry/mailing-list-api:latest
docker push your-registry/mailing-list-frontend:latest

# Deploy to Kubernetes
kubectl apply -f k8s/
kubectl rollout status deployment/api
kubectl rollout status deployment/frontend
```

See [08-Deployment.md](./docs/08-deployment.md) for detailed deployment documentation.

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

### Core Documentation

1. **[Product Requirements Document (PRD)](./01-PRD.md)**
   - Features overview
   - User stories
   - Success metrics

2. **[Technical Architecture](./02-Technical-Architecture.md)**
   - System design
   - Component breakdown
   - Technology decisions

3. **[Database Schema](./03-Database-Schema.md)**
   - Table definitions
   - Relationships
   - Indexes and constraints

4. **[API Specification](./04-API-Specification.md)**
   - All endpoints documented
   - Request/response examples
   - Authentication flows

5. **[Frontend Component Structure](./05-Frontend-Component-Structure.md)**
   - Component organization
   - State management
   - Routing

6. **[Development Roadmap](./06-Development-Roadmap.md)**
   - Complete task list with checkboxes
   - GitHub workflow instructions
   - Phase-by-phase implementation guide

### API Documentation

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI Spec**: http://localhost:3000/openapi.json

### Additional Resources

- [Contributing Guidelines](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)
- [Changelog](./CHANGELOG.md)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/your-username/mailing-list-manager.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-contribution
   ```

3. **Make Changes**
   - Follow code standards (especially 450 LOC limit)
   - Add tests for new features
   - Update documentation

4. **Run Quality Checks**
   ```bash
   npm run lint
   npm run type-check
   npm run test
   npm run check-file-sizes  # ← CRITICAL
   ```

5. **Commit & Push**
   ```bash
   git commit -m "feat: your contribution description"
   git push origin feature/your-contribution
   ```

6. **Create Pull Request**
   - Provide clear description
   - Link related issues
   - Wait for review

### Contribution Guidelines

- ✅ Follow existing code style
- ✅ Write tests for new code
- ✅ Keep files under 450 LOC
- ✅ Update documentation
- ✅ Use conventional commits
- ✅ Be respectful and professional

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 🐛 Bug Reports & Feature Requests

### Reporting Bugs

1. Search existing issues first
2. Use the bug report template
3. Include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots (if applicable)
   - Environment details

### Requesting Features

1. Check if feature already requested
2. Use the feature request template
3. Explain:
   - Use case
   - Expected behavior
   - Why it's valuable

---

## 📊 Project Status

### Current Version

**v0.1.0** - Alpha (In Development)

### Roadmap

- ✅ Phase 0: Infrastructure Setup (Complete)
- 🚧 Phase 1: Authentication & Authorization (In Progress)
- ⏳ Phase 2: Core Data Management (Planned)
- ⏳ Phase 3: Import Pipeline (Planned)
- ⏳ Phase 4: Deduplication System (Planned)
- ⏳ Phase 5: Export & Enrichment (Planned)
- ⏳ Phase 6: Advanced Features (Planned)
- ⏳ Phase 7: Testing & QA (Planned)
- ⏳ Phase 8: Deployment (Planned)

See [06-Development-Roadmap.md](./06-Development-Roadmap.md) for detailed timeline.

---

## 📞 Support

### Community Support

- **GitHub Issues**: [Open an issue](https://github.com/your-org/mailing-list-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/mailing-list-manager/discussions)

### Commercial Support

For enterprise support, please contact: support@mailinglistmanager.com

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Team

### Core Contributors

- **[Your Name]** - Project Lead & Full Stack Developer
- **[Team Member 2]** - Backend Developer
- **[Team Member 3]** - Frontend Developer

### Acknowledgments

- Thanks to all contributors who help improve this project
- Inspired by modern SaaS best practices
- Built with ❤️ using open-source technologies

---

## 🔗 Links

- **Website**: https://mailinglistmanager.com
- **Documentation**: https://docs.mailinglistmanager.com
- **Status Page**: https://status.mailinglistmanager.com
- **Blog**: https://blog.mailinglistmanager.com
- **Twitter**: [@mailinglistmgr](https://twitter.com/mailinglistmgr)

---

## ⭐ Show Your Support

If you find this project useful, please consider:

- ⭐ Starring the repository
- 🍴 Forking and contributing
- 📢 Sharing with others
- 💬 Providing feedback

---

**Built with modern technologies and best practices. Ready for production at scale.**

**Version:** 1.0.0 | **Last Updated:** November 11, 2025
