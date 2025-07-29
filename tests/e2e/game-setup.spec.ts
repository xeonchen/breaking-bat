import { test, expect } from '@playwright/test';

test.describe('Game Setup and Lineup Management User Story', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Setup prerequisite data: team with players
    await page.click('[data-testid="teams-tab"]');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Test Team');
    await page.click('[data-testid="confirm-create-team"]');

    // Add players to the team
    await page.click('[data-testid="team-test-team"]');
    await page.click('[data-testid="manage-roster-button"]');

    const players = [
      { name: 'Player 1', jersey: '1', position: 'pitcher' },
      { name: 'Player 2', jersey: '2', position: 'catcher' },
      { name: 'Player 3', jersey: '3', position: 'first-base' },
      { name: 'Player 4', jersey: '4', position: 'second-base' },
      { name: 'Player 5', jersey: '5', position: 'third-base' },
      { name: 'Player 6', jersey: '6', position: 'shortstop' },
      { name: 'Player 7', jersey: '7', position: 'left-field' },
      { name: 'Player 8', jersey: '8', position: 'center-field' },
      { name: 'Player 9', jersey: '9', position: 'right-field' },
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
  });

  test('User Story: Create new games and set up starting lineups efficiently', async ({
    page,
  }) => {
    // As a Scorekeeper
    // I want to create new games and set up starting lineups efficiently on the same page
    // So that I can quickly prepare for game recording with proper team selection, opponent details, and batting order

    // Navigate to game setup
    await page.click('[data-testid="games-tab"]');
    await expect(page.locator('[data-testid="games-page"]')).toBeVisible();

    // Test: Create a new game with all required details
    await page.click('[data-testid="create-game-button"]');
    await expect(
      page.locator('[data-testid="create-game-modal"]')
    ).toBeVisible();

    // Fill game details
    await page.fill('[data-testid="game-name-input"]', 'Season Opener');
    await page.fill('[data-testid="opponent-input"]', 'Red Sox');
    await page.fill('[data-testid="game-date-input"]', '2024-04-01');
    await page.fill('[data-testid="game-time-input"]', '14:00');
    await page.selectOption(
      '[data-testid="season-select"]',
      '2024 Regular Season'
    );
    await page.selectOption(
      '[data-testid="game-type-select"]',
      'Regular Season'
    );
    await page.selectOption('[data-testid="home-away-select"]', 'home');
    await page.selectOption('[data-testid="team-select"]', 'Test Team');

    await page.click('[data-testid="confirm-create-game"]');

    // Verify game was created
    await expect(
      page.locator('[data-testid="game-season-opener"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="game-season-opener"]')
    ).toContainText('Season Opener');
    await expect(
      page.locator('[data-testid="game-season-opener"]')
    ).toContainText('vs Red Sox');

    // Test: Set up starting lineup before the game begins
    await page.click('[data-testid="game-season-opener"]');
    await page.click('[data-testid="setup-lineup-button"]');
    await expect(
      page.locator('[data-testid="lineup-setup-page"]')
    ).toBeVisible();

    // Test: Can select teams and games from the same interface for streamlined workflow
    await expect(page.locator('[data-testid="game-info-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-info-panel"]')).toContainText(
      'Season Opener'
    );
    await expect(
      page.locator('[data-testid="team-roster-panel"]')
    ).toBeVisible();

    // Test: Set up batting order and defensive positions
    const battingOrder = [
      'Player 1',
      'Player 2',
      'Player 3',
      'Player 4',
      'Player 5',
      'Player 6',
      'Player 7',
      'Player 8',
      'Player 9',
    ];

    for (let i = 0; i < battingOrder.length; i++) {
      await page.dragAndDrop(
        `[data-testid="available-player-${battingOrder[i].toLowerCase().replace(' ', '-')}"]`,
        `[data-testid="batting-position-${i + 1}"]`
      );
    }

    // Assign defensive positions
    const positions = [
      'pitcher',
      'catcher',
      'first-base',
      'second-base',
      'third-base',
      'shortstop',
      'left-field',
      'center-field',
      'right-field',
    ];

    for (let i = 0; i < positions.length; i++) {
      await page.selectOption(
        `[data-testid="player-${i + 1}-position"]`,
        positions[i]
      );
    }

    // Test: Designate substitute players who are available during the game
    await page.click('[data-testid="substitutes-tab"]');
    await page.click('[data-testid="add-substitute-button"]');
    await page.fill('[data-testid="substitute-name-input"]', 'Sub Player 1');
    await page.fill('[data-testid="substitute-jersey-input"]', '10');
    await page.click('[data-testid="confirm-add-substitute"]');

    // Test: The lineup setup validates that all required positions are filled
    await page.click('[data-testid="starting-lineup-tab"]');

    // Try to save incomplete lineup (remove a player)
    await page.click(
      '[data-testid="batting-position-1"] [data-testid="remove-player"]'
    );
    await page.click('[data-testid="save-lineup"]');

    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('All batting positions must be filled');

    // Fix lineup and save
    await page.dragAndDrop(
      '[data-testid="available-player-player-1"]',
      '[data-testid="batting-position-1"]'
    );

    await page.click('[data-testid="save-lineup"]');
    await expect(
      page.locator('[data-testid="lineup-saved-message"]')
    ).toBeVisible();

    // Test: Changes to lineup are saved automatically
    await page.dragAndDrop(
      '[data-testid="batting-position-1"]',
      '[data-testid="batting-position-2"]'
    );
    await page.dragAndDrop(
      '[data-testid="batting-position-2"]',
      '[data-testid="batting-position-1"]'
    );

    // Should auto-save
    await page.waitForTimeout(1000);
    await expect(
      page.locator('[data-testid="auto-save-indicator"]')
    ).toBeVisible();

    // Verify changes persist after navigation
    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="game-season-opener"]');
    await page.click('[data-testid="setup-lineup-button"]');

    await expect(
      page.locator('[data-testid="batting-position-1"]')
    ).toContainText('Player 2');
    await expect(
      page.locator('[data-testid="batting-position-2"]')
    ).toContainText('Player 1');
  });

  test('Quick game creation workflow', async ({ page }) => {
    // Test: Can quickly create new games when needed
    await page.click('[data-testid="games-tab"]');

    // Quick create button should be prominent
    await expect(
      page.locator('[data-testid="quick-create-game"]')
    ).toBeVisible();

    await page.click('[data-testid="quick-create-game"]');

    // Should have smart defaults
    const today = new Date().toISOString().split('T')[0];
    await expect(page.locator('[data-testid="game-date-input"]')).toHaveValue(
      today
    );

    // Only require essential fields
    await page.fill('[data-testid="opponent-input"]', 'Quick Game Opponent');
    await page.click('[data-testid="confirm-create-game"]');

    await expect(
      page.locator('[data-testid="game-quick-game-opponent"]')
    ).toBeVisible();
  });

  test('Mobile/tablet optimized interface', async ({ page }) => {
    // Test: Interface should be optimized for quick setup and work reliably on mobile/tablet devices

    // Simulate tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="create-game-button"]');

    // Form should be responsive
    await expect(
      page.locator('[data-testid="create-game-modal"]')
    ).toBeVisible();

    // Touch-friendly form elements
    const gameNameInput = page.locator('[data-testid="game-name-input"]');
    await expect(gameNameInput).toHaveCSS('min-height', /44px/); // Touch target size

    // Mobile-optimized date/time pickers
    await page.click('[data-testid="game-date-input"]');
    await expect(
      page.locator('[data-testid="date-picker-mobile"]')
    ).toBeVisible();

    await page.click('[data-testid="game-time-input"]');
    await expect(
      page.locator('[data-testid="time-picker-mobile"]')
    ).toBeVisible();
  });

  test('Lineup validation and error handling', async ({ page }) => {
    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="create-game-button"]');

    // Test various validation scenarios

    // Empty opponent name
    await page.fill('[data-testid="game-name-input"]', 'Test Game');
    await page.click('[data-testid="confirm-create-game"]');
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Opponent name is required'
    );

    // Invalid date
    await page.fill('[data-testid="opponent-input"]', 'Test Opponent');
    await page.fill('[data-testid="game-date-input"]', '2020-01-01'); // Past date
    await page.click('[data-testid="confirm-create-game"]');
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Game date cannot be in the past'
    );

    // Fix errors and create successfully
    await page.fill('[data-testid="game-date-input"]', '2024-12-01');
    await page.click('[data-testid="confirm-create-game"]');
    await expect(page.locator('[data-testid="game-test-game"]')).toBeVisible();
  });

  test('Lineup setup with position validation', async ({ page }) => {
    // Create a game first
    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="create-game-button"]');
    await page.fill('[data-testid="game-name-input"]', 'Position Test Game');
    await page.fill('[data-testid="opponent-input"]', 'Validation Team');
    await page.click('[data-testid="confirm-create-game"]');

    await page.click('[data-testid="game-position-test-game"]');
    await page.click('[data-testid="setup-lineup-button"]');

    // Test: Cannot have duplicate positions
    await page.dragAndDrop(
      '[data-testid="available-player-player-1"]',
      '[data-testid="batting-position-1"]'
    );
    await page.dragAndDrop(
      '[data-testid="available-player-player-2"]',
      '[data-testid="batting-position-2"]'
    );

    await page.selectOption('[data-testid="player-1-position"]', 'pitcher');
    await page.selectOption('[data-testid="player-2-position"]', 'pitcher'); // Duplicate

    await page.click('[data-testid="save-lineup"]');
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('Each position can only be assigned to one player');

    // Fix and verify success
    await page.selectOption('[data-testid="player-2-position"]', 'catcher');
    await page.click('[data-testid="save-lineup"]');
    await expect(
      page.locator('[data-testid="lineup-saved-message"]')
    ).toBeVisible();
  });
});
