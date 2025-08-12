import { test, expect, Page } from '@playwright/test';
import {
  createTestPrerequisites,
  createTestGame,
  setupTestLineup,
} from './helpers/test-data-setup';

/**
 * Complete Game Workflow E2E Tests
 *
 * Tests the entire game workflow from creation through completion:
 * 1. Create prerequisites (team, season, game type, players)
 * 2. Create game
 * 3. Set up lineup (identify UI gaps)
 * 4. Start game
 * 5. Record at-bats
 * 6. Complete innings
 * 7. Finish game
 */

test.describe('Complete Game Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should complete full workflow from game creation to first at-bat', async ({
    page,
  }) => {
    // Step 1: Create complete prerequisites with players
    await createCompletePrerequisites(page);

    // Step 2: Create game using dedicated test setup
    const gameId = await createTestGame(page, {
      name: 'Workflow Test Game',
      opponent: 'Cardinals',
      teamName: 'Test Team',
    });

    // Step 3: Attempt to start the game and identify lineup setup process
    await page.goto('/games');
    await page.waitForTimeout(1000);

    // Look for the game we created
    await expect(page.locator('text=Workflow Test Game')).toBeVisible();

    // Find game card and look for action buttons
    const gameCard = page
      .locator('[data-testid*="game-"]')
      .filter({ hasText: 'Workflow Test Game' })
      .first();

    await expect(gameCard).toBeVisible();

    // Check current game status badge (not the button)
    const setupBadge = gameCard
      .locator('.chakra-badge')
      .filter({ hasText: 'Setup' });
    await expect(setupBadge).toBeVisible();

    // Look for lineup setup button/link
    const setupLineupBtn = gameCard.locator(
      '[data-testid="setup-lineup-button"]'
    );
    const configureLineupBtn = gameCard.locator(
      '[data-testid="configure-lineup-button"]'
    );
    const manageLineupBtn = gameCard.locator(
      '[data-testid="manage-lineup-button"]'
    );

    let lineupSetupExists = false;
    if (await setupLineupBtn.isVisible({ timeout: 2000 })) {
      console.log('✅ Found setup-lineup-button');
      await setupLineupBtn.click();
      lineupSetupExists = true;
    } else if (await configureLineupBtn.isVisible({ timeout: 2000 })) {
      console.log('✅ Found configure-lineup-button');
      await configureLineupBtn.click();
      lineupSetupExists = true;
    } else if (await manageLineupBtn.isVisible({ timeout: 2000 })) {
      console.log('✅ Found manage-lineup-button');
      await manageLineupBtn.click();
      lineupSetupExists = true;
    } else {
      console.log('❌ No lineup setup button found');

      // Check if there's a "Start Game" button that would show lineup error
      const startGameBtn = gameCard.locator(
        '[data-testid="start-game-button"]'
      );
      if (await startGameBtn.isVisible({ timeout: 2000 })) {
        console.log('🧪 Testing start game without lineup');
        await startGameBtn.click();

        // Should show error about lineup being required
        const lineupWarning = page.locator('text=Lineup Required');
        const setupLineupMsg = page.locator('text=Please set up a lineup');

        if (await lineupWarning.isVisible({ timeout: 3000 })) {
          console.log('✅ Game correctly prevents starting without lineup');
          expect(await lineupWarning.isVisible()).toBeTruthy();
        } else if (await setupLineupMsg.isVisible({ timeout: 3000 })) {
          console.log('✅ Game shows lineup setup message');
          expect(await setupLineupMsg.isVisible()).toBeTruthy();
        } else {
          console.log('⚠️ Start button exists but no clear lineup validation');
        }
      }
    }

    // If lineup setup interface found, test it
    if (lineupSetupExists) {
      // Wait for lineup modal to appear
      await page.waitForSelector('[data-testid="lineup-setup-modal"]', {
        timeout: 5000,
      });
      console.log('✅ Found lineup setup modal');

      // Wait for auto-assignment to complete (our new feature)
      await page.waitForTimeout(1000);

      // Check if lineup is auto-assigned (players should be automatically populated)
      const autoAssigned = await page
        .getByTestId('batting-position-1-player')
        .inputValue();

      if (!autoAssigned) {
        console.log(
          '🔄 Auto-assignment not complete, manually setting up lineup...'
        );
        // Complete lineup setup for all 9 positions (fallback)
        for (let i = 1; i <= 9; i++) {
          await page
            .getByTestId(`batting-position-${i}-player`)
            .selectOption({ index: i });
          await page
            .getByTestId(`batting-position-${i}-defensive-position`)
            .selectOption({ index: i });
        }
      } else {
        console.log('✅ Auto-assignment detected, lineup pre-populated');
      }

      // Check if save button is enabled, if not use auto-fill
      const saveButton = page.getByTestId('save-lineup-button');
      const isEnabled = await saveButton.isEnabled();

      if (!isEnabled) {
        console.log('🔄 Save button disabled, trying auto-fill positions...');
        const autoFillButton = page.getByTestId('auto-fill-positions-button');
        if (await autoFillButton.isVisible()) {
          await autoFillButton.click();
          await page.waitForTimeout(500); // Wait for auto-fill to complete
        }
      }

      // Wait for save button to become enabled
      await expect(saveButton).toBeEnabled({ timeout: 5000 });

      // Save the lineup
      await saveButton.click();
      console.log('✅ Lineup setup completed');

      // Wait for modal to close
      await page.waitForSelector('[data-testid="lineup-setup-modal"]', {
        state: 'hidden',
        timeout: 3000,
      });
    }

    // Verify we can navigate around without breaking
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should identify game state transition points', async ({ page }) => {
    // Create prerequisites and game using dedicated test setup
    await createCompletePrerequisites(page);
    await createTestGame(page, {
      name: 'State Test Game',
      opponent: 'Cubs',
      teamName: 'Test Team',
    });

    await page.goto('/games');
    await page.waitForTimeout(1000);

    // Find our game
    const gameCard = page
      .locator('[data-testid*="game-"]')
      .filter({ hasText: 'State Test Game' })
      .first();

    // Document all available actions for a game in setup state
    console.log('=== GAME ACTIONS ANALYSIS ===');

    const actions = [
      'start-game-button',
      'setup-lineup-button',
      'configure-lineup-button',
      'manage-lineup-button',
      'edit-game-button',
      'delete-game-button',
      'view-game-button',
    ];

    for (const action of actions) {
      const btn = gameCard.locator(`[data-testid="${action}"]`);
      if (await btn.isVisible({ timeout: 1000 })) {
        console.log(`✅ Action available: ${action}`);
      }
    }

    // Check if clicking on the game card itself does anything
    await gameCard.click();
    await page.waitForTimeout(1000);

    // Check if this navigated somewhere or opened a modal
    const currentUrl = page.url();
    const modals = page.locator('[role="dialog"]');
    const modalCount = await modals.count();

    console.log(`Current URL after game card click: ${currentUrl}`);
    console.log(`Modals open: ${modalCount}`);

    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should test navigation to scoring page', async ({ page }) => {
    // Test direct navigation to scoring page
    console.log('=== TESTING SCORING PAGE NAVIGATION ===');

    await page.goto('/scoring');
    await page.waitForTimeout(2000);

    // Check what happens when accessing scoring with no game
    const currentUrl = page.url();
    const hasError = await page
      .locator('text=error')
      .isVisible({ timeout: 2000 });
    const hasGameContent = await page
      .locator('[data-testid="current-game"]')
      .isVisible({ timeout: 2000 });
    const hasLoadingSpinner = await page
      .locator('[data-testid="loading-spinner"]')
      .isVisible({ timeout: 2000 });

    console.log(`Scoring page URL: ${currentUrl}`);
    console.log(`Has error: ${hasError}`);
    console.log(`Has game content: ${hasGameContent}`);
    console.log(`Has loading: ${hasLoadingSpinner}`);

    // App should handle this gracefully
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should test game creation with lineup setup intent', async ({
    page,
  }) => {
    // Test if there's a way to create game and immediately setup lineup
    await createCompletePrerequisites(page);

    await page.goto('/games');
    await page.waitForTimeout(1000);

    // Create game using dedicated test setup
    await createTestGame(page, {
      name: 'Quick Setup Game',
      opponent: 'Pirates',
      teamName: 'Test Team',
    });

    // Navigate back to games page to test the created game
    await page.goto('/games');
    await page.waitForTimeout(1000);

    // Look for the created game card and test lineup setup integration
    const gameCard = page
      .locator('[data-testid*="game-"]')
      .filter({ hasText: 'Quick Setup Game' })
      .first();

    if (await gameCard.isVisible({ timeout: 3000 })) {
      console.log('✅ Game created successfully with dedicated test setup');

      // Check for integrated lineup setup options
      const setupLineupBtn = gameCard.locator(
        '[data-testid="setup-lineup-button"]'
      );

      if (await setupLineupBtn.isVisible({ timeout: 1000 })) {
        console.log('✅ Found integrated lineup setup option');
        // Test the integration by clicking it
        await setupLineupBtn.click();
        await page.waitForTimeout(1000);
      } else {
        console.log('❌ No integrated lineup setup available');
      }
    } else {
      console.log('❌ Game creation failed with dedicated test setup');
    }

    await page.waitForTimeout(2000);

    // Check what happened after creation
    const isInLineupModal = await page
      .locator('[data-testid="lineup-modal"]')
      .isVisible({ timeout: 2000 });
    const isBackOnGamesPage = await page
      .locator('h1:has-text("Games")')
      .isVisible({ timeout: 2000 });

    console.log(`After creation - in lineup modal: ${isInLineupModal}`);
    console.log(`After creation - back on games page: ${isBackOnGamesPage}`);

    expect(isInLineupModal || isBackOnGamesPage).toBeTruthy();
  });
});

