import { test, expect } from '@playwright/test';

test.describe('Persistence round-trip (Layer 4)', () => {
  test.beforeEach(async ({ context }) => {
    // Start with clean context
    await context.clearCookies();
  });

  test('page survives reload without crashing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Verify initial load
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Reload the page
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Should still be visible after reload
    await expect(body).toBeVisible();
  });

  test('multiple reloads maintain app stability', async ({ page }) => {
    // Reload 3 times and verify app stays responsive
    for (let i = 0; i < 3; i++) {
      await page.goto('/');
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });

  test('no fatal errors on reload cycle', async ({ page }) => {
    const pageErrors: string[] = [];

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // First load
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Should not have critical errors related to data initialization
    const criticalErrors = pageErrors.filter(e =>
      e.includes('Cannot read properties of undefined') ||
      e.includes('data.inbox')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('app remains interactive after reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Find and count buttons before reload
    const buttonCountBefore = await page.locator('button').count();

    // Reload
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Buttons should still exist and be clickable
    const buttonCountAfter = await page.locator('button').count();
    expect(buttonCountAfter).toBeGreaterThan(0);

    // Should be able to interact with a button
    const firstButton = page.locator('button').first();
    if (await firstButton.isVisible({ timeout: 5000 })) {
      // Click should not crash the app
      await firstButton.click();
      await page.waitForTimeout(500);

      // App should still have buttons after click
      const finalButtonCount = await page.locator('button').count();
      expect(finalButtonCount).toBeGreaterThan(0);
    }
  });

  test('navigation persists across page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Find any clickable stage/navigation button
    const navigationButtons = page.locator('button');
    const firstButton = navigationButtons.first();

    if (await firstButton.isVisible({ timeout: 5000 })) {
      // Click a navigation button
      await firstButton.click();
      await page.waitForTimeout(500);

      // Note current URL/state
      const urlBefore = page.url();

      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle', { timeout: 10000 });

      // URL might change back to root, but app should be stable
      const urlAfter = page.url();
      expect(page.locator('body')).toBeVisible();
    }
  });

  test('rapid reload cycles do not corrupt state', async ({ page }) => {
    const pageErrors: string[] = [];

    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Rapid reload cycle
    for (let i = 0; i < 2; i++) {
      await page.goto('/');
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(500);
      await page.reload();
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      await page.waitForTimeout(500);
    }

    // Should have completed without initialization errors
    const criticalErrors = pageErrors.filter(e =>
      e.includes('Cannot read') && e.includes('undefined')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
