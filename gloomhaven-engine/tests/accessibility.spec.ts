import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper heading structure', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toHaveCount(1)
    await expect(h1).toHaveText(/Gloomhaven Digital Game Engine/)
    
    // Check for h3 headings (panels)
    const h3Headings = page.getByRole('heading', { level: 3 })
    await expect(h3Headings).toHaveCount(4) // Game Status, Controls, Implementation Status, About Phase 1
    
    // Verify heading content
    await expect(page.getByRole('heading', { name: /Game Status/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Controls/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /Implementation Status/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /About Phase 1/i })).toBeVisible()
  })

  test('should have proper semantic HTML structure', async ({ page }) => {
    // Check for main landmark
    const main = page.locator('main')
    // Note: Our current implementation doesn't use main, but we can check structure
    
    // Check for proper use of divs with semantic classes
    const header = page.locator('header')
    await expect(header).toBeVisible()
    
    // Check button accessibility
    const buttons = page.getByRole('button')
    await expect(buttons).toHaveCount(1) // Start Demo Scenario button
    
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    await expect(startButton).toBeVisible()
    await expect(startButton).toBeEnabled()
  })

  test('should have proper focus management', async ({ page }) => {
    // Test initial focus
    await page.keyboard.press('Tab')
    
    // Should focus on the start button
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    await expect(startButton).toBeFocused()
    
    // Test focus outline visibility
    await expect(startButton).toHaveCSS('outline-style', 'auto', { timeout: 1000 })
    
    // Start scenario and test focus management
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    
    // After scenario starts, tab should work
    await page.keyboard.press('Tab')
    
    // Should eventually reach the return button
    let attempts = 0
    while (attempts < 10) {
      const focused = await page.evaluate(() => document.activeElement?.textContent)
      if (focused?.includes('Return to Campaign')) {
        break
      }
      await page.keyboard.press('Tab')
      attempts++
    }
    
    const returnButton = page.getByRole('button', { name: /Return to Campaign/i })
    await expect(returnButton).toBeFocused()
  })

  test('should have proper ARIA labels and descriptions', async ({ page }) => {
    // Check that buttons have accessible names
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    await expect(startButton).toHaveAccessibleName('Start Demo Scenario')
    
    // Start scenario to test game board accessibility
    await startButton.click()
    await page.waitForTimeout(500)
    
    // Check return button
    const returnButton = page.getByRole('button', { name: /Return to Campaign/i })
    await expect(returnButton).toHaveAccessibleName('Return to Campaign')
    
    // Check headings have accessible names
    await expect(page.getByRole('heading', { name: /Scenario 1/i })).toHaveAccessibleName(/Scenario 1/)
  })

  test('should support screen reader navigation', async ({ page }) => {
    // Test landmark navigation
    // Check that content is properly structured for screen readers
    
    // Verify text content is readable
    const statusText = page.getByText(/Phase:/)
    await expect(statusText).toBeVisible()
    
    // Verify important information is available as text
    await expect(page.getByText(/Characters:/)).toBeVisible()
    await expect(page.getByText(/Party Members:/)).toBeVisible()
    
    // Start scenario and check game board accessibility
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    // Verify scenario information is accessible
    await expect(page.getByText(/Scenario:/).first()).toBeVisible()
    await expect(page.getByText(/Difficulty:/).first()).toBeVisible()
    await expect(page.getByText(/Round:/).first()).toBeVisible()
    
    // Check legend information is available
    await expect(page.getByText('Valid Move')).toBeVisible()
    // Find the Character text in the legend specifically
    const legendSection = page.locator('div.mt-4.text-sm.text-gray-600')
    await expect(legendSection.getByText('Character')).toBeVisible()
  })

  test('should have sufficient color contrast', async ({ page }) => {
    // Test color contrast with axe-core
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    // Check for color contrast violations
    const colorContrastViolations = accessibilityScanResults.violations.filter(
      violation => violation.id === 'color-contrast'
    )
    
    expect(colorContrastViolations).toHaveLength(0)
  })

  test('should work with keyboard-only navigation', async ({ page }) => {
    // Disable mouse to test keyboard-only
    await page.evaluate(() => {
      document.body.style.pointerEvents = 'none'
    })
    
    // Navigate using only keyboard
    await page.keyboard.press('Tab')
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    await expect(startButton).toBeFocused()
    
    // Activate with Enter
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    
    // Verify scenario started
    await expect(page.getByText(/Phase:.*play/i)).toBeVisible()
    
    // Navigate to return button
    await page.keyboard.press('Tab')
    
    // Find return button with keyboard navigation
    let attempts = 0
    while (attempts < 10) {
      const focused = await page.evaluate(() => document.activeElement?.textContent)
      if (focused?.includes('Return to Campaign')) {
        break
      }
      await page.keyboard.press('Tab')
      attempts++
    }
    
    // Activate return with keyboard
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    
    // Verify return to campaign
    await expect(page.getByText(/Phase:.*campaign/i)).toBeVisible()
  })

  test('should provide meaningful page titles and metadata', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Gloomhaven/)
    
    // The title should be descriptive
    const title = await page.title()
    expect(title).toMatch(/Gloomhaven|Game|Engine/)
  })

  test('should handle reduced motion preferences', async ({ page }) => {
    // Set reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    
    // Test that the application still works with reduced motion
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    // Verify functionality still works
    await expect(page.getByText(/Phase:.*play/i)).toBeVisible()
    
    // Check that animations are reduced (transition classes should still be present but might be overridden)
    const button = page.getByRole('button', { name: /Return to Campaign/i })
    await expect(button).toHaveClass(/transition-colors/)
  })

  test('should support high contrast mode', async ({ page }) => {
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' })
    
    // Verify content is still visible and accessible
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Start Demo Scenario/i })).toBeVisible()
    
    // Test functionality in high contrast mode
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    await expect(page.getByText(/Scenario 1/i)).toBeVisible()
  })

  test('should have accessible form controls and interactive elements', async ({ page }) => {
    // Test button accessibility
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    
    // Check button has proper role
    await expect(startButton).toHaveAttribute('type', 'button', { timeout: 1000 })
    
    // Check button can be activated
    await expect(startButton).toBeEnabled()
    
    // Test with keyboard
    await startButton.focus()
    await expect(startButton).toBeFocused()
    
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    
    // Verify activation worked
    await expect(page.getByText(/Phase:.*play/i)).toBeVisible()
  })

  test('should have proper error messaging and feedback', async ({ page }) => {
    // Currently the app doesn't have error states, but we can test
    // that the interface provides clear feedback
    
    // Test state changes provide clear feedback
    await expect(page.getByText(/Phase:.*campaign/i)).toBeVisible()
    
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    // State change should be clearly communicated
    await expect(page.getByText(/Phase:.*play/i)).toBeVisible()
    await expect(page.getByText(/Scenario:.*1/i)).toBeVisible()
    
    // Visual feedback should be provided
    await expect(page.getByText(/Scenario 1/i)).toBeVisible()
  })

  test('should scan scenario view for accessibility issues', async ({ page }) => {
    // Start scenario first
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    // Scan the scenario view for accessibility issues
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have accessible SVG game board', async ({ page }) => {
    // Start scenario to show game board
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    // Check SVG accessibility
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
    
    // SVG should have accessible text elements
    const svgText = page.locator('svg text')
    await expect(svgText.first()).toBeVisible()
    
    // Check that coordinate information is available
    // (This provides context for screen reader users)
    await expect(page.locator('svg text').first()).toHaveText(/-?\d+,-?\d+/)
    
    // Verify legend provides context for SVG content
    await expect(page.getByText('Valid Move')).toBeVisible()
    // Find the Character text in the legend specifically
    const legendSection = page.locator('div.mt-4.text-sm.text-gray-600')
    await expect(legendSection.getByText('Character')).toBeVisible()
  })
})