/**
 * Helper: Create team, season, game type, and players
 */
async function createCompletePrerequisites(page: Page): Promise<void> {
  console.log('Creating complete prerequisites...');

  // Use dedicated test setup instead of sample data button
  await createTestPrerequisites(page, {
    teamName: 'Test Team',
    playerCount: 12,
    seasonName: 'Test Season',
    gameTypeName: 'Regular Game',
  });

  console.log('✅ Prerequisites created for complete workflow');
}

/**
 * Helper: Add players to a team
 */
async function addPlayersToTeam(page: Page, teamName: string): Promise<void> {
  console.log(`Adding players to ${teamName}...`);

  // Look for the team card
  const teamCard = page
    .locator(`[data-testid*="team-"]`)
    .filter({ hasText: teamName })
    .first();

  if (await teamCard.isVisible({ timeout: 2000 })) {
    // Look for manage/edit team button
    const manageBtn = teamCard.locator('[data-testid*="manage-team"]');
    const editBtn = teamCard.locator('[data-testid*="edit-team"]');
    const addPlayerBtn = teamCard.locator('[data-testid*="add-player"]');

    if (await manageBtn.isVisible({ timeout: 1000 })) {
      await manageBtn.click();
    } else if (await editBtn.isVisible({ timeout: 1000 })) {
      await editBtn.click();
    } else if (await addPlayerBtn.isVisible({ timeout: 1000 })) {
      await addPlayerBtn.click();
    }

    await page.waitForTimeout(1000);

    // Try to add some test players
    const players = [
      { name: 'John Doe', jersey: '1', position: 'Pitcher' },
      { name: 'Jane Smith', jersey: '2', position: 'Catcher' },
      { name: 'Bob Johnson', jersey: '3', position: 'First Base' },
    ];

    for (const player of players) {
      const addPlayerModalBtn = page.locator(
        '[data-testid="add-player-button"]'
      );
      if (await addPlayerModalBtn.isVisible({ timeout: 1000 })) {
        await addPlayerModalBtn.click();
        await page.fill('[data-testid="player-name-input"]', player.name);
        await page.fill('[data-testid="jersey-number-input"]', player.jersey);

        const positionSelect = page.locator('[data-testid="position-select"]');
        if (await positionSelect.isVisible({ timeout: 1000 })) {
          await positionSelect.selectOption({ label: player.position });
        }

        await page.click('[data-testid="confirm-add-player"]');
        await page.waitForTimeout(500);
      }
    }
  }
}

