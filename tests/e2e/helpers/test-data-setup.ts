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
    await page.waitForTimeout(1000);
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
    await page.waitForTimeout(1000);
  }
}

/**
 * Create complete test prerequisites (team with players, season, game type)
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

  // Create team with players
  await createTestTeamWithPlayers(page, { name: teamName, playerCount });

  // Create season
  await createTestSeason(page, seasonName);

  // Create game type
  await createTestGameType(page, gameTypeName);
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

  // Create the game
  await page.goto('/games');
  await page.waitForTimeout(1000);

  await page.click('[data-testid="create-game-button"]');
  await page.fill('[data-testid="game-name-input"]', gameData.name);
  await page.fill('[data-testid="opponent-input"]', gameData.opponent);

  // Use tomorrow's date to avoid validation errors
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.fill(
    '[data-testid="game-date-input"]',
    tomorrow.toISOString().split('T')[0]
  );

  // Select the team we created
  const teamSelect = page.locator('[data-testid="team-select"]');
  if (await teamSelect.isVisible({ timeout: 2000 })) {
    await teamSelect.selectOption({ label: gameData.teamName });
  }

  // Select season
  const seasonSelect = page.locator('[data-testid="season-select"]');
  if (await seasonSelect.isVisible({ timeout: 2000 })) {
    await seasonSelect.selectOption({ index: 1 });
  }

  // Select game type
  const gameTypeSelect = page.locator('[data-testid="game-type-select"]');
  if (await gameTypeSelect.isVisible({ timeout: 2000 })) {
    await gameTypeSelect.selectOption({ index: 1 });
  }

  await page.click('[data-testid="confirm-create-game"]');
  await page.waitForTimeout(1000);

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

    // Complete lineup setup for all 9 positions
    for (let i = 1; i <= 9; i++) {
      await page
        .getByTestId(`batting-position-${i}-player`)
        .selectOption({ index: i });
      await page
        .getByTestId(`batting-position-${i}-defensive-position`)
        .selectOption({ index: i });
    }

    // Save the lineup
    await page.getByTestId('save-lineup-button').click();

    // Wait for modal to close
    await page.waitForSelector('[data-testid="lineup-setup-modal"]', {
      state: 'hidden',
      timeout: 3000,
    });
  }
}
