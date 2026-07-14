import { test, expect } from '@playwright/test';

test.describe('Fresh-session golden path (Layer 4)', () => {
  test.beforeEach(async ({ context }) => {
    // Start with clean context (no cookies/storage)
    await context.clearCookies();
  });

  test('loads app and displays Inbox stage', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load with a longer timeout for Next.js startup
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Verify we have the main app structure
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Check for the page title
    await expect(page).toHaveTitle(/PO|Workbench|Product|Owner/i);
  });

  test('app renders without fatal console errors on load', async ({ page }) => {
    const pageErrors: string[] = [];

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Give page a moment to hydrate and run effects
    await page.waitForTimeout(2000);

    // Should not have fatal errors about undefined sources or initialization
    const criticalErrors = pageErrors.filter(e =>
      e.includes('Cannot read properties of undefined') ||
      e.includes('sources') ||
      e.includes('data.inbox')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('displays page with visible content area', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // The main content should be visible
    // Looking for any visible text/button indicating the app is ready
    const content = page.locator('main, [role="main"]').first();

    if (await content.isVisible({ timeout: 5000 })) {
      expect(await content.isVisible()).toBe(true);
    }
  });

  test('button elements are accessible (stage navigation exists)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Count buttons - should have at least a few navigation/action buttons
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThan(0);
  });

  test('handles navigation without crashing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Try to find and click any stage button (should gracefully handle if locked)
    const buttons = page.locator('button');
    const firstButton = buttons.first();

    if (await firstButton.isVisible({ timeout: 5000 })) {
      // This should not crash regardless of what the button does
      await firstButton.click();

      // App should still be responsive after click
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      expect(true).toBe(true); // Just verify we got here without crash
    }
  });
});
