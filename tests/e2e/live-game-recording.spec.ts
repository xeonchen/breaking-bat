import { test, expect, Page } from '@playwright/test';

/**
 * Live Game Recording E2E Tests
 *
 * Tests the actual game recording functionality assuming we can get
 * a game into the "in_progress" state. This will help identify if
 * the scoring interface works correctly once a game is started.
 */

test.describe('Live Game Recording', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should test scoring page interface when no game is active', async ({
    page,
  }) => {
    console.log('=== TESTING SCORING PAGE WITH NO ACTIVE GAME ===');

    // Navigate directly to scoring page
    await page.goto('/scoring');
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`Scoring page URL: ${currentUrl}`);

    // Document what the scoring page shows when no game is active
    const pageElements = [
      'current-game',
      'scoreboard',
      'at-bat-form',
      'lineup-display',
      'game-controls',
      'inning-display',
      'no-game-message',
      'select-game-button',
    ];

    console.log('Scoring page elements when no game active:');
    for (const element of pageElements) {
      const el = page.locator(`[data-testid="${element}"]`);
      if (await el.isVisible({ timeout: 1000 })) {
        console.log(`  ✅ ${element}`);
      }
    }

    // Check for any error messages or guidance
    const guidanceMessages = [
      'No active game',
      'Select a game to start scoring',
      'Create a game first',
      'No current game',
    ];

    for (const msg of guidanceMessages) {
      if (await page.locator(`text=${msg}`).isVisible({ timeout: 1000 })) {
        console.log(`  ⚠️ Guidance: ${msg}`);
      }
    }

    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should test scoring interface components exist', async ({ page }) => {
    console.log('=== TESTING SCORING INTERFACE COMPONENTS ===');

    // Create a complete game setup first
    await createCompleteGameSetup(page);

    // Navigate to scoring (this may or may not work depending on game state)
    await page.goto('/scoring');
    await page.waitForTimeout(2000);

    // Check if we can access scoring components
    const scoringComponents = [
      { id: 'scoreboard', description: 'Game scoreboard' },
      { id: 'current-batter', description: 'Current batter display' },
      { id: 'at-bat-form', description: 'At-bat recording form' },
      { id: 'pitch-count', description: 'Pitch count display' },
      { id: 'baserunner-display', description: 'Baserunner positions' },
      { id: 'inning-controls', description: 'Inning navigation' },
      { id: 'game-actions', description: 'Game action buttons' },
      { id: 'lineup-display', description: 'Current lineup' },
      { id: 'substitution-controls', description: 'Player substitution' },
      { id: 'game-notes', description: 'Game notes/comments' },
    ];

    console.log('Scoring interface components:');
    for (const component of scoringComponents) {
      const element = page.locator(`[data-testid="${component.id}"]`);
      if (await element.isVisible({ timeout: 1000 })) {
        console.log(`  ✅ ${component.description}`);
      } else {
        // Check for alternative naming
        const altElement = page.locator(
          `[data-testid*="${component.id.split('-')[0]}"]`
        );
        if (await altElement.first().isVisible({ timeout: 500 })) {
          console.log(`  ⚪ ${component.description} (alternative naming)`);
        } else {
          console.log(`  ❌ ${component.description}`);
        }
      }
    }
  });

  test('should test at-bat recording form functionality', async ({ page }) => {
    console.log('=== TESTING AT-BAT RECORDING FORM ===');

    await createCompleteGameSetup(page);

    // Try to access at-bat form
    await page.goto('/scoring');
    await page.waitForTimeout(2000);

    const atBatForm = page.locator('[data-testid="at-bat-form"]');
    const recordAtBatBtn = page.locator('[data-testid="record-at-bat-button"]');
    const pitchButtons = page.locator('[data-testid*="pitch-"]');

    if (await atBatForm.isVisible({ timeout: 2000 })) {
      console.log('✅ At-bat form found');

      // Test form elements
      await testAtBatFormElements(page);

      // Test pitch recording
      await testPitchRecording(page);

      // Test outcome recording
      await testOutcomeRecording(page);
    } else if (await recordAtBatBtn.isVisible({ timeout: 2000 })) {
      console.log('✅ At-bat recording button found');

      await recordAtBatBtn.click();
      await page.waitForTimeout(1000);

      // Check if this opens a form or interface
      const formOpened = await atBatForm.isVisible({ timeout: 1000 });
      const modalOpened = await page
        .locator('[role="dialog"]')
        .isVisible({ timeout: 1000 });

      console.log(`  Form opened: ${formOpened}, Modal opened: ${modalOpened}`);

      if (formOpened || modalOpened) {
        await testAtBatFormElements(page);
      }
    } else if (await pitchButtons.first().isVisible({ timeout: 2000 })) {
      console.log('✅ Pitch recording buttons found');

      const pitchCount = await pitchButtons.count();
      console.log(`  Found ${pitchCount} pitch buttons`);

      // Test clicking pitch buttons
      if (pitchCount > 0) {
        await pitchButtons.first().click();
        await page.waitForTimeout(500);
        console.log('  ✅ Pitch button clickable');
      }
    } else {
      console.log('❌ No at-bat recording interface found');

      // Check if there are any buttons that might lead to recording
      const potentialButtons = [
        'start-at-bat',
        'record-pitch',
        'new-at-bat',
        'begin-at-bat',
        'pitch-recorder',
      ];

      for (const btnId of potentialButtons) {
        const btn = page.locator(`[data-testid="${btnId}"]`);
        if (await btn.isVisible({ timeout: 1000 })) {
          console.log(`  ✅ Found potential recording button: ${btnId}`);
        }
      }
    }
  });

  test('should test game progression simulation', async ({ page }) => {
    console.log('=== TESTING GAME PROGRESSION SIMULATION ===');

    await createCompleteGameSetup(page);

    // Navigate to scoring and attempt to simulate a half-inning
    await page.goto('/scoring');
    await page.waitForTimeout(2000);

    // Check current game state
    const inningDisplay = page.locator('[data-testid="inning-display"]');
    const currentInning = page.locator('[data-testid="current-inning"]');
    const topBottomIndicator = page.locator('[data-testid*="inning-half"]');

    if (await inningDisplay.isVisible({ timeout: 2000 })) {
      console.log('✅ Inning display found');

      const inningText = await inningDisplay.textContent();
      console.log(`  Current inning: ${inningText}`);
    } else if (await currentInning.isVisible({ timeout: 2000 })) {
      console.log('✅ Current inning display found');

      const inningText = await currentInning.textContent();
      console.log(`  Current inning: ${inningText}`);
    }

    // Try to simulate recording outcomes for 3 outs
    await simulateHalfInning(page);

    // Check if inning advanced
    await page.waitForTimeout(1000);

    const advanceInningBtn = page.locator(
      '[data-testid="advance-inning-button"]'
    );
    const nextInningBtn = page.locator('[data-testid="next-inning-button"]');

    if (await advanceInningBtn.isVisible({ timeout: 1000 })) {
      console.log('✅ Advance inning button found');
      await advanceInningBtn.click();
      await page.waitForTimeout(1000);
    } else if (await nextInningBtn.isVisible({ timeout: 1000 })) {
      console.log('✅ Next inning button found');
      await nextInningBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should test scoring validation and error handling', async ({
    page,
  }) => {
    console.log('=== TESTING SCORING VALIDATION ===');

    await createCompleteGameSetup(page);
    await page.goto('/scoring');
    await page.waitForTimeout(2000);

    // Test invalid scoring scenarios
    await testInvalidAtBatRecording(page);

    // Test edge cases
    await testScoringEdgeCases(page);

    // Test undo functionality
    await testUndoFunctionality(page);
  });

  test('should test scoring page responsive behavior', async ({ page }) => {
    console.log('=== TESTING SCORING PAGE RESPONSIVE BEHAVIOR ===');

    await createCompleteGameSetup(page);

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/scoring');
    await page.waitForTimeout(1000);

    const desktopLayout = await analyzeScoringLayout(page, 'desktop');

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    const tabletLayout = await analyzeScoringLayout(page, 'tablet');

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    const mobileLayout = await analyzeScoringLayout(page, 'mobile');

    console.log('Layout analysis:');
    console.log(`  Desktop: ${desktopLayout}`);
    console.log(`  Tablet: ${tabletLayout}`);
    console.log(`  Mobile: ${mobileLayout}`);
  });

  test('should identify missing scoring features', async ({ page }) => {
    console.log('=== IDENTIFYING MISSING SCORING FEATURES ===');

    await createCompleteGameSetup(page);
    await page.goto('/scoring');
    await page.waitForTimeout(2000);

    // Document expected but missing features
    const expectedFeatures = [
      {
        id: 'pitch-by-pitch-recording',
        description: 'Pitch-by-pitch recording',
      },
      {
        id: 'baserunner-advancement',
        description: 'Manual baserunner advancement',
      },
      { id: 'defensive-changes', description: 'Defensive position changes' },
      { id: 'offensive-substitutions', description: 'Offensive substitutions' },
      { id: 'game-notes', description: 'Game notes/comments' },
      { id: 'weather-conditions', description: 'Weather/field conditions' },
      { id: 'umpire-info', description: 'Umpire information' },
      { id: 'ejections', description: 'Player/coach ejections' },
      { id: 'injuries', description: 'Injury tracking' },
      { id: 'timeout-tracking', description: 'Timeout/delay tracking' },
      { id: 'statistics-display', description: 'Live statistics display' },
      { id: 'game-export', description: 'Game data export' },
    ];

    console.log('Expected scoring features analysis:');
    for (const feature of expectedFeatures) {
      const element = page.locator(
        `[data-testid*="${feature.id.split('-')[0]}"]`
      );
      if (await element.first().isVisible({ timeout: 1000 })) {
        console.log(`  ✅ ${feature.description}`);
      } else {
        console.log(`  ❌ MISSING: ${feature.description}`);
      }
    }
  });
});

