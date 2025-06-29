import { test, expect } from '@playwright/test'

test.describe('UI Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display main page with correct title and header', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Gloomhaven/)
    
    // Check main header
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
    
    // Check subtitle
    await expect(page.getByText(/A comprehensive implementation of the Gloomhaven board game with 5-player support/i)).toBeVisible()
  })

  test('should display game status panel with initial values', async ({ page }) => {
    // Check Game Status panel exists
    await expect(page.getByRole('heading', { name: /Game Status/i })).toBeVisible()
    
    // Check initial status values
    await expect(page.getByText(/Phase:.*campaign/i)).toBeVisible()
    await expect(page.getByText(/Characters:.*0/i)).toBeVisible()
    await expect(page.getByText(/Party Members:.*0/i)).toBeVisible()
  })

  test('should display controls panel with start demo button', async ({ page }) => {
    // Check Controls panel
    await expect(page.getByRole('heading', { name: /Controls/i })).toBeVisible()
    
    // Check Start Demo button
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    await expect(startButton).toBeVisible()
    await expect(startButton).toBeEnabled()
  })

  test('should display implementation status panel', async ({ page }) => {
    // Check Implementation Status panel
    await expect(page.getByRole('heading', { name: /Implementation Status/i })).toBeVisible()
    
    // Check completed items
    await expect(page.getByText(/Core Types.*✓ Complete/i)).toBeVisible()
    await expect(page.getByText(/Hex Grid System.*✓ Complete/i)).toBeVisible()
    await expect(page.getByText(/Game State Store.*✓ Complete/i)).toBeVisible()
    await expect(page.getByText(/Basic Game Board.*✓ Complete/i)).toBeVisible()
    
    // Check pending items
    await expect(page.getByText(/Combat System.*⚠ Pending/i)).toBeVisible()
    await expect(page.getByText(/Character System.*⚠ Pending/i)).toBeVisible()
  })

  test('should display about phase 1 information', async ({ page }) => {
    // Check About Phase 1 panel
    await expect(page.getByRole('heading', { name: /About Phase 1/i })).toBeVisible()
    
    // Check description content
    await expect(page.getByText(/Phase 1 establishes the core foundation/i)).toBeVisible()
  })

  test('should show no scenario message initially', async ({ page }) => {
    // Check that game board shows no scenario message
    await expect(page.getByText(/No active scenario. Start a scenario to see the game board./i)).toBeVisible()
  })

  test('should have responsive layout on different screen sizes', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
    
    // Check that content is still accessible on mobile
    await expect(page.getByRole('button', { name: /Start Demo Scenario/i })).toBeVisible()
  })

  test('should apply correct CSS styles and classes', async ({ page }) => {
    // Check main container classes
    const mainContainer = page.locator('div.min-h-screen.bg-gray-50').first()
    await expect(mainContainer).toBeVisible()
    
    // Check header styles
    const header = page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })
    await expect(header).toHaveClass(/text-3xl font-bold text-gray-800/)
    
    // Check button styles
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    await expect(startButton).toHaveClass(/bg-blue-600 text-white/)
  })

  test('should display all required UI components', async ({ page }) => {
    // Count main sections
    const sections = page.locator('div.bg-white.rounded-lg.shadow')
    await expect(sections).toHaveCount(4) // Game Status, Controls, Implementation Status, About Phase 1
    
    // Check specific sections exist
    await expect(page.getByText(/Game Status/)).toBeVisible()
    await expect(page.getByText(/Controls/)).toBeVisible()
    await expect(page.getByText(/Implementation Status/)).toBeVisible()
    await expect(page.getByText(/About Phase 1/)).toBeVisible()
  })

  test('should have proper text content and formatting', async ({ page }) => {
    // Check that text is properly formatted and readable
    const statusItems = page.locator('text=/Phase:|Characters:|Party Members:/')
    for (const item of await statusItems.all()) {
      await expect(item).toBeVisible()
    }
    
    // Check implementation status items
    const statusTypes = ['Core Types', 'Hex Grid System', 'Game State Store', 'Basic Game Board']
    for (const statusType of statusTypes) {
      await expect(page.getByText(statusType)).toBeVisible()
    }
    
    // Check that there are 4 completed items
    const completedItems = page.getByText('✓ Complete')
    await expect(completedItems).toHaveCount(4)
  })

  test('should load without JavaScript errors', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    // Load the page
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check no JavaScript errors occurred
    expect(errors).toHaveLength(0)
  })

  test('should have fast page load performance', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
    const loadTime = Date.now() - startTime
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Check that main content is visible quickly
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
  })
})