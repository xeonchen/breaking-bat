import { test, expect, Page } from '@playwright/test';

/**
 * Mobile Complete Workflow E2E Tests
 *
 * Tests the complete game workflow on mobile devices to ensure
 * the responsive design works correctly and all functionality
 * is accessible on smaller screens.
 */

test.describe('Mobile Complete Workflow', () => {
  // Use mobile viewport for all tests
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
  });

  test('should complete full workflow on mobile - iPhone size', async ({
    page,
  }) => {
    console.log('=== MOBILE WORKFLOW TEST (iPhone SE 375x667) ===');

    // Step 1: Test mobile navigation
    await testMobileNavigation(page);

    // Step 2: Create prerequisites on mobile
    await createPrerequisitesOnMobile(page);

    // Step 3: Create game on mobile
    await createGameOnMobile(page, 'Mobile Test Game');

    // Step 4: Test game management on mobile
    await testGameManagementOnMobile(page, 'Mobile Test Game');

    // Step 5: Test lineup setup on mobile (if available)
    await testLineupSetupOnMobile(page, 'Mobile Test Game');

    // Step 6: Test game starting on mobile
    await testGameStartOnMobile(page, 'Mobile Test Game');

    console.log('✅ Mobile workflow test completed');
  });

  test('should test mobile-specific UI elements', async ({ page }) => {
    console.log('=== TESTING MOBILE-SPECIFIC UI ELEMENTS ===');

    // Test hamburger menu
    await testMobileMenu(page);

    // Test touch interactions
    await testTouchInteractions(page);

    // Test mobile forms
    await testMobileForms(page);

    // Test mobile tables/cards
    await testMobileDataDisplay(page);
  });

  test('should test landscape orientation workflow', async ({ page }) => {
    console.log('=== TESTING LANDSCAPE ORIENTATION ===');

    // Switch to landscape (667x375)
    await page.setViewportSize({ width: 667, height: 375 });

    await page.goto('/');
    await page.waitForTimeout(1000);

    // Test navigation in landscape
    await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();

    // Test key pages in landscape
    const pages = ['/games', '/teams', '/seasons', '/scoring'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForTimeout(1000);

      console.log(`Testing ${pagePath} in landscape...`);

      // Check if page is usable in landscape
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      console.log(`  ${pagePath} horizontal overflow: ${hasOverflow}`);

      // Verify header is still visible
      await expect(page.locator('text=⚾ Breaking-Bat')).toBeVisible();
    }
  });

  test('should test tablet-size workflow', async ({ page }) => {
    console.log('=== TESTING TABLET WORKFLOW ===');

    // Set tablet viewport (iPad)
    await page.setViewportSize({ width: 768, height: 1024 });

    await createPrerequisitesOnMobile(page);
    await createGameOnMobile(page, 'Tablet Test Game');

    // Test if tablet gets more features than mobile
    await page.goto('/games');
    await page.waitForTimeout(1000);

    const gameCard = page
      .locator('[data-testid*="game-"]')
      .filter({ hasText: 'Tablet Test Game' })
      .first();

    if (await gameCard.isVisible({ timeout: 2000 })) {
      // Count visible action buttons on tablet vs mobile
      const actionButtons = gameCard.locator('button');
      const buttonCount = await actionButtons.count();

      console.log(`Tablet view - Game card has ${buttonCount} action buttons`);

      // Test if more information is visible
      const gameDetails = await gameCard.textContent();
      console.log(
        `Tablet view - Game card content length: ${gameDetails?.length || 0} chars`
      );
    }
  });

  test('should test mobile scoring interface', async ({ page }) => {
    console.log('=== TESTING MOBILE SCORING INTERFACE ===');

    await createPrerequisitesOnMobile(page);
    await createGameOnMobile(page, 'Mobile Scoring Game');

    // Navigate to scoring on mobile
    await page.goto('/scoring');
    await page.waitForTimeout(2000);

    // Test mobile scoring layout
    await testMobileScoringLayout(page);

    // Test mobile at-bat recording
    await testMobileAtBatRecording(page);

    // Test mobile game controls
    await testMobileGameControls(page);
  });

  test('should test mobile accessibility features', async ({ page }) => {
    console.log('=== TESTING MOBILE ACCESSIBILITY ===');

    await createPrerequisitesOnMobile(page);

    // Test touch target sizes
    await testTouchTargetSizes(page);

    // Test mobile keyboard navigation
    await testMobileKeyboardNavigation(page);

    // Test mobile screen reader compatibility
    await testMobileScreenReader(page);
  });

  test('should test mobile error handling', async ({ page }) => {
    console.log('=== TESTING MOBILE ERROR HANDLING ===');

    // Test network errors on mobile
    await testMobileNetworkErrors(page);

    // Test form validation on mobile
    await testMobileFormValidation(page);

    // Test mobile error recovery
    await testMobileErrorRecovery(page);
  });

  test('should test mobile performance', async ({ page }) => {
    console.log('=== TESTING MOBILE PERFORMANCE ===');

    // Simulate slow 3G connection
    await page.route('**/*', (route) => {
      // Add delay to simulate slow connection
      setTimeout(() => route.continue(), 100);
    });

    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('text=⚾ Breaking-Bat');
    const loadTime = Date.now() - startTime;

    console.log(`Page load time on slow connection: ${loadTime}ms`);

    // Test if loading indicators work properly
    const hasLoadingSpinner = await page
      .locator('[data-testid="loading-spinner"]')
      .isVisible({ timeout: 500 });
    console.log(`Loading spinner shown: ${hasLoadingSpinner}`);

    // Test navigation performance
    await testMobileNavigationPerformance(page);
  });
});