/**
 * Helper: Create complete game setup with team and players
 */
async function createCompleteGameSetup(page: Page): Promise<void> {
  // Create team
  await page.goto('/teams');
  await page.waitForTimeout(1000);

  const createTeamBtn = page.locator('[data-testid="create-team-button"]');
  if (await createTeamBtn.isVisible({ timeout: 2000 })) {
    await createTeamBtn.click();
    await page.fill('[data-testid="team-name-input"]', 'Recording Test Team');
    await page.click('[data-testid="confirm-create-team"]');
    await page.waitForTimeout(1000);
  }

  // Create players
  await addPlayersForRecording(page);

  // Create season
  await page.goto('/seasons');
  await page.waitForTimeout(1000);

  const createSeasonBtn = page.locator('[data-testid="create-season-button"]');
  if (await createSeasonBtn.isVisible({ timeout: 2000 })) {
    await createSeasonBtn.click();
    await page.fill('[data-testid="season-name-input"]', 'Recording Season');
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
  await page.fill('[data-testid="game-name-input"]', 'Recording Test Game');
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
    await seasonSelect.selectOption({ index: 1 });
  }

  await page.click('[data-testid="confirm-create-game"]');
  await page.waitForTimeout(1000);
}

/**
 * Helper: Add players needed for game recording
 */
