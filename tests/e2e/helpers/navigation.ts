import { Page, expect } from '@playwright/test';

export class NavigationHelpers {
  constructor(private page: Page) {}

  async navigateToSeasonsManagement() {
    // Navigate to Settings page
    await this.page.goto('/settings');
    await expect(
      this.page.locator('[data-testid="settings-page"]')
    ).toBeVisible();

    // Click on Game Configuration tab
    await this.page.click('[data-testid="game-config-tab"]');

    // Wait for seasons section to be visible
    await expect(
      this.page.locator('[data-testid="seasons-section"]')
    ).toBeVisible();

    return this;
  }

  async navigateToGameTypesManagement() {
    // Navigate to Settings page
    await this.page.goto('/settings');
    await expect(
      this.page.locator('[data-testid="settings-page"]')
    ).toBeVisible();

    // Click on Game Configuration tab
    await this.page.click('[data-testid="game-config-tab"]');

    // Wait for game types section to be visible
    await expect(
      this.page.locator('[data-testid="game-types-section"]')
    ).toBeVisible();

    return this;
  }

  async waitForSeasonsGridToLoad() {
    // Wait for either the no seasons message or the seasons grid to be visible
    await Promise.race([
      expect(
        this.page.locator('[data-testid="no-seasons-message"]')
      ).toBeVisible(),
      expect(this.page.locator('[data-testid="seasons-grid"]')).toBeVisible(),
    ]);

    return this;
  }

  async waitForGameTypesGridToLoad() {
    // Wait for either the no game types message or the game types grid to be visible
    await Promise.race([
      expect(
        this.page.locator('[data-testid="no-game-types-message"]')
      ).toBeVisible(),
      expect(
        this.page.locator('[data-testid="game-types-grid"]')
      ).toBeVisible(),
    ]);

    return this;
  }

  async expectSeasonsPageElements() {
    await expect(
      this.page.locator('[data-testid="seasons-section"]')
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="seasons-section"] h2')
    ).toContainText('Seasons');

    return this;
  }

  async expectGameTypesPageElements() {
    await expect(
      this.page.locator('[data-testid="game-types-section"]')
    ).toBeVisible();
    await expect(
      this.page.locator('[data-testid="game-types-section"] h2')
    ).toContainText('Game Types');

    return this;
  }
}
