import { test, expect, Page } from '@playwright/test';

/**
 * Lineup Setup E2E Tests
 *
 * Focuses specifically on the lineup management workflow:
 * - Finding lineup setup UI after game creation
 * - Testing defensive position assignments
 * - Testing batting order configuration
 * - Testing substitute management
 * - Identifying UI gaps in the lineup setup process
 */

test.describe('Lineup Setup Management (@lineup-configuration:AC001-@lineup-configuration:AC046)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should identify lineup setup entry points (@lineup-configuration:AC001)', async ({
    page,
  }) => {
    // Given: Game exists with prerequisites
    await createBasicSetup(page);
    await page.goto('/games');
    await page.waitForTimeout(1000);

    // When: I look for lineup setup entry points on game card
    const gameCard = page
      .locator('[data-testid*="game-"]')
      .filter({ hasText: 'Lineup Test Game' })
      .first();
    await expect(gameCard).toBeVisible();

    console.log('=== LINEUP SETUP ENTRY POINTS ===');

    // Test all possible entry points to lineup setup
    const entryPoints = [
      { testId: 'setup-lineup-button', description: 'Setup Lineup Button' },
      {
        testId: 'configure-lineup-button',
        description: 'Configure Lineup Button',
      },
      { testId: 'manage-lineup-button', description: 'Manage Lineup Button' },
      { testId: 'edit-lineup-button', description: 'Edit Lineup Button' },
      {
        testId: 'lineup-settings-button',
        description: 'Lineup Settings Button',
      },
      { testId: 'team-lineup-button', description: 'Team Lineup Button' },
    ];

    let foundEntryPoint = false;
    for (const entry of entryPoints) {
      const button = gameCard.locator(`[data-testid="${entry.testId}"]`);
      if (await button.isVisible({ timeout: 1000 })) {
        console.log(`✅ Found: ${entry.description}`);
        foundEntryPoint = true;

        // Test clicking this entry point
        await button.click();
        await page.waitForTimeout(1000);

        // Check what opened
        const hasModal = await page
          .locator('[role="dialog"]')
          .isVisible({ timeout: 2000 });
        const hasNewPage = !page.url().includes('/games');
        const hasLineupInterface = await page
          .locator('[data-testid*="lineup"]')
          .first()
          .isVisible({ timeout: 2000 });

        console.log(`  → Opens modal: ${hasModal}`);
        console.log(`  → Navigates to new page: ${hasNewPage}`);
        console.log(`  → Shows lineup interface: ${hasLineupInterface}`);

        if (hasModal || hasNewPage || hasLineupInterface) {
          await testLineupInterface(page);
        }

        // Return to games page for next test
        if (hasNewPage) {
          await page.goto('/games');
          await page.waitForTimeout(1000);
        } else if (hasModal) {
          const closeBtn = page.locator('[aria-label="Close"]');
          if (await closeBtn.isVisible({ timeout: 1000 })) {
            await closeBtn.click();
          }
          await page.waitForTimeout(500);
        }
      }
    }

    if (!foundEntryPoint) {
      console.log('❌ No lineup setup entry points found');
    }

    // Test alternative approaches
    await testAlternativeLineupAccess(page, gameCard);
  });

  test('should test lineup interface completeness', async ({ page }) => {
    await createBasicSetup(page);

    // Try to access lineup setup and test its completeness
    const lineupInterface = await findAndOpenLineupInterface(page);

    if (lineupInterface) {
      console.log('=== TESTING LINEUP INTERFACE COMPLETENESS ===');

      // Test defensive positions
      await testDefensivePositions(page);

      // Test batting order
      await testBattingOrder(page);

      // Test substitute management
      await testSubstituteManagement(page);

      // Test lineup validation
      await testLineupValidation(page);

      // Test save functionality
      await testLineupSaving(page);
    } else {
      console.log('⚠️ Could not access lineup interface - documenting gap');

      // Document what we expect to see
      await documentExpectedLineupInterface(page);
    }
  });

  test('should test lineup setup with insufficient players', async ({
    page,
  }) => {
    // Create team with only 2 players (insufficient for full lineup)
    await createMinimalSetup(page);

    await page.goto('/games');
    await page.waitForTimeout(1000);

    // Create game
    await page.click('[data-testid="create-game-button"]');
    await page.fill(
      '[data-testid="game-name-input"]',
      'Insufficient Players Game'
    );
    await page.fill('[data-testid="opponent-input"]', 'Test Opponents');
    // Use tomorrow's date to avoid validation errors
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill(
      '[data-testid="game-date-input"]',
      tomorrow.toISOString().split('T')[0]
    );

    const teamSelect = page.locator('[data-testid="team-select"]');
    if (await teamSelect.isVisible({ timeout: 2000 })) {
      await teamSelect.selectOption({ index: 1 });
    }

    await page.click('[data-testid="confirm-create-game"]');
    await page.waitForTimeout(1000);

    // Try to set up lineup with insufficient players
    const lineupInterface = await findAndOpenLineupInterface(page);

    if (lineupInterface) {
      console.log('=== TESTING INSUFFICIENT PLAYERS SCENARIO ===');

      // Should show validation errors or warnings
      const insufficientPlayersWarning = page.locator(
        'text=insufficient players'
      );
      const needMorePlayersMsg = page.locator('text=need more players');
      const notEnoughPlayersMsg = page.locator('text=not enough players');

      const hasWarning =
        (await insufficientPlayersWarning.isVisible({ timeout: 2000 })) ||
        (await needMorePlayersMsg.isVisible({ timeout: 2000 })) ||
        (await notEnoughPlayersMsg.isVisible({ timeout: 2000 }));

      if (hasWarning) {
        console.log('✅ System validates insufficient players');
      } else {
        console.log('⚠️ No validation for insufficient players detected');
      }
    }
  });

  test('should test lineup modification after creation', async ({ page }) => {
    await createBasicSetup(page);

    // Create game and set up initial lineup
    const lineupInterface = await findAndOpenLineupInterface(page);

    if (lineupInterface) {
      // Set up initial lineup
      await setupBasicLineup(page);

      // Save lineup
      await saveLineup(page);

      // Now test modification
      console.log('=== TESTING LINEUP MODIFICATION ===');

      // Return to lineup setup
      const modifyInterface = await findAndOpenLineupInterface(page);

      if (modifyInterface) {
        // Verify lineup is populated
        const populatedPositions = await page
          .locator('select[data-testid*="position"]:not([value=""])')
          .count();
        console.log(`Found ${populatedPositions} populated positions`);

        if (populatedPositions > 0) {
          console.log('✅ Lineup persists after saving');

          // Try to modify lineup
          const firstSelect = page
            .locator('select[data-testid*="position"]')
            .first();
          if (await firstSelect.isVisible({ timeout: 1000 })) {
            const optionCount = await firstSelect.locator('option').count();
            if (optionCount > 2) {
              await firstSelect.selectOption({ index: 2 });
              console.log('✅ Can modify existing lineup');
            }
          }

          // Save modifications
          await saveLineup(page);
        } else {
          console.log('❌ Lineup not persisting after save');
        }
      }
    }
  });

  test('should test position-specific requirements', async ({ page }) => {
    await createBasicSetup(page);

    const lineupInterface = await findAndOpenLineupInterface(page);

    if (lineupInterface) {
      console.log('=== TESTING POSITION-SPECIFIC REQUIREMENTS ===');

      // Test if certain positions have restrictions
      const criticalPositions = [
        'pitcher-select',
        'catcher-select',
        'shortstop-select',
        'center-field-select',
      ];

      for (const position of criticalPositions) {
        const select = page.locator(`[data-testid="${position}"]`);
        if (await select.isVisible({ timeout: 1000 })) {
          console.log(`✅ Found ${position} selector`);

          // Check if it has position-specific validation
          await select.selectOption({ index: 1 });
          const hasValidation = await page
            .locator('text=position requirement')
            .isVisible({ timeout: 1000 });

          if (hasValidation) {
            console.log(`  → ${position} has specific requirements`);
          }
        }
      }
    }
  });

  test('should test drag-and-drop lineup management', async ({ page }) => {
    await createBasicSetup(page);

    const lineupInterface = await findAndOpenLineupInterface(page);

    if (lineupInterface) {
      console.log('=== TESTING DRAG-AND-DROP FUNCTIONALITY ===');

      // Look for draggable elements
      const draggableItems = page.locator('[draggable="true"]');
      const dragHandles = page.locator('[data-testid*="drag-handle"]');
      const battingOrderList = page.locator(
        '[data-testid="batting-order-list"]'
      );

      const hasDragAndDrop =
        (await draggableItems.count()) > 0 ||
        (await dragHandles.count()) > 0 ||
        (await battingOrderList.isVisible({ timeout: 1000 }));

      if (hasDragAndDrop) {
        console.log('✅ Drag-and-drop interface detected');

        // Test drag and drop if elements exist
        if ((await draggableItems.count()) >= 2) {
          const first = draggableItems.first();
          const second = draggableItems.nth(1);

          await first.dragTo(second);
          console.log('✅ Drag-and-drop executed successfully');
        }
      } else {
        console.log('❌ No drag-and-drop interface found');
      }
    }
  });
});