async function addPlayersForRecording(page: Page): Promise<void> {
  const players = [
    { name: 'Ace Pitcher', jersey: '1', position: 'Pitcher' },
    { name: 'Safe Catcher', jersey: '2', position: 'Catcher' },
    { name: 'First Baseman', jersey: '3', position: 'First Base' },
    { name: 'Second Baseman', jersey: '4', position: 'Second Base' },
    { name: 'Third Baseman', jersey: '5', position: 'Third Base' },
    { name: 'Short Stop', jersey: '6', position: 'Shortstop' },
    { name: 'Left Fielder', jersey: '7', position: 'Left Field' },
    { name: 'Center Fielder', jersey: '8', position: 'Center Field' },
    { name: 'Right Fielder', jersey: '9', position: 'Right Field' },
  ];

  // Find team and add players
  const teamCard = page
    .locator(`[data-testid*="team-"]`)
    .filter({ hasText: 'Recording Test Team' })
    .first();

  if (await teamCard.isVisible({ timeout: 2000 })) {
    const manageBtn = teamCard.locator('[data-testid*="manage"]');
    if (await manageBtn.isVisible({ timeout: 1000 })) {
      await manageBtn.click();
      await page.waitForTimeout(1000);
    }

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
      }
    }
  }
}

/**
 * Helper: Test at-bat form elements
 */
