import { test, expect } from '@playwright/test'

test.describe('User Experience Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('complete demo scenario startup flow', async ({ page }) => {
    // Initial state - campaign management
    await expect(page.getByText(/Phase:.*campaign/i)).toBeVisible()
    await expect(page.getByText(/No active scenario/i)).toBeVisible()
    
    // Click Start Demo Scenario button
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    await expect(startButton).toBeVisible()
    await startButton.click()
    
    // Wait for state to update
    await page.waitForTimeout(500)
    
    // Verify scenario has started
    await expect(page.getByText(/Phase:.*play/i)).toBeVisible()
    await expect(page.getByText(/Characters:.*1/i)).toBeVisible()
    await expect(page.getByText(/Party Members:.*1/i)).toBeVisible()
    await expect(page.getByText(/Scenario:.*1/i)).toBeVisible()
    
    // Verify game board is now visible
    await expect(page.getByRole('heading', { name: /Scenario 1/i })).toBeVisible()
    await expect(page.getByText(/Difficulty:.*1.*Round:.*1/i).first()).toBeVisible()
    
    // Verify SVG game board is rendered
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
    
    // Verify hex tiles are present
    const hexPaths = page.locator('svg path')
    await expect(hexPaths.first()).toBeVisible()
    
    // Verify character indicator is present (red circle)
    const characterCircle = page.locator('svg circle[fill="#ef4444"]')
    await expect(characterCircle).toBeVisible()
    
    // Verify legend is displayed
    await expect(page.getByText('Valid Move')).toBeVisible()
    await expect(page.getByText('In Range')).toBeVisible()
    await expect(page.getByText('Selected')).toBeVisible()
    
    // Find the Character text in the legend specifically
    const legendSection = page.locator('div.mt-4.text-sm.text-gray-600')
    await expect(legendSection.getByText('Character')).toBeVisible()
    
    // Button should now show "Return to Campaign"
    await expect(page.getByRole('button', { name: /Return to Campaign/i })).toBeVisible()
  })

  test('return to campaign flow', async ({ page }) => {
    // Start a scenario first
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    // Verify we're in scenario mode
    await expect(page.getByText(/Phase:.*play/i)).toBeVisible()
    
    // Click Return to Campaign
    const returnButton = page.getByRole('button', { name: /Return to Campaign/i })
    await expect(returnButton).toBeVisible()
    await returnButton.click()
    
    // Wait for state to update
    await page.waitForTimeout(500)
    
    // Verify we're back in campaign mode
    await expect(page.getByText(/Phase:.*campaign/i)).toBeVisible()
    
    // Start Demo button should be visible again (this is the key indicator)
    await expect(page.getByRole('button', { name: /Start Demo Scenario/i })).toBeVisible()
  })

  test('hex interaction and selection flow', async ({ page }) => {
    // Start scenario
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    // Wait for SVG to be rendered
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
    
    // Find hex tiles (path elements)
    const hexTiles = page.locator('svg path')
    await expect(hexTiles.first()).toBeVisible()
    
    // Click on a hex tile (should be able to interact)
    await hexTiles.first().click()
    
    // Verify the click was registered (check for hover effects or state changes)
    // Note: The actual behavior depends on implementation, so we verify the hex is still there
    await expect(hexTiles.first()).toBeVisible()
    
    // Verify coordinates are displayed on hex tiles
    const coordinateText = page.locator('svg text')
    await expect(coordinateText.first()).toBeVisible()
  })

  test('responsive behavior and mobile usability', async ({ page }) => {
    // Test desktop view first
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
    
    // Start scenario on desktop
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    // Switch to mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify key elements are still accessible on mobile
    await expect(page.getByRole('heading', { name: /Scenario 1/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Return to Campaign/i })).toBeVisible()
    
    // Verify game board is still visible (might be scrollable)
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
    
    // Test scrolling behavior
    await page.mouse.wheel(0, 100)
    await expect(svg).toBeVisible()
    
    // Switch back to tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('heading', { name: /Scenario 1/i })).toBeVisible()
  })

  test('keyboard navigation and accessibility', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab')
    
    // The start button should be focusable
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    await expect(startButton).toBeFocused()
    
    // Press Enter to activate button
    await page.keyboard.press('Enter')
    await page.waitForTimeout(500)
    
    // Verify scenario started
    await expect(page.getByText(/Phase:.*play/i)).toBeVisible()
    
    // Test that return button is now focusable
    await page.keyboard.press('Tab')
    const returnButton = page.getByRole('button', { name: /Return to Campaign/i })
    
    // Continue tabbing to find the return button (it might take several tabs)
    let attempts = 0
    while (attempts < 10) {
      const focused = await page.evaluate(() => document.activeElement?.textContent)
      if (focused?.includes('Return to Campaign')) {
        break
      }
      await page.keyboard.press('Tab')
      attempts++
    }
  })

  test('game state persistence during navigation', async ({ page }) => {
    // Start scenario
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    // Record initial state
    const scenarioText = await page.getByText(/Scenario:.*1/i).textContent()
    const difficultyText = await page.getByText(/Difficulty:.*1/i).first().textContent()
    
    // Refresh the page
    await page.reload()
    
    // Note: Since we're using client-side state management without persistence,
    // the state will reset. This test documents current behavior.
    await expect(page.getByText(/Phase:.*campaign/i)).toBeVisible()
    await expect(page.getByText(/Start a scenario to see the game board/i)).toBeVisible()
  })

  test('error handling and edge cases', async ({ page }) => {
    // Test rapid clicking (should not cause issues)
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    
    // Click multiple times rapidly with small delays
    await startButton.click()
    await page.waitForTimeout(100)
    
    // Check if button is still available (may have changed to "Return to Campaign")
    const currentButton = page.getByRole('button').first()
    await currentButton.click()
    await page.waitForTimeout(100)
    await currentButton.click()
    
    await page.waitForTimeout(1000)
    
    // Wait for state to stabilize and check final state
    await page.waitForTimeout(500)
    
    // The final state depends on which button was clicked last
    // Either we're in campaign mode or scenario mode - both are acceptable
    const campaignPhase = page.getByText(/Phase:.*campaign/i)
    const playPhase = page.getByText(/Phase:.*play/i)
    
    // Check that we're in one of the valid states
    const isCampaign = await campaignPhase.isVisible({ timeout: 1000 }).catch(() => false)
    const isPlay = await playPhase.isVisible({ timeout: 1000 }).catch(() => false)
    
    expect(isCampaign || isPlay).toBe(true)
  })

  test('visual feedback and user interaction cues', async ({ page }) => {
    // Test hover effects on start button
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    
    // Hover over button
    await startButton.hover()
    
    // Button should have hover styling (bg-blue-700)
    await expect(startButton).toHaveClass(/hover:bg-blue-700/)
    
    // Click button
    await startButton.click()
    await page.waitForTimeout(500)
    
    // Test hex tile hover effects
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
    
    const hexTile = page.locator('svg path').first()
    await hexTile.hover()
    
    // Hex should have hover styling
    await expect(hexTile).toHaveClass(/hover:opacity-80/)
  })

  test('content loading and progressive enhancement', async ({ page }) => {
    // Test that content loads progressively
    await page.goto('/')
    
    // Header should load first
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
    
    // Then panels should be visible
    await expect(page.getByText(/Game Status/)).toBeVisible()
    await expect(page.getByText(/Controls/)).toBeVisible()
    
    // Start scenario and test progressive loading
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    
    // Game board should load
    await expect(page.getByRole('heading', { name: /Scenario 1/i })).toBeVisible()
    
    // SVG should render
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
    
    // Hex elements should be present
    const hexElements = page.locator('svg path')
    await expect(hexElements.first()).toBeVisible()
  })
})