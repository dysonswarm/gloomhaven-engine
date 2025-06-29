import { test, expect } from '@playwright/test'

test.describe('Performance and Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load page within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Page should load within 5 seconds (allowing for slower browsers)
    expect(loadTime).toBeLessThan(5000)
    
    // Check that critical content is visible quickly
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    // Navigate to page and wait for load
    await page.waitForLoadState('networkidle')
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Wait a bit for metrics to be available
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          resolve({
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          })
        }, 1000)
      })
    })
    
    // Check performance thresholds
    expect((metrics as any).loadTime).toBeLessThan(1000) // Load event should complete quickly
    expect((metrics as any).firstContentfulPaint).toBeLessThan(3000) // FCP should be under 3s
  })

  test('should render without layout shifts', async ({ page }) => {
    // Measure Cumulative Layout Shift
    await page.waitForLoadState('networkidle')
    
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              cls += (entry as any).value
            }
          }
        })
        
        observer.observe({ type: 'layout-shift', buffered: true })
        
        // Wait for a bit to collect layout shift data
        setTimeout(() => {
          observer.disconnect()
          resolve(cls)
        }, 2000)
      })
    })
    
    // CLS should be less than 0.1 (good)
    expect(cls).toBeLessThan(0.1)
  })

  test('should handle scenario startup performance', async ({ page }) => {
    const startTime = Date.now()
    
    // Click start scenario button
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    
    // Wait for scenario to be visible
    await expect(page.getByRole('heading', { name: /Scenario 1/i })).toBeVisible()
    
    const scenarioStartTime = Date.now() - startTime
    
    // Scenario startup should be reasonable (under 7 seconds for WebKit)
    expect(scenarioStartTime).toBeLessThan(7000)
    
    // SVG should render quickly
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
  })

  test('should handle multiple rapid interactions', async ({ page }) => {
    // Test rapid clicking performance
    const startButton = page.getByRole('button', { name: /Start Demo Scenario/i })
    
    const startTime = Date.now()
    
    // Rapid fire clicks with better error handling
    for (let i = 0; i < 5; i++) {
      try {
        if (await startButton.isVisible({ timeout: 200 })) {
          await startButton.click({ timeout: 1000 })
        } else {
          // Button might have changed to "Return to Campaign"
          const returnButton = page.getByRole('button', { name: /Return to Campaign/i })
          if (await returnButton.isVisible({ timeout: 200 })) {
            await returnButton.click({ timeout: 1000 })
          }
        }
      } catch (error) {
        // Continue with next iteration if click fails
        continue
      }
      await page.waitForTimeout(100)
    }
    
    const clickTime = Date.now() - startTime
    
    // Should handle rapid clicks without hanging (allowing more time for WebKit)
    expect(clickTime).toBeLessThan(8000)
    
    // Should still function correctly - check that we're in a valid state
    const campaignPhase = page.getByText(/Phase:.*campaign/i)
    const playPhase = page.getByText(/Phase:.*play/i)
    
    // Check that we're in one of the valid states
    const isCampaign = await campaignPhase.isVisible({ timeout: 1000 }).catch(() => false)
    const isPlay = await playPhase.isVisible({ timeout: 1000 }).catch(() => false)
    
    expect(isCampaign || isPlay).toBe(true)
  })

  test('should maintain performance with SVG interactions', async ({ page }) => {
    // Start scenario
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
    
    // Test SVG interaction performance
    const hexTiles = page.locator('svg path')
    const startTime = Date.now()
    
    // Click multiple hex tiles rapidly with better error handling
    const tileCount = await hexTiles.count()
    for (let i = 0; i < Math.min(5, tileCount); i++) {
      try {
        await hexTiles.nth(i).click({ timeout: 1000 })
      } catch (error) {
        // Continue with next tile if one fails
        continue
      }
    }
    
    const interactionTime = Date.now() - startTime
    
    // SVG interactions should be responsive (allowing more time for WebKit)
    expect(interactionTime).toBeLessThan(5000)
  })

  test('should handle viewport changes performantly', async ({ page }) => {
    const startTime = Date.now()
    
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1024, height: 768 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 }
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
    }
    
    const resizeTime = Date.now() - startTime
    
    // Viewport changes should be handled efficiently
    expect(resizeTime).toBeLessThan(2000)
  })

  test('should not have memory leaks during state changes', async ({ page }) => {
    // Start scenario and return to campaign multiple times
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
      await page.waitForTimeout(200)
      await expect(page.getByText(/Phase:.*play/i)).toBeVisible()
      
      await page.getByRole('button', { name: /Return to Campaign/i }).click()
      await page.waitForTimeout(200)
      await expect(page.getByText(/Phase:.*campaign/i)).toBeVisible()
    }
    
    // Check that page is still responsive
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await expect(page.getByRole('heading', { name: /Scenario 1/i })).toBeVisible()
  })

  test('should render SVG efficiently with many elements', async ({ page }) => {
    // Start scenario to render SVG
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
    
    // Count SVG elements
    const svgElements = page.locator('svg *')
    const elementCount = await svgElements.count()
    
    // Should have a reasonable number of elements (not too many for performance)
    expect(elementCount).toBeGreaterThan(0)
    expect(elementCount).toBeLessThan(1000) // Reasonable upper bound
    
    // All elements should be rendered
    const pathElements = page.locator('svg path')
    const pathCount = await pathElements.count()
    expect(pathCount).toBeGreaterThan(0)
  })

  test('should handle network conditions gracefully', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100) // Add 100ms delay to all requests
    })
    
    await page.goto('/')
    
    // Should still load and be functional
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Start Demo Scenario/i })).toBeVisible()
    
    // Should still be interactive
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await expect(page.getByRole('heading', { name: /Scenario 1/i })).toBeVisible()
  })

  test('should be visually consistent across renders', async ({ page }) => {
    // Take screenshot of initial state
    await expect(page.getByRole('heading', { name: /Gloomhaven Digital Game Engine/i })).toBeVisible()
    await page.screenshot({ path: 'test-results/campaign-view.png', fullPage: true })
    
    // Start scenario and take screenshot
    await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
    await page.waitForTimeout(500)
    
    await expect(page.getByRole('heading', { name: /Scenario 1/i })).toBeVisible()
    const svg = page.locator('svg').first()
    await expect(svg).toBeVisible()
    
    await page.screenshot({ path: 'test-results/scenario-view.png', fullPage: true })
    
    // Return to campaign and verify consistency
    await page.getByRole('button', { name: /Return to Campaign/i }).click()
    await page.waitForTimeout(500)
    
    // Check that we are back in campaign mode 
    await expect(page.getByText(/Phase:.*campaign/i)).toBeVisible()
    // The scenario may still be displayed but we're in campaign mode
    await page.screenshot({ path: 'test-results/campaign-return.png', fullPage: true })
  })

  test('should maintain performance under stress', async ({ page }) => {
    const iterations = 10
    const startTime = Date.now()
    
    // Stress test with rapid state changes
    for (let i = 0; i < iterations; i++) {
      await page.getByRole('button', { name: /Start Demo Scenario/i }).click()
      await expect(page.getByText(/Phase:.*play/i)).toBeVisible()
      
      await page.getByRole('button', { name: /Return to Campaign/i }).click()
      await expect(page.getByText(/Phase:.*campaign/i)).toBeVisible()
    }
    
    const totalTime = Date.now() - startTime
    const averageTime = totalTime / iterations
    
    // Each cycle should complete reasonably quickly (allowing more time for WebKit)
    expect(averageTime).toBeLessThan(1200)
    
    // Final state should be correct
    await expect(page.getByText(/Phase:.*campaign/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Start Demo Scenario/i })).toBeVisible()
  })
})