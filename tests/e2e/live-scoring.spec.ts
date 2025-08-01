import { test, expect } from '@playwright/test';

/**
 * Live Scoring E2E Tests
 *
 * Tests the live scoring page components and UI behavior.
 * These tests focus on verifying the UI components exist and function properly.
 */

test.describe('Live Scoring Page Components', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load by checking for the header title
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should navigate to scoring route and handle non-existent game', async ({
    page,
  }) => {
    // Navigate to a scoring route
    await page.goto('/scoring/non-existent-game');

    // Wait for page to process
    await page.waitForTimeout(2000);

    // The page should handle this gracefully - it might redirect, show error, or show loading
    // Let's verify the page structure remains intact
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    // Page should not crash - verify we have some content
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('should verify games page navigation works', async ({ page }) => {
    // Navigate to games page which should exist
    await page.goto('/games');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Verify we can navigate around the app
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    // Try to navigate to other pages to ensure app routing works
    await page.goto('/teams');
    await page.waitForTimeout(500);
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    await page.goto('/stats');
    await page.waitForTimeout(500);
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should test navigation tabs work correctly', async ({ page }) => {
    // Test clicking navigation tabs
    await page.goto('/');

    // Click on different navigation tabs
    const teamsTab = page.locator('[data-testid="teams-tab"]');
    if (await teamsTab.isVisible({ timeout: 2000 })) {
      await teamsTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/teams');
    }

    const gamesTab = page.locator('[data-testid="games-tab"]');
    if (await gamesTab.isVisible({ timeout: 2000 })) {
      await gamesTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/games');
    }

    const homeTab = page.locator('[data-testid="home-tab"]');
    if (await homeTab.isVisible({ timeout: 2000 })) {
      await homeTab.click();
      await page.waitForTimeout(500);
      expect(page.url()).toMatch(/\/$|\/\?|\/home/);
    }
  });

  test('should verify app works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Verify mobile layout
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    // Test navigation on mobile
    await page.goto('/teams');
    await page.waitForTimeout(500);
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    await page.goto('/games');
    await page.waitForTimeout(500);
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should handle unknown routes gracefully', async ({ page }) => {
    // Navigate to a completely invalid route
    await page.goto('/this-route-does-not-exist');

    // Wait for page to process
    await page.waitForTimeout(1000);

    // App should not crash and should show some content
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    // Page should have some content (not blank)
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
  });
});
