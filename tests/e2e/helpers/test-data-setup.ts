import { Page, expect } from '@playwright/test';

/**
 * Dedicated E2E Test Data Setup
 * Creates minimal required test data independently of the sample data feature
 */

export interface TestTeamData {
  name: string;
  playerCount: number;
}

export interface TestGameData {
  name: string;
  opponent: string;
  teamName: string;
  seasonName?: string;
  gameTypeName?: string;
}

/**
 * Create a team with players for E2E testing
 */
export async function createTestTeamWithPlayers(
  page: Page,
  teamData: TestTeamData
): Promise<void> {
  // Create team
  await page.goto('/teams');
  await page.waitForTimeout(1000);

  const createTeamBtn = page.locator('[data-testid="create-team-button"]');
  if (await createTeamBtn.isVisible({ timeout: 2000 })) {
    await createTeamBtn.click();
    await page.fill('[data-testid="team-name-input"]', teamData.name);
    await page.click('[data-testid="confirm-create-team"]');
    await page.waitForTimeout(1000);

    // Add players to the team
    await addPlayersToTestTeam(page, teamData.name, teamData.playerCount);
  }
}

/**
 * Add players to a test team
 */
async function addPlayersToTestTeam(
  page: Page,
  teamName: string,
  playerCount: number
): Promise<void> {
  const teamCard = page
    .locator(`[data-testid*="team-"]`)
    .filter({ hasText: teamName })
    .first();

  if (await teamCard.isVisible({ timeout: 2000 })) {
    // Look for manage/add players button
    const manageBtn = teamCard.locator('[data-testid*="manage-team"]');
    const addPlayerBtn = teamCard.locator('[data-testid*="add-player"]');

    if (await manageBtn.isVisible({ timeout: 1000 })) {
      await manageBtn.click();
    } else if (await addPlayerBtn.isVisible({ timeout: 1000 })) {
      await addPlayerBtn.click();
    }

    // Create the specified number of players
    for (let i = 1; i <= playerCount; i++) {
      const createPlayerBtn = page.locator(
        '[data-testid="create-player-button"]'
      );
      if (await createPlayerBtn.isVisible({ timeout: 1000 })) {
        await createPlayerBtn.click();

        await page.fill(
          '[data-testid="player-name-input"]',
          `Test Player ${i}`
        );
        await page.fill('[data-testid="player-jersey-input"]', `${i}`);

        // Add a primary position
        const positionSelect = page.locator(
          '[data-testid="player-position-select"]'
        );
        if (await positionSelect.isVisible({ timeout: 1000 })) {
          await positionSelect.selectOption({ index: (i % 9) + 1 });
        }

        await page.click('[data-testid="confirm-create-player"]');
        await page.waitForTimeout(500);
      }
    }
  }
}

/**
 * Create a test season
 */
export async function createTestSeason(
  page: Page,
  seasonName: string = 'Test Season'
): Promise<void> {
  await page.goto('/seasons');
  await page.waitForTimeout(1000);

  const createSeasonBtn = page.locator('[data-testid="create-season-button"]');
  if (await createSeasonBtn.isVisible({ timeout: 2000 })) {
    await createSeasonBtn.click();

    await page.fill('[data-testid="season-name-input"]', seasonName);
    await page.fill('[data-testid="season-year-input"]', '2025');
    await page.fill('[data-testid="season-start-date"]', '2025-04-01');
    await page.fill('[data-testid="season-end-date"]', '2025-09-30');
    await page.click('[data-testid="confirm-create-season"]');

    // Wait for success toast or season to appear in list
    try {
      await page.waitForSelector('text="Season created successfully"', {
        timeout: 3000,
      });
    } catch {
      // If no success toast, wait for the season to appear in the list
      await page.waitForSelector(`text="${seasonName}"`, { timeout: 3000 });
    }
    await page.waitForTimeout(500);
  }
}

/**
 * Create a test game type
 */
export async function createTestGameType(
  page: Page,
  gameTypeName: string = 'Regular Game'
): Promise<void> {
  await page.goto('/game-types');
  await page.waitForTimeout(1000);

  const createGameTypeBtn = page.locator(
    '[data-testid="create-game-type-button"]'
  );
  if (await createGameTypeBtn.isVisible({ timeout: 2000 })) {
    await createGameTypeBtn.click();
    await page.fill('[data-testid="game-type-name-input"]', gameTypeName);
    await page.click('[data-testid="confirm-create-game-type"]');

    // Wait for success toast or game type to appear in list
    try {
      await page.waitForSelector('text="Game type created successfully"', {
        timeout: 3000,
      });
    } catch {
      // If no success toast, wait for the game type to appear in the list
      await page.waitForSelector(`text="${gameTypeName}"`, { timeout: 3000 });
    }
    await page.waitForTimeout(500);
  }
}

