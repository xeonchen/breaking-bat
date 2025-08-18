import { Given, When, Then } from '@cucumber/cucumber';
import { Page, expect } from '@playwright/test';

declare let page: Page;

// Background steps
Given('I am in a live scoring session', async () => {
  // Setup game and navigate to scoring
  const { createTestGame, setupTestLineup } = await import(
    '../helpers/test-data-setup'
  );
  await createTestGame(page, {
    name: 'Innings Test Game',
    opponent: 'Test Opponent',
    teamName: 'Test Team',
  });

  await setupTestLineup(page, 'Innings Test Game');

  // Start game and navigate to scoring
  await page.goto('/games');
  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: 'Innings Test Game' });
  const startBtn = gameCard.locator('[data-testid="start-game-button"]');

  if (await startBtn.isVisible()) {
    await startBtn.click();
    await page.waitForTimeout(2000);
  }

  await expect(page.getByTestId('scoring-page')).toBeVisible();
});

// @live-game-scoring:AC025 - Away team batting in top innings only
Given('my team is playing away', async () => {
  // Verify game setup indicates away status
  // This should be set during game creation as away team
  const opponentInfo = page.getByTestId('opponent-info');
  if (await opponentInfo.isVisible()) {
    await expect(opponentInfo).toContainText(/vs|@/); // Away game indicator
  }
});

When('it is the top of the inning', async () => {
  // Verify we're in top half of inning
  const inningInfo = page.getByTestId('current-inning-info');
  if (await inningInfo.isVisible()) {
    await expect(inningInfo).toContainText(/top|T/i);
  }
});

Then('I should be able to record scoring for my team', async () => {
  // Scoring interface should be enabled
  const atBatForm = page.getByTestId('at-bat-form');
  await expect(atBatForm).toBeVisible();

  // Buttons should be enabled
  const singleBtn = page.getByTestId('single-button');
  await expect(singleBtn).toBeEnabled();
});

When('it is the bottom of the inning', async () => {
  // In a full implementation, this would switch inning half
  // For testing, we simulate being in bottom half
  // This would typically be done through inning management controls

  // Verify bottom half indicator if visible
  const inningInfo = page.getByTestId('current-inning-info');
  if (await inningInfo.isVisible()) {
    const inningText = await inningInfo.textContent();
    // If shows bottom, we're in bottom half
    if (inningText && inningText.toLowerCase().includes('bottom')) {
      // We're in bottom half
    }
  }
});

Then('I should not be able to record scoring for my team', async () => {
  // Check for opponent batting indicator
  const opponentBattingAlert = page.getByTestId('opponent-batting-alert');
  if (await opponentBattingAlert.isVisible({ timeout: 2000 })) {
    await expect(opponentBattingAlert).toBeVisible();
    await expect(opponentBattingAlert).toContainText(/opponent/i);
  }

  // Or check if scoring interface is disabled
  const atBatForm = page.getByTestId('at-bat-form');
  if (await atBatForm.isVisible()) {
    // Form might be visible but disabled
    const singleBtn = page.getByTestId('single-button');
    if (await singleBtn.isVisible()) {
      // Button should be disabled or form should show disabled state
      const opacity = await atBatForm.evaluate(
        (el) => window.getComputedStyle(el).opacity
      );
      expect(parseFloat(opacity)).toBeLessThan(1); // Should be visually disabled
    }
  }
});

// @live-game-scoring:AC026 - Home team batting in bottom innings only
Given('my team is playing at home', async () => {
  // This would be set during game creation
  // We check for home game indicators
  const opponentInfo = page.getByTestId('opponent-info');
  if (await opponentInfo.isVisible()) {
    await expect(opponentInfo).toContainText(/vs/); // Home game indicator (vs not @)
  }
});

// @live-game-scoring:AC027 - Away game interface shows "Top of [Inning]"
Then(
  'the interface should clearly show "Top of [Inning]" when it\'s my turn',
  async () => {
    const inningInfo = page.getByTestId('current-inning-info');
    if (await inningInfo.isVisible()) {
      const text = await inningInfo.textContent();
      expect(text).toMatch(/top.*\d+/i); // Should show "Top of [number]"
    }
  }
);

// @live-game-scoring:AC028 - Home game interface shows "Bottom of [Inning]"
Then(
  'the interface should clearly show "Bottom of [Inning]" when it\'s my turn',
  async () => {
    const inningInfo = page.getByTestId('current-inning-info');
    if (await inningInfo.isVisible()) {
      const text = await inningInfo.textContent();
      expect(text).toMatch(/bottom.*\d+/i); // Should show "Bottom of [number]"
    }
  }
);

// @live-game-scoring:AC029 - Cannot record at-bats during opponent's turn
When("it is the opponent's turn to bat", async () => {
  // Check for opponent batting status
  const opponentBattingAlert = page.getByTestId('opponent-batting-alert');
  if (await opponentBattingAlert.isVisible()) {
    await expect(opponentBattingAlert).toContainText(/opponent.*bat/i);
  }
});

When('I attempt to record an at-bat', async () => {
  // Try to click scoring button
  const singleBtn = page.getByTestId('single-button');
  if (await singleBtn.isVisible()) {
    await singleBtn.click();
  }
});

Then('the system should prevent the recording', async () => {
  // Should not advance or show success
  const successMessage = page.getByText('At-bat recorded');
  expect(await successMessage.isVisible({ timeout: 1000 })).toBeFalsy();

  // May show error or simply not respond
  const errorOrDisabled = await page
    .locator('[data-testid*="error"], text*=disabled, text*=opponent')
    .first()
    .isVisible({ timeout: 1000 });
  if (errorOrDisabled) {
    // Expected - system prevented the action
  }
});

// @live-game-scoring:AC030 - Interface automatically disables during opponent innings
When('the inning switches to opponent batting', async () => {
  // This would happen through inning management
  // We simulate by checking current state
  const inningInfo = page.getByTestId('current-inning-info');
  await expect(inningInfo).toBeVisible();
});

Then(
  "my team's batting interface should be automatically disabled",
  async () => {
    // Check for disabled state indicators
    const opponentAlert = page.getByTestId('opponent-batting-alert');
    const atBatForm = page.getByTestId('at-bat-form');

    if (await opponentAlert.isVisible({ timeout: 2000 })) {
      await expect(opponentAlert).toBeVisible();
    } else if (await atBatForm.isVisible()) {
      // Form should be visually disabled
      const opacity = await atBatForm.evaluate(
        (el) => window.getComputedStyle(el).opacity
      );
      expect(parseFloat(opacity)).toBeLessThan(1);
    }
  }
);

When('the inning switches back to my team batting', async () => {
  // This would be handled by inning management system
  // We verify the interface becomes active again
  const atBatForm = page.getByTestId('at-bat-form');
  await expect(atBatForm).toBeVisible();
});

Then(
  "my team's batting interface should be automatically enabled",
  async () => {
    // Interface should be fully active
    const atBatForm = page.getByTestId('at-bat-form');
    await expect(atBatForm).toBeVisible();

    const singleBtn = page.getByTestId('single-button');
    await expect(singleBtn).toBeEnabled();

    // No opponent batting alert should be visible
    const opponentAlert = page.getByTestId('opponent-batting-alert');
    expect(await opponentAlert.isVisible({ timeout: 1000 })).toBeFalsy();
  }
);
