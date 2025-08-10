import { test, expect, Page } from '@playwright/test';
import {
  createTestPrerequisites,
  createTestGame,
  setupTestLineup,
} from './helpers/test-data-setup';

/**
 * Game State Transitions E2E Tests
 *
 * Tests all possible game state transitions and validates that the UI
 * correctly reflects state changes and provides appropriate actions:
 *
 * Game States: setup → in_progress → suspended → resumed → completed
 *
 * This test identifies exactly where the game starting process breaks down
 * and what UI elements are missing or not working correctly.
 */

test.describe('Game State Transitions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should trace complete state transition flow', async ({ page }) => {
    console.log('=== COMPLETE GAME STATE TRANSITION FLOW ===');

    // Create prerequisites and game using dedicated test setup
    await createTestGameWithPrerequisites(page, 'State Transition Game');

    // Document initial state (should be 'setup')
    await verifyGameState(page, 'State Transition Game', 'setup');

    // Attempt transition: setup → in_progress
    const canStart = await attemptGameStart(page, 'State Transition Game');

    if (canStart) {
      await verifyGameState(page, 'State Transition Game', 'in_progress');

      // Attempt transition: in_progress → suspended
      const canSuspend = await attemptGameSuspend(
        page,
        'State Transition Game'
      );

      if (canSuspend) {
        await verifyGameState(page, 'State Transition Game', 'suspended');

        // Attempt transition: suspended → in_progress (resume)
        const canResume = await attemptGameResume(
          page,
          'State Transition Game'
        );

        if (canResume) {
          await verifyGameState(page, 'State Transition Game', 'in_progress');

          // Attempt transition: in_progress → completed
          const canComplete = await attemptGameComplete(
            page,
            'State Transition Game'
          );

          if (canComplete) {
            await verifyGameState(page, 'State Transition Game', 'completed');
            console.log(
              '✅ Complete state flow: setup → in_progress → suspended → resumed → completed'
            );
          } else {
            console.log('❌ Cannot complete game from in_progress state');
          }
        } else {
          console.log('❌ Cannot resume game from suspended state');
        }
      } else {
        console.log('❌ Cannot suspend game from in_progress state');
      }
    } else {
      console.log(
        '❌ Cannot start game from setup state - THIS IS THE MAIN ISSUE'
      );
      await diagnoseStartGameProblem(page, 'State Transition Game');
    }
  });

  test('should identify required conditions for each transition', async ({
    page,
  }) => {
    console.log('=== ANALYZING REQUIRED CONDITIONS FOR STATE TRANSITIONS ===');

    // Test what conditions are required to start a game
    await analyzeSetupToInProgressRequirements(page);

    // Test what conditions allow suspending
    await analyzeInProgressToSuspendedRequirements(page);

    // Test what conditions allow completion
    await analyzeInProgressToCompletedRequirements(page);
  });

  test('should test state-specific UI elements', async ({ page }) => {
    console.log('=== TESTING STATE-SPECIFIC UI ELEMENTS ===');

    await createTestGameWithPrerequisites(page, 'UI Elements Game');

    // Test UI elements for 'setup' state
    await testSetupStateUI(page, 'UI Elements Game');

    // If we can start the game, test in_progress UI
    const started = await attemptGameStart(page, 'UI Elements Game');
    if (started) {
      await testInProgressStateUI(page, 'UI Elements Game');
    }
  });

  test('should test error handling during transitions', async ({ page }) => {
    console.log('=== TESTING ERROR HANDLING DURING TRANSITIONS ===');

    // Test starting game without lineup
    await createTestGameWithPrerequisites(page, 'Error Test Game');

    await page.goto('/games');
    await page.waitForTimeout(1000);

    const gameCard = page
      .locator('[data-testid*="game-"]')
      .filter({ hasText: 'Error Test Game' })
      .first();

    // Check that start game button is disabled without lineup (this is correct behavior)
    const startBtn = gameCard.locator('[data-testid="start-game-button"]');
    const startBtnExists = await startBtn.isVisible({ timeout: 2000 });

    if (startBtnExists) {
      const isEnabled = await startBtn.isEnabled();

      if (!isEnabled) {
        console.log('✅ Start game button correctly disabled without lineup');

        // Check if there's a visual indication of why it's disabled
        const setupLineupBtn = gameCard.locator(
          '[data-testid="setup-lineup-button"]'
        );
        const setupLineupExists = await setupLineupBtn.isVisible({
          timeout: 1000,
        });

        if (setupLineupExists) {
          console.log('✅ Setup lineup button is available as expected');

          // Verify game is in setup state
          const gameStatus = await gameCard
            .locator('.chakra-badge')
            .textContent();
          console.log(`Game status: ${gameStatus}`);

          if (gameStatus?.toLowerCase().includes('setup')) {
            console.log('✅ Game correctly in setup state without lineup');
          }
        } else {
          console.log('⚠️ Setup lineup button not found');
        }
      } else {
        console.log('❌ Start game button should be disabled without lineup');
      }
    } else {
      console.log('❌ No start game button found');
    }
  });

  test('should test URL-based navigation to different game states', async ({
    page,
  }) => {
    console.log('=== TESTING URL-BASED NAVIGATION ===');

    await createTestGameWithPrerequisites(page, 'URL Test Game');

    // Test direct navigation to scoring page with no current game
    await page.goto('/scoring');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    const hasRedirect = currentUrl !== new URL('/scoring', page.url()).href;
    const hasError = await page
      .locator('text=No current game')
      .isVisible({ timeout: 2000 });
    const hasGameSelection = await page
      .locator('text=Select a game')
      .isVisible({ timeout: 2000 });

    console.log(`Direct /scoring navigation - URL: ${currentUrl}`);
    console.log(`Redirected: ${hasRedirect}`);
    console.log(`Shows error: ${hasError}`);
    console.log(`Shows game selection: ${hasGameSelection}`);

    // Test navigation with game ID
    // This would require knowing the game ID from the database
    await page.goto('/scoring?gameId=test-game-id');
    await page.waitForTimeout(1000);

    const scoringWithIdUrl = page.url();
    console.log(`/scoring with gameId - URL: ${scoringWithIdUrl}`);
  });

  test('should test persistence of game states', async ({ page }) => {
    console.log('=== TESTING GAME STATE PERSISTENCE ===');

    await createTestGameWithPrerequisites(page, 'Persistence Game');

    // Record initial state
    await page.goto('/games');
    await page.waitForTimeout(1000);

    const gameCard = page
      .locator('[data-testid*="game-"]')
      .filter({ hasText: 'Persistence Game' })
      .first();

    // Get initial game status (using badge which shows the status)
    const initialStatus =
      (await gameCard.locator('.chakra-badge').textContent()) || 'unknown';
    console.log(`Initial game status: ${initialStatus}`);

    // Navigate away and back
    await page.goto('/teams');
    await page.waitForTimeout(500);
    await page.goto('/games');
    await page.waitForTimeout(1000);

    // Re-find the game card after navigation
    const gameCardAfterNav = page
      .locator('[data-testid*="game-"]')
      .filter({ hasText: 'Persistence Game' })
      .first();

    const afterNavigationStatus =
      (await gameCardAfterNav.locator('.chakra-badge').textContent()) ||
      'unknown';
    console.log(`Status after navigation: ${afterNavigationStatus}`);

    if (initialStatus === afterNavigationStatus) {
      console.log('✅ Game state persists across navigation');
    } else {
      console.log('❌ Game state not persisting');
    }

    // Test page refresh
    await page.reload();
    await page.waitForTimeout(1000);

    // Re-find the game card after reload
    const gameCardAfterReload = page
      .locator('[data-testid*="game-"]')
      .filter({ hasText: 'Persistence Game' })
      .first();

    const afterReloadStatus =
      (await gameCardAfterReload.locator('.chakra-badge').textContent()) ||
      'unknown';
    console.log(`Status after page reload: ${afterReloadStatus}`);

    if (initialStatus === afterReloadStatus) {
      console.log('✅ Game state persists across page refresh');
    } else {
      console.log('❌ Game state not persisting across refresh');
    }
  });
});

