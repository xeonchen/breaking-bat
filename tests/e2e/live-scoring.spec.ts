import { test, expect } from '@playwright/test';

test.describe('Live Scoring User Story', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Setup prerequisite data: team with players and a game
    await page.click('[data-testid="teams-tab"]');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Home Team');
    await page.click('[data-testid="confirm-create-team"]');

    // Add players to the team
    await page.click('[data-testid="team-home-team"]');
    await page.click('[data-testid="manage-roster-button"]');

    const players = [
      { name: 'John Smith', jersey: '1', position: 'pitcher' },
      { name: 'Mike Johnson', jersey: '2', position: 'catcher' },
      { name: 'Sarah Wilson', jersey: '3', position: 'first-base' },
      { name: 'David Brown', jersey: '4', position: 'second-base' },
      { name: 'Lisa Davis', jersey: '5', position: 'third-base' },
      { name: 'Tom Miller', jersey: '6', position: 'shortstop' },
      { name: 'Amy Garcia', jersey: '7', position: 'left-field' },
      { name: 'Chris Rodriguez', jersey: '8', position: 'center-field' },
      { name: 'Jessica Martinez', jersey: '9', position: 'right-field' },
    ];

    for (const player of players) {
      await page.click('[data-testid="add-player-button"]');
      await page.fill('[data-testid="player-name-input"]', player.name);
      await page.fill('[data-testid="player-jersey-input"]', player.jersey);
      await page.selectOption(
        '[data-testid="player-position-select"]',
        player.position
      );
      await page.click('[data-testid="confirm-add-player"]');
    }

    // Create a game
    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="create-game-button"]');
    await page.fill('[data-testid="game-name-input"]', 'Championship Game');
    await page.fill('[data-testid="opponent-input"]', 'Visitors');
    await page.fill('[data-testid="game-date-input"]', '2024-08-15');
    await page.fill('[data-testid="game-time-input"]', '19:00');
    await page.selectOption('[data-testid="team-select"]', 'Home Team');
    await page.click('[data-testid="confirm-create-game"]');

    // Setup lineup
    await page.click('[data-testid="game-championship-game"]');
    await page.click('[data-testid="setup-lineup-button"]');

    // Set batting order and positions
    for (let i = 0; i < players.length; i++) {
      await page.dragAndDrop(
        `[data-testid="available-player-${players[i].name.toLowerCase().replace(' ', '-')}"]`,
        `[data-testid="batting-position-${i + 1}"]`
      );
      await page.selectOption(
        `[data-testid="player-${i + 1}-position"]`,
        players[i].position
      );
    }

    await page.click('[data-testid="save-lineup"]');
    await expect(
      page.locator('[data-testid="lineup-saved-message"]')
    ).toBeVisible();
  });

  test('User Story: Record live game events and track statistics in real-time', async ({
    page,
  }) => {
    // As a Scorekeeper
    // I want to record live game events and track statistics in real-time
    // So that I can provide accurate, up-to-date information during games and generate comprehensive reports

    // Navigate to live scoring
    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="game-championship-game"]');
    await page.click('[data-testid="start-live-scoring"]');

    await expect(
      page.locator('[data-testid="live-scoring-page"]')
    ).toBeVisible();

    // Test: The interface displays current game state clearly
    await expect(page.locator('[data-testid="game-info-panel"]')).toContainText(
      'Championship Game'
    );
    await expect(page.locator('[data-testid="game-info-panel"]')).toContainText(
      'vs Visitors'
    );
    await expect(page.locator('[data-testid="current-inning"]')).toContainText(
      'Inning 1'
    );
    await expect(page.locator('[data-testid="inning-half"]')).toContainText(
      'Top'
    );
    await expect(page.locator('[data-testid="home-score"]')).toContainText('0');
    await expect(page.locator('[data-testid="visitor-score"]')).toContainText(
      '0'
    );

    // Test: Current batter information is prominently displayed
    await expect(page.locator('[data-testid="current-batter"]')).toContainText(
      '#1 John Smith'
    );
    await expect(
      page.locator('[data-testid="batting-position"]')
    ).toContainText('Batting 1st');

    // Test: Baserunner status is visually clear
    await expect(page.locator('[data-testid="first-base"]')).toHaveClass(
      /empty/
    );
    await expect(page.locator('[data-testid="second-base"]')).toHaveClass(
      /empty/
    );
    await expect(page.locator('[data-testid="third-base"]')).toHaveClass(
      /empty/
    );

    // Test: Record a single - batter reaches first base
    await page.click('[data-testid="result-single"]');
    await page.fill(
      '[data-testid="at-bat-description"]',
      'Single to center field'
    );
    await page.click('[data-testid="confirm-at-bat"]');

    // Verify baserunner status updated
    await expect(page.locator('[data-testid="first-base"]')).toContainText(
      'John Smith'
    );
    await expect(page.locator('[data-testid="first-base"]')).toHaveClass(
      /occupied/
    );
    await expect(page.locator('[data-testid="current-batter"]')).toContainText(
      '#2 Mike Johnson'
    );

    // Test: Record at-bat with RBI - runner scores
    await page.click('[data-testid="result-double"]');
    await page.fill(
      '[data-testid="at-bat-description"]',
      'Double to left field, RBI'
    );
    await page.fill('[data-testid="rbi-count"]', '1');

    // Set baserunner movement
    await page.click('[data-testid="runner-john-smith-scores"]');
    await page.click('[data-testid="batter-to-second"]');
    await page.click('[data-testid="confirm-at-bat"]');

    // Verify score updated and runner positions
    await expect(page.locator('[data-testid="home-score"]')).toContainText('1');
    await expect(page.locator('[data-testid="first-base"]')).toHaveClass(
      /empty/
    );
    await expect(page.locator('[data-testid="second-base"]')).toContainText(
      'Mike Johnson'
    );
    await expect(
      page.locator('[data-testid="runs-this-inning"]')
    ).toContainText('1');

    // Test: Record a strikeout - no baserunner changes
    await page.click('[data-testid="result-strikeout"]');
    await page.fill('[data-testid="at-bat-description"]', 'Swinging strikeout');
    await page.click('[data-testid="confirm-at-bat"]');

    // Verify no score change, baserunners stay
    await expect(page.locator('[data-testid="home-score"]')).toContainText('1');
    await expect(page.locator('[data-testid="second-base"]')).toContainText(
      'Mike Johnson'
    );
    await expect(page.locator('[data-testid="outs-count"]')).toContainText('1');

    // Test: Record home run with RBI
    await page.click('[data-testid="result-home-run"]');
    await page.fill(
      '[data-testid="at-bat-description"]',
      'Two-run homer to right field'
    );
    await page.fill('[data-testid="rbi-count"]', '2');

    // Home run clears all bases
    await page.click('[data-testid="all-runners-score"]');
    await page.click('[data-testid="confirm-at-bat"]');

    // Verify score updated and bases empty
    await expect(page.locator('[data-testid="home-score"]')).toContainText('3');
    await expect(page.locator('[data-testid="first-base"]')).toHaveClass(
      /empty/
    );
    await expect(page.locator('[data-testid="second-base"]')).toHaveClass(
      /empty/
    );
    await expect(page.locator('[data-testid="third-base"]')).toHaveClass(
      /empty/
    );
    await expect(
      page.locator('[data-testid="runs-this-inning"]')
    ).toContainText('3');

    // Test: Complete inning - advance to bottom of 1st
    await page.click('[data-testid="result-groundout"]');
    await page.click('[data-testid="confirm-at-bat"]');
    await page.click('[data-testid="result-flyout"]');
    await page.click('[data-testid="confirm-at-bat"]');

    // Should advance to bottom of inning
    await expect(page.locator('[data-testid="current-inning"]')).toContainText(
      'Inning 1'
    );
    await expect(page.locator('[data-testid="inning-half"]')).toContainText(
      'Bottom'
    );
    await expect(page.locator('[data-testid="outs-count"]')).toContainText('0');

    // Test: Statistics are updated in real-time
    await page.click('[data-testid="view-statistics"]');

    // Verify player statistics
    await expect(
      page.locator('[data-testid="player-john-smith-stats"]')
    ).toContainText('1-1'); // 1 hit in 1 at-bat
    await expect(
      page.locator('[data-testid="player-mike-johnson-stats"]')
    ).toContainText('1-1, 1 RBI'); // 1 hit, 1 RBI
    await expect(
      page.locator('[data-testid="player-sarah-wilson-stats"]')
    ).toContainText('1-1, 2 RBI'); // Home run with 2 RBI

    // Test: Team statistics
    await expect(
      page.locator('[data-testid="team-batting-average"]')
    ).toContainText('.750'); // 3 hits in 4 at-bats
    await expect(page.locator('[data-testid="team-runs"]')).toContainText('3');
    await expect(page.locator('[data-testid="team-hits"]')).toContainText('3');
    await expect(page.locator('[data-testid="team-rbi"]')).toContainText('3');

    // Test: Game statistics
    await expect(
      page.locator('[data-testid="innings-completed"]')
    ).toContainText('0.5'); // Top of 1st completed
    await expect(page.locator('[data-testid="total-at-bats"]')).toContainText(
      '5'
    );

    await page.click('[data-testid="back-to-scoring"]');

    // Test: All data is automatically saved and persists during the game
    await page.reload();

    // Verify game state persists
    await expect(page.locator('[data-testid="home-score"]')).toContainText('3');
    await expect(page.locator('[data-testid="current-inning"]')).toContainText(
      'Inning 1'
    );
    await expect(page.locator('[data-testid="inning-half"]')).toContainText(
      'Bottom'
    );

    // Test: Can continue scoring from where left off
    await expect(page.locator('[data-testid="current-batter"]')).toContainText(
      '#1 John Smith'
    );
  });

  test('Complex scoring scenario with substitutions', async ({ page }) => {
    // Start live scoring
    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="game-championship-game"]');
    await page.click('[data-testid="start-live-scoring"]');

    // Advance to later in the game
    await page.click('[data-testid="advance-to-inning"]');
    await page.selectOption('[data-testid="inning-select"]', '5');
    await page.selectOption('[data-testid="half-select"]', 'top');
    await page.click('[data-testid="confirm-advance"]');

    // Test: Make a substitution
    await page.click('[data-testid="substitutions"]');
    await page.click('[data-testid="substitute-player"]');

    // Remove current player and add substitute
    await page.selectOption('[data-testid="remove-player"]', 'John Smith');
    await page.selectOption(
      '[data-testid="substitute-player"]',
      'Sub Player #10'
    );
    await page.selectOption('[data-testid="substitute-position"]', 'pitcher');
    await page.click('[data-testid="confirm-substitution"]');

    // Verify substitution is reflected
    await expect(page.locator('[data-testid="current-pitcher"]')).toContainText(
      'Sub Player #10'
    );

    // Test: Record complex play with multiple runners
    await page.click('[data-testid="result-triple"]');
    await page.fill('[data-testid="at-bat-description"]', 'Triple with 2 RBI');
    await page.fill('[data-testid="rbi-count"]', '2');

    // Set complex baserunner movements
    await page.click('[data-testid="runner-first-scores"]');
    await page.click('[data-testid="runner-second-scores"]');
    await page.click('[data-testid="batter-to-third"]');
    await page.click('[data-testid="confirm-at-bat"]');

    // Verify complex scoring recorded correctly
    await expect(page.locator('[data-testid="home-score"]')).toContain('2'); // 2 additional runs
    await expect(page.locator('[data-testid="third-base"]')).not.toHaveClass(
      /empty/
    );
  });

  test('Error handling and validation during live scoring', async ({
    page,
  }) => {
    // Start live scoring
    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="game-championship-game"]');
    await page.click('[data-testid="start-live-scoring"]');

    // Test: Validation errors for invalid inputs
    await page.click('[data-testid="result-single"]');
    await page.fill('[data-testid="rbi-count"]', '-1'); // Invalid negative RBI
    await page.click('[data-testid="confirm-at-bat"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'RBI cannot be negative'
    );

    // Test: RBI mismatch validation
    await page.fill('[data-testid="rbi-count"]', '2');
    await page.click('[data-testid="confirm-at-bat"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'RBI count must match runs scored'
    );

    // Test: Correct the error and continue
    await page.fill('[data-testid="rbi-count"]', '0');
    await page.click('[data-testid="confirm-at-bat"]');

    await expect(page.locator('[data-testid="current-batter"]')).toContainText(
      '#2 Mike Johnson'
    );
  });

  test('Mobile interface optimization for live scoring', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    // Start live scoring
    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="game-championship-game"]');
    await page.click('[data-testid="start-live-scoring"]');

    // Test: Interface elements are touch-friendly
    const resultButton = page.locator('[data-testid="result-single"]');
    await expect(resultButton).toHaveCSS('min-height', /44px/); // Touch target size

    // Test: Swipe gestures for quick actions
    await page.swipeLeft('[data-testid="scoring-panel"]');
    await expect(
      page.locator('[data-testid="statistics-panel"]')
    ).toBeVisible();

    await page.swipeRight('[data-testid="statistics-panel"]');
    await expect(page.locator('[data-testid="scoring-panel"]')).toBeVisible();

    // Test: Mobile-optimized forms
    await page.click('[data-testid="result-single"]');
    await expect(
      page.locator('[data-testid="mobile-at-bat-form"]')
    ).toBeVisible();

    // Large, easy-to-tap buttons
    const confirmButton = page.locator('[data-testid="confirm-at-bat"]');
    await expect(confirmButton).toHaveCSS('min-height', /48px/);
  });

  test('Real-time updates and offline functionality', async ({ page }) => {
    // Start live scoring
    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="game-championship-game"]');
    await page.click('[data-testid="start-live-scoring"]');

    // Record some at-bats
    await page.click('[data-testid="result-single"]');
    await page.click('[data-testid="confirm-at-bat"]');

    // Test offline operation
    await page.context().setOffline(true);

    // Should still work offline
    await page.click('[data-testid="result-double"]');
    await page.fill('[data-testid="rbi-count"]', '1');
    await page.click('[data-testid="confirm-at-bat"]');

    // Verify data is cached locally
    await expect(page.locator('[data-testid="home-score"]')).toContainText('1');
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();

    // Test data persistence after going back online
    await page.context().setOffline(false);
    await page.reload();

    // Data should still be there
    await expect(page.locator('[data-testid="home-score"]')).toContainText('1');
  });
});
