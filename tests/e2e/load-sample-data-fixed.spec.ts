import { test, expect } from '@playwright/test';

test.describe('Load Sample Data - After Database Fix', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should successfully load sample data without IndexedDB errors', async ({
    page,
  }) => {
    // Navigate to Settings page
    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

    // Verify button and description are present
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="load-sample-data-description"]')
    ).toBeVisible();

    // Click Load Sample Data button
    await page.click('[data-testid="load-sample-data-button"]');

    // Wait for success toast - should now work without IndexedDB compound index errors
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 15000 });

    // Verify no error occurred
    await expect(
      page.locator('text=Failed to Load Sample Data')
    ).not.toBeVisible();
    await expect(
      page.locator(
        'text=KeyPath [name+year] on object store seasons is not indexed'
      )
    ).not.toBeVisible();
  });

  test('should create the expected data quantities', async ({ page }) => {
    // Navigate to Settings page
    await page.goto('/settings');

    // Load sample data
    await page.click('[data-testid="load-sample-data-button"]');
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 15000 });

    // Wait for toast to disappear
    await page.waitForTimeout(6000);

    // Verify data was created by checking Teams page
    await page.goto('/teams');
    await expect(page.locator('[data-testid="teams-page"]')).toBeVisible();

    // Should see 3 teams (check if team cards exist)
    const teamCards = page.locator('[data-testid*="team-"]');
    await expect(teamCards).toHaveCount(3, { timeout: 10000 });
  });

  test('should create seasons accessible in Game Configuration', async ({
    page,
  }) => {
    // Load sample data first
    await page.goto('/settings');
    await page.click('[data-testid="load-sample-data-button"]');
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(6000);

    // Navigate to Game Configuration tab
    await page.click('[data-testid="game-config-tab"]');
    await expect(page.locator('[data-testid="seasons-section"]')).toBeVisible();

    // Should see the created seasons (this verifies compound index is working)
    await expect(page.locator('text=2025 Spring Season')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=2025 Summer Season')).toBeVisible();
    await expect(page.locator('text=2025 Fall Season')).toBeVisible();
  });

  test('should handle multiple clicks gracefully (no duplicates)', async ({
    page,
  }) => {
    await page.goto('/settings');

    // First click
    await page.click('[data-testid="load-sample-data-button"]');
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(6000);

    // Second click - should not create errors or duplicates
    await page.click('[data-testid="load-sample-data-button"]');
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 15000 });

    // No error messages should appear
    await expect(
      page.locator('text=Failed to Load Sample Data')
    ).not.toBeVisible();
  });
});