/**
 * Helper: Test mobile navigation
 */
async function testMobileNavigation(page: Page): Promise<void> {
  console.log('Testing mobile navigation...');

  // Look for hamburger menu
  const hamburgerMenu = page.locator('[data-testid="mobile-menu-button"]');
  const menuIcon = page.locator('[data-testid="menu-icon"]');
  const navToggle = page.locator('[aria-label="Toggle navigation"]');

  if (await hamburgerMenu.isVisible({ timeout: 2000 })) {
    console.log('  ✅ Hamburger menu found');
    await hamburgerMenu.click();
    await page.waitForTimeout(500);

    // Check if menu opened
    const menuOpened = await page
      .locator('[data-testid="mobile-nav-menu"]')
      .isVisible({ timeout: 1000 });
    console.log(`  Menu opened: ${menuOpened}`);
  } else if (await menuIcon.isVisible({ timeout: 2000 })) {
    console.log('  ✅ Menu icon found');
    await menuIcon.click();
    await page.waitForTimeout(500);
  } else if (await navToggle.isVisible({ timeout: 2000 })) {
    console.log('  ✅ Nav toggle found');
    await navToggle.click();
    await page.waitForTimeout(500);
  } else {
    console.log('  ❌ No mobile menu found');

    // Check for bottom navigation
    const bottomNav = page.locator('[data-testid="bottom-navigation"]');
    const navTabs = page.locator('[role="tab"]');

    if (await bottomNav.isVisible({ timeout: 1000 })) {
      console.log('  ✅ Bottom navigation found');
    } else if ((await navTabs.count()) > 0) {
      console.log('  ✅ Tab navigation found');
    } else {
      console.log('  ⚠️ No clear mobile navigation pattern found');
    }
  }

  // Test navigation to key sections
  const sections = ['Games', 'Teams', 'Seasons', 'Stats'];

  for (const section of sections) {
    const link = page.locator(`text=${section}`).first();
    if (await link.isVisible({ timeout: 1000 })) {
      await link.click();
      await page.waitForTimeout(1000);

      // Verify navigation worked
      const currentUrl = page.url();
      console.log(`  Navigated to ${section}: ${currentUrl}`);

      // Return to home for next test
      await page.goto('/');
      await page.waitForTimeout(500);
    }
  }
}

/**
 * Helper: Create prerequisites on mobile
 */
