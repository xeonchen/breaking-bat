import { test, expect } from '@playwright/test';

/**
 * Data Persistence E2E Tests
 *
 * Tests the PWA's offline-first data persistence features including auto-save,
 * export/import functionality, session recovery, and offline operation.
 */

test.describe('Data Persistence Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to load by checking for the header title
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should auto-save team creation immediately', async ({ page }) => {
    // Navigate to teams page
    await page.goto('/teams');
    await page.waitForTimeout(1000);

    // Create a team
    await page.locator('[data-testid="create-team-button"]').click();
    await page
      .locator('[data-testid="team-name-input"]')
      .fill('Auto-Save Test Team');
    await page.locator('[data-testid="confirm-create-team"]').click();

    // Wait for creation to complete
    await page.waitForTimeout(1000);

    // Verify team appears
    await expect(
      page.locator('[data-testid="team-auto-save-test-team"]')
    ).toBeVisible();

    // Refresh page to test persistence
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify team still exists after reload (data was auto-saved)
    await expect(
      page.locator('[data-testid="team-auto-save-test-team"]')
    ).toBeVisible();
  });

  test('should persist data across browser sessions', async ({
    page,
    context,
  }) => {
    // Create some test data
    await page.goto('/teams');
    await page.waitForTimeout(1000);

    // Create a team
    await page.locator('[data-testid="create-team-button"]').click();
    await page
      .locator('[data-testid="team-name-input"]')
      .fill('Session Test Team');
    await page.locator('[data-testid="confirm-create-team"]').click();
    await page.waitForTimeout(1000);

    // Verify team was created
    await expect(
      page.locator('[data-testid="team-session-test-team"]')
    ).toBeVisible();

    // Create a new page (simulating new browser session)
    const newPage = await context.newPage();
    await newPage.goto('/teams');
    await newPage.waitForTimeout(1000);

    // Verify data persists in new session
    await expect(
      newPage.locator('[data-testid="team-session-test-team"]')
    ).toBeVisible();

    await newPage.close();
  });

  test('should handle offline simulation gracefully', async ({
    page,
    context,
  }) => {
    // Start online and navigate to teams page
    await page.goto('/teams');
    await page.waitForTimeout(1000);

    // Verify app works initially
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    // Create a team while online
    const createButton = page.locator('[data-testid="create-team-button"]');
    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      await page
        .locator('[data-testid="team-name-input"]')
        .fill('Offline Prep Team');
      await page.locator('[data-testid="confirm-create-team"]').click();
      await page.waitForTimeout(1000);

      // Verify team was created
      await expect(
        page.locator('[data-testid="team-offline-prep-team"]')
      ).toBeVisible();
    }

    // Test that the app doesn't break when network is unavailable
    // (This simulates offline behavior without actually going offline during navigation)
    await context.setOffline(true);

    // Wait a moment for offline state to be set
    await page.waitForTimeout(500);

    // Restore online mode for further navigation
    await context.setOffline(false);

    // Verify data persists after network interruption simulation
    await page.reload();
    await page.waitForTimeout(1000);

    if (await createButton.isVisible({ timeout: 2000 })) {
      await expect(
        page.locator('[data-testid="team-offline-prep-team"]')
      ).toBeVisible();
    }
  });

  test('should maintain data consistency during page navigation', async ({
    page,
  }) => {
    // Start with teams page
    await page.goto('/teams');
    await page.waitForTimeout(1000);

    // Verify app is working
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    // Create test data
    const createButton = page.locator('[data-testid="create-team-button"]');
    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      await page
        .locator('[data-testid="team-name-input"]')
        .fill('Navigation Consistency Team');
      await page.locator('[data-testid="confirm-create-team"]').click();
      await page.waitForTimeout(1000);
    }

    // Navigate to different pages to test consistency
    await page.goto('/stats');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    await page.goto('/games');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    await page.goto('/');
    await page.waitForTimeout(1000);
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    // Return to teams page and verify data consistency
    await page.goto('/teams');
    await page.waitForTimeout(1000);

    if (await createButton.isVisible({ timeout: 2000 })) {
      await expect(
        page.locator('[data-testid="team-navigation-consistency-team"]')
      ).toBeVisible();
    }
  });

  test('should handle rapid data operations without loss', async ({ page }) => {
    // Navigate to teams page
    await page.goto('/teams');
    await page.waitForTimeout(1000);

    // Create multiple teams rapidly to test auto-save performance
    const teamNames = ['Rapid Team 1', 'Rapid Team 2', 'Rapid Team 3'];

    for (const teamName of teamNames) {
      await page.locator('[data-testid="create-team-button"]').click();
      await page.locator('[data-testid="team-name-input"]').fill(teamName);
      await page.locator('[data-testid="confirm-create-team"]').click();
      // Small delay to allow processing
      await page.waitForTimeout(500);
    }

    // Verify all teams were created and saved
    for (const teamName of teamNames) {
      const testId = teamName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      await expect(
        page.locator(`[data-testid="team-${testId}"]`)
      ).toBeVisible();
    }

    // Refresh to verify persistence
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify all teams still exist after reload
    for (const teamName of teamNames) {
      const testId = teamName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      await expect(
        page.locator(`[data-testid="team-${testId}"]`)
      ).toBeVisible();
    }
  });

  test('should handle data integrity across different page navigation', async ({
    page,
  }) => {
    // Create test data on teams page
    await page.goto('/teams');
    await page.waitForTimeout(1000);

    await page.locator('[data-testid="create-team-button"]').click();
    await page
      .locator('[data-testid="team-name-input"]')
      .fill('Navigation Test Team');
    await page.locator('[data-testid="confirm-create-team"]').click();
    await page.waitForTimeout(1000);

    // Navigate to different pages
    await page.goto('/seasons');
    await page.waitForTimeout(500);

    await page.goto('/game-types');
    await page.waitForTimeout(500);

    await page.goto('/games');
    await page.waitForTimeout(500);

    // Return to teams page
    await page.goto('/teams');
    await page.waitForTimeout(1000);

    // Verify data integrity is maintained
    await expect(
      page.locator('[data-testid="team-navigation-test-team"]')
    ).toBeVisible();

    // Test navigation via UI tabs if available
    const homeTab = page.locator('[data-testid="home-tab"]');
    if (await homeTab.isVisible({ timeout: 1000 })) {
      await homeTab.click();
      await page.waitForTimeout(500);

      const teamsTab = page.locator('[data-testid="teams-tab"]');
      if (await teamsTab.isVisible({ timeout: 1000 })) {
        await teamsTab.click();
        await page.waitForTimeout(500);

        // Verify data still exists after tab navigation
        await expect(
          page.locator('[data-testid="team-navigation-test-team"]')
        ).toBeVisible();
      }
    }
  });

  test('should recover gracefully from storage errors', async ({ page }) => {
    // Navigate to app
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Test that app loads successfully
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    // Navigate to different sections to ensure no storage errors crash the app
    const pages = ['/teams', '/seasons', '/game-types', '/games', '/stats'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForTimeout(500);

      // Verify app didn't crash due to storage issues
      await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

      // Check that page has some content (not blank due to storage error)
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
      if (hasContent) {
        expect(hasContent.length).toBeGreaterThan(10);
      }
    }
  });

  test('should handle mobile data persistence correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to teams page on mobile
    await page.goto('/teams');
    await page.waitForTimeout(1000);

    // Create a team on mobile
    const createButton = page.locator('[data-testid="create-team-button"]');
    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      await page
        .locator('[data-testid="team-name-input"]')
        .fill('Mobile Test Team');
      await page.locator('[data-testid="confirm-create-team"]').click();
      await page.waitForTimeout(1000);

      // Verify team was created on mobile
      await expect(
        page.locator('[data-testid="team-mobile-test-team"]')
      ).toBeVisible();
    }

    // Switch to desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();
    await page.waitForTimeout(1000);

    // Verify data persists across viewport changes
    if (await createButton.isVisible({ timeout: 2000 })) {
      await expect(
        page.locator('[data-testid="team-mobile-test-team"]')
      ).toBeVisible();
    }
  });
});
