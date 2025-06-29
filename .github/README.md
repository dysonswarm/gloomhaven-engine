# 🚀 CI/CD Pipeline Documentation

This directory contains GitHub Actions workflows for automated testing, building, and deployment of the Gloomhaven Digital Game Engine.

## 📋 Available Workflows

### 1. `ci.yml` - Continuous Integration Pipeline

**Triggers:** Push to `main`/`develop`, Pull Requests to `main`

**Jobs:**
- **Install Dependencies** - Caches node_modules for faster builds
- **Code Quality & Linting** - ESLint and TypeScript type checking
- **Unit Tests** - Vitest test suite with coverage reporting
- **E2E Tests** - Playwright tests across Chromium, Firefox, and WebKit
- **Build Application** - Next.js production build
- **Security Audit** - npm audit and dependency scanning
- **Accessibility Tests** - WCAG 2.1 AA compliance validation
- **Performance Tests** - Core Web Vitals and performance benchmarks
- **Status Check** - Final validation summary

**Duration:** ~8-12 minutes
**Parallel Execution:** Yes (browser tests run in parallel)

### 2. `deploy.yml` - Deployment Pipeline

**Triggers:** Push to `main`, Git tags (`v*`), Manual trigger

**Jobs:**
- **Pre-deployment Validation** - Quick smoke tests
- **Build Production Bundle** - Optimized production build
- **Production Smoke Tests** - Critical path validation
- **Create GitHub Release** - Automated releases for tags
- **Deploy to Staging** - Staging environment deployment
- **Health Check** - Post-deployment validation

**Features:**
- Automatic GitHub releases for version tags
- Production-ready build artifacts
- Deployment notifications
- Health check validation

### 3. `security.yml` - Security & Dependency Management

**Triggers:** Weekly schedule (Mondays 9 AM UTC), Dependency changes, Manual trigger

**Jobs:**
- **Security Audit** - npm audit for vulnerabilities
- **License Compliance** - License compatibility checking
- **Dependency Updates** - Outdated package detection
- **CodeQL Analysis** - Static security analysis
- **Docker Security** - Container vulnerability scanning (optional)
- **Security Summary** - Comprehensive security report

**Schedule:** Weekly automated runs
**Retention:** 30 days for security reports

### 4. `matrix-tests.yml` - Matrix Testing

**Triggers:** Weekly schedule (Sundays 6 AM UTC), Push to `develop`, Manual trigger

**Jobs:**
- **Matrix Tests** - Cross-platform testing (Node 18/20/21 × Ubuntu/Windows/macOS)
- **Browser Compatibility** - Cross-browser validation
- **Performance Benchmark** - Performance regression testing
- **Matrix Summary** - Compatibility report

**Coverage:**
- Node.js versions: 18, 20, 21
- Operating systems: Ubuntu, Windows, macOS
- Browsers: Chromium, Firefox, WebKit

## 🔧 Configuration

### Required Secrets

For full deployment functionality, configure these secrets in your GitHub repository:

```bash
# Optional: For deployment to hosting services
VERCEL_TOKEN         # Vercel deployment token
ORG_ID              # Vercel organization ID
PROJECT_ID          # Vercel project ID

# Optional: For enhanced reporting
CODECOV_TOKEN       # Code coverage reporting
```

### Environment Configuration

The pipelines use these environment variables:

```yaml
NODE_VERSION: '18'    # Primary Node.js version
CI: true             # Enables CI optimizations
NODE_ENV: production # For production builds
```

## 📊 Test Coverage

### Unit Tests (Vitest)
- **55 tests** across 4 test suites
- Type definitions, hex calculations, game state, React components
- Coverage reporting with Codecov integration

### E2E Tests (Playwright)
- **144 tests** across 4 comprehensive suites:
  - **UI Validation** (39 tests) - Component rendering and layout
  - **User Experience Flows** (27 tests) - Complete user journeys
  - **Accessibility** (45 tests) - WCAG 2.1 AA compliance
  - **Performance** (33 tests) - Core Web Vitals and optimization

