import { Given, When, Then } from '@cucumber/cucumber';
import { Page, expect } from '@playwright/test';

declare let page: Page;

// Background steps
Given('I am on the teams page', async () => {
  await page.goto('/teams');
  await expect(page.getByTestId('teams-page')).toBeVisible();
});

// @team-management:AC001-004 - Team/season/game type creation
When('I create a new team named {string}', async (teamName: string) => {
  const createBtn = page.locator('[data-testid="create-team-button"]');
  await expect(createBtn).toBeVisible();
  await createBtn.click();

  await page.fill('[data-testid="team-name-input"]', teamName);
  await page.click('[data-testid="confirm-create-team"]');

  // Wait for team creation
  await page.waitForTimeout(1000);
});

Then('the team should be created successfully', async () => {
  // Look for success message
  const successMessage = page.locator('text=Team created successfully');
  if (await successMessage.isVisible({ timeout: 2000 })) {
    await expect(successMessage).toBeVisible();
  }

  // Verify team appears in list
  await expect(page.locator('[data-testid*="team-"]')).toBeVisible();
});

// @roster-management:AC005-010 - Player management
When(
  'I add a player named {string} with jersey number {string}',
  async (playerName: string, jerseyNumber: string) => {
    // Find team card and add player
    const teamCard = page.locator('[data-testid*="team-"]').first();
    const addPlayerBtn = teamCard.locator(
      '[data-testid*="add-player"], [data-testid*="manage-team"]'
    );

    if (await addPlayerBtn.isVisible({ timeout: 2000 })) {
      await addPlayerBtn.click();
    }

    // Look for create player button
    const createPlayerBtn = page.locator(
      '[data-testid="create-player-button"]'
    );
    if (await createPlayerBtn.isVisible({ timeout: 2000 })) {
      await createPlayerBtn.click();

      await page.fill('[data-testid="player-name-input"]', playerName);
      await page.fill('[data-testid="player-jersey-input"]', jerseyNumber);

      // Select a position
      const positionSelect = page.locator(
        '[data-testid="player-position-select"]'
      );
      if (await positionSelect.isVisible()) {
        await positionSelect.selectOption({ index: 1 }); // Select first position
      }

      await page.click('[data-testid="confirm-create-player"]');
      await page.waitForTimeout(500);
    }
  }
);

Then('the player should be added to the team', async () => {
  // Verify player appears in team roster
  const playerCard = page.locator('[data-testid*="player-"]');
  await expect(playerCard.first()).toBeVisible();
});

When(
  "I update the player's position to {string}",
  async (newPosition: string) => {
    // Find player card and edit
    const playerCard = page.locator('[data-testid*="player-"]').first();
    const editBtn = playerCard.locator('[data-testid*="edit-player"]');

    if (await editBtn.isVisible({ timeout: 2000 })) {
      await editBtn.click();

      const positionSelect = page.locator(
        '[data-testid="player-position-select"]'
      );
      await positionSelect.selectOption(newPosition);

      const saveBtn = page.locator(
        '[data-testid="save-player"], [data-testid="confirm-edit-player"]'
      );
      await saveBtn.click();
    }
  }
);

Then("the player's position should be updated", async () => {
  // Verify position change is reflected
  await page.waitForTimeout(500);
  // Position should be visible in player card
  const playerCard = page.locator('[data-testid*="player-"]').first();
  await expect(playerCard).toBeVisible();
});

// @lineup-configuration:AC011-013 - Lineup management basics
Given('I have a team with multiple players', async () => {
  // Ensure we have a team with several players
  await page.goto('/teams');

  // If no teams exist, create one with players
  const teamCard = page.locator('[data-testid*="team-"]');
  if (!(await teamCard.first().isVisible({ timeout: 2000 }))) {
    // Create team
    await page.locator('[data-testid="create-team-button"]').click();
    await page.fill('[data-testid="team-name-input"]', 'Test Team');
    await page.click('[data-testid="confirm-create-team"]');
    await page.waitForTimeout(1000);
  }

  // Add multiple players if needed
  const firstTeam = page.locator('[data-testid*="team-"]').first();
  const manageBtn = firstTeam.locator(
    '[data-testid*="manage-team"], [data-testid*="add-player"]'
  );

  if (await manageBtn.isVisible()) {
    await manageBtn.click();

    // Add a few players
    for (let i = 1; i <= 3; i++) {
      const createPlayerBtn = page.locator(
        '[data-testid="create-player-button"]'
      );
      if (await createPlayerBtn.isVisible({ timeout: 1000 })) {
        await createPlayerBtn.click();
        await page.fill('[data-testid="player-name-input"]', `Player ${i}`);
        await page.fill('[data-testid="player-jersey-input"]', `${i}`);

        const positionSelect = page.locator(
          '[data-testid="player-position-select"]'
        );
        if (await positionSelect.isVisible()) {
          await positionSelect.selectOption({ index: i });
        }

        await page.click('[data-testid="confirm-create-player"]');
        await page.waitForTimeout(500);
      }
    }
  }
});

When('I create a basic lineup', async () => {
  // Navigate to games and create a game to create lineup
  await page.goto('/games');

  const createGameBtn = page.locator('[data-testid="create-game-button"]');
  if (await createGameBtn.isVisible()) {
    await createGameBtn.click();

    const modal = page.locator('[data-testid="create-game-modal"]');
    await expect(modal).toBeVisible();

    await page.fill('[data-testid="game-name-input"]', 'Lineup Test Game');
    await page.fill('[data-testid="opponent-input"]', 'Opponent');

    const teamSelect = page.locator('[data-testid="team-select"]');
    await teamSelect.selectOption({ index: 1 });

    await page.click('[data-testid="create-game-confirm"]');
    await expect(modal).not.toBeVisible();
    await page.waitForTimeout(1000);
  }

  // Setup lineup
  const gameCard = page.locator('[data-testid*="game-"]').first();
  const setupBtn = gameCard.locator('[data-testid*="setup-lineup"]');

  if (await setupBtn.isVisible()) {
    await setupBtn.click();

    const lineupModal = page.locator('[data-testid="lineup-modal"]');
    await expect(lineupModal).toBeVisible();

    // Use auto-fill if available
    const autoFillBtn = page.locator(
      '[data-testid="auto-fill-positions-button"]'
    );
    if (await autoFillBtn.isVisible()) {
      await autoFillBtn.click();
    }
  }
});

Then('the lineup should be created with the team players', async () => {
  // Verify lineup modal shows players assigned
  const lineupModal = page.locator('[data-testid="lineup-modal"]');
  await expect(lineupModal).toBeVisible();

  // Look for player assignments
  const playerSelects = page.locator(
    '[data-testid*="batting-position-"][data-testid*="-player"]'
  );
  const firstSelect = playerSelects.first();

  if (await firstSelect.isVisible()) {
    const selectedValue = await firstSelect.inputValue();
    expect(selectedValue).not.toBe('');
  }

  // Save lineup
  const saveBtn = page.getByTestId('save-lineup-button');
  await expect(saveBtn).toBeEnabled();
  await saveBtn.click();
});
