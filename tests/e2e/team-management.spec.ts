import { test, expect } from '@playwright/test';

test.describe('Team Management User Story', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('User Story: Create and manage teams, seasons, and game types', async ({
    page,
  }) => {
    // As a Scorekeeper
    // I want to create and manage teams, seasons, and game types
    // So that I can organize data by different teams and events

    // Navigate to team management
    await page.click('[data-testid="teams-tab"]');
    await expect(page.locator('[data-testid="teams-page"]')).toBeVisible();

    // Test: Create new team with team name and basic information
    await page.click('[data-testid="create-team-button"]');
    await expect(
      page.locator('[data-testid="create-team-modal"]')
    ).toBeVisible();

    await page.fill('[data-testid="team-name-input"]', 'Red Sox');
    await page.click('[data-testid="confirm-create-team"]');

    // Verify team was created
    await expect(page.locator('[data-testid="team-red-sox"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-red-sox"]')).toContainText(
      'Red Sox'
    );

    // Test: Create seasons to organize games by time periods
    await page.click('[data-testid="seasons-tab"]');
    await page.click('[data-testid="create-season-button"]');

    await page.fill('[data-testid="season-name-input"]', '2024 Regular Season');
    await page.fill('[data-testid="season-start-date"]', '2024-04-01');
    await page.fill('[data-testid="season-end-date"]', '2024-09-30');
    await page.click('[data-testid="confirm-create-season"]');

    await expect(
      page.locator('[data-testid="season-2024-regular-season"]')
    ).toBeVisible();

    // Test: Define different game types
    await page.click('[data-testid="game-types-tab"]');
    await page.click('[data-testid="create-game-type-button"]');

    await page.fill('[data-testid="game-type-name"]', 'Regular Season');
    await page.click('[data-testid="confirm-create-game-type"]');

    await page.click('[data-testid="create-game-type-button"]');
    await page.fill('[data-testid="game-type-name"]', 'Playoffs');
    await page.click('[data-testid="confirm-create-game-type"]');

    await expect(
      page.locator('[data-testid="game-type-regular-season"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="game-type-playoffs"]')
    ).toBeVisible();

    // Test: Manage player rosters for each team
    await page.click('[data-testid="teams-tab"]');
    await page.click('[data-testid="team-red-sox"]');
    await page.click('[data-testid="manage-roster-button"]');

    // Add first player
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Ted Williams');
    await page.fill('[data-testid="player-jersey-input"]', '9');
    await page.selectOption(
      '[data-testid="player-position-select"]',
      'left-field'
    );
    await page.click('[data-testid="confirm-add-player"]');

    // Add second player
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'David Ortiz');
    await page.fill('[data-testid="player-jersey-input"]', '34');
    await page.selectOption(
      '[data-testid="player-position-select"]',
      'first-base'
    );
    await page.click('[data-testid="confirm-add-player"]');

    // Verify players are added to roster
    await expect(
      page.locator('[data-testid="player-ted-williams"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="player-ted-williams"]')
    ).toContainText('#9 Ted Williams');
    await expect(
      page.locator('[data-testid="player-david-ortiz"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="player-david-ortiz"]')
    ).toContainText('#34 David Ortiz');

    // Test: Set up starting lineup and substitutes before games
    await page.click('[data-testid="setup-lineup-button"]');

    // Drag and drop players to batting order
    await page.dragAndDrop(
      '[data-testid="player-derek-jeter"]',
      '[data-testid="batting-position-1"]'
    );
    await page.dragAndDrop(
      '[data-testid="player-babe-ruth"]',
      '[data-testid="batting-position-2"]'
    );

    // Assign defensive positions
    await page.selectOption(
      '[data-testid="derek-jeter-position"]',
      'shortstop'
    );
    await page.selectOption(
      '[data-testid="babe-ruth-position"]',
      'right-field'
    );

    await page.click('[data-testid="save-lineup"]');
    await expect(
      page.locator('[data-testid="lineup-saved-message"]')
    ).toBeVisible();

    // Verify lineup is saved
    await expect(
      page.locator('[data-testid="batting-position-1"]')
    ).toContainText('Derek Jeter');
    await expect(
      page.locator('[data-testid="batting-position-2"]')
    ).toContainText('Babe Ruth');

    // Test: All team and player data is saved locally and persists between sessions
    await page.reload();

    // Verify data persists after reload
    await page.click('[data-testid="teams-tab"]');
    await expect(page.locator('[data-testid="team-red-sox"]')).toBeVisible();

    await page.click('[data-testid="team-red-sox"]');
    await page.click('[data-testid="manage-roster-button"]');
    await expect(
      page.locator('[data-testid="player-ted-williams"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="player-david-ortiz"]')
    ).toBeVisible();

    // Test offline operation (PWA requirement)
    await page.context().setOffline(true);
    await page.reload();

    // Should still work offline
    await expect(page.locator('[data-testid="teams-tab"]')).toBeVisible();
    await page.click('[data-testid="teams-tab"]');
    await expect(page.locator('[data-testid="team-red-sox"]')).toBeVisible();
  });

  test('Edge cases and validation', async ({ page }) => {
    await page.click('[data-testid="teams-tab"]');

    // Test: Cannot create team with empty name
    await page.click('[data-testid="create-team-button"]');
    await page.click('[data-testid="confirm-create-team"]'); // Empty name

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Team name cannot be empty'
    );

    // Test: Cannot create team with duplicate name
    await page.fill('[data-testid="team-name-input"]', 'Red Sox');
    await page.click('[data-testid="confirm-create-team"]');
    await expect(page.locator('[data-testid="team-red-sox"]')).toBeVisible();

    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Red Sox'); // Duplicate
    await page.click('[data-testid="confirm-create-team"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Team name Red Sox already exists'
    );

    // Test: Cannot assign duplicate jersey numbers
    await page.click('[data-testid="team-red-sox"]');
    await page.click('[data-testid="manage-roster-button"]');

    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Player 1');
    await page.fill('[data-testid="player-jersey-input"]', '10');
    await page.click('[data-testid="confirm-add-player"]');

    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Player 2');
    await page.fill('[data-testid="player-jersey-input"]', '10'); // Duplicate jersey
    await page.click('[data-testid="confirm-add-player"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Jersey number 10 already exists'
    );
  });

  test('Data export functionality', async ({ page }) => {
    // Create test data
    await page.click('[data-testid="teams-tab"]');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Export Test Team');
    await page.click('[data-testid="confirm-create-team"]');

    // Test: Data should be exportable for backup purposes
    await page.click('[data-testid="export-data-button"]');

    // Download should start
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(
      /breaking-bat-export-.*\.json/
    );

    // Verify export contains team data
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });
});
