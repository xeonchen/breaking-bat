import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import 'fake-indexeddb/auto';
import { LoadDefaultDataUseCase } from '@/application/use-cases/LoadDefaultDataUseCase';
import { IndexedDBSeasonRepository } from '../IndexedDBSeasonRepository';
import { IndexedDBTeamRepository } from '../IndexedDBTeamRepository';
import { IndexedDBPlayerRepository } from '../IndexedDBPlayerRepository';
import { IndexedDBGameTypeRepository } from '../IndexedDBGameTypeRepository';
import { getDatabase } from '../../database/connection';

describe('LoadDefaultDataUseCase Integration with Compound Index', () => {
  let useCase: LoadDefaultDataUseCase;
  let teamRepository: IndexedDBTeamRepository;
  let playerRepository: IndexedDBPlayerRepository;
  let seasonRepository: IndexedDBSeasonRepository;
  let gameTypeRepository: IndexedDBGameTypeRepository;
  let testDb: any;

  beforeEach(async () => {
    // Initialize repositories
    teamRepository = new IndexedDBTeamRepository();
    playerRepository = new IndexedDBPlayerRepository();
    seasonRepository = new IndexedDBSeasonRepository();
    gameTypeRepository = new IndexedDBGameTypeRepository();

    // Initialize use case
    useCase = new LoadDefaultDataUseCase(
      teamRepository,
      playerRepository,
      seasonRepository,
      gameTypeRepository
    );

    testDb = getDatabase();
    await testDb.open();
  });

  afterEach(async () => {
    if (testDb) {
      await testDb.delete();
    }
  });

  it('should successfully load sample data without IndexedDB compound index errors', async () => {
    // This test reproduces the exact scenario that was failing before the fix
    // It should succeed now that we have the [name+year] compound index

    const result = await useCase.execute();

    // Should succeed without the KeyPath [name+year] error
    expect(result.isSuccess).toBe(true);
    expect(result.value).toBeDefined();

    if (result.value) {
      // Verify expected data was created
      expect(result.value.teamsCreated).toBe(3);
      expect(result.value.playersCreated).toBe(33);
      expect(result.value.seasonsCreated).toBe(3);
      expect(result.value.gameTypesCreated).toBe(5);

      // Verify the message contains the expected information
      expect(result.value.message).toContain('3 teams with 33 MLB players');
      expect(result.value.message).toContain('3 seasons');
      expect(result.value.message).toContain('5 game types');
    }

    // Verify that seasons were actually saved and can be queried using compound index
    const allSeasons = await seasonRepository.findAll();
    expect(allSeasons).toHaveLength(3);

    // Test the compound index query that was failing before
    const springExists = await seasonRepository.existsByNameAndYear(
      '2025 Spring Season',
      2025
    );
    expect(springExists).toBe(true);

    const summerExists = await seasonRepository.existsByNameAndYear(
      '2025 Summer Season',
      2025
    );
    expect(summerExists).toBe(true);

    const fallExists = await seasonRepository.existsByNameAndYear(
      '2025 Fall Season',
      2025
    );
    expect(fallExists).toBe(true);

    // Test non-existent combination
    const nonExistent = await seasonRepository.existsByNameAndYear(
      '2025 Winter Season',
      2025
    );
    expect(nonExistent).toBe(false);
  });

  it('should prevent duplicate seasons using compound index', async () => {
    // Run the use case twice - should not create duplicates
    const result1 = await useCase.execute();
    expect(result1.isSuccess).toBe(true);

    const result2 = await useCase.execute();
    expect(result2.isSuccess).toBe(true);

    // Should still have only 3 seasons (no duplicates)
    const allSeasons = await seasonRepository.findAll();
    expect(allSeasons).toHaveLength(3);

    // Compound index queries should still work
    const springExists = await seasonRepository.existsByNameAndYear(
      '2025 Spring Season',
      2025
    );
    expect(springExists).toBe(true);
  });

  it('should handle different year seasons correctly with compound index', async () => {
    // Load default data (creates 2025 seasons)
    await useCase.execute();

    // Manually create a 2024 season with same name
    await seasonRepository.save(
      new (await import('@/domain/entities')).Season(
        'test-season-2024',
        '2025 Spring Season', // Same name as default data
        2024, // Different year
        new Date('2024-03-01'),
        new Date('2024-05-31')
      )
    );

    // Both should exist but be distinguished by compound index
    const exists2025 = await seasonRepository.existsByNameAndYear(
      '2025 Spring Season',
      2025
    );
    const exists2024 = await seasonRepository.existsByNameAndYear(
      '2025 Spring Season',
      2024
    );

    expect(exists2025).toBe(true);
    expect(exists2024).toBe(true);

    // Should have 4 total seasons now (3 from default + 1 added)
    const allSeasons = await seasonRepository.findAll();
    expect(allSeasons).toHaveLength(4);
  });
});