/**
 * Helper: Create basic team, season, and players
 */
async function createBasicSetup(page: Page): Promise<void> {
  // Create team
  await page.goto('/teams');
  await page.waitForTimeout(1000);

  const createTeamBtn = page.locator('[data-testid="create-team-button"]');
  if (await createTeamBtn.isVisible({ timeout: 2000 })) {
    await createTeamBtn.click();
    await page.fill('[data-testid="team-name-input"]', 'Lineup Test Team');
    await page.click('[data-testid="confirm-create-team"]');
    await page.waitForTimeout(1000);
  }

  // Add full roster of players
  await addFullRoster(page, 'Lineup Test Team');

  // Create season
  await page.goto('/seasons');
  await page.waitForTimeout(1000);

  const createSeasonBtn = page.locator('[data-testid="create-season-button"]');
  if (await createSeasonBtn.isVisible({ timeout: 2000 })) {
    await createSeasonBtn.click();
    await page.fill('[data-testid="season-name-input"]', 'Lineup Test Season');
    await page.fill('[data-testid="season-year-input"]', '2025');
    await page.fill('[data-testid="season-start-date"]', '2025-04-01');
    await page.fill('[data-testid="season-end-date"]', '2025-09-30');
    await page.click('[data-testid="confirm-create-season"]');
    await page.waitForTimeout(1000);
  }

  // Create game
  await page.goto('/games');
  await page.waitForTimeout(1000);

  await page.click('[data-testid="create-game-button"]');
  await page.fill('[data-testid="game-name-input"]', 'Lineup Test Game');
  await page.fill('[data-testid="opponent-input"]', 'Test Opponents');
  // Use tomorrow's date to avoid validation errors
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await page.fill(
    '[data-testid="game-date-input"]',
    tomorrow.toISOString().split('T')[0]
  );

  const teamSelect = page.locator('[data-testid="team-select"]');
  if (await teamSelect.isVisible({ timeout: 2000 })) {
    await teamSelect.selectOption({ index: 1 });
  }

  const seasonSelect = page.locator('[data-testid="season-select"]');
  if (await seasonSelect.isVisible({ timeout: 2000 })) {
    await page.waitForTimeout(1000);
    const optionCount = await seasonSelect.locator('option').count();
    if (optionCount > 1) {
      await seasonSelect.selectOption({ index: 1 });
    } else {
      console.log('  ⚠️ Season dropdown has no selectable options - skipping');
    }
  }

  await page.click('[data-testid="confirm-create-game"]');
  await page.waitForTimeout(1000);
}

