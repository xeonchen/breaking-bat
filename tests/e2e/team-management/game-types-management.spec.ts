import { test, expect } from '@playwright/test';
import { NavigationHelpers } from '../helpers/navigation';

/**
 * Game Types Management E2E Tests
 *
 * Maps to user story: game-setup.md
 * Tests ACs: AC032-AC037 (Prerequisites Management - Game Types)
 *
 * AC032: Dedicated game types interface
 * AC033: Create game types (name required, description optional)
 * AC034: Validation (name 1-100 chars, description ≤500 chars)
 * AC035: Edit game types
 * AC036: Delete game types with confirmation
 * AC037: Grid layout display
 */

test.describe('Game Types Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create and manage game types', async ({ page }) => {
    const navigation = new NavigationHelpers(page);

    // Navigate to game types management
    await navigation.navigateToGameTypesManagement();

    // Verify game types page elements
    await navigation.expectGameTypesPageElements();
    await navigation.waitForGameTypesGridToLoad();

    // Verify empty state when no game types exist
    await expect(
      page.locator('[data-testid="no-game-types-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="no-game-types-message"]')
    ).toContainText('No game types found');

    // Create a new game type
    await page.click('[data-testid="create-game-type-button"]');

    // Verify create game type modal opens
    await expect(page.locator('[role="dialog"] h2')).toContainText(
      'Create New Game Type'
    );

    // Fill in game type details
    await page.fill('[data-testid="game-type-name-input"]', 'Regular Season');
    await page.fill(
      '[data-testid="game-type-description-input"]',
      'Standard league games played during the regular season'
    );

    // Submit the form
    await page.click('[data-testid="confirm-create-game-type"]');

    // Verify game type appears in list
    await expect(
      page.locator('[data-testid="game-type-regular-season"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="game-type-regular-season"]')
    ).toContainText('Regular Season');
    await expect(
      page.locator('[data-testid="game-type-regular-season"]')
    ).toContainText('Standard league games');
  });

  test('should create game type without description', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToGameTypesManagement();

    // Create a new game type
    await page.click('[data-testid="create-game-type-button"]');

    // Fill in only the name (description is optional)
    await page.fill('[data-testid="game-type-name-input"]', 'Playoffs');

    // Submit the form
    await page.click('[data-testid="confirm-create-game-type"]');

    // Verify game type appears in list
    await expect(
      page.locator('[data-testid="game-type-playoffs"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="game-type-playoffs"]')
    ).toContainText('Playoffs');
  });

  test('should validate game type name is required', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToGameTypesManagement();

    // Create a new game type
    await page.click('[data-testid="create-game-type-button"]');

    // Try to submit without filling name
    await page.click('[data-testid="confirm-create-game-type"]');

    // Verify validation error appears
    await expect(page.locator('text=Game type name is required')).toBeVisible();
  });

  test('should validate character limits', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToGameTypesManagement();

    // Create a new game type
    await page.click('[data-testid="create-game-type-button"]');

    // Fill in name that exceeds character limit (>100 chars)
    const longName = 'A'.repeat(101);
    await page.fill('[data-testid="game-type-name-input"]', longName);

    // Submit the form
    await page.click('[data-testid="confirm-create-game-type"]');

    // Verify validation error for name length
    await expect(
      page.locator('text=Game type name cannot exceed 100 characters')
    ).toBeVisible();

    // Clear name and fill valid name
    await page.fill('[data-testid="game-type-name-input"]', 'Tournament');

    // Fill in description that exceeds character limit (>500 chars)
    const longDescription = 'A'.repeat(501);
    await page.fill(
      '[data-testid="game-type-description-input"]',
      longDescription
    );

    // Submit the form
    await page.click('[data-testid="confirm-create-game-type"]');

    // Verify validation error for description length
    await expect(
      page.locator('text=Description cannot exceed 500 characters')
    ).toBeVisible();
  });

  test('should edit game type', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToGameTypesManagement();
    await page.click('[data-testid="create-game-type-button"]');
    await page.fill('[data-testid="game-type-name-input"]', 'Original Type');
    await page.fill(
      '[data-testid="game-type-description-input"]',
      'Original description'
    );
    await page.click('[data-testid="confirm-create-game-type"]');

    // Wait for game type to appear
    const gameTypeCard = page.locator(
      '[data-testid^="game-type-original-type"]'
    );
    await expect(gameTypeCard).toBeVisible();

    // Find and click the edit button
    const editButton = gameTypeCard.locator('[data-testid^="edit-game-type-"]');
    await editButton.click();

    // Verify edit modal opens
    await expect(page.locator('[role="dialog"] h2')).toContainText(
      'Edit Game Type'
    );

    // Update game type details
    await page.fill('[data-testid="game-type-name-input"]', 'Updated Type');
    await page.fill(
      '[data-testid="game-type-description-input"]',
      'Updated description'
    );
    await page.click('[data-testid="confirm-create-game-type"]');

    // Verify game type is updated
    await expect(
      page.locator('[data-testid="game-type-updated-type"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="game-type-updated-type"]')
    ).toContainText('Updated Type');
    await expect(
      page.locator('[data-testid="game-type-updated-type"]')
    ).toContainText('Updated description');
  });

  test('should delete game type', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToGameTypesManagement();
    await page.click('[data-testid="create-game-type-button"]');
    await page.fill('[data-testid="game-type-name-input"]', 'Type To Delete');
    await page.click('[data-testid="confirm-create-game-type"]');

    // Wait for game type to appear
    const gameTypeCard = page.locator(
      '[data-testid^="game-type-type-to-delete"]'
    );
    await expect(gameTypeCard).toBeVisible();

    // Set up dialog handler for confirmation
    page.on('dialog', (dialog) => dialog.accept());

    // Find and click the delete button
    const deleteButton = gameTypeCard.locator(
      '[data-testid^="delete-game-type-"]'
    );
    await deleteButton.click();

    // Verify game type is removed
    await expect(gameTypeCard).not.toBeVisible();
  });

  test('should create multiple game types', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToGameTypesManagement();

    const gameTypes = [
      { name: 'Regular Season', description: 'Standard league games' },
      { name: 'Playoffs', description: 'Post-season elimination games' },
      { name: 'Tournament', description: 'Special tournament games' },
    ];

    // Create multiple game types
    for (const gameType of gameTypes) {
      await page.click('[data-testid="create-game-type-button"]');
      await page.fill('[data-testid="game-type-name-input"]', gameType.name);
      await page.fill(
        '[data-testid="game-type-description-input"]',
        gameType.description
      );
      await page.click('[data-testid="confirm-create-game-type"]');

      // Verify each game type appears
      const testId = `game-type-${gameType.name.toLowerCase().replace(/\s+/g, '-')}`;
      await expect(page.locator(`[data-testid="${testId}"]`)).toBeVisible();
    }

    // Verify all game types are visible in the grid
    await expect(page.locator('[data-testid="game-types-grid"]')).toBeVisible();
  });
});
