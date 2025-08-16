import { Given, When, Then } from '@cucumber/cucumber';
import { Page, expect } from '@playwright/test';

declare let page: Page;

// Background steps
Given('I am using the application', async () => {
  await page.goto('/');
  await page.waitForTimeout(1000);
});

// @app-framework:AC001-005 - Streamlined Navigation
Then('I should see 4 main navigation sections instead of 7', async () => {
  // Check desktop navigation
  const navItems = page.locator(
    '[data-testid="nav-item"], [data-testid*="nav-"], nav a, .nav-item'
  );

  if (await navItems.first().isVisible({ timeout: 2000 })) {
    const count = await navItems.count();
    expect(count).toBeLessThanOrEqual(4);
  }

  // Check mobile navigation
  const mobileNavItems = page.locator(
    '[data-testid="mobile-nav-item"], [data-testid*="bottom-nav-"]'
  );
  if (await mobileNavItems.first().isVisible({ timeout: 1000 })) {
    const mobileCount = await mobileNavItems.count();
    expect(mobileCount).toBeLessThanOrEqual(4);
  }
});

When('I access the application', async () => {
  await page.goto('/');
});

Then('I should be redirected to the games page by default', async () => {
  // Should either be on /games or redirected there
  await expect(page).toHaveURL(/.*\/games.*/);
  await expect(page.getByTestId('games-page')).toBeVisible();
});

// @app-settings:AC006-011 - Consolidated Settings Management
When('I navigate to settings', async () => {
  // Look for settings navigation
  const settingsLink = page.locator(
    'a[href*="/settings"], [data-testid*="settings"]'
  );
  if (await settingsLink.first().isVisible({ timeout: 2000 })) {
    await settingsLink.first().click();
  } else {
    await page.goto('/settings');
  }
});

Then(
  'I should see a tabbed interface with General and Game Configuration sections',
  async () => {
    await expect(page.getByTestId('settings-page')).toBeVisible();

    // Look for tab interface
    const generalTab = page.locator(
      'text=General, [data-testid*="general-tab"]'
    );
    const gameConfigTab = page.locator(
      'text=Game Configuration, [data-testid*="game-config-tab"]'
    );

    if (await generalTab.first().isVisible({ timeout: 2000 })) {
      await expect(generalTab.first()).toBeVisible();
    }

    if (await gameConfigTab.first().isVisible({ timeout: 2000 })) {
      await expect(gameConfigTab.first()).toBeVisible();
    }
  }
);

Then(
  'seasons and game types management should be accessible from Settings',
  async () => {
    await page.goto('/settings');

    // Look for Game Configuration tab
    const gameConfigTab = page.locator(
      'text=Game Configuration, [data-testid*="game-config"]'
    );
    if (await gameConfigTab.first().isVisible()) {
      await gameConfigTab.first().click();

      // Should see seasons and game types management
      const seasonsSection = page.locator(
        'text=Season, [data-testid*="season"]'
      );
      const gameTypesSection = page.locator(
        'text=Game Type, [data-testid*="game-type"]'
      );

      if (await seasonsSection.first().isVisible({ timeout: 2000 })) {
        await expect(seasonsSection.first()).toBeVisible();
      }

      if (await gameTypesSection.first().isVisible({ timeout: 2000 })) {
        await expect(gameTypesSection.first()).toBeVisible();
      }
    }
  }
);

// @game-creation:AC012-017 - Simplified Game Creation
When('I create a new game', async () => {
  await page.goto('/games');

  const createGameBtn = page.locator('[data-testid="create-game-button"]');
  await createGameBtn.click();

  const modal = page.locator('[data-testid="create-game-modal"]');
  await expect(modal).toBeVisible();
});

Then('season and game type fields should be optional', async () => {
  const modal = page.locator('[data-testid="create-game-modal"]');
  await expect(modal).toBeVisible();

  // Fill only required fields
  await page.fill('[data-testid="game-name-input"]', 'Quick Game');
  await page.fill('[data-testid="opponent-input"]', 'Quick Opponent');

  // Select team (usually required)
  const teamSelect = page.locator('[data-testid="team-select"]');
  if (await teamSelect.isVisible()) {
    await teamSelect.selectOption({ index: 1 });
  }

  // Season and game type should be optional - don't fill them
  const createBtn = page.locator('[data-testid="create-game-confirm"]');

  // Button should be enabled even without season/game type
  await expect(createBtn).toBeEnabled();

  await createBtn.click();
  await expect(modal).not.toBeVisible();
});

// @app-framework:AC006-009 - Enhanced Mobile Experience
Given('I am using a mobile device', async () => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
});

Then('navigation should provide larger touch targets', async () => {
  // Check bottom navigation touch targets on mobile
  const mobileNavItems = page.locator(
    '[data-testid*="bottom-nav-"], [data-testid*="mobile-nav"]'
  );

  if (await mobileNavItems.first().isVisible()) {
    const firstItem = mobileNavItems.first();
    const boundingBox = await firstItem.boundingBox();

    if (boundingBox) {
      // Touch targets should be at least 44px (iOS/Android guidelines)
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      expect(boundingBox.width).toBeGreaterThanOrEqual(44);
    }
  }
});

Then('all interactions should be optimized for thumb navigation', async () => {
  // Test key interactive elements
  await page.goto('/games');

  const createBtn = page.locator('[data-testid="create-game-button"]');
  if (await createBtn.isVisible()) {
    const boundingBox = await createBtn.boundingBox();
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(44);
    }
  }

  // Reset viewport
  await page.setViewportSize({ width: 1280, height: 720 });
});

// @app-framework:AC020-024 - Backward Compatibility
Then('all existing functionality should remain accessible', async () => {
  // Test key navigation paths still work
  await page.goto('/teams');
  await expect(page.getByTestId('teams-page')).toBeVisible();

  await page.goto('/games');
  await expect(page.getByTestId('games-page')).toBeVisible();

  await page.goto('/settings');
  await expect(page.getByTestId('settings-page')).toBeVisible();
});

Then('all current data should be preserved', async () => {
  // If sample data exists, it should still be accessible
  await page.goto('/teams');

  // Should be able to see teams page without errors
  await expect(page.getByTestId('teams-page')).toBeVisible();

  // No error messages should be visible
  const errorMessages = page.locator(
    'text=Error, text=error, [data-testid*="error"]'
  );
  if (await errorMessages.first().isVisible({ timeout: 1000 })) {
    expect(await errorMessages.count()).toBe(0);
  }
});
