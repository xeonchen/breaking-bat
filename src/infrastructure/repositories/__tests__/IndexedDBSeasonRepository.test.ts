import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import 'fake-indexeddb/auto';
import { IndexedDBSeasonRepository } from '../IndexedDBSeasonRepository';
import { Season } from '@/domain/entities';
import { getDatabase } from '../../database/connection';

describe('IndexedDBSeasonRepository', () => {
  let repository: IndexedDBSeasonRepository;
  let testDb: any;

  beforeEach(async () => {
    repository = new IndexedDBSeasonRepository();
    testDb = getDatabase();
    await testDb.open();
  });

  afterEach(async () => {
    if (testDb) {
      await testDb.delete();
    }
  });

  describe('Compound Index Requirements', () => {
    it('should support compound index queries on [name+year]', async () => {
      // Create test seasons
      const season1 = new Season(
        'season-1',
        'Spring Season',
        2025,
        new Date('2025-03-01'),
        new Date('2025-05-31')
      );

      const season2 = new Season(
        'season-2',
        'Summer Season',
        2025,
        new Date('2025-06-01'),
        new Date('2025-08-31')
      );

      const season3 = new Season(
        'season-3',
        'Spring Season',
        2024,
        new Date('2024-03-01'),
        new Date('2024-05-31')
      );

      // Save all seasons
      await repository.save(season1);
      await repository.save(season2);
      await repository.save(season3);

      // This test should FAIL initially because the compound index [name+year] doesn't exist
      // The existsByNameAndYear method tries to use this compound index

      // Test case 1: Should find season with name "Spring Season" and year 2025
      const exists2025 = await repository.existsByNameAndYear(
        'Spring Season',
        2025
      );
      expect(exists2025).toBe(true);

      // Test case 2: Should find season with name "Spring Season" and year 2024
      const exists2024 = await repository.existsByNameAndYear(
        'Spring Season',
        2024
      );
      expect(exists2024).toBe(true);

      // Test case 3: Should NOT find season with name "Fall Season" and year 2025
      const existsFall = await repository.existsByNameAndYear(
        'Fall Season',
        2025
      );
      expect(existsFall).toBe(false);

      // Test case 4: Should NOT find season with name "Spring Season" and year 2023
      const exists2023 = await repository.existsByNameAndYear(
        'Spring Season',
        2023
      );
      expect(exists2023).toBe(false);
    });

    it('should handle duplicate prevention using compound index', async () => {
      // Create first season
      const season1 = new Season(
        'season-1',
        'Spring Season',
        2025,
        new Date('2025-03-01'),
        new Date('2025-05-31')
      );

      await repository.save(season1);

      // Check that it exists
      const existsBefore = await repository.existsByNameAndYear(
        'Spring Season',
        2025
      );
      expect(existsBefore).toBe(true);

      // Try to save another season with same name and year (this should be detectable)
      const season2 = new Season(
        'season-2',
        'Spring Season',
        2025,
        new Date('2025-03-15'),
        new Date('2025-06-15')
      );

      await repository.save(season2);

      // Should still detect existence using compound index
      const existsAfter = await repository.existsByNameAndYear(
        'Spring Season',
        2025
      );
      expect(existsAfter).toBe(true);

      // Should be able to differentiate by year
      const existsDifferentYear = await repository.existsByNameAndYear(
        'Spring Season',
        2024
      );
      expect(existsDifferentYear).toBe(false);
    });

    it('should perform efficiently with compound index on large dataset', async () => {
      // Create multiple seasons with various name/year combinations
      const seasons = [];
      const seasonNames = ['Spring', 'Summer', 'Fall', 'Winter'];
      const years = [2020, 2021, 2022, 2023, 2024, 2025];

      for (const name of seasonNames) {
        for (const year of years) {
          const season = new Season(
            `season-${name}-${year}`,
            `${name} Season`,
            year,
            new Date(`${year}-01-01`),
            new Date(`${year}-12-31`)
          );
          seasons.push(season);
        }
      }

      // Save all seasons
      for (const season of seasons) {
        await repository.save(season);
      }

      // Test that compound index queries work efficiently
      const startTime = performance.now();

      // Test various compound index queries
      const spring2025 = await repository.existsByNameAndYear(
        'Spring Season',
        2025
      );
      const summer2023 = await repository.existsByNameAndYear(
        'Summer Season',
        2023
      );
      const nonExistent = await repository.existsByNameAndYear(
        'Autumn Season',
        2025
      );

      const endTime = performance.now();
      const queryTime = endTime - startTime;

      // Verify results
      expect(spring2025).toBe(true);
      expect(summer2023).toBe(true);
      expect(nonExistent).toBe(false);

      // Performance check - compound index should make this fast
      // If there's no compound index, this might be slow due to full table scan
      expect(queryTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe('Database Schema Validation', () => {
    it('should have the required compound index in database schema', async () => {
      // This test directly checks if the database has the expected compound index
      // It should FAIL initially and pass after we add the index to the schema

      const db = getDatabase();
      const seasonsTable = db.table('seasons');

      // Check if the compound index exists in the schema
      const schema = seasonsTable.schema;
      const indexes = schema.indexes;

      // Look for the compound index [name+year]
      const hasCompoundIndex = indexes.some((index: any) => {
        return (
          Array.isArray(index.keyPath) &&
          index.keyPath.includes('name') &&
          index.keyPath.includes('year')
        );
      });

      expect(hasCompoundIndex).toBe(true);
    });
  });
});