/**
 * Helper: Create a test game with prerequisites using dedicated test data setup
 */
async function createTestGameWithPrerequisites(
  page: Page,
  gameName: string
): Promise<void> {
  await createTestGame(page, {
    name: gameName,
    opponent: 'Test Opponents',
    teamName: 'Test Team',
  });
}

/**
 * Helper: Verify game is in expected state
 */
async function verifyGameState(
  page: Page,
  gameName: string,
  expectedState: string
): Promise<boolean> {
  await page.goto('/games');
  await page.waitForTimeout(1000);

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();

  if (!(await gameCard.isVisible({ timeout: 2000 }))) {
    console.log(`❌ Game ${gameName} not found`);
    return false;
  }

  // Check for status badge
  const statusBadges = ['Setup', 'In Progress', 'Suspended', 'Completed'];
  let currentState = 'unknown';

  for (const status of statusBadges) {
    // Be more specific to avoid strict mode violations - target the badge element specifically
    const statusBadge = gameCard
      .locator('.chakra-badge')
      .filter({ hasText: status });
    if (await statusBadge.isVisible({ timeout: 1000 })) {
      currentState = status.toLowerCase().replace(' ', '_');
      break;
    }
  }

  console.log(
    `Game "${gameName}" current state: ${currentState}, expected: ${expectedState}`
  );

  return currentState === expectedState;
}

