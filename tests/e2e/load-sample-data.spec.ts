import { test, expect } from '@playwright/test';

test.describe('Load Sample Data for Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display Load Sample Data button with description', async ({
    page,
  }) => {
    // Navigate to Settings page
    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

    // Should be on General tab by default
    await expect(page.locator('[data-testid="general-tab"]')).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Verify Load Sample Data button is visible
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).toContainText('Load Sample Data');

    // Verify description is visible
    await expect(
      page.locator('[data-testid="load-sample-data-description"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="load-sample-data-description"]')
    ).toContainText(
      'Load sample teams with MLB fantasy players, seasons, and game types for testing'
    );

    // Verify add icon is present (Chakra UI colorScheme is handled via CSS classes)
    await expect(
      page.locator('[data-testid="load-sample-data-button"] svg')
    ).toBeVisible();
  });

  test('should successfully load sample data', async ({ page }) => {
    // Navigate to Settings page
    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

    // Click Load Sample Data button
    await page.click('[data-testid="load-sample-data-button"]');

    // Verify button shows loading state
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).toContainText('Loading Sample Data...');
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).toBeDisabled();

    // Wait for success toast notification - Chakra UI toasts don't use data-testid
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 10000 });

    // Verify button returns to normal state
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).toContainText('Load Sample Data');
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).not.toBeDisabled();
  });

  test('should handle existing sample data gracefully', async ({ page }) => {
    // Navigate to Settings page and load sample data first
    await page.goto('/settings');
    await page.click('[data-testid="load-sample-data-button"]');

    // Wait for first load to complete
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 10000 });
    // Wait for toast to disappear before next action
    await page.waitForTimeout(6000);

    // Click Load Sample Data button again
    await page.click('[data-testid="load-sample-data-button"]');

    // Should still show success (not create duplicates)
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display error notification on failure', async ({ page }) => {
    // Mock network failure or dependency error
    await page.route('**/api/**', (route) => {
      route.abort('failed');
    });

    // Navigate to Settings page
    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

    // Click Load Sample Data button
    await page.click('[data-testid="load-sample-data-button"]');

    // Should show error toast - look for any toast with error content
    // Note: This test may need adjustment based on actual error handling implementation
    await expect(
      page
        .locator('text=Failed to Load Sample Data')
        .or(page.locator('text=LoadDefaultDataUseCase not initialized'))
    ).toBeVisible({ timeout: 10000 });

    // Verify button returns to normal state
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).toContainText('Load Sample Data');
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).not.toBeDisabled();
  });

  test('should verify created sample data is accessible in Teams page', async ({
    page,
  }) => {
    // Load sample data first
    await page.goto('/settings');
    await page.click('[data-testid="load-sample-data-button"]');
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(6000); // Wait for toast to disappear

    // Navigate to Teams page
    await page.goto('/teams');
    await expect(page.locator('[data-testid="teams-page"]')).toBeVisible();

    // Verify 3 teams are present
    await expect(
      page.locator('[data-testid="team-dodgers-all-stars"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="team-yankees-legends"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="team-braves-champions"]')
    ).toBeVisible();

    // Verify team names
    await expect(
      page.locator('[data-testid="team-dodgers-all-stars"]')
    ).toContainText('Dodgers All-Stars');
    await expect(
      page.locator('[data-testid="team-yankees-legends"]')
    ).toContainText('Yankees Legends');
    await expect(
      page.locator('[data-testid="team-braves-champions"]')
    ).toContainText('Braves Champions');
  });

  test('should verify MLB players have correct details in team', async ({
    page,
  }) => {
    // Load sample data first
    await page.goto('/settings');
    await page.click('[data-testid="load-sample-data-button"]');
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(6000); // Wait for toast to disappear

    // Navigate to Teams page
    await page.goto('/teams');
    await expect(page.locator('[data-testid="teams-page"]')).toBeVisible();

    // Click on Dodgers All-Stars team to view details
    await page.click('[data-testid="team-dodgers-all-stars"]');

    // Verify we're on team details page or modal
    await expect(page.locator('[data-testid="team-details"]')).toBeVisible();

    // Verify key players are present
    await expect(page.locator('text=Shohei Ohtani')).toBeVisible();
    await expect(page.locator('text=Mookie Betts')).toBeVisible();
    await expect(page.locator('text=Walker Buehler')).toBeVisible();

    // Verify jersey numbers and positions (if displayed)
    await expect(page.locator('text=#17')).toBeVisible(); // Shohei Ohtani
    await expect(page.locator('text=#50')).toBeVisible(); // Mookie Betts
    await expect(page.locator('text=#21')).toBeVisible(); // Walker Buehler
  });

  test('should verify created seasons in Settings Game Configuration', async ({
    page,
  }) => {
    // Load sample data first
    await page.goto('/settings');
    await page.click('[data-testid="load-sample-data-button"]');
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(6000); // Wait for toast to disappear

    // Navigate to Game Configuration tab
    await page.click('[data-testid="game-config-tab"]');
    await expect(page.locator('[data-testid="seasons-section"]')).toBeVisible();

    // Verify 3 seasons are created
    await expect(page.locator('text=2025 Spring Season')).toBeVisible();
    await expect(page.locator('text=2025 Summer Season')).toBeVisible();
    await expect(page.locator('text=2025 Fall Season')).toBeVisible();

    // Verify date ranges are present
    await expect(page.locator('text=March 1 - May 31, 2025')).toBeVisible();
    await expect(page.locator('text=June 1 - August 31, 2025')).toBeVisible();
    await expect(
      page.locator('text=September 1 - November 30, 2025')
    ).toBeVisible();
  });

  test('should verify created game types in Settings Game Configuration', async ({
    page,
  }) => {
    // Load sample data first
    await page.goto('/settings');
    await page.click('[data-testid="load-sample-data-button"]');
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(6000); // Wait for toast to disappear

    // Navigate to Game Configuration tab
    await page.click('[data-testid="game-config-tab"]');
    await expect(
      page.locator('[data-testid="game-types-section"]')
    ).toBeVisible();

    // Verify 5 game types are created
    await expect(page.locator('text=Regular Season')).toBeVisible();
    await expect(page.locator('text=Playoff')).toBeVisible();
    await expect(page.locator('text=Championship')).toBeVisible();
    await expect(page.locator('text=Tournament')).toBeVisible();
    await expect(page.locator('text=Scrimmage')).toBeVisible();
  });

  test('should handle loading state properly', async ({ page }) => {
    // Navigate to Settings page
    await page.goto('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();

    // Click Load Sample Data button
    await page.click('[data-testid="load-sample-data-button"]');

    // Verify loading state immediately
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).toContainText('Loading Sample Data...');
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).toBeDisabled();

    // Verify loading spinner is present (Chakra UI loading button has spinner)
    await expect(
      page.locator('[data-testid="load-sample-data-button"] .chakra-spinner')
    ).toBeVisible();

    // Verify button cannot be clicked again during loading
    const clickCount = await page.evaluate(() => {
      const button = document.querySelector(
        '[data-testid="load-sample-data-button"]'
      ) as HTMLButtonElement;
      let count = 0;
      const originalClick = button.click;
      button.click = () => {
        count++;
        return originalClick.call(button);
      };
      // Try to click multiple times
      for (let i = 0; i < 5; i++) {
        button.click();
      }
      return count;
    });

    // Should not register additional clicks while disabled
    expect(clickCount).toBeLessThanOrEqual(1);

    // Wait for loading to complete
    await expect(
      page.locator('text=Sample Data Loaded Successfully!')
    ).toBeVisible({ timeout: 10000 });

    // Verify button returns to normal state
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).toContainText('Load Sample Data');
    await expect(
      page.locator('[data-testid="load-sample-data-button"]')
    ).not.toBeDisabled();
  });
});