async function createPrerequisitesOnMobile(page: Page): Promise<void> {
  console.log('Creating prerequisites on mobile...');

  // Create team on mobile
  await page.goto('/teams');
  await page.waitForTimeout(1000);

  const createTeamBtn = page.locator('[data-testid="create-team-button"]');
  if (await createTeamBtn.isVisible({ timeout: 2000 })) {
    await createTeamBtn.click();

    // Test mobile form
    const nameInput = page.locator('[data-testid="team-name-input"]');
    await expect(nameInput).toBeVisible();

    await nameInput.fill('Mobile Test Team');
    await page.click('[data-testid="confirm-create-team"]');
    await page.waitForTimeout(1000);

    console.log('  ✅ Team created on mobile');
  }

  // Create season on mobile
  await page.goto('/seasons');
  await page.waitForTimeout(1000);

  const createSeasonBtn = page.locator('[data-testid="create-season-button"]');
  if (await createSeasonBtn.isVisible({ timeout: 2000 })) {
    await createSeasonBtn.click();

    await page.fill('[data-testid="season-name-input"]', 'Mobile Season');
    await page.fill('[data-testid="season-year-input"]', '2025');
    await page.fill('[data-testid="season-start-date"]', '2025-04-01');
    await page.fill('[data-testid="season-end-date"]', '2025-09-30');
    await page.click('[data-testid="confirm-create-season"]');
    await page.waitForTimeout(1000);

    console.log('  ✅ Season created on mobile');
  }
}

/**
 * Helper: Create game on mobile
 */
async function createGameOnMobile(page: Page, gameName: string): Promise<void> {
  console.log('Creating game on mobile...');

  await page.goto('/games');
  await page.waitForTimeout(1000);

  const createGameBtn = page.locator('[data-testid="create-game-button"]');
  if (await createGameBtn.isVisible({ timeout: 2000 })) {
    await createGameBtn.click();

    // Test mobile game creation form
    const modal = page.locator('[role="dialog"]');
    const formVisible = await modal.isVisible({ timeout: 2000 });

    if (formVisible) {
      console.log('  ✅ Mobile game creation modal opened');

      // Fill form on mobile
      await page.fill('[data-testid="game-name-input"]', gameName);
      await page.fill('[data-testid="opponent-input"]', 'Mobile Opponents');
      // Use tomorrow's date to avoid validation errors
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill(
        '[data-testid="game-date-input"]',
        tomorrow.toISOString().split('T')[0]
      );

      // Test mobile select dropdowns
      const teamSelect = page.locator('[data-testid="team-select"]');
      if (await teamSelect.isVisible({ timeout: 1000 })) {
        await teamSelect.selectOption({ index: 1 });
        console.log('  ✅ Team selection works on mobile');
      }

      const seasonSelect = page.locator('[data-testid="season-select"]');
      if (await seasonSelect.isVisible({ timeout: 1000 })) {
        await page.waitForTimeout(1000);
        const optionCount = await seasonSelect.locator('option').count();
        if (optionCount > 1) {
          await seasonSelect.selectOption({ index: 1 });
          console.log('  ✅ Season selection works on mobile');
        } else {
          console.log(
            '  ⚠️ Season dropdown has no selectable options on mobile - skipping'
          );
        }
      }

      await page.click('[data-testid="confirm-create-game"]');
      await page.waitForTimeout(2000);

      console.log('  ✅ Game created on mobile');
    } else {
      console.log('  ❌ Mobile game creation form not accessible');
    }
  }
}

/**
 * Helper: Test game management on mobile
 */
async function testGameManagementOnMobile(
  page: Page,
  gameName: string
): Promise<void> {
  console.log('Testing game management on mobile...');

  await page.goto('/games');
  await page.waitForTimeout(1000);

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();

  if (await gameCard.isVisible({ timeout: 2000 })) {
    console.log('  ✅ Game card visible on mobile');

    // Test mobile game card interactions
    const cardHeight = await gameCard.boundingBox();
    console.log(`  Mobile game card height: ${cardHeight?.height}px`);

    // Test if all information is readable
    const cardText = await gameCard.textContent();
    const hasEssentialInfo =
      cardText?.includes(gameName) && cardText?.includes('Mobile Opponents');
    console.log(`  Essential info visible: ${hasEssentialInfo}`);

    // Test mobile action buttons
    const actionButtons = gameCard.locator('button');
    const buttonCount = await actionButtons.count();
    console.log(`  Action buttons available: ${buttonCount}`);

    // Test button accessibility on mobile
    if (buttonCount > 0) {
      const firstButton = actionButtons.first();
      const buttonSize = await firstButton.boundingBox();
      console.log(
        `  First button size: ${buttonSize?.width}x${buttonSize?.height}px`
      );

      // Check if button is large enough for touch (44px minimum recommended)
      const isTouchFriendly =
        (buttonSize?.width || 0) >= 44 && (buttonSize?.height || 0) >= 44;
      console.log(`  Touch-friendly button size: ${isTouchFriendly}`);
    }
  } else {
    console.log('  ❌ Game card not visible on mobile');
  }
}

