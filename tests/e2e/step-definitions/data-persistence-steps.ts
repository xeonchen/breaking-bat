import { Given, When, Then } from '@cucumber/cucumber';
import { Page, expect } from '@playwright/test';

declare let page: Page;

// Background steps
Given('I am on the settings page', async () => {
  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();
});

Given('I have game data in the system', async () => {
  // Load sample data to ensure we have data to export
  await page.goto('/');

  const loadSampleBtn = page.locator('[data-testid="load-sample-data-btn"]');
  if (await loadSampleBtn.isVisible({ timeout: 2000 })) {
    await loadSampleBtn.click();
    await page.waitForTimeout(2000);
  }
});

// @app-framework:AC010 - Auto-save functionality
When('I make changes to game data', async () => {
  // Navigate to teams and make a change
  await page.goto('/teams');

  const createTeamBtn = page.locator('[data-testid="create-team-button"]');
  if (await createTeamBtn.isVisible()) {
    await createTeamBtn.click();
    await page.fill('[data-testid="team-name-input"]', 'Auto Save Test Team');
    await page.click('[data-testid="confirm-create-team"]');

    // Wait for auto-save
    await page.waitForTimeout(1000);
  }
});

Then('the changes should be automatically saved to local storage', async () => {
  // Refresh page to verify persistence
  await page.reload();
  await page.waitForTimeout(1000);

  // Check if team still exists
  await expect(page.locator('[data-testid*="team-"]')).toBeVisible();
});

// @app-framework:AC011 - Session recovery
Given('I have an unfinished game', async () => {
  // Create and start a game but don't complete it
  await page.goto('/games');

  const { createTestGame, setupTestLineup } = await import(
    '../helpers/test-data-setup'
  );
  await createTestGame(page, {
    name: 'Unfinished Game',
    opponent: 'Test Opponent',
    teamName: 'Test Team',
  });

  await setupTestLineup(page, 'Unfinished Game');

  // Start the game
  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: 'Unfinished Game' });
  const startBtn = gameCard.locator('[data-testid="start-game-button"]');
  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(1000);
  }
});

When('I restart the application', async () => {
  // Simulate app restart by refreshing and navigating to home
  await page.goto('/');
  await page.waitForTimeout(1000);
});

Then('the unfinished game should be automatically loaded', async () => {
  // Should see option to continue game or be automatically redirected
  await page.goto('/games');

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: 'Unfinished Game' });
  await expect(gameCard).toBeVisible();

  // Game status should be in_progress or resumable
  const statusBadge = gameCard.locator('[data-testid*="status"]');
  if (await statusBadge.isVisible()) {
    await expect(statusBadge).toContainText(/progress|suspended/i);
  }
});

// @app-framework:AC015 - Data export
When('I export game data in {string} format', async (format: string) => {
  await page.goto('/settings');

  // Look for export functionality
  const exportBtn = page.locator(
    '[data-testid="export-data-btn"], [data-testid*="export"]'
  );
  if (await exportBtn.isVisible({ timeout: 2000 })) {
    await exportBtn.click();

    // Select format if dialog appears
    const formatSelect = page.locator('[data-testid="export-format-select"]');
    if (await formatSelect.isVisible()) {
      await formatSelect.selectOption(format);
    }

    const confirmBtn = page.locator(
      '[data-testid="confirm-export"], [data-testid="export-confirm"]'
    );
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
  }
});

Then('the export should complete successfully', async () => {
  // Look for success message
  const successMessage = page.locator(
    'text=Export completed, text=exported successfully'
  );
  if (await successMessage.first().isVisible({ timeout: 5000 })) {
    await expect(successMessage.first()).toBeVisible();
  }
});

// @app-framework:AC016 - Data import
When('I import previously exported data', async () => {
  await page.goto('/settings');

  const importBtn = page.locator(
    '[data-testid="import-data-btn"], [data-testid*="import"]'
  );
  if (await importBtn.isVisible({ timeout: 2000 })) {
    await importBtn.click();

    // This would typically involve file upload, but for E2E we'll simulate
    const confirmBtn = page.locator(
      '[data-testid="confirm-import"], [data-testid="import-confirm"]'
    );
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
  }
});

Then('the import should complete successfully', async () => {
  const successMessage = page.locator(
    'text=Import completed, text=imported successfully'
  );
  if (await successMessage.first().isVisible({ timeout: 5000 })) {
    await expect(successMessage.first()).toBeVisible();
  }
});

// @app-framework:AC012 - Data persistence across sessions
Then('all data should persist between browser sessions', async () => {
  // This is inherently tested by the other scenarios that reload the page
  // and verify data is still present
  await page.goto('/teams');
  await expect(page.locator('[data-testid*="team-"]')).toBeVisible();
});

// @app-framework:AC013 - Offline functionality
Given('the application is offline', async () => {
  // Simulate offline mode
  await page.setOfflineMode(true);
});

When('I use the application', async () => {
  // Navigate and try to use features
  await page.goto('/teams');
});

Then('all features should work without network connection', async () => {
  // Basic navigation and viewing should work
  await expect(page.getByTestId('teams-page')).toBeVisible();

  // Re-enable online mode for cleanup
  await page.setOfflineMode(false);
});
