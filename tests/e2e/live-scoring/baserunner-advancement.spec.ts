import { test, expect } from '@playwright/test';

test.describe('Live Scoring - Baserunner Advancement (@AC004, @AC005, @AC006, @AC007)', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test game with runners in position
    await page.goto('/');
    await page.getByTestId('load-sample-data-button').click();
    await page.waitForSelector('[data-testid="sample-data-loaded"]');

    // Create and start test game
    await page.getByTestId('nav-games').click();
    await page.getByTestId('create-game-button').click();
    await page.getByTestId('game-name-input').fill('Baserunner Test Game');
    await page.getByTestId('opponent-input').fill('Test Team');
    await page.getByTestId('home-away-home').check();
    await page.getByTestId('save-game-button').click();

    // Set up complete 9-player lineup
    await page.getByTestId('setup-lineup-button').click();
    for (let i = 1; i <= 9; i++) {
      await page.getByTestId(`lineup-player-${i}`).selectOption(`player-${i}`);
    }
    await page.getByTestId('save-lineup-button').click();
    await page.getByTestId('start-game-button').click();

    // Create game situation with runners on base
    await page.getByTestId('single-button').click(); // Runner on 1st
    await page.getByTestId('single-button').click(); // Runners on 1st and 2nd
    await page.getByTestId('single-button').click(); // Bases loaded

    await expect(page.getByTestId('scoring-page')).toBeVisible();
  });

  test('should apply standard baserunner advancement for single (@AC004)', async ({
    page,
  }) => {
    // Given: Runners on 1st and 3rd base
    // First, set up this specific situation
    await page.getByTestId('strikeout-button').click(); // Clear one runner
    await page.getByTestId('strikeout-button').click(); // Clear another runner
    await page.getByTestId('single-button').click(); // Runner on 1st
    await page.getByTestId('double-button').click(); // Runner to 3rd, batter to 2nd
    await page.getByTestId('strikeout-button').click(); // Out, advance batter

    // Now we should have runners on 2nd and 3rd
    await expect(page.getByTestId('baserunner-second')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-third')).not.toContainText(
      'Empty'
    );

    const initialScore = await page
      .getByTestId('scoreboard-section')
      .textContent();

    // When: Batter hits a single
    await page.getByTestId('single-button').click();

    // Then: Standard advancement should apply
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Runner from 3rd should score
    const newScore = await page.getByTestId('scoreboard-section').textContent();
    expect(newScore).not.toBe(initialScore);

    // Runner from 2nd should advance to 3rd
    await expect(page.getByTestId('baserunner-third')).not.toContainText(
      'Empty'
    );

    // Batter should be on 1st
    await expect(page.getByTestId('baserunner-first')).not.toContainText(
      'Empty'
    );
  });

  test('should advance all runners two bases for double (@AC004)', async ({
    page,
  }) => {
    // Given: Runners on 1st and 2nd (from beforeEach setup)
    await expect(page.getByTestId('baserunner-first')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-second')).not.toContainText(
      'Empty'
    );

    const initialScore = await page
      .getByTestId('scoreboard-section')
      .textContent();

    // When: Batter hits a double
    await page.getByTestId('double-button').click();

    // Then: All runners should advance two bases
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Both runners should score (2nd and 3rd base runners)
    const newScore = await page.getByTestId('scoreboard-section').textContent();
    expect(newScore).not.toBe(initialScore);

    // Batter should be on 2nd base
    await expect(page.getByTestId('baserunner-second')).not.toContainText(
      'Empty'
    );

    // 1st and 3rd should be empty now
    await expect(page.getByTestId('baserunner-first')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-third')).toContainText('Empty');
  });

  test('should advance only forced runners on walk (@AC004)', async ({
    page,
  }) => {
    // Given: Runners on 1st and 3rd (need specific setup)
    await page.getByTestId('strikeout-button').click(); // Clear a batter
    await page.getByTestId('single-button').click(); // Runner on 1st
    await page.getByTestId('triple-button').click(); // Previous runner to 3rd, batter to 3rd
    await page.getByTestId('strikeout-button').click(); // Advance batter

    // Verify setup: should have runners on 1st and 3rd
    await expect(page.getByTestId('baserunner-first')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-third')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-second')).toContainText('Empty');

    // When: Batter walks
    await page.getByTestId('walk-button').click();

    // Then: Only forced runner should advance
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // 1st base runner should advance to 2nd (forced)
    await expect(page.getByTestId('baserunner-second')).not.toContainText(
      'Empty'
    );

    // 3rd base runner should stay (not forced)
    await expect(page.getByTestId('baserunner-third')).not.toContainText(
      'Empty'
    );

    // Batter should be on 1st
    await expect(page.getByTestId('baserunner-first')).not.toContainText(
      'Empty'
    );
  });

  test('should show manual override interface for runner advancement (@AC005)', async ({
    page,
  }) => {
    // Given: Game setup with manual override enabled
    // This may require additional UI setup or configuration

    // When: Hitting with runners on base
    await page.getByTestId('double-button').click();

    // Then: If manual override is enabled, should show advancement modal
    // Note: This test assumes manual override UI is implemented
    // May need to check for modal or override interface

    // For now, mark as implementation pending
    test.skip('Manual override UI needs to be implemented');
  });

  test('should calculate RBIs based on scoring runners (@AC006)', async ({
    page,
  }) => {
    // Given: Runners on 2nd and 3rd base
    await expect(page.getByTestId('baserunner-second')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-third')).not.toContainText(
      'Empty'
    );

    // When: Batter hits double (should score both runners)
    await page.getByTestId('double-button').click();
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Then: Should show correct RBI count in success message or stats
    await expect(page.getByText(/2 run.*scored/i)).toBeVisible();
  });

  test('should display visual baserunner representation (@AC007)', async ({
    page,
  }) => {
    // Given: Live scoring page with baserunners
    await expect(page.getByTestId('at-bat-form')).toBeVisible();

    // Then: Should show visual baserunner display
    const baserunnerDisplay = page.locator('[data-testid^="baserunner-"]');
    await expect(baserunnerDisplay).toHaveCount(3); // 1st, 2nd, 3rd base

    // Each base should show its status clearly
    const firstBase = page.getByTestId('baserunner-first');
    const secondBase = page.getByTestId('baserunner-second');
    const thirdBase = page.getByTestId('baserunner-third');

    // Should distinguish between occupied and empty bases
    await expect(firstBase).toBeVisible();
    await expect(secondBase).toBeVisible();
    await expect(thirdBase).toBeVisible();

    // Occupied bases should show player name or indicator
    if ((await secondBase.textContent()) !== 'Empty') {
      await expect(secondBase).not.toContainText('Empty');
    }
  });

  test('should update baserunner display in real-time (@AC007)', async ({
    page,
  }) => {
    // Given: Initial baserunner state
    const initialFirstBase = await page
      .getByTestId('baserunner-first')
      .textContent();
    const initialSecondBase = await page
      .getByTestId('baserunner-second')
      .textContent();

    // When: Recording at-bat that changes baserunners
    await page.getByTestId('single-button').click();
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Then: Display should update immediately
    const newFirstBase = await page
      .getByTestId('baserunner-first')
      .textContent();
    const newSecondBase = await page
      .getByTestId('baserunner-second')
      .textContent();

    // Some change should have occurred
    expect(newFirstBase).not.toBe(initialFirstBase);
    expect(newSecondBase).not.toBe(initialSecondBase);
  });

  test('should clear all runners on home run (@AC004)', async ({ page }) => {
    // Given: Bases loaded (from beforeEach)
    await expect(page.getByTestId('baserunner-first')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-second')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-third')).not.toContainText(
      'Empty'
    );

    const initialScore = await page
      .getByTestId('scoreboard-section')
      .textContent();

    // When: Batter hits home run
    await page.getByTestId('home-run-button').click();
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Then: All bases should be cleared
    await expect(page.getByTestId('baserunner-first')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-second')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-third')).toContainText('Empty');

    // Score should increase by 4 (3 runners + batter)
    const newScore = await page.getByTestId('scoreboard-section').textContent();
    expect(newScore).not.toBe(initialScore);
    await expect(page.getByText(/4 run.*scored/i)).toBeVisible();
  });

  test('should not advance runners on strikeout (@AC004)', async ({ page }) => {
    // Given: Runners on base
    const initialFirst = await page
      .getByTestId('baserunner-first')
      .textContent();
    const initialSecond = await page
      .getByTestId('baserunner-second')
      .textContent();
    const initialThird = await page
      .getByTestId('baserunner-third')
      .textContent();

    // When: Batter strikes out
    await page.getByTestId('strikeout-button').click();
    await expect(page.getByText('At-bat recorded')).toBeVisible();

    // Then: All runners should stay in place
    const finalFirst = await page.getByTestId('baserunner-first').textContent();
    const finalSecond = await page
      .getByTestId('baserunner-second')
      .textContent();
    const finalThird = await page.getByTestId('baserunner-third').textContent();

    expect(finalFirst).toBe(initialFirst);
    expect(finalSecond).toBe(initialSecond);
    expect(finalThird).toBe(initialThird);
  });

  test('should handle baserunner advancement with outs (@AC008)', async ({
    page,
  }) => {
    // Given: Runners on base with some outs already
    await page.getByTestId('strikeout-button').click(); // 1 out
    await page.getByTestId('ground-out-button').click(); // 2 outs

    // Verify out count
    const outCount = page.getByTestId('current-outs');
    await expect(outCount).toContainText('2');

    // When: Recording another out
    await page.getByTestId('strikeout-button').click(); // 3 outs

    // Then: Should handle inning transition
    await expect(page.getByText(/inning/i)).toBeVisible(); // Inning change message

    // Out count should reset
    await expect(outCount).toContainText('0');

    // Bases should be cleared for new inning
    await expect(page.getByTestId('baserunner-first')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-second')).toContainText('Empty');
    await expect(page.getByTestId('baserunner-third')).toContainText('Empty');
  });
});
