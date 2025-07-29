import { test, expect } from '@playwright/test';

test.describe('Data Persistence and Export User Story', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('User Story: Export and import data for backup and analysis purposes', async ({
    page,
  }) => {
    // As a League Administrator
    // I want to export and import data for backup and analysis purposes
    // So that I can maintain historical records and perform cross-season analysis

    // Create comprehensive test data
    await page.click('[data-testid="teams-tab"]');

    // Create multiple teams
    const teams = ['Lions', 'Tigers', 'Bears'];
    for (const teamName of teams) {
      await page.click('[data-testid="create-team-button"]');
      await page.fill('[data-testid="team-name-input"]', teamName);
      await page.click('[data-testid="confirm-create-team"]');

      // Add players to each team
      await page.click(`[data-testid="team-${teamName.toLowerCase()}"]`);
      await page.click('[data-testid="manage-roster-button"]');

      for (let i = 1; i <= 5; i++) {
        await page.click('[data-testid="add-player-button"]');
        await page.fill(
          '[data-testid="player-name-input"]',
          `${teamName} Player ${i}`
        );
        await page.fill('[data-testid="player-jersey-input"]', `${i}`);
        await page.click('[data-testid="confirm-add-player"]');
      }

      await page.click('[data-testid="back-to-teams"]');
    }

    // Create seasons
    await page.click('[data-testid="seasons-tab"]');
    const seasons = ['2023 Regular Season', '2024 Regular Season'];
    for (const seasonName of seasons) {
      await page.click('[data-testid="create-season-button"]');
      await page.fill('[data-testid="season-name-input"]', seasonName);
      await page.fill(
        '[data-testid="season-start-date"]',
        seasonName.includes('2023') ? '2023-04-01' : '2024-04-01'
      );
      await page.fill(
        '[data-testid="season-end-date"]',
        seasonName.includes('2023') ? '2023-09-30' : '2024-09-30'
      );
      await page.click('[data-testid="confirm-create-season"]');
    }

    // Create games with complete statistics
    await page.click('[data-testid="games-tab"]');
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="create-game-button"]');
      await page.fill('[data-testid="game-name-input"]', `Game ${i}`);
      await page.fill('[data-testid="opponent-input"]', `Opponent ${i}`);
      await page.fill('[data-testid="game-date-input"]', '2024-05-15');
      await page.selectOption('[data-testid="team-select"]', 'Lions');
      await page.click('[data-testid="confirm-create-game"]');
    }

    // Test: Full data export functionality
    await page.click('[data-testid="data-management-tab"]');
    await expect(
      page.locator('[data-testid="data-export-section"]')
    ).toBeVisible();

    // Test: Export options are available
    await expect(page.locator('[data-testid="export-all-data"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="export-teams-only"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="export-games-only"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="export-statistics-only"]')
    ).toBeVisible();

    // Test: Export all data
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-all-data"]');
    await page.click('[data-testid="confirm-export"]');

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
      /breaking-bat-full-export-\d{4}-\d{2}-\d{2}\.json/
    );

    // Verify export contains all data types
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Test: Preview export contents before download
    await page.click('[data-testid="preview-export"]');
    await expect(
      page.locator('[data-testid="export-preview-modal"]')
    ).toBeVisible();

    // Verify preview shows data summary
    await expect(
      page.locator('[data-testid="preview-teams-count"]')
    ).toContainText('3 teams');
    await expect(
      page.locator('[data-testid="preview-players-count"]')
    ).toContainText('15 players');
    await expect(
      page.locator('[data-testid="preview-seasons-count"]')
    ).toContainText('2 seasons');
    await expect(
      page.locator('[data-testid="preview-games-count"]')
    ).toContainText('3 games');

    await page.click('[data-testid="close-preview"]');

    // Test: Selective export - teams only
    const teamsDownloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-teams-only"]');
    await page.click('[data-testid="confirm-export"]');

    const teamsDownload = await teamsDownloadPromise;
    expect(teamsDownload.suggestedFilename()).toMatch(
      /breaking-bat-teams-export-\d{4}-\d{2}-\d{2}\.json/
    );

    // Test: Data import functionality
    await expect(
      page.locator('[data-testid="data-import-section"]')
    ).toBeVisible();

    // Clear existing data for import test
    await page.click('[data-testid="clear-all-data"]');
    await page.fill('[data-testid="confirm-clear-input"]', 'DELETE ALL DATA');
    await page.click('[data-testid="confirm-clear-all"]');

    // Verify data is cleared
    await page.click('[data-testid="teams-tab"]');
    await expect(
      page.locator('[data-testid="no-teams-message"]')
    ).toBeVisible();

    // Test: Import previously exported data
    await page.click('[data-testid="data-management-tab"]');

    // Simulate file selection for import
    await page.setInputFiles('[data-testid="import-file-input"]', downloadPath);
    await page.click('[data-testid="start-import"]');

    // Verify import progress
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="import-status"]')).toContainText(
      'Importing teams...'
    );

    // Wait for import completion
    await expect(page.locator('[data-testid="import-complete"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('[data-testid="import-summary"]')).toContainText(
      'Successfully imported 3 teams, 15 players, 2 seasons, 3 games'
    );

    // Test: Verify imported data integrity
    await page.click('[data-testid="teams-tab"]');
    await expect(page.locator('[data-testid="team-lions"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-tigers"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-bears"]')).toBeVisible();

    // Verify player data integrity
    await page.click('[data-testid="team-lions"]');
    await page.click('[data-testid="manage-roster-button"]');

    for (let i = 1; i <= 5; i++) {
      await expect(
        page.locator(`[data-testid="player-lions-player-${i}"]`)
      ).toBeVisible();
    }

    // Test: Verify seasons and games imported
    await page.click('[data-testid="seasons-tab"]');
    await expect(
      page.locator('[data-testid="season-2023-regular-season"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="season-2024-regular-season"]')
    ).toBeVisible();

    await page.click('[data-testid="games-tab"]');
    await expect(page.locator('[data-testid="game-game-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-game-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="game-game-3"]')).toBeVisible();
  });

  test('Data persistence across browser sessions', async ({ page }) => {
    // Create test data
    await page.click('[data-testid="teams-tab"]');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Persistent Team');
    await page.click('[data-testid="confirm-create-team"]');

    // Add detailed data
    await page.click('[data-testid="team-persistent-team"]');
    await page.click('[data-testid="manage-roster-button"]');
    await page.click('[data-testid="add-player-button"]');
    await page.fill('[data-testid="player-name-input"]', 'Test Player');
    await page.fill('[data-testid="player-jersey-input"]', '42');
    await page.click('[data-testid="confirm-add-player"]');

    // Create a game with statistics
    await page.click('[data-testid="games-tab"]');
    await page.click('[data-testid="create-game-button"]');
    await page.fill('[data-testid="game-name-input"]', 'Persistence Test Game');
    await page.fill('[data-testid="opponent-input"]', 'Test Opponent');
    await page.selectOption('[data-testid="team-select"]', 'Persistent Team');
    await page.click('[data-testid="confirm-create-game"]');

    // Test: Data persists after page reload
    await page.reload();
    await page.click('[data-testid="teams-tab"]');
    await expect(
      page.locator('[data-testid="team-persistent-team"]')
    ).toBeVisible();

    // Test: Data persists after browser restart (simulate with new context)
    const newPage = await page.context().newPage();
    await newPage.goto('/');

    await newPage.click('[data-testid="teams-tab"]');
    await expect(
      newPage.locator('[data-testid="team-persistent-team"]')
    ).toBeVisible();

    await newPage.click('[data-testid="team-persistent-team"]');
    await newPage.click('[data-testid="manage-roster-button"]');
    await expect(
      newPage.locator('[data-testid="player-test-player"]')
    ).toBeVisible();

    await newPage.click('[data-testid="games-tab"]');
    await expect(
      newPage.locator('[data-testid="game-persistence-test-game"]')
    ).toBeVisible();
  });

  test('Advanced export and filtering options', async ({ page }) => {
    // Create test data with dates
    await page.click('[data-testid="teams-tab"]');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Export Team');
    await page.click('[data-testid="confirm-create-team"]');

    // Create games with different dates
    await page.click('[data-testid="games-tab"]');
    const gameDates = ['2024-01-15', '2024-06-15', '2024-12-15'];

    for (let i = 0; i < gameDates.length; i++) {
      await page.click('[data-testid="create-game-button"]');
      await page.fill(
        '[data-testid="game-name-input"]',
        `Date Test Game ${i + 1}`
      );
      await page.fill('[data-testid="opponent-input"]', `Opponent ${i + 1}`);
      await page.fill('[data-testid="game-date-input"]', gameDates[i]);
      await page.selectOption('[data-testid="team-select"]', 'Export Team');
      await page.click('[data-testid="confirm-create-game"]');
    }

    // Test: Date range export filtering
    await page.click('[data-testid="data-management-tab"]');
    await page.click('[data-testid="advanced-export-options"]');

    await page.fill('[data-testid="export-start-date"]', '2024-01-01');
    await page.fill('[data-testid="export-end-date"]', '2024-06-30');

    const filteredDownloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-filtered-data"]');

    const filteredDownload = await filteredDownloadPromise;
    expect(filteredDownload.suggestedFilename()).toMatch(
      /breaking-bat-filtered-export-\d{4}-\d{2}-\d{2}\.json/
    );

    // Test: Team-specific export
    await page.selectOption(
      '[data-testid="export-team-filter"]',
      'Export Team'
    );

    const teamDownloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-team-specific"]');

    const teamDownload = await teamDownloadPromise;
    expect(teamDownload.suggestedFilename()).toMatch(
      /breaking-bat-export-team-.*\.json/
    );
  });

  test('Import validation and error handling', async ({ page }) => {
    await page.click('[data-testid="data-management-tab"]');

    // Test: Invalid file format handling
    await page.setInputFiles('[data-testid="import-file-input"]', {
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('invalid data'),
    });

    await page.click('[data-testid="start-import"]');
    await expect(page.locator('[data-testid="import-error"]')).toContainText(
      'Invalid file format'
    );

    // Test: Corrupted JSON handling
    await page.setInputFiles('[data-testid="import-file-input"]', {
      name: 'corrupted.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"invalid": json}'),
    });

    await page.click('[data-testid="start-import"]');
    await expect(page.locator('[data-testid="import-error"]')).toContainText(
      'File contains invalid JSON'
    );

    // Test: Valid JSON but wrong structure
    await page.setInputFiles('[data-testid="import-file-input"]', {
      name: 'wrong-structure.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"someOtherApp": "data"}'),
    });

    await page.click('[data-testid="start-import"]');
    await expect(page.locator('[data-testid="import-error"]')).toContainText(
      'File does not contain valid breaking-bat data'
    );

    // Test: Version compatibility check
    await page.setInputFiles('[data-testid="import-file-input"]', {
      name: 'old-version.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"version": "0.5.0", "teams": []}'),
    });

    await page.click('[data-testid="start-import"]');
    await expect(page.locator('[data-testid="version-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="version-warning"]')).toContainText(
      'This data was exported from an older version'
    );

    // Should offer migration option
    await expect(page.locator('[data-testid="migrate-data"]')).toBeVisible();
    await page.click('[data-testid="migrate-data"]');
    await expect(
      page.locator('[data-testid="migration-progress"]')
    ).toBeVisible();
  });

  test('Automated backup and data integrity', async ({ page }) => {
    // Test: Automatic backup creation
    await page.click('[data-testid="settings-tab"]');
    await page.click('[data-testid="data-settings"]');

    // Enable automatic backups
    await page.check('[data-testid="enable-auto-backup"]');
    await page.selectOption('[data-testid="backup-frequency"]', 'daily');
    await page.click('[data-testid="save-backup-settings"]');

    // Test: Manual backup trigger
    await page.click('[data-testid="create-backup-now"]');
    await expect(page.locator('[data-testid="backup-created"]')).toBeVisible();
    await expect(page.locator('[data-testid="backup-created"]')).toContainText(
      'Backup created successfully'
    );

    // Test: View backup history
    await page.click('[data-testid="view-backup-history"]');
    await expect(
      page.locator('[data-testid="backup-history-modal"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="backup-list"]')).toBeVisible();

    // Should show at least one backup
    await expect(page.locator('[data-testid="backup-item"]')).toHaveCount(1);

    // Test: Data integrity check
    await page.click('[data-testid="run-integrity-check"]');
    await expect(
      page.locator('[data-testid="integrity-check-progress"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="integrity-check-complete"]')
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator('[data-testid="integrity-result"]')
    ).toContainText('Data integrity verified');

    // Test: Restore from backup
    await page.click(
      '[data-testid="backup-item"]:first-child [data-testid="restore-backup"]'
    );
    await page.fill('[data-testid="confirm-restore-input"]', 'RESTORE BACKUP');
    await page.click('[data-testid="confirm-restore"]');

    await expect(
      page.locator('[data-testid="restore-progress"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="restore-complete"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('Cross-platform data compatibility', async ({ page }) => {
    // Create comprehensive dataset
    await page.click('[data-testid="teams-tab"]');
    await page.click('[data-testid="create-team-button"]');
    await page.fill('[data-testid="team-name-input"]', 'Cross Platform Team');
    await page.click('[data-testid="confirm-create-team"]');

    // Export data
    await page.click('[data-testid="data-management-tab"]');
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-all-data"]');
    await page.click('[data-testid="confirm-export"]');

    const download = await downloadPromise;
    const downloadPath = await download.path();

    // Test: Cross-browser compatibility verification
    await page.click('[data-testid="verify-compatibility"]');
    await page.setInputFiles(
      '[data-testid="compatibility-file-input"]',
      downloadPath
    );
    await page.click('[data-testid="run-compatibility-check"]');

    await expect(
      page.locator('[data-testid="compatibility-result"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="compatibility-result"]')
    ).toContainText('Data is compatible with all supported platforms');

    // Test: Format validation
    await expect(
      page.locator('[data-testid="format-validation"]')
    ).toContainText('✓ JSON structure valid');
    await expect(
      page.locator('[data-testid="format-validation"]')
    ).toContainText('✓ Character encoding compatible');
    await expect(
      page.locator('[data-testid="format-validation"]')
    ).toContainText('✓ Date formats standardized');
  });
});
