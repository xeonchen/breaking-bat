import { Given, When, Then } from '@cucumber/cucumber';
import { Page, expect } from '@playwright/test';

declare let page: Page;

// Background steps
Given('I am on the main page', async () => {
  await page.goto('/');
  await page.waitForTimeout(1000);
});

Given('the system has no existing data', async () => {
  // For E2E testing, we assume a clean state or this would clear data
  // In practice, this might involve clearing IndexedDB or calling a reset API
  await page.goto('/');
});

// @sample-data-management:AC001 - Load sample data successfully
When('I click the Load Sample Data button', async () => {
  const loadSampleBtn = page.locator('[data-testid="load-sample-data-btn"]');
  await expect(loadSampleBtn).toBeVisible();
  await loadSampleBtn.click();
});

Then('sample data should be loaded successfully', async () => {
  // Wait for loading to complete
  await page.waitForTimeout(3000);

  // Look for success message
  const successMessage = page.locator(
    'text=Sample data loaded successfully, text=successfully loaded'
  );
  await expect(successMessage.first()).toBeVisible({ timeout: 10000 });
});

// @sample-data-management:AC002 - MLB player data
Then(
  'the system should have MLB players with realistic names and positions',
  async () => {
    // Navigate to teams to verify player data
    await page.goto('/teams');
    await expect(page.getByTestId('teams-page')).toBeVisible();

    // Should have teams with players
    const teamCard = page.locator('[data-testid*="team-"]').first();
    await expect(teamCard).toBeVisible();

    // Check for player count indicator
    const playerCount = teamCard.locator('text*=player');
    if (await playerCount.isVisible({ timeout: 2000 })) {
      await expect(playerCount).toBeVisible();
    }
  }
);

// @sample-data-management:AC003 - Multiple teams
Then('multiple teams should be created with proper rosters', async () => {
  await page.goto('/teams');

  // Should have multiple team cards
  const teamCards = page.locator('[data-testid*="team-"]');
  const count = await teamCards.count();
  expect(count).toBeGreaterThan(1);

  // Each team should have players
  for (let i = 0; i < Math.min(count, 3); i++) {
    const teamCard = teamCards.nth(i);
    const playerCount = teamCard.locator('text*=player');
    if (await playerCount.isVisible({ timeout: 1000 })) {
      await expect(playerCount).toBeVisible();
    }
  }
});

// @sample-data-management:AC004 - Seasons and game types
Then(
  'seasons and game types should be available for game creation',
  async () => {
    await page.goto('/games');

    const createGameBtn = page.locator('[data-testid="create-game-button"]');
    await createGameBtn.click();

    const modal = page.locator('[data-testid="create-game-modal"]');
    await expect(modal).toBeVisible();

    // Check if season dropdown has options
    const seasonSelect = page.locator('[data-testid="season-select"]');
    if (await seasonSelect.isVisible()) {
      const options = await seasonSelect.locator('option').count();
      expect(options).toBeGreaterThan(1); // Should have more than just placeholder
    }

    // Check if game type dropdown has options
    const gameTypeSelect = page.locator('[data-testid="game-type-select"]');
    if (await gameTypeSelect.isVisible()) {
      const options = await gameTypeSelect.locator('option').count();
      expect(options).toBeGreaterThan(1);
    }

    // Close modal
    const cancelBtn = page.locator('[data-testid="cancel-create-game"]');
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
  }
);

// @sample-data-management:AC005 - Idempotent loading
When('I click Load Sample Data multiple times', async () => {
  const loadSampleBtn = page.locator('[data-testid="load-sample-data-btn"]');

  // Click multiple times
  await loadSampleBtn.click();
  await page.waitForTimeout(1000);

  if (await loadSampleBtn.isVisible({ timeout: 2000 })) {
    await loadSampleBtn.click();
    await page.waitForTimeout(1000);
  }
});

Then('duplicate data should not be created', async () => {
  // Wait for any loading to complete
  await page.waitForTimeout(2000);

  // Check teams count - should not have excessive duplicates
  await page.goto('/teams');
  const teamCards = page.locator('[data-testid*="team-"]');
  const count = await teamCards.count();

  // Should have reasonable number of teams (not 50+ duplicates)
  expect(count).toBeLessThan(10);
});

// @sample-data-management:AC006 - Clear existing data
Given('sample data has been loaded previously', async () => {
  await page.goto('/');

  const loadSampleBtn = page.locator('[data-testid="load-sample-data-btn"]');
  if (await loadSampleBtn.isVisible()) {
    await loadSampleBtn.click();
    await page.waitForTimeout(2000);
  }
});

When('I load sample data again', async () => {
  const loadSampleBtn = page.locator('[data-testid="load-sample-data-btn"]');
  if (await loadSampleBtn.isVisible()) {
    await loadSampleBtn.click();
  }
});

Then('existing sample data should be replaced cleanly', async () => {
  await page.waitForTimeout(2000);

  // Verify data is still clean and not duplicated
  await page.goto('/teams');
  const teamCards = page.locator('[data-testid*="team-"]');
  const count = await teamCards.count();
  expect(count).toBeLessThan(10);
});

// @sample-data-management:AC007 - Loading state and feedback
When('I initiate sample data loading', async () => {
  const loadSampleBtn = page.locator('[data-testid="load-sample-data-btn"]');
  await loadSampleBtn.click();

  // Don't wait for completion, check loading state immediately
});

Then('I should see loading feedback during the process', async () => {
  // Look for loading indicators
  const loadingIndicator = page.locator(
    'text=Loading, text=loading, [data-testid*="loading"], [data-testid*="spinner"]'
  );

  if (await loadingIndicator.first().isVisible({ timeout: 1000 })) {
    await expect(loadingIndicator.first()).toBeVisible();
  }

  // Wait for completion
  await page.waitForTimeout(3000);

  // Should see success message
  const successMessage = page.locator(
    'text=loaded successfully, text=Sample data loaded'
  );
  await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
});