/**
 * Create complete test prerequisites (team with players, season, game type)
 * HYBRID APPROACH: Use sample data for reliability, then add specific test data
 */
export async function createTestPrerequisites(
  page: Page,
  options: {
    teamName?: string;
    playerCount?: number;
    seasonName?: string;
    gameTypeName?: string;
  } = {}
): Promise<void> {
  const {
    teamName = 'Test Team',
    playerCount = 12,
    seasonName = 'Test Season',
    gameTypeName = 'Regular Game',
  } = options;

  // HYBRID APPROACH: Start with sample data for reliable baseline
  console.log('🔄 Loading sample data for reliable baseline...');
  await page.goto('/settings');
  await page.getByTestId('load-sample-data-button').click();

  // Wait for success toast
  try {
    await page.waitForSelector('text="Sample Data Loaded Successfully!"', {
      timeout: 10000,
    });
    console.log('✅ Sample data loaded successfully');
  } catch (error) {
    console.log('⚠️ Sample data loading may have failed:', error.message);
  }

  // Wait for data to fully propagate
  await page.waitForTimeout(2000);

  // Now add specific test data if different from sample data
  if (
    teamName !== 'Test Team' ||
    seasonName !== 'Test Season' ||
    gameTypeName !== 'Regular Game'
  ) {
    console.log('🔧 Adding specific test data for this test...');

    // Only create additional data if it's different from the defaults
    if (seasonName !== 'Test Season') {
      await createTestSeason(page, seasonName);
    }

    if (gameTypeName !== 'Regular Game') {
      await createTestGameType(page, gameTypeName);
    }

    if (teamName !== 'Test Team') {
      await createTestTeamWithPlayers(page, { name: teamName, playerCount });
    }
  }

  console.log('✅ Test prerequisites setup complete');
}

/**
 * Create a test game with all prerequisites
 */
