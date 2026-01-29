# E2E Tests - User Acceptance Testing (UAT)

This directory contains end-to-end tests for the Stream ABR Advisor application using Playwright with Chrome browser.

## Overview

The UAT tests verify the complete user workflow:
1. **Ingest**: Loading and analyzing M3U8 playlists via URL, Channel/VOD ID, or local file
2. **Validation**: RFC 8216 validation and playlist classification
3. **Sampling**: Time-window sampling and metrics extraction
4. **Scoring**: Policy-based scoring with recommendations

## Test Results

**Current Status**: 7/10 tests passing

### Passing Tests ✅
- Application loading and UI elements
- Input method selection (URL, ID, File)
- Placeholder messages
- Channel/VOD ID input handling
- File upload option visibility
- Navigation and UI responsiveness
- Empty input validation

### Known Limitations ⚠️
Some tests depend on external network resources and may fail in CI or restricted environments:
- Complete workflow test (requires external M3U8 URL access)
- Classification badges test (requires successful network request)
- Invalid URL handling (may vary based on browser security)

## Running Tests

### Locally

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with headed browser (visible)
npm run test:e2e:headed
```

### In CI/CD

Tests run automatically in GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

See `.github/workflows/uat.yml` for the CI configuration.

## Test Structure

- `workflow.spec.ts` - Complete user workflow tests
  - Application loading and UI elements
  - Input method selection (URL, ID, File)
  - Analysis and validation flow
  - Error handling and edge cases

## Configuration

Tests are configured in `playwright.config.ts`:
- Browser: Chrome (Chromium)
- Base URL: http://localhost:5173 (Vite dev server)
- Automatic dev server startup
- Screenshot on failure
- Trace on first retry

## Test Fixtures

Tests use public test streams where available:
- Mux test stream: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`

**Note**: Tests that depend on external URLs may fail if those URLs are unreachable or blocked by network policies.

## Debugging

```bash
# Run tests in debug mode
npx playwright test --debug

# Show test report
npx playwright show-report

# Run specific test file
npx playwright test tests/e2e/workflow.spec.ts

# Run specific test
npx playwright test -g "should display the application title"
```

## Requirements

- Node.js 18+
- Chrome/Chromium browser (installed automatically by Playwright)

## Notes

- Tests may fail if external URLs are unreachable (network-dependent)
- Some tests include timeout handling for network requests
- Error handling tests verify graceful degradation
- UI interaction tests (7/10) are stable and network-independent
- Full workflow tests may require additional mocking for CI environments
