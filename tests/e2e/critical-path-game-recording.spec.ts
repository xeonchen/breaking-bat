import { test, expect, Page } from '@playwright/test';
import { createTestGame, setupTestLineup } from './helpers/test-data-setup';

/**
 * Critical Path E2E Test: Complete Game Recording Journey
 *
 * This test validates the complete user workflow from game creation to scoring,
 * ensuring all critical ACs work together seamlessly for the core user value.
 *
 * Coverage:
 * - live-game-scoring:AC001: At-bat recording with business logic
 * - live-game-scoring:AC002: Current batter auto-advancement
 * - live-game-scoring:AC035: Real-time data persistence
 * - live-game-scoring:AC036: Game state preservation
 * - lineup-configuration:AC001: Lineup setup access
 * - lineup-configuration:AC038: Valid lineup enables game start
 * - lineup-configuration:AC042: Game lineupId population
 */

test.describe('Critical Path: Complete Game Recording Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should complete full game recording workflow from creation to scoring (@live-game-scoring:AC001, @live-game-scoring:AC002, @live-game-scoring:AC035, @lineup-configuration:AC001, @lineup-configuration:AC038, @lineup-configuration:AC042)', async ({
    page,
  }) => {
    // ===== PHASE 1: PREREQUISITES SETUP =====
    await setupPrerequisites(page);

    // ===== PHASE 2: GAME CREATION =====
    const gameId = await createGame(page);
    await validateGameCreated(page, gameId);

    // ===== PHASE 3: LINEUP CONFIGURATION =====
    await setupLineup(page, gameId);
    await validateLineupComplete(page);

    // ===== PHASE 4: START GAME =====
    await startGame(page);
    await validateGameStarted(page);

    // ===== PHASE 5: RECORD AT-BATS =====
    await recordMultipleAtBats(page);
    await validateScoringData(page);

    // ===== PHASE 6: DATA PERSISTENCE VALIDATION =====
    await validateDataPersistence(page);

    console.log('✅ Complete game recording workflow validated successfully');
  });

  test('should handle game state recovery after interruption (@live-game-scoring:AC036, @lineup-configuration:AC041)', async ({
    page,
  }) => {
    // Setup game and start recording
    await setupPrerequisites(page);
    const gameId = await createGame(page);
    await setupLineup(page, gameId);
    await startGame(page);

    // Record some at-bats
    await recordAtBat(page, 'single-button');
    await recordAtBat(page, 'walk-button');

    // Simulate interruption (navigate away and back)
    await page.goto('/');
    await page.goto('/games');

    // Find and resume the game
    const normalizedGameId = gameId.toLowerCase().replace(/\s+/g, '-');
    const gameCard = page
      .locator(`[data-testid="game-${normalizedGameId}"]`)
      .first();
    await expect(gameCard).toBeVisible();

    const resumeButton = gameCard
      .locator(
        '[data-testid*="resume"], [data-testid*="continue"], [data-testid*="start"]'
      )
      .first();
    await resumeButton.click();

    // Validate game state is preserved
    await expect(page.getByTestId('scoring-page')).toBeVisible();
    await expect(page.getByTestId('current-batter')).toContainText(
      '3rd Batter'
    ); // Should be on 3rd batter

    // Validate baserunners are preserved
    await expect(page.getByTestId('baserunner-first')).not.toContainText(
      'Empty'
    );
    await expect(page.getByTestId('baserunner-second')).not.toContainText(
      'Empty'
    );

    console.log('✅ Game state recovery validated successfully');
  });
});

// ===== HELPER FUNCTIONS =====

async function setupPrerequisites(page: Page): Promise<void> {
  console.log('🔄 Setting up prerequisites (teams, seasons, game types)...');

  // Load sample data for consistent test environment
  await page.goto('/');

  // Check if sample data is already loaded
  await page.goto('/teams');
  const existingTeams = await page.locator('[data-testid*="team-"]').count();

  if (existingTeams === 0) {
    await page.goto('/');
    const loadDataButton = page.getByTestId('load-sample-data-button');
    if (await loadDataButton.isVisible({ timeout: 2000 })) {
      await loadDataButton.click();
      await expect(
        page.getByText('Sample data loaded successfully')
      ).toBeVisible();
    }
  }

  // Validate prerequisites exist
  await page.goto('/teams');
  await expect(page.locator('[data-testid*="team-"]').first()).toBeVisible();

  console.log('✅ Prerequisites setup complete');
}

async function createGame(page: Page): Promise<string> {
  console.log('🏗️ Creating new game...');

  const gameName = `Critical Path Test Game ${Date.now()}`;
  const gameData = {
    name: gameName,
    opponent: 'Test Opponent',
    teamName: 'Test Team', // Use sample data team
  };

  // Use the existing helper which is more robust
  const gameId = await createTestGame(page, gameData);

  console.log(`✅ Game created with ID: ${gameId}`);
  return gameId;
}

