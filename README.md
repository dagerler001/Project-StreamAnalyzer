# Stream ABR Advisor - UAT Testing

This repository includes comprehensive User Acceptance Testing (UAT) using Playwright with Chrome browser automation.

## Testing Infrastructure

### E2E Tests with Playwright

The project uses Playwright for end-to-end testing with Chrome/Chromium browser. Tests verify:

- ✅ Application loading and UI rendering
- ✅ Input method selection (URL, Channel/VOD ID, File)
- ✅ User interaction flows
- ✅ Navigation and responsiveness
- ✅ Error handling and validation

### Running Tests

```bash
# Install dependencies
npm install

# Run E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive debugging)
npm run test:e2e:ui

# Run with headed browser (visible)
npm run test:e2e:headed

# Run unit tests
npm test
```

### Test Structure

```
tests/
├── e2e/
│   ├── workflow.spec.ts    # UAT workflow tests
│   └── README.md           # E2E testing documentation
```

### CI/CD Integration

UAT tests run automatically via GitHub Actions:
- On push to `main` or `develop` branches
- On pull requests
- Manual workflow dispatch

See `.github/workflows/uat.yml` for configuration.

### Test Results

**Current Status**: 7/10 tests passing

Core UI interaction tests are stable. Some tests depend on external network resources and may fail in restricted environments.

See `tests/e2e/README.md` for detailed test documentation.

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── analysis/      # M3U8 parsing and analysis
├── components/    # React UI components
├── hooks/         # Custom React hooks
├── report/        # Reporting components
├── scoring/       # Scoring engine and rules
└── types/         # TypeScript type definitions

tests/
├── e2e/          # E2E tests with Playwright
└── (unit tests)  # Co-located with source files
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Testing**: Vitest (unit), Playwright (E2E)
- **Browser Automation**: Playwright with Chrome
- **CI/CD**: GitHub Actions

## Documentation

- [E2E Testing Guide](tests/e2e/README.md)
- [Project Overview](.planning/PROJECT.md)
- [Roadmap](.planning/ROADMAP.md)

## License

This project is private and proprietary.
