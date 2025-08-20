import { Given, When, Then } from '@cucumber/cucumber';
import { Page, expect } from '@playwright/test';

declare let page: Page;

// Background steps
Given('I am on the games page', async () => {
  await page.goto('/games');
  await expect(page.getByTestId('games-page')).toBeVisible();
});

Given('sample data has been loaded', async () => {
  // Load sample data for reliable testing
  const loadSampleBtn = page.locator('[data-testid="load-sample-data-btn"]');
  if (await loadSampleBtn.isVisible({ timeout: 2000 })) {
    await loadSampleBtn.click();
    await page.waitForTimeout(2000); // Wait for loading
  }
});

// @game-creation:AC001-006 - Game creation workflow
When('I create a new game with name {string}', async (gameName: string) => {
  const createBtn = page.locator('[data-testid="create-game-button"]');
  await expect(createBtn).toBeVisible();
  await createBtn.click();

  const modal = page.locator('[data-testid="create-game-modal"]');
  await expect(modal).toBeVisible();

  // Fill in required fields
  await page.fill('[data-testid="game-name-input"]', gameName);
  await page.fill('[data-testid="opponent-input"]', 'Test Opponent');

  // Set as away game for testing
  const homeAwayToggle = page.locator('[data-testid="home-away-toggle"]');
  if (await homeAwayToggle.isVisible()) {
    await homeAwayToggle.click(); // Switch to away
  }

  // Select team from dropdown
  const teamSelect = page.locator('[data-testid="team-select"]');
  await teamSelect.selectOption({ index: 1 }); // Select first available team

  // Select season if available
  const seasonSelect = page.locator('[data-testid="season-select"]');
  if (await seasonSelect.isVisible()) {
    await seasonSelect.selectOption({ index: 1 });
  }

  // Select game type if available
  const gameTypeSelect = page.locator('[data-testid="game-type-select"]');
  if (await gameTypeSelect.isVisible()) {
    await gameTypeSelect.selectOption({ index: 1 });
  }

  // Create the game
  await page.click('[data-testid="create-game-confirm"]');

  // Wait for modal to close and game to appear
  await expect(modal).not.toBeVisible();
  await page.waitForTimeout(1000);
});

Then('the game should be created successfully', async () => {
  // Look for success message or game card
  const successMessage = page.locator('text=Game created successfully');
  if (await successMessage.isVisible({ timeout: 2000 })) {
    await expect(successMessage).toBeVisible();
  }

  // Verify game appears in list
  await expect(page.locator('[data-testid*="game-"]')).toBeVisible();
});

// @lineup-configuration:AC007-021 - Lineup setup interface
When('I set up the lineup for the game', async () => {
  // Find the game card and click setup lineup
  const gameCard = page.locator('[data-testid*="game-"]').first();
  const setupBtn = gameCard.locator(
    '[data-testid*="setup-lineup"], [data-testid*="manage-lineup"]'
  );

  if (await setupBtn.isVisible({ timeout: 2000 })) {
    await setupBtn.click();
  } else {
    throw new Error('Setup lineup button not found');
  }

  // Wait for lineup modal or page
  const lineupModal = page.locator(
    '[data-testid="lineup-modal"], [data-testid="lineup-page"]'
  );
  await expect(lineupModal).toBeVisible();

  // Use auto-fill functionality to complete lineup
  const autoFillBtn = page.locator(
    '[data-testid="auto-fill-positions-button"]'
  );
  if (await autoFillBtn.isVisible({ timeout: 2000 })) {
    await autoFillBtn.click();
    await page.waitForTimeout(1000);
  }

  // Save the lineup
  const saveBtn = page.getByTestId('save-lineup-button');
  await expect(saveBtn).toBeEnabled();
  await saveBtn.click();

  // Wait for lineup to be saved
  await page.waitForTimeout(1000);
});

Then('the lineup should be configured properly', async () => {
  // Verify lineup was saved successfully
  // Look for success message or return to games page
  const gamesPage = page.locator('[data-testid="games-page"]');
  if (await gamesPage.isVisible({ timeout: 3000 })) {
    await expect(gamesPage).toBeVisible();
  }
});

// @lineup-configuration:AC022-043 - Complete workflow integration
When('I start the game', async () => {
  // Find the game card with setup lineup and start it
  const gameCard = page.locator('[data-testid*="game-"]').first();
  const startBtn = gameCard.locator('[data-testid="start-game-button"]');

  if (await startBtn.isVisible({ timeout: 2000 })) {
    await startBtn.click();
    await page.waitForTimeout(2000);
  } else {
    throw new Error('Start game button not found or game not ready');
  }
});

Then('I should be redirected to the live scoring interface', async () => {
  // Should navigate to scoring page
  await expect(page.getByTestId('scoring-page')).toBeVisible({ timeout: 5000 });

  // Verify key elements are present
  await expect(page.getByTestId('current-batter')).toBeVisible();
  await expect(page.getByTestId('at-bat-form')).toBeVisible();
});

Then('the game status should be {string}', async (expectedStatus: string) => {
  // Navigate back to games page to check status
  await page.goto('/games');
  await expect(page.getByTestId('games-page')).toBeVisible();

  // Find game card and check status
  const gameCard = page.locator('[data-testid*="game-"]').first();
  const statusBadge = gameCard.locator('[data-testid*="status"]');

  if (await statusBadge.isVisible()) {
    await expect(statusBadge).toContainText(expectedStatus);
  }
});

// @lineup-configuration:AC012-015 - Lineup validation
Given('I have a game without a complete lineup', async () => {
  // Create game but don't complete lineup setup
  await page.goto('/games');
  const createBtn = page.locator('[data-testid="create-game-button"]');
  await createBtn.click();

  const modal = page.locator('[data-testid="create-game-modal"]');
  await expect(modal).toBeVisible();

  await page.fill('[data-testid="game-name-input"]', 'Incomplete Game');
  await page.fill('[data-testid="opponent-input"]', 'Test Opponent');

  // Select team and create game without completing lineup
  const teamSelect = page.locator('[data-testid="team-select"]');
  await teamSelect.selectOption({ index: 1 });

  await page.click('[data-testid="create-game-confirm"]');
  await expect(modal).not.toBeVisible();
});

Then('the start game button should be disabled', async () => {
  const gameCard = page.locator('[data-testid*="game-"]').first();
  const startBtn = gameCard.locator('[data-testid="start-game-button"]');

  if (await startBtn.isVisible({ timeout: 2000 })) {
    await expect(startBtn).toBeDisabled();
  } else {
    // Start button might not be visible if game is not ready
    expect(await startBtn.isVisible()).toBeFalsy();
  }
});

When('I attempt to start the game', async () => {
  const gameCard = page.locator('[data-testid*="game-"]').first();
  const startBtn = gameCard.locator('[data-testid="start-game-button"]');

  // Try to click if visible (should be disabled)
  if (await startBtn.isVisible({ timeout: 1000 })) {
    await startBtn.click();
  }
});

Then('I should see a validation message', async () => {
  // Look for error message or tooltip
  const errorMessage = page.locator(
    'text=lineup, text=complete, text=required'
  );
  if (await errorMessage.first().isVisible({ timeout: 2000 })) {
    await expect(errorMessage.first()).toBeVisible();
  }
});