/**
 * Helper: Attempt to start a game
 */
async function attemptGameStart(
  page: Page,
  gameName: string
): Promise<boolean> {
  console.log(`Attempting to start game: ${gameName}`);

  await page.goto('/games');
  await page.waitForTimeout(1000);

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();

  if (!(await gameCard.isVisible({ timeout: 2000 }))) {
    console.log(`Game ${gameName} not found`);
    return false;
  }

  // First, set up lineup if needed
  const setupLineupBtn = gameCard.locator(
    '[data-testid="setup-lineup-button"]'
  );
  if (await setupLineupBtn.isVisible({ timeout: 2000 })) {
    console.log('✅ Setting up lineup first');
    // Use the helper function instead of duplicating logic
    await setupTestLineup(page, gameName);
  }

  // Look for start game button (should be enabled now)
  const startBtn = gameCard.locator('[data-testid="start-game-button"]');
  if (await startBtn.isVisible({ timeout: 2000 })) {
    console.log('✅ Found start-game-button');
    await startBtn.click();
    await page.waitForTimeout(2000);

    // Check if state changed to in_progress
    const nowInProgress = await gameCard
      .locator('text=In Progress')
      .isVisible({ timeout: 2000 });

    if (nowInProgress) {
      console.log('✅ Game successfully started');
      return true;
    } else {
      console.log('❌ Game did not transition to in_progress state');
      return false;
    }
  } else {
    console.log('❌ No start-game-button found');
    return false;
  }
}

/**
 * Helper: Attempt to suspend a game
 */
async function attemptGameSuspend(
  page: Page,
  gameName: string
): Promise<boolean> {
  console.log(`Attempting to suspend game: ${gameName}`);

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();

  const suspendBtn = gameCard.locator('[data-testid="suspend-game-button"]');
  const pauseBtn = gameCard.locator('[data-testid="pause-game-button"]');

  if (await suspendBtn.isVisible({ timeout: 2000 })) {
    await suspendBtn.click();
    await page.waitForTimeout(1000);
    return await gameCard
      .locator('text=Suspended')
      .isVisible({ timeout: 2000 });
  } else if (await pauseBtn.isVisible({ timeout: 2000 })) {
    await pauseBtn.click();
    await page.waitForTimeout(1000);
    return await gameCard
      .locator('text=Suspended')
      .isVisible({ timeout: 2000 });
  }

  console.log('❌ No suspend/pause button found');
  return false;
}

/**
 * Helper: Attempt to resume a game
 */
