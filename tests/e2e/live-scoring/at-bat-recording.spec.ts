import { test, expect } from '@playwright/test';
import { createTestGame, setupTestLineup } from '../helpers/test-data-setup';

test.describe('Live Scoring - At-Bat Recording (@AC001, @AC002, @AC003)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console logging from the beginning
    page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', (error) =>
      console.log('BROWSER ERROR:', error.message)
    );

    // Create test game using dedicated test setup
    const gameName = 'E2E Test Game';
    await createTestGame(page, {
      name: gameName,
      opponent: 'Test Opponent',
      teamName: 'Test Team',
    });

    // Setup lineup for the test game
    await setupTestLineup(page, gameName);

    // Start the game
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
      console.log('✅ Game started successfully');
    } else {
      console.log('❌ Start game button not found');
    }

    // Wait for scoring page to load
    try {
      await page.waitForSelector('[data-testid="scoring-page"]', {
        timeout: 5000,
      });
      console.log('✅ Scoring page loaded successfully');
    } catch (e) {
      console.log('❌ Scoring page failed to load:', e.message);
    }

    // Should navigate to live scoring page
    await expect(page.getByTestId('scoring-page')).toBeVisible();
  });

  test('should record at-bat with functional business logic integration (@AC001)', async ({
    page,
  }) => {
    // Given: Live scoring page with current batter displayed
    await expect(page.getByTestId('current-batter')).toBeVisible();
    await expect(page.getByTestId('at-bat-form')).toBeVisible();

    // Verify initial game state (according to live-scoring.yaml ui_schema)
    const currentBatter = page.getByTestId('current-batter');
    await expect(currentBatter).toContainText('1st Batter'); // First batter in lineup per spec

    // Verify empty baserunners initially
    await expect(page.getByTestId('baserunner-first')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-second')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-third')).toContainText('Empty');

    // When: Recording a double (should place batter on second base)
    await page.getByTestId('double-button').click();

    // Handle baserunner advancement modal (expected for hits like doubles)
    await expect(
      page.getByTestId('baserunner-advancement-modal')
    ).toBeVisible();
    await page.getByTestId('confirm-advancement').click();

    // Then: At-bat should be recorded and persisted immediately
    await expect(page.getByText('At-bat recorded').first()).toBeVisible();

    // Wait for toast to disappear
    await page
      .getByText('At-bat recorded')
      .first()
      .waitFor({ state: 'hidden', timeout: 3000 });

    // Verify baserunner advancement: batter should be on second base
    // Note: Using sample data from hybrid approach - expect actual MLB player names
    await expect(page.getByTestId('baserunner-second')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-first')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-third')).toContainText('Empty');
  });

  test('should persist at-bat data immediately to prevent data loss (@AC001)', async ({
    page,
  }) => {
    // Given: Initial state with first batter
    await expect(page.getByTestId('current-batter')).toContainText(
      '1st Batter'
    );

    // When: Recording a home run
    await page.getByTestId('home-run-button').click();

    // Home runs may not need advancement modal (automatic advancement)
    try {
      await page.waitForSelector(
        '[data-testid="baserunner-advancement-modal"]',
        { timeout: 2000 }
      );
      await page.getByTestId('confirm-advancement').click();
    } catch {
      // Home runs might automatically advance all runners without modal
    }

    // Then: Data should be persisted (verify by page refresh)
    await page.reload();

    // Should still show the same game state after refresh
    await expect(page.getByTestId('scoring-page')).toBeVisible();
    await expect(page.getByTestId('current-batter')).toContainText(
      '2nd Batter'
    ); // Should advance to next batter
  });

  test('should automatically advance to next batter after each at-bat (@AC002)', async ({
    page,
  }) => {
    // Given: First batter up
    await expect(page.getByTestId('current-batter')).toContainText(
      '1st Batter'
    );

    // When: Recording first at-bat (strikeout)
    await page.getByTestId('strikeout-button').click();
    await expect(page.getByText('At-bat recorded').first()).toBeVisible();
    await page
      .getByText('At-bat recorded')
      .first()
      .waitFor({ state: 'hidden', timeout: 3000 });

    // Then: Should advance to second batter
    await expect(page.getByTestId('current-batter')).toContainText(
      '2nd Batter'
    );

    // When: Recording second at-bat (walk)
    await page.getByTestId('walk-button').click();
    await expect(page.getByText('At-bat recorded').first()).toBeVisible();
    await page
      .getByText('At-bat recorded')
      .first()
      .waitFor({ state: 'hidden', timeout: 3000 });

    // Then: Should advance to third batter
    await expect(page.getByTestId('current-batter')).toContainText(
      '3rd Batter'
    );
  });

  test('should provide touch-friendly batting result buttons (@AC003)', async ({
    page,
  }) => {
    // Given: Scoring page loaded
    await expect(page.getByTestId('at-bat-form')).toBeVisible();

    // Then: All batting result buttons should be visible and touch-friendly
    const expectedButtons = [
      'single-button',
      'double-button',
      'triple-button',
      'home-run-button',
      'walk-button',
      'strikeout-button',
      'ground-out-button',
    ];

    for (const buttonTestId of expectedButtons) {
      const button = page.getByTestId(buttonTestId);
      await expect(button).toBeVisible();

      // Verify button is touch-friendly (at least 40px height is acceptable for this UI)
      const boundingBox = await button.boundingBox();
      expect(boundingBox?.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('should show proper baserunner diagram with current state (@AC007)', async ({
    page,
  }) => {
    // Given: Empty bases initially (check baserunner display section exists)
    await expect(page.getByTestId('scoring-page')).toBeVisible();
    await expect(page.getByTestId('baserunner-first')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-second')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-third')).toContainText('Empty');

    // When: Recording a single
    await page.getByTestId('single-button').click();
    await expect(
      page.getByTestId('baserunner-advancement-modal')
    ).toBeVisible();
    await page.getByTestId('confirm-advancement').click();
    await expect(page.getByText('At-bat recorded').first()).toBeVisible();
    await page
      .getByText('At-bat recorded')
      .first()
      .waitFor({ state: 'hidden', timeout: 3000 });

    // Then: Should show batter on first base (expect actual MLB player from sample data)
    await expect(page.getByTestId('baserunner-first')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-second')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-third')).toContainText('Empty');
  });

  test('should update in real-time without page refresh (@AC014)', async ({
    page,
  }) => {
    // Given: Initial state
    const initialBatter = await page
      .getByTestId('current-batter')
      .textContent();

    // When: Recording an at-bat
    await page.getByTestId('single-button').click();
    await expect(
      page.getByTestId('baserunner-advancement-modal')
    ).toBeVisible();
    await page.getByTestId('confirm-advancement').click();

    // Then: Interface should update immediately without refresh
    const updatedBatter = await page
      .getByTestId('current-batter')
      .textContent();
    expect(updatedBatter).not.toBe(initialBatter);

    // Baserunner state should be updated immediately (expect actual MLB player from sample data)
    await expect(page.getByTestId('baserunner-first')).not.toContainText(
      'Empty'
    );
  });

  test('should provide immediate visual feedback for all actions (@AC016)', async ({
    page,
  }) => {
    // Given: Scoring interface ready
    await expect(page.getByTestId('at-bat-form')).toBeVisible();

    // When: Clicking any scoring button
    await page.getByTestId('double-button').click();

    // Then: Should immediately show modal (visual feedback)
    await expect(page.getByTestId('baserunner-advancement-modal')).toBeVisible({
      timeout: 1000,
    });

    // When: Confirming advancement
    await page.getByTestId('confirm-advancement').click();

    // Then: Should immediately show success toast (visual feedback)
    await expect(page.getByText('At-bat recorded').first()).toBeVisible({
      timeout: 1000,
    });
  });
});