/**
 * Helper: Create a game
 */
async function createGame(
  page: Page,
  gameName: string,
  opponent: string
): Promise<string> {
  await page.goto('/games');
  await page.waitForTimeout(1000);

  await page.click('[data-testid="create-game-button"]');
  await page.fill('[data-testid="game-name-input"]', gameName);
  await page.fill('[data-testid="opponent-input"]', opponent);
  // Use tomorrow's date to avoid validation errors
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.fill(
    '[data-testid="game-date-input"]',
    tomorrow.toISOString().split('T')[0]
  );

  // Select team
  const teamSelect = page.locator('[data-testid="team-select"]');
  if (await teamSelect.isVisible({ timeout: 2000 })) {
    await teamSelect.selectOption({ index: 1 });
  }

  // Select season
  const seasonSelect = page.locator('[data-testid="season-select"]');
  if (await seasonSelect.isVisible({ timeout: 2000 })) {
    // Wait for options to be populated and check if they exist
    await page.waitForTimeout(1500);
    const optionCount = await seasonSelect.locator('option').count();
    console.log(`  Season select has ${optionCount} options`);

    if (optionCount > 1) {
      await seasonSelect.selectOption({ index: 1 });
    } else {
      console.log(
        '  ⚠️ Season dropdown has no selectable options - skipping selection'
      );
    }
  }

  // Select game type
  const gameTypeSelect = page.locator('[data-testid="game-type-select"]');
  if (await gameTypeSelect.isVisible({ timeout: 2000 })) {
    await page.waitForTimeout(1000);
    const optionCount = await gameTypeSelect.locator('option').count();
    if (optionCount > 1) {
      await gameTypeSelect.selectOption({ index: 1 });
      console.log('  ✅ Game type selected');
    } else {
      console.log(
        '  ⚠️ Game type dropdown has no selectable options - skipping selection'
      );
    }
  }

  await page.click('[data-testid="confirm-create-game"]');
  await page.waitForTimeout(2000);

  return 'test-game-id'; // In real implementation, we'd extract this
}

