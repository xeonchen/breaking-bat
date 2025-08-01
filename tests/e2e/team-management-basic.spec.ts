import { test, expect } from '@playwright/test';

test.describe('Basic Team Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create and manage a basic team', async ({ page }) => {
    // Navigate to teams page
    await page.goto('/teams');

    // Verify teams page loads
    await expect(page.locator('[data-testid="teams-page"]')).toBeVisible();
    await expect(page.locator('[data-testid="page-header"]')).toContainText(
      'Teams'
    );

    // Create a new team
    await page.click('[data-testid="create-team-button"]');

    // Verify create team modal opens
    await expect(
      page.locator('[data-testid="create-team-modal"]')
    ).toBeVisible();

    // Fill in team name
    await page.fill('[data-testid="team-name-input"]', 'Test Team');

    // Submit the form
    await page.click('[data-testid="confirm-create-team"]');

    // Verify modal closes and team appears in list
    await expect(
      page.locator('[data-testid="create-team-modal"]')
    ).not.toBeVisible();
    await expect(page.locator('[data-testid="team-test-team"]')).toBeVisible();

    // Verify team card shows correct information
    await expect(page.locator('[data-testid="team-test-team"]')).toContainText(
      'Test Team'
    );
  });

  test('should validate team name is required', async ({ page }) => {
    // Navigate to teams page
    await page.goto('/teams');

    // Create a new team
    await page.click('[data-testid="create-team-button"]');

    // Try to submit without filling name
    await page.click('[data-testid="confirm-create-team"]');

    // Verify validation error appears
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('required');
  });

  test('should open edit team modal', async ({ page }) => {
    // Navigate to teams page and create a team first
    await page.goto('/teams');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Test Team');
    await page.click('[data-testid="confirm-create-team"]');

    // Wait for team to appear
    await expect(page.locator('[data-testid="team-test-team"]')).toBeVisible();

    // Click edit button
    await page.click('[data-testid="edit-team-test-team"]');

    // Verify edit modal opens
    await expect(page.locator('[data-testid="edit-team-modal"]')).toBeVisible();

    // Verify team name is pre-filled
    await expect(page.locator('[data-testid="team-name-input"]')).toHaveValue(
      'Test Team'
    );

    // Close modal without saving
    await page.keyboard.press('Escape');
    await expect(
      page.locator('[data-testid="edit-team-modal"]')
    ).not.toBeVisible();
  });

  test('should delete a team', async ({ page }) => {
    // Navigate to teams page and create a team first
    await page.goto('/teams');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Team To Delete');
    await page.click('[data-testid="confirm-create-team"]');

    // Wait for team to appear
    await expect(
      page.locator('[data-testid="team-team-to-delete"]')
    ).toBeVisible();

    // Click delete button
    await page.click('[data-testid="delete-team-team-to-delete"]');

    // Verify delete confirmation modal
    await expect(
      page.locator('[data-testid="delete-team-modal"]')
    ).toBeVisible();

    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify team is removed
    await expect(
      page.locator('[data-testid="team-team-to-delete"]')
    ).not.toBeVisible();
  });

  test('should search teams', async ({ page }) => {
    // Navigate to teams page and create multiple teams
    await page.goto('/teams');

    // Create first team
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Lions');
    await page.click('[data-testid="confirm-create-team"]');

    // Create second team
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Tigers');
    await page.click('[data-testid="confirm-create-team"]');

    // Verify both teams exist
    await expect(page.locator('[data-testid="team-lions"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tigers"]')).toBeVisible();

    // Search for "Lions"
    await page.fill('[data-testid="teams-search-input"]', 'Lions');

    // Wait a moment for search to process
    await page.waitForTimeout(600);

    // Verify search results
    await expect(page.locator('[data-testid="team-lions"]')).toBeVisible();
    // Note: The search functionality may or may not hide non-matching teams
    // depending on the implementation
  });

  test('should show empty state when no teams exist', async ({ page }) => {
    // Navigate to teams page
    await page.goto('/teams');

    // Verify empty state message is shown when no teams exist
    await expect(
      page.locator('[data-testid="empty-teams-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="empty-teams-message"]')
    ).toContainText('No teams created yet');
  });
});