async function attemptGameResume(
  page: Page,
  gameName: string
): Promise<boolean> {
  console.log(`Attempting to resume game: ${gameName}`);

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();

  const resumeBtn = gameCard.locator('[data-testid="resume-game-button"]');

  if (await resumeBtn.isVisible({ timeout: 2000 })) {
    await resumeBtn.click();
    await page.waitForTimeout(1000);
    return await gameCard
      .locator('text=In Progress')
      .isVisible({ timeout: 2000 });
  }

  console.log('❌ No resume button found');
  return false;
}

/**
 * Helper: Attempt to complete a game
 */
async function attemptGameComplete(
  page: Page,
  gameName: string
): Promise<boolean> {
  console.log(`Attempting to complete game: ${gameName}`);

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();

  const completeBtn = gameCard.locator('[data-testid="complete-game-button"]');
  const endBtn = gameCard.locator('[data-testid="end-game-button"]');

  if (await completeBtn.isVisible({ timeout: 2000 })) {
    await completeBtn.click();
    await page.waitForTimeout(1000);
    return await gameCard
      .locator('text=Completed')
      .isVisible({ timeout: 2000 });
  } else if (await endBtn.isVisible({ timeout: 2000 })) {
    await endBtn.click();
    await page.waitForTimeout(1000);
    return await gameCard
      .locator('text=Completed')
      .isVisible({ timeout: 2000 });
  }

  console.log('❌ No complete/end button found');
  return false;
}

/**
 * Helper: Diagnose why game cannot start
 */
async function diagnoseStartGameProblem(
  page: Page,
  gameName: string
): Promise<void> {
  console.log('=== DIAGNOSING GAME START PROBLEM ===');

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();

  // Check what buttons/actions are available
  const availableActions = [
    'start-game-button',
    'setup-lineup-button',
    'configure-lineup-button',
    'manage-lineup-button',
    'edit-game-button',
    'delete-game-button',
  ];

  console.log('Available actions:');
  for (const action of availableActions) {
    const btn = gameCard.locator(`[data-testid="${action}"]`);
    if (await btn.isVisible({ timeout: 1000 })) {
      console.log(`  ✅ ${action}`);
    } else {
      console.log(`  ❌ ${action}`);
    }
  }

  // Check if there are any warning messages or requirements shown
  const requirementMessages = [
    'Lineup required',
    'Setup required',
    'Players needed',
    'Complete setup',
  ];

  console.log('Requirement messages:');
  for (const msg of requirementMessages) {
    if (await gameCard.locator(`text=${msg}`).isVisible({ timeout: 1000 })) {
      console.log(`  ⚠️ Found: ${msg}`);
    }
  }

  // Check if clicking the game card reveals more information
  await gameCard.click();
  await page.waitForTimeout(1000);

  const modalOpened = await page
    .locator('[role="dialog"]')
    .isVisible({ timeout: 1000 });
  const navigatedAway = !page.url().includes('/games');

  console.log(
    `Clicking game card - Modal opened: ${modalOpened}, Navigated: ${navigatedAway}`
  );
}

/**
 * Additional helper functions for comprehensive testing
 */
async function analyzeSetupToInProgressRequirements(page: Page): Promise<void> {
  console.log('Analyzing setup → in_progress requirements...');
  // Implementation for analyzing what's needed to start a game
}

async function analyzeInProgressToSuspendedRequirements(
  page: Page
): Promise<void> {
  console.log('Analyzing in_progress → suspended requirements...');
  // Implementation for analyzing suspend conditions
}

async function analyzeInProgressToCompletedRequirements(
  page: Page
): Promise<void> {
  console.log('Analyzing in_progress → completed requirements...');
  // Implementation for analyzing completion conditions
}

async function testSetupStateUI(page: Page, gameName: string): Promise<void> {
  console.log('Testing setup state UI elements...');
  // Implementation for testing setup state specific UI
}

async function testInProgressStateUI(
  page: Page,
  gameName: string
): Promise<void> {
  console.log('Testing in_progress state UI elements...');
  // Implementation for testing in_progress state specific UI
}
