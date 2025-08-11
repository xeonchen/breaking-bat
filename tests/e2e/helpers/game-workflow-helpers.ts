import { Page } from '@playwright/test';

/**
 * Common helper functions for game workflow e2e tests
 *
 * These utilities provide reusable functions for creating game prerequisites,
 * managing test data, and performing common game workflow operations.
 */

// Generate a valid future date for game creation (tomorrow)
export function getValidGameDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export interface TestPlayer {
  name: string;
  jersey: string;
  position: string;
}

export interface TestTeamSetup {
  teamName: string;
  players: TestPlayer[];
}

export interface TestGameSetup {
  gameName: string;
  opponent: string;
  date: string;
  teamName?: string;
  seasonName?: string;
  gameTypeName?: string;
}

/**
 * Standard test data for consistent testing
 */
export const TEST_DATA = {
  teams: {
    basic: {
      teamName: 'Test Team',
      players: [
        { name: 'Test Pitcher', jersey: '1', position: 'Pitcher' },
        { name: 'Test Catcher', jersey: '2', position: 'Catcher' },
        { name: 'Test First Base', jersey: '3', position: 'First Base' },
      ],
    },
    full: {
      teamName: 'Full Roster Team',
      players: [
        { name: 'Ace Pitcher', jersey: '1', position: 'Pitcher' },
        { name: 'Safe Catcher', jersey: '2', position: 'Catcher' },
        { name: 'First Baseman', jersey: '3', position: 'First Base' },
        { name: 'Second Baseman', jersey: '4', position: 'Second Base' },
        { name: 'Third Baseman', jersey: '5', position: 'Third Base' },
        { name: 'Short Stop', jersey: '6', position: 'Shortstop' },
        { name: 'Left Fielder', jersey: '7', position: 'Left Field' },
        { name: 'Center Fielder', jersey: '8', position: 'Center Field' },
        { name: 'Right Fielder', jersey: '9', position: 'Right Field' },
        { name: 'Utility Player', jersey: '10', position: 'Utility' },
        { name: 'Bench Warmer', jersey: '11', position: 'Bench' },
      ],
    },
  },
  seasons: {
    current: {
      name: '2025 Test Season',
      year: '2025',
      startDate: '2025-04-01',
      endDate: '2025-09-30',
    },
  },
  gameTypes: {
    regular: {
      name: 'Regular Season',
      description: 'Standard regular season game',
    },
  },
  games: {
    basic: {
      gameName: 'Test Game',
      opponent: 'Test Opponents',
      date: '2025-01-15',
    },
  },
};

/**
 * Create a complete team with players
 */
export async function createTeamWithPlayers(
  page: Page,
  teamSetup: TestTeamSetup
): Promise<boolean> {
  console.log(`Creating team: ${teamSetup.teamName}`);

  // Navigate to teams page
  await page.goto('/teams');
  await page.waitForTimeout(1000);

  // Create team
  const createTeamBtn = page.locator('[data-testid="create-team-button"]');
  if (!(await createTeamBtn.isVisible({ timeout: 2000 }))) {
    console.log('❌ Create team button not found');
    return false;
  }

  await createTeamBtn.click();
  await page.fill('[data-testid="team-name-input"]', teamSetup.teamName);
  await page.click('[data-testid="confirm-create-team"]');
  await page.waitForTimeout(1000);

  // Add players
  return await addPlayersToTeam(page, teamSetup.teamName, teamSetup.players);
}

/**
 * Add players to an existing team
 */
export async function addPlayersToTeam(
  page: Page,
  teamName: string,
  players: TestPlayer[]
): Promise<boolean> {
  console.log(`Adding ${players.length} players to ${teamName}`);

  const teamCard = page
    .locator('[data-testid*="team-"]')
    .filter({ hasText: teamName })
    .first();

  if (!(await teamCard.isVisible({ timeout: 2000 }))) {
    console.log(`❌ Team card not found: ${teamName}`);
    return false;
  }

  // Look for manage team button
  const manageBtn = teamCard.locator('[data-testid*="manage"]');
  const editBtn = teamCard.locator('[data-testid*="edit"]');

  if (await manageBtn.isVisible({ timeout: 1000 })) {
    await manageBtn.click();
  } else if (await editBtn.isVisible({ timeout: 1000 })) {
    await editBtn.click();
  } else {
    console.log('❌ No team management button found');
    return false;
  }

  await page.waitForTimeout(1000);

  // Add each player
  let successCount = 0;
  for (const player of players) {
    const addPlayerBtn = page.locator('[data-testid="add-player-button"]');
    if (await addPlayerBtn.isVisible({ timeout: 1000 })) {
      await addPlayerBtn.click();
      await page.fill('[data-testid="player-name-input"]', player.name);
      await page.fill('[data-testid="jersey-number-input"]', player.jersey);

      const positionSelect = page.locator('[data-testid="position-select"]');
      if (await positionSelect.isVisible({ timeout: 1000 })) {
        await positionSelect.selectOption({ label: player.position });
      }

      await page.click('[data-testid="confirm-add-player"]');
      await page.waitForTimeout(500);
      successCount++;
    }
  }

  console.log(`✅ Added ${successCount}/${players.length} players`);
  return successCount === players.length;
}

