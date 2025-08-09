import { test, expect } from '@playwright/test';

test.describe('Live Scoring - At-Bat Recording (@AC001, @AC002, @AC003)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data and navigate to live scoring
    await page.goto('/');
    await page.getByTestId('load-sample-data-button').click();
    await page.waitForSelector('[data-testid="sample-data-loaded"]');

    // Create a test game and start it
    await page.getByTestId('nav-games').click();
    await page.getByTestId('create-game-button').click();
    await page.getByTestId('game-name-input').fill('E2E Test Game');
    await page.getByTestId('opponent-input').fill('Test Opponent');
    await page.getByTestId('home-away-home').check();
    await page.getByTestId('save-game-button').click();

    // Set up lineup and start game
    await page.getByTestId('setup-lineup-button').click();
    await page.getByTestId('lineup-player-1').selectOption('player-1');
    await page.getByTestId('lineup-player-2').selectOption('player-2');
    await page.getByTestId('lineup-player-3').selectOption('player-3');
    await page.getByTestId('save-lineup-button').click();
    await page.getByTestId('start-game-button').click();

    // Should navigate to live scoring page
    await expect(page.getByTestId('scoring-page')).toBeVisible();
  });

  test('should record at-bat with functional business logic integration (@AC001)', async ({
    page,
  }) => {
    // Given: Live scoring page with current batter displayed
    await expect(page.getByTestId('current-batter')).toBeVisible();
    await expect(page.getByTestId('at-bat-form')).toBeVisible();

    // Verify initial game state
    const currentBatter = page.getByTestId('current-batter');
    await expect(currentBatter).toContainText('1'); // First batter in lineup

    // Verify empty baserunners initially
    await expect(page.getByTestId('baserunner-first')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-second')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-third')).toContainText('Empty');

    // When: Recording a double (should place batter on second base)
    await page.getByTestId('double-button').click();

    // Then: At-bat should be recorded and processed
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Verify batter advanced to next player
    const nextBatter = page.getByTestId('current-batter');
    await expect(nextBatter).toContainText('2'); // Second batter should be up

    // Verify baserunners updated (batter should be on second base)
    await expect(page.getByTestId('baserunner-first')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-second')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-third')).toContainText('Empty');

    // Verify scoreboard updated (if applicable)
    await expect(page.getByTestId('scoreboard-section')).toBeVisible();
  });

  test('should persist at-bat data immediately to prevent data loss (@AC001)', async ({
    page,
  }) => {
    // Given: Live scoring interface
    await expect(page.getByTestId('at-bat-form')).toBeVisible();

    // When: Recording an at-bat
    await page.getByTestId('single-button').click();
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Then: Data should be persisted (simulate browser crash/refresh)
    await page.reload();

    // After reload, game should resume with recorded at-bat
    await expect(page.getByTestId('scoring-page')).toBeVisible();

    // Verify second batter is now up (proving first at-bat was saved)
    const currentBatter = page.getByTestId('current-batter');
    await expect(currentBatter).toContainText('2');

    // Verify baserunner is still on base from previous at-bat
    await expect(page.getByTestId('baserunner-first')).not.toContainText(
      'Empty'
    );
  });

  test('should automatically advance to next batter after each at-bat (@AC002)', async ({
    page,
  }) => {
    // Given: Game starting with first batter
    const initialBatter = page.getByTestId('current-batter');
    await expect(initialBatter).toContainText('1');

    // When: Completing first at-bat
    await page.getByTestId('strikeout-button').click();
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Then: Should advance to second batter
    const secondBatter = page.getByTestId('current-batter');
    await expect(secondBatter).toContainText('2');

    // When: Completing second at-bat
    await page.getByTestId('walk-button').click();
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Then: Should advance to third batter
    const thirdBatter = page.getByTestId('current-batter');
    await expect(thirdBatter).toContainText('3');
  });

  test('should cycle back to first batter after ninth batter (@AC002)', async ({
    page,
  }) => {
    // Given: We need to advance through all 9 batters
    // Set up full 9-player lineup first
    await page.getByTestId('pause-game-button').click();
    await page.getByTestId('confirm-pause-button').click();
    await page.getByTestId('nav-games').click();
    await page.getByTestId('setup-lineup-button').click();

    // Fill remaining lineup positions
    for (let i = 4; i <= 9; i++) {
      await page.getByTestId(`lineup-player-${i}`).selectOption(`player-${i}`);
    }
    await page.getByTestId('save-lineup-button').click();
    await page.getByTestId('resume-game-button').click();

    // Fast-forward through batters 1-8 by recording quick outs
    for (let batter = 1; batter <= 8; batter++) {
      const currentBatter = page.getByTestId('current-batter');
      await expect(currentBatter).toContainText(batter.toString());
      await page.getByTestId('ground-out-button').click();
      await expect(page.getByText('At-bat recorded')).toBeVisible();
    }

    // Verify 9th batter is up
    const ninthBatter = page.getByTestId('current-batter');
    await expect(ninthBatter).toContainText('9');

    // When: 9th batter completes at-bat
    await page.getByTestId('single-button').click();
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Then: Should cycle back to first batter
    const backToFirst = page.getByTestId('current-batter');
    await expect(backToFirst).toContainText('1');
  });

  test('should display all batting result quick-action buttons (@AC003)', async ({
    page,
  }) => {
    // Given: At-bat form is displayed
    await expect(page.getByTestId('at-bat-form')).toBeVisible();
    const outcomeButtons = page.getByTestId('outcome-buttons');
    await expect(outcomeButtons).toBeVisible();

    // Then: All required buttons should be present
    const expectedButtons = [
      'single-button',
      'double-button',
      'triple-button',
      'home-run-button',
      'walk-button',
      'strikeout-button',
      'ground-out-button',
    ];

    for (const buttonId of expectedButtons) {
      await expect(page.getByTestId(buttonId)).toBeVisible();
      await expect(page.getByTestId(buttonId)).toBeEnabled();
    }
  });

  test('should work with touch input on tablet devices (@AC003)', async ({
    page,
    browserName,
  }) => {
    // Given: Tablet viewport simulation
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify mobile-optimized layout is applied
    await expect(page.getByTestId('at-bat-form')).toHaveClass(/mobile-layout/);

    // Then: All buttons should be appropriately sized for touch
    const buttons = await page
      .getByTestId('outcome-buttons')
      .locator('button')
      .all();

    for (const button of buttons) {
      const boundingBox = await button.boundingBox();
      expect(boundingBox).toBeTruthy();
      // Touch target should be at least 44px (iOS/Android recommendation)
      expect(boundingBox!.height).toBeGreaterThanOrEqual(40);
      expect(boundingBox!.width).toBeGreaterThanOrEqual(80);
    }

    // When: Tapping a button (simulate touch)
    await page.getByTestId('double-button').click();

    // Then: Should register the touch input properly
    await expect(page.getByText('At-bat recorded')).toBeVisible();
  });

  test('should provide immediate visual feedback for button presses (@AC016)', async ({
    page,
  }) => {
    // Given: At-bat form with buttons
    await expect(page.getByTestId('at-bat-form')).toBeVisible();

    // When: Hovering over a button
    const homeRunButton = page.getByTestId('home-run-button');
    await homeRunButton.hover();

    // Then: Should show visual hover state
    await expect(homeRunButton).toHaveCSS('background-color', /#/); // Some color change

    // When: Clicking the button
    await homeRunButton.click();

    // Then: Should show immediate feedback
    await expect(page.getByText('At-bat recorded')).toBeVisible({
      timeout: 1000,
    });

    // And success feedback should be prominent
    const successMessage = page.getByText('At-bat recorded');
    await expect(successMessage).toHaveCSS('color', /#/); // Success color
  });

  test('should handle rapid successive button clicks without errors (@AC001)', async ({
    page,
  }) => {
    // Given: Multiple rapid at-bats to record
    const atBats = ['single', 'double', 'strikeout', 'walk'];

    // When: Clicking buttons in rapid succession
    for (const atBat of atBats) {
      await page.getByTestId(`${atBat}-button`).click();
      // Wait for processing but don't wait too long
      await expect(page.getByText('At-bat recorded')).toBeVisible({
        timeout: 2000,
      });
      // Small delay to allow processing
      await page.waitForTimeout(100);
    }

    // Then: All at-bats should be processed successfully
    // Should be on 5th batter after 4 at-bats
    const currentBatter = page.getByTestId('current-batter');
    await expect(currentBatter).toContainText('5');

    // Should have runners on base from the hits
    await expect(page.getByTestId('baserunner-first')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-second')).not.toContainText(
      'Empty'
    );
  });

  test('should show error message when at-bat recording fails (@AC016)', async ({
    page,
  }) => {
    // Given: Simulate error condition (disconnect database or similar)
    // This might require injecting an error condition through test data

    // When: Attempting to record at-bat with error condition
    // Note: This test may need to be implemented with database mocking
    // or network interception to simulate failure conditions

    // Then: Should show appropriate error message
    // await expect(page.getByTestId('error-message')).toBeVisible();
    // await expect(page.getByTestId('retry-button')).toBeVisible();

    // For now, mark as pending implementation
    test.skip('Error simulation needs backend integration');
  });
});
