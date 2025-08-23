import { test, expect } from '@playwright/test';
import { createTestGame, setupTestLineup } from './helpers/test-data-setup';

test.describe('Innings Management - Home/Away Status Integration (@live-game-scoring:AC025-@live-game-scoring:AC030)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console logging
    page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', (error) =>
      console.log('BROWSER ERROR:', error.message)
    );

    // Create test game and setup lineup
    const gameName = 'Innings Management Test';
    await createTestGame(page, {
      name: gameName,
      opponent: 'Test Opponent',
      teamName: 'Test Team',
    });

    await setupTestLineup(page, gameName);

    // Start the game to get to scoring page
    await page.goto('/games');
    await page.waitForTimeout(1000);

    const gameCard = page
      .locator('[data-testid*="game-"]')
      .filter({ hasText: gameName })
      .first();

    const startBtn = gameCard.locator('[data-testid="start-game-button"]');
    if (await startBtn.isVisible({ timeout: 2000 })) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }

    await expect(page.getByTestId('scoring-page')).toBeVisible();
  });

  test('should manage away team innings correctly (@live-game-scoring:AC025, @live-game-scoring:AC027)', async ({
    page,
  }) => {
    // Given: Away team setup (should be configured in game creation)

    // Then: Should see inning indicator showing current state
    const inningInfo = page.getByTestId('current-inning-info');
    await expect(inningInfo).toBeVisible();

    // Should show appropriate inning text for away team
    const inningText = await inningInfo.textContent();
    expect(inningText).toBeTruthy();

    // When: It's top of inning (away team bats)
    if (inningText && inningText.toLowerCase().includes('top')) {
      // Then: Scoring interface should be enabled
      const atBatForm = page.getByTestId('at-bat-form');
      await expect(atBatForm).toBeVisible();

      const singleBtn = page.getByTestId('single-button');
      await expect(singleBtn).toBeEnabled();
    }

    // When: It's bottom of inning (home team bats)
    if (inningText && inningText.toLowerCase().includes('bottom')) {
      // Then: Should show opponent batting alert
      const opponentAlert = page.getByTestId('opponent-batting-alert');
      if (await opponentAlert.isVisible({ timeout: 2000 })) {
        await expect(opponentAlert).toContainText(/opponent/i);
      }
    }
  });

  test('should display clear inning indicators (@live-game-scoring:AC027, @live-game-scoring:AC028)', async ({
    page,
  }) => {
    // Given: Live scoring interface
    const inningInfo = page.getByTestId('current-inning-info');
    await expect(inningInfo).toBeVisible();

    // Then: Should clearly show inning and half
    const inningText = await inningInfo.textContent();
    expect(inningText).toBeTruthy();

    // Should contain inning number
    expect(inningText).toMatch(/\d+/); // Contains a number

    // Should contain half indicator (Top/Bottom or abbreviation)
    expect(inningText).toMatch(/(top|bottom|t|b)/i);
  });

  test('should prevent recording during opponent innings (@live-game-scoring:AC029)', async ({
    page,
  }) => {
    // Check if opponent is currently batting
    const opponentAlert = page.getByTestId('opponent-batting-alert');

    if (await opponentAlert.isVisible({ timeout: 2000 })) {
      // Given: Opponent is batting
      await expect(opponentAlert).toContainText(/opponent/i);

      // When: Try to record at-bat
      const singleBtn = page.getByTestId('single-button');
      if (await singleBtn.isVisible()) {
        await singleBtn.click();
      }

      // Then: Should not record successfully
      const successMessage = page.getByText('At-bat recorded');
      expect(await successMessage.isVisible({ timeout: 1000 })).toBeFalsy();
    } else {
      // If it's our turn to bat, verify we can record
      const atBatForm = page.getByTestId('at-bat-form');
      await expect(atBatForm).toBeVisible();

      const singleBtn = page.getByTestId('single-button');
      await expect(singleBtn).toBeEnabled();
    }
  });

  test('should automatically control interface based on batting turn (@live-game-scoring:AC030)', async ({
    page,
  }) => {
    // Given: Live scoring interface
    const inningInfo = page.getByTestId('current-inning-info');
    await expect(inningInfo).toBeVisible();

    const inningText = await inningInfo.textContent();
    expect(inningText).toBeTruthy();

    // Check current state and verify appropriate interface control
    const opponentAlert = page.getByTestId('opponent-batting-alert');
    const atBatForm = page.getByTestId('at-bat-form');

    if (await opponentAlert.isVisible({ timeout: 1000 })) {
      // Opponent is batting - interface should be disabled
      await expect(opponentAlert).toBeVisible();
      await expect(opponentAlert).toContainText(/opponent/i);

      // Scoring form should be disabled or visually indicated as inactive
      if (await atBatForm.isVisible()) {
        const opacity = await atBatForm.evaluate(
          (el) => window.getComputedStyle(el).opacity
        );
        expect(parseFloat(opacity)).toBeLessThan(1); // Should be visually disabled
      }
    } else {
      // Our turn to bat - interface should be active
      await expect(atBatForm).toBeVisible();

      const singleBtn = page.getByTestId('single-button');
      await expect(singleBtn).toBeEnabled();

      // No opponent alert should be visible
      expect(await opponentAlert.isVisible({ timeout: 500 })).toBeFalsy();
    }
  });

  test('should maintain consistent game state across inning transitions (@live-game-scoring:AC025-@live-game-scoring:AC030)', async ({
    page,
  }) => {
    // Given: Current game state
    const inningInfo = page.getByTestId('current-inning-info');
    await expect(inningInfo).toBeVisible();

    const currentBatter = page.getByTestId('current-batter');
    await expect(currentBatter).toBeVisible();

    // Record current state for potential future validation

    // When: Interface is active (our turn to bat)
    const atBatForm = page.getByTestId('at-bat-form');
    const opponentAlert = page.getByTestId('opponent-batting-alert');

    if (
      (await atBatForm.isVisible()) &&
      !(await opponentAlert.isVisible({ timeout: 500 }))
    ) {
      // Record an at-bat to test state consistency
      const singleBtn = page.getByTestId('single-button');
      await singleBtn.click();

      // Handle advancement modal if present
      try {
        await page.waitForSelector(
          '[data-testid="baserunner-advancement-modal"]',
          { timeout: 2000 }
        );
        await page.getByTestId('confirm-advancement').click();
      } catch {
        // Modal didn't appear
      }

      // Should see success
      await expect(page.getByText('At-bat recorded').first()).toBeVisible();
      await page
        .getByText('At-bat recorded')
        .first()
        .waitFor({ state: 'hidden', timeout: 3000 });

      // Then: Game state should remain consistent
      await expect(inningInfo).toBeVisible();
      await expect(currentBatter).toBeVisible();

      // Inning should be the same or progressed logically
      const newInning = await inningInfo.textContent();
      expect(newInning).toBeTruthy();

      // Batter should advance or inning state should reflect proper progression
      const newBatter = await currentBatter.textContent();
      expect(newBatter).toBeTruthy();
    }

    // Verify no critical errors occurred
    const criticalErrors = page.locator('text=/critical|fatal|crash/i');
    expect(await criticalErrors.count()).toBe(0);
  });
});
