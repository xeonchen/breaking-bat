import { test, expect } from '@playwright/test';

test.describe('Team and Player Management (@team-management:AC001-@roster-management:AC026)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create teams with team name and basic information (@team-management:AC001)', async ({
    page,
  }) => {
    // Given: Teams page
    await page.goto('/teams');
    await expect(page.locator('[data-testid="teams-page"]')).toBeVisible();

    // When: I create a new team with team name and basic information
    await page.click('[data-testid="create-team-button"]');
    await expect(
      page.locator('[data-testid="create-team-modal"]')
    ).toBeVisible();
    await page.fill('[data-testid="team-name-input"]', 'Test Team');
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

  test('should validate team name is required (@team-management:AC001)', async ({
    page,
  }) => {
    // Given: Teams page
    await page.goto('/teams');

    // When: I try to create a team without providing a name
    await page.click('[data-testid="create-team-button"]');
    await page.click('[data-testid="confirm-create-team"]');

    // Then: I should see a validation error
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="validation-error"]')
    ).toContainText('required');
  });

  test('should open edit team modal (@team-management:AC001)', async ({
    page,
  }) => {
    // Given: Teams page with an existing team
    await page.goto('/teams');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Test Team');
    await page.click('[data-testid="confirm-create-team"]');
    await expect(page.locator('[data-testid="team-test-team"]')).toBeVisible();

    // When: I click the edit button for a team
    await page.click('[data-testid="edit-team-test-team"]');

    // Then: The edit modal should open with pre-filled team information
    await expect(page.locator('[data-testid="edit-team-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-name-input"]')).toHaveValue(
      'Test Team'
    );

    // And: I should be able to close the modal without saving
    await page.keyboard.press('Escape');
    await expect(
      page.locator('[data-testid="edit-team-modal"]')
    ).not.toBeVisible();
  });

  test('should delete a team (@team-management:AC001)', async ({ page }) => {
    // Given: Teams page with an existing team
    await page.goto('/teams');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Team To Delete');
    await page.click('[data-testid="confirm-create-team"]');
    await expect(
      page.locator('[data-testid="team-team-to-delete"]')
    ).toBeVisible();

    // When: I click the delete button and confirm deletion
    await page.click('[data-testid="delete-team-team-to-delete"]');
    await expect(
      page.locator('[data-testid="delete-team-modal"]')
    ).toBeVisible();
    await page.click('[data-testid="confirm-delete-button"]');

    // Then: The team should be removed from the list
    await expect(
      page.locator('[data-testid="team-team-to-delete"]')
    ).not.toBeVisible();
  });

  test('should search teams (@team-management:AC001)', async ({ page }) => {
    // Given: Teams page with multiple teams
    await page.goto('/teams');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Lions');
    await page.click('[data-testid="confirm-create-team"]');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Tigers');
    await page.click('[data-testid="confirm-create-team"]');
    await expect(page.locator('[data-testid="team-lions"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tigers"]')).toBeVisible();

    // When: I search for a specific team name
    await page.fill('[data-testid="teams-search-input"]', 'Lions');
    await page.waitForTimeout(600);

    // Then: The matching team should remain visible
    await expect(page.locator('[data-testid="team-lions"]')).toBeVisible();
  });

  test('should show empty state when no teams exist (@team-management:AC001)', async ({
    page,
  }) => {
    // Given: Teams page with no teams created
    await page.goto('/teams');

    // Then: I should see an empty state message
    await expect(
      page.locator('[data-testid="empty-teams-message"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="empty-teams-message"]')
    ).toContainText('No teams created yet');
  });
});