/**
 * Create a season
 */
export async function createSeason(
  page: Page,
  seasonData: { name: string; year: string; startDate: string; endDate: string }
): Promise<boolean> {
  console.log(`Creating season: ${seasonData.name}`);

  await page.goto('/seasons');
  await page.waitForTimeout(1000);

  const createSeasonBtn = page.locator('[data-testid="create-season-button"]');
  if (!(await createSeasonBtn.isVisible({ timeout: 2000 }))) {
    console.log('❌ Create season button not found');
    return false;
  }

  await createSeasonBtn.click();
  await page.fill('[data-testid="season-name-input"]', seasonData.name);
  await page.fill('[data-testid="season-year-input"]', seasonData.year);
  await page.fill('[data-testid="season-start-date"]', seasonData.startDate);
  await page.fill('[data-testid="season-end-date"]', seasonData.endDate);
  await page.click('[data-testid="confirm-create-season"]');
  await page.waitForTimeout(1000);

  console.log('✅ Season created');
  return true;
}

/**
 * Create a game type
 */
export async function createGameType(
  page: Page,
  gameTypeData: { name: string; description?: string }
): Promise<boolean> {
  console.log(`Creating game type: ${gameTypeData.name}`);

  await page.goto('/game-types');
  await page.waitForTimeout(1000);

  const createGameTypeBtn = page.locator(
    '[data-testid="create-game-type-button"]'
  );
  if (!(await createGameTypeBtn.isVisible({ timeout: 2000 }))) {
    console.log('❌ Create game type button not found');
    return false;
  }

  await createGameTypeBtn.click();
  await page.fill('[data-testid="game-type-name-input"]', gameTypeData.name);

  if (gameTypeData.description) {
    const descInput = page.locator(
      '[data-testid="game-type-description-input"]'
    );
    if (await descInput.isVisible({ timeout: 1000 })) {
      await descInput.fill(gameTypeData.description);
    }
  }

  await page.click('[data-testid="confirm-create-game-type"]');
  await page.waitForTimeout(1000);

  console.log('✅ Game type created');
  return true;
}

/**
 * Create a complete game setup (team, season, game type, game)
 */
export async function createCompleteGameSetup(
  page: Page,
  gameSetup: TestGameSetup
): Promise<boolean> {
  console.log('Creating complete game setup...');

  // Create team with full roster
  const teamSuccess = await createTeamWithPlayers(page, TEST_DATA.teams.full);
  if (!teamSuccess) {
    console.log('❌ Failed to create team');
    return false;
  }

  // Create season
  const seasonSuccess = await createSeason(page, TEST_DATA.seasons.current);
  if (!seasonSuccess) {
    console.log('❌ Failed to create season');
    return false;
  }

  // Create game type
  const gameTypeSuccess = await createGameType(
    page,
    TEST_DATA.gameTypes.regular
  );
  if (!gameTypeSuccess) {
    console.log('❌ Failed to create game type');
    return false;
  }

  // Create game
  const gameSuccess = await createGame(page, gameSetup);
  if (!gameSuccess) {
    console.log('❌ Failed to create game');
    return false;
  }

  console.log('✅ Complete game setup created');
  return true;
}

/**
 * Create a game
 */
export async function createGame(
  page: Page,
  gameSetup: TestGameSetup
): Promise<boolean> {
  console.log(`Creating game: ${gameSetup.gameName}`);

  await page.goto('/games');
  await page.waitForTimeout(1000);

  const createGameBtn = page.locator('[data-testid="create-game-button"]');
  if (!(await createGameBtn.isVisible({ timeout: 2000 }))) {
    console.log('❌ Create game button not found');
    return false;
  }

  await createGameBtn.click();
  await page.fill('[data-testid="game-name-input"]', gameSetup.gameName);
  await page.fill('[data-testid="opponent-input"]', gameSetup.opponent);
  await page.fill('[data-testid="game-date-input"]', gameSetup.date);

  // Select team if dropdown is available
  const teamSelect = page.locator('[data-testid="team-select"]');
  if (await teamSelect.isVisible({ timeout: 2000 })) {
    // Wait for options to be loaded
    await page.waitForTimeout(1000);
    const optionCount = await teamSelect.locator('option').count();
    if (optionCount > 1) {
      await teamSelect.selectOption({ index: 1 });
    } else {
      console.log('⚠️ Team dropdown has no options available');
    }
  }

  // Select season if dropdown is available
  const seasonSelect = page.locator('[data-testid="season-select"]');
  if (await seasonSelect.isVisible({ timeout: 2000 })) {
    // Wait for options to be loaded
    await page.waitForTimeout(1000);
    const optionCount = await seasonSelect.locator('option').count();
    if (optionCount > 1) {
      await seasonSelect.selectOption({ index: 1 });
    } else {
      console.log('⚠️ Season dropdown has no options available');
    }
  }

  // Select game type if dropdown is available
  const gameTypeSelect = page.locator('[data-testid="game-type-select"]');
  if (await gameTypeSelect.isVisible({ timeout: 2000 })) {
    // Wait for options to be loaded
    await page.waitForTimeout(1000);
    const optionCount = await gameTypeSelect.locator('option').count();
    if (optionCount > 1) {
      await gameTypeSelect.selectOption({ index: 1 });
    } else {
      console.log('⚠️ Game type dropdown has no options available');
    }
  }

  await page.click('[data-testid="confirm-create-game"]');
  await page.waitForTimeout(2000);

  console.log('✅ Game created');
  return true;
}

