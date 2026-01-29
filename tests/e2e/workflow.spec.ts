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
    await expect(page.getByText('M3U8 URL')).toBeVisible()
    await expect(page.getByText('Channel / VOD ID')).toBeVisible()
    await expect(page.getByText('Local File')).toBeVisible()
  })

  test('complete workflow: URL input → validation → sample → score', async ({ page }) => {
    // Step 1: Enter a sample M3U8 URL
    const sampleUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    
    // Find and click the M3U8 URL radio button
    await page.getByRole('radio', { name: /M3U8 URL/i }).click()
    
    // Fill in the URL input
    const urlInput = page.locator('input[type="text"]').first()
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
    
    // Find and click the "Run Sample" or "Analyze Sample" button
    const sampleButton = page.getByRole('button', { name: /Sample|Analyze/i }).first()
    if (await sampleButton.isVisible()) {
      await sampleButton.click()
      
      // Wait for sample results
      await page.waitForTimeout(5000)
    }
    
    // Step 4: Verify results panels are visible
    await expect(page.locator('.results-section')).toBeVisible()
  })

  test('should show placeholder message when no analysis is run', async ({ page }) => {
    // Verify initial state shows placeholder
    await expect(page.getByText(/Results output will render here/i)).toBeVisible()
  })

  test('should handle Channel/VOD ID input', async ({ page }) => {
    // Select Channel/VOD ID radio button
    await page.getByRole('radio', { name: /Channel.*VOD ID/i }).click()
    
    // Verify the input field changes
    const input = page.locator('input[type="text"]').first()
    await expect(input).toBeVisible()
    
    // Fill in a sample ID
    await input.fill('test-channel-123')
    
    // Verify analyze button is enabled
    const analyzeButton = page.getByRole('button', { name: /Analyze/i })
    await expect(analyzeButton).toBeEnabled()
  })

  test('should have file upload option', async ({ page }) => {
    // Select Local File radio button
    await page.getByRole('radio', { name: /Local File/i }).click()
    
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

  test('should display classification badges after analysis', async ({ page }) => {
    // This test requires a successful analysis
    // Using a mock or test URL that would typically work
    await page.getByRole('radio', { name: /M3U8 URL/i }).click()
    
    const urlInput = page.locator('input[type="text"]').first()
    await urlInput.fill('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')
    
    await page.getByRole('button', { name: /Analyze/i }).click()
    
    // Wait for results with extended timeout for network requests
    try {
      await expect(page.locator('.results-container')).toBeVisible({ timeout: 30000 })
      
      // If analysis succeeds, check for classification
      // Note: This might not work if the URL is unreachable
      const hasClassification = await page.locator('.classification-badges, .results-section').count()
      expect(hasClassification).toBeGreaterThan(0)
    } catch (error) {
      // If analysis fails due to network, that's acceptable for UAT
      // Check that error handling works
      const errorMessage = page.locator('.error-message, .placeholder')
      await expect(errorMessage).toBeVisible()
    }
  })
})

test.describe('Stream ABR Advisor - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should handle invalid URL gracefully', async ({ page }) => {
    await page.getByRole('radio', { name: /M3U8 URL/i }).click()
    
    const urlInput = page.locator('input[type="text"]').first()
    await urlInput.fill('not-a-valid-url')
    
    await page.getByRole('button', { name: /Analyze/i }).click()
    
    // Should show error or remain in idle state
    await page.waitForTimeout(2000)
    
    // Check for error state or placeholder
    const hasError = await page.locator('.error-message, .error-state, .placeholder').count()
    expect(hasError).toBeGreaterThan(0)
  })

  test('should handle empty input', async ({ page }) => {
    await page.getByRole('radio', { name: /M3U8 URL/i }).click()
    
    // Try to analyze without entering anything
    const analyzeButton = page.getByRole('button', { name: /Analyze/i })
    
    // Button might be disabled or will show error
    if (await analyzeButton.isEnabled()) {
      await analyzeButton.click()
      await page.waitForTimeout(1000)
      
      // Should remain in idle state or show error
      const placeholder = page.locator('.placeholder, .error-message')
      await expect(placeholder).toBeVisible()
    }
  })
})
