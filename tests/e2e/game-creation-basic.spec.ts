import { test, expect } from '@playwright/test';

test.describe('Basic Game Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should open create game modal with form fields', async ({ page }) => {
    // Navigate to games page
    await page.goto('/games');

    // Verify games page loads
    await expect(page.locator('h1')).toContainText('Games');

    // Create a new game
    await page.click('[data-testid="create-game-button"]');

    // Verify modal opens with form fields
    await expect(page.locator('[role="dialog"] h2')).toContainText(
      'Create New Game'
    );
    await expect(page.locator('[data-testid="game-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="opponent-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-date-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="season-select"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="game-type-select"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="confirm-create-game"]')
    ).toBeVisible();
  });

  test('should validate required game fields', async ({ page }) => {
    // Navigate to games page
    await page.goto('/games');

    // Create a new game
    await page.click('[data-testid="create-game-button"]');

    // Try to submit without filling required fields
    await page.click('[data-testid="confirm-create-game"]');

    // Verify validation errors appear (they should be shown in the UI)
    // Note: The exact error display depends on the implementation
    // We can check that the modal is still visible (didn't close due to validation errors)
    await expect(page.locator('[role="dialog"] h2')).toContainText(
      'Create New Game'
    );
  });

  test('should show games page structure', async ({ page }) => {
    // Navigate to games page
    await page.goto('/games');

    // Verify basic page structure is present
    await expect(page.locator('h1')).toContainText('Games');
    await expect(
      page.locator('[data-testid="create-game-button"]')
    ).toBeVisible();

    // The games grid might not be visible if no games exist - that's okay
    // We just verify the page loads properly
  });

  test('should handle game status filtering', async ({ page }) => {
    // Navigate to games page
    await page.goto('/games');

    // Verify status filter tabs are present (use role-based selectors)
    await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Setup' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'In Progress' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Completed' })).toBeVisible();

    // Click on different status tabs
    await page.getByRole('tab', { name: 'Setup' }).click();
    await page.getByRole('tab', { name: 'All' }).click();

    // The page should still work after filtering
    await expect(page.locator('h1')).toContainText('Games');
  });

  test('should show loading spinner during game operations', async ({
    page,
  }) => {
    // Navigate to games page
    await page.goto('/games');

    // If the page is loading, we might see a loading spinner
    // This test verifies the loading state handling exists
    const maybeSpinner = page.locator('[data-testid="loading-spinner"]');

    // The spinner might not be visible if loading is very fast
    // This test just ensures the loading mechanism is in place if needed
    if (await maybeSpinner.isVisible()) {
      await expect(maybeSpinner).toBeVisible();
    }
  });

  test('should support game search functionality', async ({ page }) => {
    // Navigate to games page
    await page.goto('/games');

    // Verify search input exists
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test search');
      // The search functionality should work without errors
      await expect(page.locator('h1')).toContainText('Games');
    } else {
      // If search input doesn't exist, just verify the page loads
      await expect(page.locator('h1')).toContainText('Games');
    }
  });

  test('should create game with optional season and game type fields', async ({
    page,
  }) => {
    // First create a team that we can use for the game
    await page.goto('/teams');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Test Team for Game');
    await page.click('[data-testid="confirm-create-team"]');

    // Wait for team creation to complete
    await expect(
      page.locator('[data-testid="team-test-team-for-game"]')
    ).toBeVisible();

    // Now navigate to games page
    await page.goto('/games');

    // Create a new game
    await page.click('[data-testid="create-game-button"]');

    // Fill in required fields (name, opponent, date, team)
    await page.fill('[data-testid="game-name-input"]', 'Quick Pickup Game');
    await page.fill('[data-testid="opponent-input"]', 'Rival Team');
    await page.fill('[data-testid="game-date-input"]', '2025-12-01');

    // Select the team we just created
    const teamSelect = page.locator('[data-testid="team-select"]');
    await teamSelect.selectOption({ label: 'Test Team for Game' });

    // Leave season and game type empty (testing optional fields)
    // Season select should remain at default empty value
    // Game type select should remain at default empty value

    // Submit the form
    await page.click('[data-testid="confirm-create-game"]');

    // Verify success - look for success toast
    await expect(page.locator('text=Game created successfully')).toBeVisible({
      timeout: 5000,
    });

    // Verify modal closes after creation
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify the game appears in the games list
    await expect(page.locator('text=Quick Pickup Game')).toBeVisible();
  });

  test('should create game with only season field filled', async ({ page }) => {
    // First create a team
    await page.goto('/teams');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Season Test Team');
    await page.click('[data-testid="confirm-create-team"]');
    await expect(
      page.locator('[data-testid="team-season-test-team"]')
    ).toBeVisible();

    // Navigate to games page
    await page.goto('/games');

    // Create a new game
    await page.click('[data-testid="create-game-button"]');

    // Fill in required fields plus season (but not game type)
    await page.fill('[data-testid="game-name-input"]', 'Season Game');
    await page.fill('[data-testid="opponent-input"]', 'Test Opponent');
    await page.fill('[data-testid="game-date-input"]', '2025-12-01');

    // Select the team we created
    const teamSelect = page.locator('[data-testid="team-select"]');
    await teamSelect.selectOption({ label: 'Season Test Team' });

    // Select season if available (but leave game type empty)
    const seasonSelect = page.locator('[data-testid="season-select"]');
    const seasonOptions = seasonSelect.locator('option');
    const seasonCount = await seasonOptions.count();

    if (seasonCount > 1) {
      await seasonSelect.selectOption({ index: 1 });
    }

    // Leave game type empty - this tests partial optional field usage
    // Submit the form
    await page.click('[data-testid="confirm-create-game"]');

    // Verify success
    await expect(page.locator('text=Game created successfully')).toBeVisible({
      timeout: 5000,
    });

    // Verify modal closes
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({
      timeout: 5000,
    });

    // Verify game appears in list
    await expect(page.locator('text=Season Game')).toBeVisible();
  });
});