/**
 * Find a game card by name
 */
export async function findGameCard(page: Page, gameName: string) {
  await page.goto('/games');
  await page.waitForTimeout(1000);

  return page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();
}

/**
 * Get game status from game card
 */
export async function getGameStatus(
  page: Page,
  gameName: string
): Promise<string | null> {
  const gameCard = await findGameCard(page, gameName);

  if (!(await gameCard.isVisible({ timeout: 2000 }))) {
    return null;
  }

  // Check for status badges
  const statusBadges = ['Setup', 'In Progress', 'Suspended', 'Completed'];

  for (const status of statusBadges) {
    if (await gameCard.locator(`text=${status}`).isVisible({ timeout: 1000 })) {
      return status.toLowerCase().replace(' ', '_');
    }
  }

  return 'unknown';
}

/**
 * Check if lineup setup is available for a game
 */
export async function hasLineupSetupAvailable(
  page: Page,
  gameName: string
): Promise<boolean> {
  const gameCard = await findGameCard(page, gameName);

  if (!(await gameCard.isVisible({ timeout: 2000 }))) {
    return false;
  }

  const setupButtons = [
    'setup-lineup-button',
    'configure-lineup-button',
    'manage-lineup-button',
    'edit-lineup-button',
  ];

  for (const buttonId of setupButtons) {
    const button = gameCard.locator(`[data-testid="${buttonId}"]`);
    if (await button.isVisible({ timeout: 1000 })) {
      return true;
    }
  }

  return false;
}

/**
 * Check if game can be started
 */
export async function canStartGame(
  page: Page,
  gameName: string
): Promise<boolean> {
  const gameCard = await findGameCard(page, gameName);

  if (!(await gameCard.isVisible({ timeout: 2000 }))) {
    return false;
  }

  const startButton = gameCard.locator('[data-testid="start-game-button"]');
  return await startButton.isVisible({ timeout: 1000 });
}

/**
 * Attempt to start a game and return success status
 */
export async function attemptStartGame(
  page: Page,
  gameName: string
): Promise<{
  success: boolean;
  error?: string;
  navigatedToScoring?: boolean;
}> {
  const gameCard = await findGameCard(page, gameName);

  if (!(await gameCard.isVisible({ timeout: 2000 }))) {
    return { success: false, error: 'Game not found' };
  }

  const startButton = gameCard.locator('[data-testid="start-game-button"]');
  if (!(await startButton.isVisible({ timeout: 2000 }))) {
    return { success: false, error: 'Start button not available' };
  }

  await startButton.click();
  await page.waitForTimeout(2000);

  // Check for error messages
  const lineupError = await page
    .locator('text=Lineup Required')
    .isVisible({ timeout: 2000 });
  if (lineupError) {
    return { success: false, error: 'Lineup required' };
  }

  // Check if navigated to scoring page
  const navigatedToScoring = page.url().includes('/scoring');
  if (navigatedToScoring) {
    return { success: true, navigatedToScoring: true };
  }

  // Check if game status changed to in_progress
  const newStatus = await getGameStatus(page, gameName);
  if (newStatus === 'in_progress') {
    return { success: true };
  }

  return { success: false, error: 'Game did not start successfully' };
}

/**
 * Log detailed information about available actions for a game
 */
export async function analyzeGameActions(
  page: Page,
  gameName: string
): Promise<void> {
  console.log(`=== ANALYZING ACTIONS FOR ${gameName} ===`);

  const gameCard = await findGameCard(page, gameName);

  if (!(await gameCard.isVisible({ timeout: 2000 }))) {
    console.log('❌ Game not found');
    return;
  }

  const status = await getGameStatus(page, gameName);
  console.log(`Game status: ${status}`);

  // Check for all possible action buttons
  const actions = [
    'start-game-button',
    'setup-lineup-button',
    'configure-lineup-button',
    'manage-lineup-button',
    'edit-game-button',
    'delete-game-button',
    'suspend-game-button',
    'resume-game-button',
    'complete-game-button',
  ];

  console.log('Available actions:');
  for (const action of actions) {
    const button = gameCard.locator(`[data-testid="${action}"]`);
    if (await button.isVisible({ timeout: 1000 })) {
      console.log(`  ✅ ${action}`);
    }
  }

  // Check for any requirement messages
  const gameText = await gameCard.textContent();
  console.log(`Game card content: ${gameText}`);
}