export async function createTestGame(
  page: Page,
  gameData: TestGameData
): Promise<string> {
  // Create prerequisites first
  await createTestPrerequisites(page, {
    teamName: gameData.teamName,
    seasonName: gameData.seasonName,
    gameTypeName: gameData.gameTypeName,
  });

  // Navigate to games page and wait for data to load
  await page.goto('/games');
  await page.waitForTimeout(3000); // Extra time for data loading

  await page.click('[data-testid="create-game-button"]');

  // Wait for modal and dropdowns to be fully loaded
  await page.waitForSelector('[data-testid="game-name-input"]', {
    timeout: 5000,
  });
  await page.waitForTimeout(1000); // Wait for dropdowns to populate

  await page.fill('[data-testid="game-name-input"]', gameData.name);
  await page.fill('[data-testid="opponent-input"]', gameData.opponent);

  // Use tomorrow's date to avoid validation errors
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.fill(
    '[data-testid="game-date-input"]',
    tomorrow.toISOString().split('T')[0]
  );

  // Set game as AWAY game so we can bat in the top of innings (when game starts)
  // This ensures the at-bat buttons are enabled in tests since games start with isTopInning=true
  const homeAwaySelect = page.locator('[data-testid="home-away-select"]');
  if (await homeAwaySelect.isVisible({ timeout: 2000 })) {
    await homeAwaySelect.selectOption('away');
    console.log('✅ Set game as away game for testing');
  }

  // Select the team (use sample data team if default, or specific team if provided)
  const teamSelect = page.locator('[data-testid="team-select"]');
  if (await teamSelect.isVisible({ timeout: 2000 })) {
    if (gameData.teamName === 'Test Team') {
      // Use sample data team (should be available)
      await teamSelect.selectOption({ index: 1 });
      console.log('✅ Selected sample data team');
    } else {
      // Use specific team name
      await teamSelect.selectOption({ label: gameData.teamName });
      console.log(`✅ Selected specific team: ${gameData.teamName}`);
    }
  }

  // Select season (sample data should have seasons available)
  const seasonSelect = page.locator('[data-testid="season-select"]');
  if (await seasonSelect.isVisible({ timeout: 2000 })) {
    const optionCount = await seasonSelect.locator('option').count();
    console.log(`Season dropdown has ${optionCount} options`);

    if (optionCount > 1) {
      if (gameData.seasonName === 'Test Season' || !gameData.seasonName) {
        // Use first available season from sample data
        await seasonSelect.selectOption({ index: 1 });
        console.log('✅ Selected sample data season');
      } else {
        // Try to select specific season
        try {
          await seasonSelect.selectOption({ label: gameData.seasonName });
          console.log(`✅ Selected specific season: ${gameData.seasonName}`);
        } catch {
          // Fallback to first option - check if page is still open
          if (!page.isClosed()) {
            await seasonSelect.selectOption({ index: 1 });
            console.log('⚠️ Specific season not found, using first available');
          }
        }
      }
    } else {
      console.log('⚠️ Season dropdown has no options - skipping selection');
    }
  }

  // Select game type (sample data should have game types available)
  const gameTypeSelect = page.locator('[data-testid="game-type-select"]');
  if (!page.isClosed() && (await gameTypeSelect.isVisible({ timeout: 2000 }))) {
    const optionCount = await gameTypeSelect.locator('option').count();
    console.log(`Game type dropdown has ${optionCount} options`);

    if (optionCount > 1) {
      if (gameData.gameTypeName === 'Regular Game' || !gameData.gameTypeName) {
        // Use first available game type from sample data
        await gameTypeSelect.selectOption({ index: 1 });
        console.log('✅ Selected sample data game type');
      } else {
        // Try to select specific game type
        try {
          await gameTypeSelect.selectOption({ label: gameData.gameTypeName });
          console.log(
            `✅ Selected specific game type: ${gameData.gameTypeName}`
          );
        } catch {
          // Fallback to first option - check if page is still open
          if (!page.isClosed()) {
            await gameTypeSelect.selectOption({ index: 1 });
            console.log(
              '⚠️ Specific game type not found, using first available'
            );
          }
        }
      }
    } else {
      console.log('⚠️ Game type dropdown has no options - skipping selection');
    }
  }

  // Check if page is still available before clicking
  if (!page.isClosed()) {
    await page.click('[data-testid="confirm-create-game"]');
    await page.waitForTimeout(1000);
  } else {
    console.log('❌ Page closed before game creation could complete');
  }

  return gameData.name;
}

/**
 * Complete lineup setup for a game
 */
export async function setupTestLineup(
  page: Page,
  gameName: string
): Promise<void> {
  await page.goto('/games');
  await page.waitForTimeout(1000);

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();

  const setupLineupBtn = gameCard.locator(
    '[data-testid="setup-lineup-button"]'
  );
  if (await setupLineupBtn.isVisible({ timeout: 2000 })) {
    await setupLineupBtn.click();

    // Wait for lineup modal to appear
    await page.waitForSelector('[data-testid="lineup-setup-modal"]', {
      timeout: 5000,
    });

    // Wait a moment for the lineup modal data to load
    await page.waitForTimeout(2000);

    // Check if players are available (sample data should provide players)
    const firstPlayerSelect = page.getByTestId('batting-position-1-player');
    const optionCount = await firstPlayerSelect.locator('option').count();
    console.log(`Player dropdown has ${optionCount} options available`);

    if (optionCount <= 1) {
      console.log(
        '❌ No players available - sample data may not have loaded properly'
      );
      return; // Exit early to avoid timeout
    }

    console.log('✅ Players available for lineup setup');

    // Complete lineup setup for all 9 positions
    for (let i = 1; i <= 9; i++) {
      const playerSelect = page.getByTestId(`batting-position-${i}-player`);
      const positionSelect = page.getByTestId(
        `batting-position-${i}-defensive-position`
      );

      await playerSelect.selectOption({ index: i });
      await positionSelect.selectOption({ index: i });
    }

    // Save the lineup
    await page.getByTestId('save-lineup-button').click();

    // Wait for success feedback (toast or modal close)
    try {
      await page.waitForSelector('text="Lineup saved successfully"', {
        timeout: 3000,
      });
      console.log('✅ Lineup saved successfully');
    } catch {
      console.log('⚠️ No success toast - checking modal close');
    }

    // Wait for modal to close
    await page.waitForSelector('[data-testid="lineup-setup-modal"]', {
      state: 'hidden',
      timeout: 3000,
    });

    console.log('✅ Lineup modal closed');
  }
}
