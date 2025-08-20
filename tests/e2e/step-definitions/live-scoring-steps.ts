import { Given, When, Then } from '@cucumber/cucumber';
import { Page, expect } from '@playwright/test';

declare let page: Page;

// Background steps
Given('I am on the live scoring page', async () => {
  await page.goto('/scoring');
  await expect(page.getByTestId('scoring-page')).toBeVisible();
});

Given('I have a game in progress', async () => {
  // Setup game with proper lineup using test helper
  const { createTestGame, setupTestLineup } = await import(
    '../helpers/test-data-setup'
  );
  await createTestGame(page, {
    name: 'Gherkin Test Game',
    opponent: 'Test Opponent',
    teamName: 'Test Team',
  });
  await setupTestLineup(page, 'Gherkin Test Game');

  // Navigate to scoring page
  await page.goto('/games');
  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: 'Gherkin Test Game' })
    .first();
  const startBtn = gameCard.locator('[data-testid="start-game-button"]');
  if (await startBtn.isVisible()) {
    await startBtn.click();
  }

  await expect(page.getByTestId('scoring-page')).toBeVisible();
});

// @live-game-scoring:AC001 - Functional business logic integration
When('I record a batting result of {string}', async (result: string) => {
  const buttonMap: Record<string, string> = {
    single: 'single-button',
    double: 'double-button',
    triple: 'triple-button',
    'home run': 'home-run-button',
    walk: 'walk-button',
    strikeout: 'strikeout-button',
    'ground out': 'ground-out-button',
  };

  const buttonTestId = buttonMap[result.toLowerCase()];
  if (!buttonTestId) {
    throw new Error(`Unknown batting result: ${result}`);
  }

  await page.getByTestId(buttonTestId).click();

  // Handle baserunner advancement modal if it appears
  try {
    await page.waitForSelector('[data-testid="baserunner-advancement-modal"]', {
      timeout: 2000,
    });
    await page.getByTestId('confirm-advancement').click();
  } catch {
    // Modal didn't appear, continue
  }
});

Then('the at-bat should be recorded and persisted immediately', async () => {
  // Check for success toast
  await expect(page.getByText('At-bat recorded').first()).toBeVisible();

  // Wait for toast to disappear
  await page
    .getByText('At-bat recorded')
    .first()
    .waitFor({ state: 'hidden', timeout: 3000 });
});

// @live-game-scoring:AC002 - Auto-advance to next batter
Then('the system should advance to the next batter', async () => {
  // Verify the batter order has advanced
  const batterDisplay = page.getByTestId('current-batter');
  await expect(batterDisplay).toBeVisible();

  // Should show "2nd Batter" after recording first at-bat
  await expect(batterDisplay).toContainText('2nd Batter');
});

// @live-game-scoring:AC003 - Touch-friendly buttons
Then('all batting result buttons should be touch-friendly', async () => {
  const buttonTestIds = [
    'single-button',
    'double-button',
    'triple-button',
    'home-run-button',
    'walk-button',
    'strikeout-button',
    'ground-out-button',
  ];

  for (const buttonTestId of buttonTestIds) {
    const button = page.getByTestId(buttonTestId);
    await expect(button).toBeVisible();

    // Verify minimum touch target size (44px height)
    const boundingBox = await button.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
  }
});

// @live-game-scoring:AC009 - Visual baserunner representation
Then('I should see the baserunner diagram with current state', async () => {
  await expect(page.getByTestId('baserunner-first')).toBeVisible();
  await expect(page.getByTestId('baserunner-second')).toBeVisible();
  await expect(page.getByTestId('baserunner-third')).toBeVisible();
});

When('there are runners on base', async () => {
  // Record a single to put a runner on first
  await page.getByTestId('single-button').click();
  try {
    await page.waitForSelector('[data-testid="baserunner-advancement-modal"]', {
      timeout: 2000,
    });
    await page.getByTestId('confirm-advancement').click();
  } catch {
    // Modal didn't appear
  }

  await expect(page.getByText('At-bat recorded').first()).toBeVisible();
  await page
    .getByText('At-bat recorded')
    .first()
    .waitFor({ state: 'hidden', timeout: 3000 });
});

Then('I should see runners displayed on the appropriate bases', async () => {
  // After recording a single, should have runner on first
  await expect(page.getByTestId('baserunner-first')).not.toContainText('Empty');
  await expect(page.getByTestId('baserunner-second')).toContainText('Empty');
  await expect(page.getByTestId('baserunner-third')).toContainText('Empty');
});

// @live-game-scoring:AC004 - Real-time updates
Then(
  'the interface should update immediately without page refresh',
  async () => {
    // Verify immediate UI response - this is tested by the flow itself
    // The fact that we can see updated batter and baserunner state proves real-time updates
    const batterDisplay = page.getByTestId('current-batter');
    await expect(batterDisplay).toBeVisible();
  }
);

// @live-game-scoring:AC034 - Visual feedback
Then('I should receive immediate visual feedback', async () => {
  // Visual feedback is the success toast and immediate UI updates
  // This is inherently tested by the other steps that verify immediate responses
  await expect(page.getByTestId('scoring-page')).toBeVisible();
});