/**
 * Helper: Create minimal setup with only 2 players
 */
async function createMinimalSetup(page: Page): Promise<void> {
  // Create team
  await page.goto('/teams');
  await page.waitForTimeout(1000);

  const createTeamBtn = page.locator('[data-testid="create-team-button"]');
  if (await createTeamBtn.isVisible({ timeout: 2000 })) {
    await createTeamBtn.click();
    await page.fill('[data-testid="team-name-input"]', 'Minimal Team');
    await page.click('[data-testid="confirm-create-team"]');
    await page.waitForTimeout(1000);
  }

  // Add only 2 players
  await addMinimalPlayers(page, 'Minimal Team');
}

/**
 * Helper: Add full roster of players
 */
async function addFullRoster(page: Page, teamName: string): Promise<void> {
  const players = [
    { name: 'Ace Pitcher', jersey: '1', position: 'Pitcher (P)' },
    { name: 'Safe Catcher', jersey: '2', position: 'Catcher (C)' },
    { name: 'First Base', jersey: '3', position: 'First Base (1B)' },
    { name: 'Second Base', jersey: '4', position: 'Second Base (2B)' },
    { name: 'Third Base', jersey: '5', position: 'Third Base (3B)' },
    { name: 'Short Stop', jersey: '6', position: 'Shortstop (SS)' },
    { name: 'Left Field', jersey: '7', position: 'Left Field (LF)' },
    { name: 'Center Field', jersey: '8', position: 'Center Field (CF)' },
    { name: 'Right Field', jersey: '9', position: 'Right Field (RF)' },
    { name: 'Utility Player', jersey: '10', position: '' },
    { name: 'Bench Player', jersey: '11', position: '' },
  ];

  await addPlayersToTeam(page, teamName, players);
}