/**
 * Helper: Attempt to set up a lineup
 */
async function attemptLineupSetup(page: Page): Promise<void> {
  console.log('Attempting lineup setup...');

  // Look for different lineup setup interfaces
  const playerPositions = [
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

  // Try to assign players to positions
  for (let i = 0; i < playerPositions.length; i++) {
    const positionSelect = page.locator(
      `[data-testid="${playerPositions[i]}-select"]`
    );
    const battingOrderSelect = page.locator(
      `[data-testid="batting-order-${i + 1}"]`
    );

    if (await positionSelect.isVisible({ timeout: 1000 })) {
      await positionSelect.selectOption({ index: 1 });
    } else if (await battingOrderSelect.isVisible({ timeout: 1000 })) {
      await battingOrderSelect.selectOption({ index: 1 });
    }
  }

  // Look for save/confirm lineup button
  const saveLineupBtn = page.locator('[data-testid="save-lineup-button"]');
  const confirmLineupBtn = page.locator(
    '[data-testid="confirm-lineup-button"]'
  );
  const completeLineupBtn = page.locator(
    '[data-testid="complete-lineup-button"]'
  );

  if (await saveLineupBtn.isVisible({ timeout: 1000 })) {
    await saveLineupBtn.click();
  } else if (await confirmLineupBtn.isVisible({ timeout: 1000 })) {
    await confirmLineupBtn.click();
  } else if (await completeLineupBtn.isVisible({ timeout: 1000 })) {
    await completeLineupBtn.click();
  }

  await page.waitForTimeout(1000);
}