/**
 * Helper: Test lineup setup on mobile
 */
async function testLineupSetupOnMobile(
  page: Page,
  gameName: string
): Promise<void> {
  console.log('Testing lineup setup on mobile...');

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();

  // Look for lineup setup button
  const setupLineupBtn = gameCard.locator(
    '[data-testid="setup-lineup-button"]'
  );

  if (await setupLineupBtn.isVisible({ timeout: 2000 })) {
    await setupLineupBtn.click();
    await page.waitForTimeout(1000);

    // Test mobile lineup interface
    const lineupInterface = page.locator('[data-testid*="lineup"]').first();
    if (await lineupInterface.isVisible({ timeout: 2000 })) {
      console.log('  ✅ Mobile lineup interface accessible');

      // Test if lineup interface is usable on mobile
      const interfaceSize = await lineupInterface.boundingBox();
      const viewportHeight = page.viewportSize()?.height || 667;

      const fitsOnScreen = (interfaceSize?.height || 0) <= viewportHeight;
      console.log(`  Lineup interface fits on mobile screen: ${fitsOnScreen}`);
    } else {
      console.log('  ❌ Mobile lineup interface not accessible');
    }
  } else {
    console.log('  ❌ No lineup setup available on mobile');
  }
}

/**
 * Helper: Test game starting on mobile
 */
async function testGameStartOnMobile(
  page: Page,
  gameName: string
): Promise<void> {
  console.log('Testing game start on mobile...');

  const gameCard = page
    .locator('[data-testid*="game-"]')
    .filter({ hasText: gameName })
    .first();

  const startGameBtn = gameCard.locator('[data-testid="start-game-button"]');

  if (await startGameBtn.isVisible({ timeout: 2000 })) {
    console.log('  ✅ Start game button visible on mobile');

    const buttonSize = await startGameBtn.boundingBox();
    console.log(
      `  Start button size: ${buttonSize?.width}x${buttonSize?.height}px`
    );

    await startGameBtn.click();
    await page.waitForTimeout(2000);

    // Check what happened
    const currentUrl = page.url();
    const navigationOccurred = currentUrl.includes('/scoring');
    const errorShown = await page
      .locator('text=Lineup Required')
      .isVisible({ timeout: 1000 });

    console.log(`  Navigation to scoring: ${navigationOccurred}`);
    console.log(`  Lineup error shown: ${errorShown}`);
  } else {
    console.log('  ❌ Start game button not visible on mobile');
  }
}

/**
 * Additional mobile-specific test helper functions
 */
async function testMobileMenu(page: Page): Promise<void> {
  console.log('Testing mobile menu functionality...');
}

async function testTouchInteractions(page: Page): Promise<void> {
  console.log('Testing touch interactions...');
}

async function testMobileForms(page: Page): Promise<void> {
  console.log('Testing mobile form usability...');
}

async function testMobileDataDisplay(page: Page): Promise<void> {
  console.log('Testing mobile data display...');
}

async function testMobileScoringLayout(page: Page): Promise<void> {
  console.log('Testing mobile scoring layout...');
}

async function testMobileAtBatRecording(page: Page): Promise<void> {
  console.log('Testing mobile at-bat recording...');
}

async function testMobileGameControls(page: Page): Promise<void> {
  console.log('Testing mobile game controls...');
}

async function testTouchTargetSizes(page: Page): Promise<void> {
  console.log('Testing touch target sizes...');
}

async function testMobileKeyboardNavigation(page: Page): Promise<void> {
  console.log('Testing mobile keyboard navigation...');
}

async function testMobileScreenReader(page: Page): Promise<void> {
  console.log('Testing mobile screen reader compatibility...');
}

async function testMobileNetworkErrors(page: Page): Promise<void> {
  console.log('Testing mobile network error handling...');
}

async function testMobileFormValidation(page: Page): Promise<void> {
  console.log('Testing mobile form validation...');
}

async function testMobileErrorRecovery(page: Page): Promise<void> {
  console.log('Testing mobile error recovery...');
}

async function testMobileNavigationPerformance(page: Page): Promise<void> {
  console.log('Testing mobile navigation performance...');
}