async function testAtBatFormElements(page: Page): Promise<void> {
  console.log('Testing at-bat form elements...');

  const formElements = [
    'batter-select',
    'pitch-count-display',
    'pitch-type-select',
    'result-select',
    'outcome-buttons',
    'baserunner-controls',
    'submit-at-bat-button',
  ];

  for (const element of formElements) {
    const el = page.locator(`[data-testid*="${element.split('-')[0]}"]`);
    if (await el.first().isVisible({ timeout: 1000 })) {
      console.log(`  ✅ ${element}`);
    }
  }
}

/**
 * Helper: Test pitch recording
 */
async function testPitchRecording(page: Page): Promise<void> {
  console.log('Testing pitch recording...');

  const pitchTypes = ['strike', 'ball', 'foul', 'hit'];

  for (const pitchType of pitchTypes) {
    const btn = page.locator(`[data-testid="${pitchType}-button"]`);
    if (await btn.isVisible({ timeout: 1000 })) {
      console.log(`  ✅ ${pitchType} button found`);
    }
  }
}

/**
 * Helper: Test outcome recording
 */
async function testOutcomeRecording(page: Page): Promise<void> {
  console.log('Testing outcome recording...');

  const outcomes = [
    'single',
    'double',
    'triple',
    'home-run',
    'walk',
    'strikeout',
    'groundout',
    'flyout',
  ];

  for (const outcome of outcomes) {
    const btn = page.locator(`[data-testid="${outcome}-button"]`);
    if (await btn.isVisible({ timeout: 1000 })) {
      console.log(`  ✅ ${outcome} button found`);
    }
  }
}

/**
 * Helper: Simulate a half inning
 */
async function simulateHalfInning(page: Page): Promise<void> {
  console.log('Simulating half inning...');

  // Try to record 3 outs
  for (let out = 1; out <= 3; out++) {
    const strikeoutBtn = page.locator('[data-testid="strikeout-button"]');
    const groundoutBtn = page.locator('[data-testid="groundout-button"]');
    const outBtn = page.locator('[data-testid="out-button"]');

    if (await strikeoutBtn.isVisible({ timeout: 1000 })) {
      await strikeoutBtn.click();
      await page.waitForTimeout(500);
      console.log(`  Recorded out ${out}/3 (strikeout)`);
    } else if (await groundoutBtn.isVisible({ timeout: 1000 })) {
      await groundoutBtn.click();
      await page.waitForTimeout(500);
      console.log(`  Recorded out ${out}/3 (groundout)`);
    } else if (await outBtn.isVisible({ timeout: 1000 })) {
      await outBtn.click();
      await page.waitForTimeout(500);
      console.log(`  Recorded out ${out}/3 (generic out)`);
    } else {
      console.log(`  ❌ No out recording method found for out ${out}`);
      break;
    }
  }
}

/**
 * Helper: Test invalid at-bat recording
 */
async function testInvalidAtBatRecording(page: Page): Promise<void> {
  console.log('Testing invalid at-bat scenarios...');
  // Implementation for testing validation
}

/**
 * Helper: Test scoring edge cases
 */
async function testScoringEdgeCases(page: Page): Promise<void> {
  console.log('Testing scoring edge cases...');
  // Implementation for edge case testing
}

/**
 * Helper: Test undo functionality
 */
async function testUndoFunctionality(page: Page): Promise<void> {
  console.log('Testing undo functionality...');

  const undoBtn = page.locator('[data-testid="undo-button"]');
  const undoLastBtn = page.locator('[data-testid="undo-last-play-button"]');

  if (await undoBtn.isVisible({ timeout: 1000 })) {
    console.log('  ✅ Undo button found');
  } else if (await undoLastBtn.isVisible({ timeout: 1000 })) {
    console.log('  ✅ Undo last play button found');
  } else {
    console.log('  ❌ No undo functionality found');
  }
}

/**
 * Helper: Analyze scoring layout for different viewport sizes
 */
async function analyzeScoringLayout(
  page: Page,
  viewportName: string
): Promise<string> {
  const key_elements = [
    'scoreboard',
    'at-bat-form',
    'lineup-display',
    'game-controls',
  ];
  const visibleElements: string[] = [];

  for (const element of key_elements) {
    const el = page.locator(`[data-testid*="${element.split('-')[0]}"]`);
    if (await el.first().isVisible({ timeout: 1000 })) {
      visibleElements.push(element);
    }
  }

  return `${visibleElements.length}/${key_elements.length} elements visible`;
}
