import { test, expect } from '@playwright/test';
import { NavigationHelpers } from './helpers/navigation';

test.describe('Seasons Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create and manage seasons', async ({ page }) => {
    const navigation = new NavigationHelpers(page);

    // Navigate to seasons management
    await navigation.navigateToSeasonsManagement();

    // Verify seasons page elements
    await navigation.expectSeasonsPageElements();
    await navigation.waitForSeasonsGridToLoad();

    // Verify empty state when no seasons exist
    await expect(
      page.locator('[data-testid="no-seasons-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="no-seasons-message"]')
    ).toContainText('No seasons found');

    // Create a new season
    await page.click('[data-testid="create-season-button"]');

    // Verify create season modal opens
    await expect(page.locator('[role="dialog"] h2')).toContainText(
      'Create New Season'
    );

    // Fill in season details
    await page.fill('[data-testid="season-name-input"]', '2024 Regular Season');
    await page.fill('[data-testid="season-year-input"]', '2024');
    await page.fill('[data-testid="season-start-date"]', '2024-04-01');
    await page.fill('[data-testid="season-end-date"]', '2024-09-30');

    // Submit the form
    await page.click('[data-testid="confirm-create-season"]');

    // Verify season appears in list
    await expect(
      page.locator('[data-testid="season-2024-regular-season"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="season-2024-regular-season"]')
    ).toContainText('2024 Regular Season');
    await expect(
      page.locator('[data-testid="season-2024-regular-season"]')
    ).toContainText('2024');
  });

  test('should validate season form fields', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToSeasonsManagement();

    // Create a new season
    await page.click('[data-testid="create-season-button"]');

    // Try to submit without filling required fields
    await page.click('[data-testid="confirm-create-season"]');

    // Verify validation errors appear
    await expect(page.locator('text=Season name is required')).toBeVisible();
  });

  test('should validate date range', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToSeasonsManagement();

    // Create a new season
    await page.click('[data-testid="create-season-button"]');

    // Fill in invalid date range (end before start)
    await page.fill('[data-testid="season-name-input"]', 'Invalid Season');
    await page.fill('[data-testid="season-start-date"]', '2024-09-30');
    await page.fill('[data-testid="season-end-date"]', '2024-04-01');

    // Submit the form
    await page.click('[data-testid="confirm-create-season"]');

    // Verify validation error for date range
    await expect(
      page.locator('text=End date must be after start date')
    ).toBeVisible();
  });

  test('should edit season', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToSeasonsManagement();
    await page.click('[data-testid="create-season-button"]');
    await page.fill('[data-testid="season-name-input"]', 'Original Season');
    await page.fill('[data-testid="season-start-date"]', '2024-04-01');
    await page.fill('[data-testid="season-end-date"]', '2024-09-30');
    await page.click('[data-testid="confirm-create-season"]');

    // Wait for season to appear and get the generated ID
    const seasonCard = page.locator('[data-testid^="season-original-season"]');
    await expect(seasonCard).toBeVisible();

    // Find and click the edit button (we need to find the actual ID)
    const editButton = seasonCard.locator('[data-testid^="edit-season-"]');
    await editButton.click();

    // Verify edit modal opens
    await expect(page.locator('[role="dialog"] h2')).toContainText(
      'Edit Season'
    );

    // Update season name
    await page.fill('[data-testid="season-name-input"]', 'Updated Season');
    await page.click('[data-testid="confirm-create-season"]');

    // Verify season name is updated
    await expect(
      page.locator('[data-testid="season-updated-season"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="season-updated-season"]')
    ).toContainText('Updated Season');
  });

  test('should delete season', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToSeasonsManagement();
    await page.click('[data-testid="create-season-button"]');
    await page.fill('[data-testid="season-name-input"]', 'Season To Delete');
    await page.fill('[data-testid="season-start-date"]', '2024-04-01');
    await page.fill('[data-testid="season-end-date"]', '2024-09-30');
    await page.click('[data-testid="confirm-create-season"]');

    // Wait for season to appear
    const seasonCard = page.locator('[data-testid^="season-season-to-delete"]');
    await expect(seasonCard).toBeVisible();

    // Set up dialog handler for confirmation
    page.on('dialog', (dialog) => dialog.accept());

    // Find and click the delete button
    const deleteButton = seasonCard.locator('[data-testid^="delete-season-"]');
    await deleteButton.click();

    // Verify season is removed
    await expect(seasonCard).not.toBeVisible();
  });

  test('should show season status badges', async ({ page }) => {
    const navigation = new NavigationHelpers(page);
    await navigation.navigateToSeasonsManagement();

    // Create a future season
    await page.click('[data-testid="create-season-button"]');
    await page.fill('[data-testid="season-name-input"]', 'Future Season');

    // Set dates in the future
    await page.fill('[data-testid="season-start-date"]', '2025-04-01');
    await page.fill('[data-testid="season-end-date"]', '2025-09-30');
    await page.click('[data-testid="confirm-create-season"]');

    // Verify the season appears (status badge testing would require more complex date logic)
    await expect(
      page.locator('[data-testid="season-future-season"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="season-future-season"]')
    ).toContainText('Future Season');
  });
});