### Browser Support
- ✅ **Chromium** (Chrome, Edge)
- ✅ **Firefox**
- ✅ **WebKit** (Safari)

## 🚦 Pipeline Status

### Success Criteria

A successful CI run requires:
- ✅ All linting rules pass
- ✅ TypeScript compilation succeeds
- ✅ Unit tests pass (55/55)
- ✅ E2E tests pass across all browsers
- ✅ Production build succeeds
- ✅ Security audit passes (no high/critical vulnerabilities)
- ✅ Accessibility tests pass (WCAG 2.1 AA)
- ✅ Performance tests meet thresholds

### Failure Handling

When tests fail:
- 🔍 **Artifacts** are uploaded for debugging
- 📊 **Test reports** are generated automatically
- 🖼️ **Screenshots** and traces are captured for E2E failures
- 📋 **Detailed logs** are available in job summaries

## 📈 Performance Thresholds

The pipeline enforces these performance standards:

```yaml
Page Load Time: < 5 seconds
First Contentful Paint: < 3 seconds
Cumulative Layout Shift: < 0.1
SVG Interaction Time: < 5 seconds
Scenario Startup: < 7 seconds
```

## 🔐 Security Standards

Security checks include:
- 🛡️ **Vulnerability scanning** with npm audit
- 📜 **License compliance** checking
- 🔍 **Static analysis** with CodeQL
- 🐳 **Container scanning** with Trivy (when applicable)
- 📋 **Dependency updates** monitoring

## 🚀 Deployment Process

### Staging Deployment
1. Code merged to `main` branch
2. Pre-deployment validation
3. Production build creation
4. Smoke tests execution
5. Staging deployment
6. Health check validation

### Production Release

#### Automatic Releases (Default)
1. Create git tag: `git tag v1.0.0 && git push origin v1.0.0`
2. Automated GitHub release creation
3. Production build artifacts
4. **Automatic release notes** generated from commit messages
5. Distribution package creation

#### Manual Release Notes (Optional)
For major releases with custom announcements:
1. Create `RELEASE_NOTES_v1.0.0.md` in project root
2. Write custom release notes (see [template](RELEASE_NOTES_TEMPLATE.md))
3. Create git tag: `git tag v1.0.0 && git push origin v1.0.0`
4. Pipeline automatically uses manual notes instead of generating them

## 📋 Maintenance

### Weekly Tasks (Automated)
- 🔍 Security vulnerability scanning
- 📦 Dependency update checking
- 🧪 Cross-platform compatibility testing
- ⚡ Performance regression testing

### Monthly Tasks (Manual)
- 📊 Review performance trends
- 🔄 Update dependency versions
- 🛡️ Security patch reviews
- 📈 Pipeline optimization

## 🔧 Local Development

To run the same checks locally:

```bash
# Install dependencies
npm ci

# Run linting
npm run lint

# Run unit tests
npm run test

# Run E2E tests
npm run test:e2e

# Build application
npm run build
```

## 🆘 Troubleshooting

### Common Issues

**Node.js Version Mismatch**
```bash
# Use the same Node.js version as CI
nvm use 18
```

**Playwright Browser Issues**
```bash
# Install browsers locally
npx playwright install --with-deps
```

**Memory Issues in CI**
- WebKit tests may timeout due to memory constraints
- Performance thresholds are browser-specific
- Large test suites are split across parallel jobs

### Getting Help

1. 📋 Check the [TESTING_SUMMARY.md](../TESTING_SUMMARY.md) for test details
2. 🔍 Review failed job logs in GitHub Actions
3. 📊 Download test artifacts for detailed analysis
4. 🐛 Create GitHub issues for persistent failures

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)
- [Vitest Documentation](https://vitest.dev/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Note:** This pipeline is designed for the Gloomhaven Digital Game Engine Phase 1 implementation. As the project grows, additional workflows may be added for advanced features, performance monitoring, and deployment automation.