async function validateGameCreated(
  page: Page,
  gameIdentifier: string
): Promise<void> {
  // Convert game name to the format used in data-testid (lowercase, spaces to hyphens)
  const normalizedGameId = gameIdentifier.toLowerCase().replace(/\s+/g, '-');

  // Validate game appears in games list
  const gameCard = page
    .locator(`[data-testid="game-${normalizedGameId}"]`)
    .first();
  await expect(gameCard).toBeVisible();

  // Validate setup lineup button is available (AC001)
  const setupButton = gameCard
    .locator('[data-testid*="setup"], [data-testid*="lineup"]')
    .first();
  await expect(setupButton).toBeVisible();

  console.log('✅ Game creation validated');
}

async function setupLineup(page: Page, gameId: string): Promise<void> {
  console.log('👥 Setting up lineup...');

  // Use the existing helper which handles the complexity
  await setupTestLineup(page, gameId);

  console.log('✅ Lineup setup complete');
}

async function validateLineupComplete(page: Page): Promise<void> {
  // Validate Start Game button becomes available (AC038)
  const startButton = page
    .locator('[data-testid*="start"], button:has-text("Start")')
    .first();
  await expect(startButton).toBeVisible();
  await expect(startButton).toBeEnabled();

  console.log('✅ Lineup completion validated');
}

async function startGame(page: Page): Promise<void> {
  console.log('🎮 Starting game...');

  const startButton = page
    .locator('[data-testid*="start"], button:has-text("Start")')
    .first();
  await startButton.click();

  console.log('✅ Game started');
}

async function validateGameStarted(page: Page): Promise<void> {
  // Should navigate to scoring page
  await expect(page.getByTestId('scoring-page')).toBeVisible();

  // Validate scoring interface elements are present
  await expect(page.getByTestId('current-batter')).toBeVisible();
  await expect(page.getByTestId('at-bat-form')).toBeVisible();

  // Validate initial batter is displayed (AC002)
  await expect(page.getByTestId('current-batter')).toContainText('1st Batter');

  // Validate baserunners are initially empty
  await expect(page.getByTestId('baserunner-first')).toContainText('Empty');
  await expect(page.getByTestId('baserunner-second')).toContainText('Empty');
  await expect(page.getByTestId('baserunner-third')).toContainText('Empty');

  console.log('✅ Game start validated');
}

async function recordMultipleAtBats(page: Page): Promise<void> {
  console.log('⚾ Recording multiple at-bats...');

  // Record various types of at-bats to test different scenarios
  const atBatSequence = [
    'single-button',
    'walk-button',
    'double-button',
    'strikeout-button',
    'home-run-button',
  ];

  for (let i = 0; i < atBatSequence.length; i++) {
    await recordAtBat(page, atBatSequence[i]);

    // Validate batter advancement (AC002)
    const expectedBatter = `${i + 2}${getOrdinalSuffix(i + 2)} Batter`;
    await expect(page.getByTestId('current-batter')).toContainText(
      expectedBatter
    );
  }

  console.log('✅ Multiple at-bats recorded successfully');
}

async function recordAtBat(page: Page, buttonId: string): Promise<void> {
  await page.getByTestId(buttonId).click();

  // Handle baserunner advancement modal if it appears
  const modal = page.getByTestId('baserunner-advancement-modal');
  if (await modal.isVisible({ timeout: 2000 })) {
    // For critical path test, confirm with automatic advancement (no manual selection)
    await page.getByTestId('confirm-advancement').click();
  }

  // Wait for at-bat to be recorded
  await expect(page.getByText('At-bat recorded')).toBeVisible();
  await page
    .getByText('At-bat recorded')
    .waitFor({ state: 'hidden', timeout: 3000 });
}

async function validateScoringData(page: Page): Promise<void> {
  // Validate that scoring data is persisted (AC001, AC035)
  // This would typically involve checking database/localStorage
  // For E2E, we validate that the UI reflects the recorded data

  // Check that baserunners are updated appropriately
  const baserunners = [
    page.getByTestId('baserunner-first'),
    page.getByTestId('baserunner-second'),
    page.getByTestId('baserunner-third'),
  ];

  // At least some bases should have runners after our sequence
  let hasRunners = false;
  for (const base of baserunners) {
    if (!(await base.textContent())?.includes('Empty')) {
      hasRunners = true;
      break;
    }
  }

  expect(hasRunners).toBeTruthy();

  console.log('✅ Scoring data validation complete');
}

async function validateDataPersistence(page: Page): Promise<void> {
  // Refresh page and ensure data persists (AC036)
  await page.reload();

  // Should still be on scoring page with data intact
  await expect(page.getByTestId('scoring-page')).toBeVisible();
  await expect(page.getByTestId('current-batter')).toBeVisible();

  // Current batter should not be the first batter anymore
  const currentBatterText = await page
    .getByTestId('current-batter')
    .textContent();
  expect(currentBatterText).not.toContain('1st Batter');

  console.log('✅ Data persistence validated');
}

function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }

  switch (lastDigit) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}
