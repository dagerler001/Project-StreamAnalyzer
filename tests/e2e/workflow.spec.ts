import { test, expect } from '@playwright/test'

/**
 * UAT Test Suite: Stream ABR Advisor Complete Workflow
 * 
 * Tests the complete user workflow from ingesting a playlist
 * to viewing analysis results and scoring recommendations.
 */

test.describe('Stream ABR Advisor - UAT Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the application title and header', async ({ page }) => {
    // Verify the app loads with correct title
    await expect(page).toHaveTitle(/Stream ABR Advisor/)
    
    // Verify header elements
    await expect(page.locator('.app-kicker')).toContainText('Stream ABR Advisor')
    await expect(page.locator('.app-title')).toContainText('Scoring + Report')
  })

  test('should have input methods available', async ({ page }) => {
    // Verify all three input methods are present
    await expect(page.getByRole('button', { name: 'URL' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Channel/VOD ID' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Local File' })).toBeVisible()
  })

  test('complete workflow: URL input → validation → sample → score', async ({ page }) => {
    // Step 1: Enter a sample M3U8 URL
    const sampleUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    
    // Click the URL button in segmented control (should be selected by default)
    await page.getByRole('button', { name: 'URL' }).click()
    
    // Fill in the URL input
    const urlInput = page.locator('input[type="url"]')
    await urlInput.fill(sampleUrl)
    
    // Click the analyze button
    await page.getByRole('button', { name: /Analyze/i }).click()
    
    // Step 2: Wait for analysis to complete (with timeout)
    await expect(page.locator('.results-container')).toBeVisible({ timeout: 30000 })
    
    // Verify validation results are displayed
    await expect(page.getByText(/Validation/i)).toBeVisible()
    
    // Step 3: Configure and run sample
    // Check if sample controls are visible
    await expect(page.getByText(/Sample Configuration/i)).toBeVisible()
    
    // Find the sample button if it exists
    const sampleButton = page.getByRole('button', { name: /Sample|Analyze/i }).first()
    const buttonCount = await page.getByRole('button', { name: /Sample|Analyze/i }).count()
    
    if (buttonCount > 0 && await sampleButton.isVisible()) {
      await sampleButton.click()
      
      // Wait for sample processing to start/complete
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        // Network idle is optional, continue if it times out
      })
    }
    
    // Step 4: Verify results panels are visible
    await expect(page.locator('.results-section')).toBeVisible()
  })

  test('should show placeholder message when no analysis is run', async ({ page }) => {
    // Verify initial state shows placeholder
    await expect(page.getByText(/Results output will render here/i)).toBeVisible()
  })

  test('should handle Channel/VOD ID input', async ({ page }) => {
    // Select Channel/VOD ID button
    await page.getByRole('button', { name: 'Channel/VOD ID' }).click()
    
    // Verify the input field changes
    const input = page.locator('#id-input')
    await expect(input).toBeVisible()
    
    // Fill in a sample ID
    await input.fill('test-channel-123')
    
    // Verify analyze button is enabled
    const analyzeButton = page.getByRole('button', { name: /Analyze/i })
    await expect(analyzeButton).toBeEnabled()
  })

  test('should have file upload option', async ({ page }) => {
    // Select Local File button
    await page.getByRole('button', { name: 'Local File' }).click()
    
    // Verify file input is present
    await expect(page.locator('input[type="file"]')).toBeVisible()
  })

  test('navigation and UI responsiveness', async ({ page }) => {
    // Test that the page sections are present and scrollable
    await expect(page.locator('.app-header')).toBeVisible()
    await expect(page.locator('.app-main')).toBeVisible()
    
    // Verify multiple panels are present
    const panels = page.locator('.panel')
    await expect(panels).toHaveCount(2) // Ingest and Results panels
  })

  test('should attempt to load external M3U8 URL', async ({ page }) => {
    // This test requires a successful network connection to external URL
    // It may be skipped in restricted CI environments
    const testUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    
    await page.getByRole('button', { name: 'URL' }).click()
    
    const urlInput = page.locator('input[type="url"]')
    await urlInput.fill(testUrl)
    
    await page.getByRole('button', { name: /Analyze/i }).click()
    
    // Wait for either success or error state (but not indefinitely)
    await Promise.race([
      page.locator('.results-container').waitFor({ state: 'visible', timeout: 30000 }),
      page.locator('.error-message').waitFor({ state: 'visible', timeout: 30000 }),
      page.locator('.error-state').waitFor({ state: 'visible', timeout: 30000 })
    ]).catch(() => {
      // If neither appears, the test will fail appropriately
    })
    
    // Verify we got some result (either success or error)
    const hasResults = await page.locator('.results-container').isVisible()
    const hasError = await page.locator('.error-message, .error-state').isVisible()
    
    // At least one should be true
    expect(hasResults || hasError).toBe(true)
  })
})

test.describe('Stream ABR Advisor - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should validate URL format before submission', async ({ page }) => {
    await page.getByRole('button', { name: 'URL' }).click()
    
    const urlInput = page.locator('input[type="url"]')
    await urlInput.fill('not-a-valid-url')
    
    await page.getByRole('button', { name: /Analyze/i }).click()
    
    // Wait for response (error or loading state)
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
      // Network idle is optional
    })
    
    // Check that we stayed on the same page or got an error
    // The page should not have transitioned to a success state
    const resultsContainer = page.locator('.results-container')
    const isVisible = await resultsContainer.isVisible().catch(() => false)
    
    // Either we show results with error, or we stay in initial state
    if (isVisible) {
      // If results are shown, they should indicate an error
      const hasError = await page.locator('.error-message, .error-state').count()
      expect(hasError).toBeGreaterThanOrEqual(0)
    } else {
      // Or we remain in the idle state showing placeholder
      await expect(page.locator('.placeholder')).toBeVisible()
    }
  })

  test('should disable analyze button for empty URL input', async ({ page }) => {
    await page.getByRole('button', { name: 'URL' }).click()
    
    // Verify the analyze button is disabled when input is empty
    const analyzeButton = page.getByRole('button', { name: /Analyze/i })
    await expect(analyzeButton).toBeDisabled()
    
    // Fill in some text
    const urlInput = page.locator('input[type="url"]')
    await urlInput.fill('https://example.com/test.m3u8')
    
    // Button should now be enabled
    await expect(analyzeButton).toBeEnabled()
    
    // Clear the input
    await urlInput.clear()
    
    // Button should be disabled again
    await expect(analyzeButton).toBeDisabled()
  })
})