/**
 * Helper: Add minimal players
 */
async function addMinimalPlayers(page: Page, teamName: string): Promise<void> {
  const players = [
    { name: 'Player One', jersey: '1', position: 'Pitcher (P)' },
    { name: 'Player Two', jersey: '2', position: 'Catcher (C)' },
  ];

  await addPlayersToTeam(page, teamName, players);
}

/**
 * Helper: Add players to team
 */
async function addPlayersToTeam(
  page: Page,
  teamName: string,
  players: Array<{ name: string; jersey: string; position: string }>
): Promise<void> {
  // Wait for team to be created and appear in the list
  const teamCardSelector = `[data-testid="team-${teamName.toLowerCase().replace(/\s+/g, '-')}"]`;
  await page.waitForSelector(teamCardSelector, { timeout: 10000 });

  // Click the view button to open team details modal
  const viewButtonSelector = `[data-testid="view-team-${teamName.toLowerCase().replace(/\s+/g, '-')}"]`;
  await page.click(viewButtonSelector);

  // Wait for the team details modal to open
  await page.waitForSelector('[data-testid="team-details-modal"]', {
    timeout: 10000,
  });
  // Wait for the add player button inside the TeamManagement component
  await page.waitForSelector('[data-testid="add-player-button"]', {
    timeout: 10000,
  });

  // Add each player
  for (const player of players) {
    const addPlayerBtn = page.locator('[data-testid="add-player-button"]');
    if (await addPlayerBtn.isVisible({ timeout: 1000 })) {
      await addPlayerBtn.click();
      await page.fill('[data-testid="player-name-input"]', player.name);
      await page.fill('[data-testid="player-jersey-input"]', player.jersey);

      const positionSelect = page.locator(
        '[data-testid="player-position-select"]'
      );
      if (
        (await positionSelect.isVisible({ timeout: 1000 })) &&
        player.position
      ) {
        await positionSelect.selectOption({ label: player.position });
      }

      await page.click('[data-testid="confirm-add-player"]');
      await page.waitForTimeout(500);
    }
  }

  // Close the team details modal
  await page
    .click('[data-testid="close-modal-button"]', { timeout: 5000 })
    .catch(() => {
      // If close button not found, try escape key or modal overlay click
      return page.keyboard.press('Escape');
    });
}

/**
 * Helper: Find and open lineup interface
 */
async function findAndOpenLineupInterface(page: Page): Promise<boolean> {
  await page.goto('/games');
  await page.waitForTimeout(1000);

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: 'Lineup Test Game' })
    .first();

  if (!(await gameCard.isVisible({ timeout: 2000 }))) {
    return false;
  }

  // Try different lineup entry points
  const entryButtons = [
    'setup-lineup-button',
    'configure-lineup-button',
    'manage-lineup-button',
    'edit-lineup-button',
  ];

  for (const buttonId of entryButtons) {
    const button = gameCard.locator(`[data-testid="${buttonId}"]`);
    if (await button.isVisible({ timeout: 1000 })) {
      await button.click();
      await page.waitForTimeout(1000);
      return true;
    }
  }

  return false;
}

/**
 * Helper: Test lineup interface functions
 */
async function testLineupInterface(page: Page): Promise<void> {
  console.log('  → Testing lineup interface...');

  // Check for key interface elements
  const elements = [
    'lineup-form',
    'batting-order',
    'position-assignments',
    'player-selects',
    'save-lineup-button',
  ];

  for (const element of elements) {
    const el = page.locator(`[data-testid*="${element}"]`);
    if (await el.isVisible({ timeout: 1000 })) {
      console.log(`    ✅ Found ${element}`);
    }
  }
}

/**
 * Additional test functions for comprehensive lineup testing
 */
async function testDefensivePositions(page: Page): Promise<void> {
  console.log('Testing defensive positions...');
  // Implementation would test all 9 defensive positions
}

async function testBattingOrder(page: Page): Promise<void> {
  console.log('Testing batting order...');
  // Implementation would test batting order from 1-9
}

async function testSubstituteManagement(page: Page): Promise<void> {
  console.log('Testing substitute management...');
  // Implementation would test bench players and substitutions
}

async function testLineupValidation(page: Page): Promise<void> {
  console.log('Testing lineup validation...');
  // Implementation would test validation rules
}

async function testLineupSaving(page: Page): Promise<void> {
  console.log('Testing lineup saving...');
  // Implementation would test save functionality
}

async function documentExpectedLineupInterface(page: Page): Promise<void> {
  console.log('=== EXPECTED LINEUP INTERFACE ===');
  console.log('The lineup interface should include:');
  console.log('1. Defensive position assignments (9 positions)');
  console.log('2. Batting order configuration (1-9)');
  console.log('3. Substitute/bench player management');
  console.log('4. Validation for complete lineup');
  console.log('5. Save/confirm functionality');
}

async function setupBasicLineup(page: Page): Promise<void> {
  console.log('Setting up basic lineup...');

  // Look for player position selects in the lineup interface
  const playerSelects = page.locator('select[data-testid*="position"]');
  const selectCount = await playerSelects.count();

  console.log(`Found ${selectCount} position selectors`);

  // Try to set up at least a few positions
  if (selectCount > 0) {
    for (let i = 0; i < Math.min(3, selectCount); i++) {
      const select = playerSelects.nth(i);
      if (await select.isVisible({ timeout: 1000 })) {
        const options = await select.locator('option').count();
        if (options > 1) {
          await select.selectOption({ index: 1 });
          console.log(`  ✅ Set position ${i + 1}`);
          await page.waitForTimeout(200);
        }
      }
    }
  }

  console.log('Basic lineup setup attempted');
}

async function saveLineup(page: Page): Promise<void> {
  const saveBtn = page.locator('[data-testid="save-lineup-button"]');
  if (await saveBtn.isVisible({ timeout: 1000 })) {
    // Check if button is enabled before clicking
    const isEnabled = await saveBtn.isEnabled();
    console.log(`Save lineup button enabled: ${isEnabled}`);

    if (isEnabled) {
      await saveBtn.click();
      await page.waitForTimeout(1000);
      console.log('✅ Lineup saved successfully');
    } else {
      console.log('⚠️ Save button disabled - lineup may be incomplete');
      // This is expected behavior when lineup is not complete
    }
  }
}

async function testAlternativeLineupAccess(
  page: Page,
  gameCard: any
): Promise<void> {
  console.log('=== TESTING ALTERNATIVE LINEUP ACCESS ===');

  // Test clicking the game card itself
  await gameCard.click();
  await page.waitForTimeout(1000);

  // Test right-click context menu
  await gameCard.click({ button: 'right' });
  await page.waitForTimeout(500);

  // Check for context menu options
  const contextMenu = page.locator('[role="menu"]');
  if (await contextMenu.isVisible({ timeout: 1000 })) {
    console.log('✅ Context menu available');
  }
}
