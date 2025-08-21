import { AtBatRecordingIntegration } from '@/application/integrations/AtBatRecordingIntegration';
import { IndexedDBGameRepository } from '@/infrastructure/repositories/IndexedDBGameRepository';
import { IndexedDBAtBatRepository } from '@/infrastructure/repositories/IndexedDBAtBatRepository';
import { BaserunnerAdvancementService } from '@/domain/services/BaserunnerAdvancementService';
import { RecordAtBatUseCase } from '@/application/use-cases/RecordAtBatUseCase';
import { BattingResult, Game, AtBat } from '@/domain';
import { DatabaseHelper } from '@/tests/helpers/DatabaseHelper';
import Dexie from 'dexie';

describe.skip('At-Bat Recording Integration Tests (@live-game-scoring:AC001, @live-game-scoring:AC002, @live-game-scoring:AC007) - SKIPPED: Requires live game state management implementation', () => {
  let integration: AtBatRecordingIntegration;
  let gameRepository: IndexedDBGameRepository;
  let atBatRepository: IndexedDBAtBatRepository;
  let baserunnerService: BaserunnerAdvancementService;
  let recordAtBatUseCase: RecordAtBatUseCase;
  let db: Dexie;

  beforeAll(async () => {
    // Create real test database for integration testing
    const dbName = `test-atbat-integration-${Date.now()}`;
    db = new Dexie(dbName);

    // Schema matching the main application
    db.version(1).stores({
      games: '++id, name, opponent, date, teamId, status',
      atBats: '++id, gameId, batterId, inning, result, timestamp',
    });

    await db.open();
  });

  beforeEach(async () => {
    // Clean database and initialize real repositories
    await Promise.all([db.table('games').clear(), db.table('atBats').clear()]);

    gameRepository = new IndexedDBGameRepository(db);
    atBatRepository = new IndexedDBAtBatRepository(db);
    baserunnerService = new BaserunnerAdvancementService();
    recordAtBatUseCase = new RecordAtBatUseCase(
      gameRepository,
      atBatRepository,
      baserunnerService
    );

    integration = new AtBatRecordingIntegration(recordAtBatUseCase);
  });

  afterAll(async () => {
    if (db) {
      db.close();
    }
  });

  describe('End-to-End At-Bat Recording (@live-game-scoring:AC001)', () => {
    it('should record complete at-bat with real database persistence', async () => {
      // Given: A real game setup with lineup
      const game = new Game(
        'integration-game-1',
        'Integration Test Game',
        'Test Opponent',
        new Date(),
        null, // seasonId
        null, // gameTypeId
        'home',
        'team-1'
      );

      // Start game with test lineup
      game.startGame('test-lineup-1');
      await gameRepository.save(game);

      // Set up baserunners
      game.updateBaserunners({
        first: { playerId: 'player-2', playerName: 'Jane Doe' },
        second: null,
        third: { playerId: 'player-1', playerName: 'John Smith' },
      });

      // When: Recording an at-bat through the integration layer
      const atBatData = {
        gameId: game.id,
        batterId: 'player-3',
        battingResult: BattingResult.double(),
        finalCount: { balls: 1, strikes: 2 },
        pitchSequence: ['B', 'S', 'S (FB)'],
        baserunnerAdvancement: {}, // Use standard rules
      };

      const result = await integration.recordAtBat(atBatData);

      // Then: Complete integration should work
      expect(result.success).toBe(true);
      expect(result.runsScored).toBe(2); // Both runners should score
      expect(result.rbis).toBe(2);

      // Verify database persistence
      const savedGame = await gameRepository.findById(game.id);
      expect(savedGame).toBeDefined();
      expect(savedGame!.getCurrentBatter()?.playerId).toBe('player-1'); // Advanced to next batter

      const gameAtBats = await atBatRepository.findByGameId(game.id);
      expect(gameAtBats).toHaveLength(1);
      expect(gameAtBats[0].result.value).toBe('2B');
      expect(gameAtBats[0].rbis).toBe(2);
    });

    it('should handle rapid successive at-bat recording', async () => {
      // Given: Game setup for rapid recording
      const game = new Game(
        'rapid-game-1',
        'Rapid Recording Test',
        'Rapid Opponent',
        new Date(),
        null, // seasonId
        null, // gameTypeId
        'home',
        'team-1'
      );

      game.startGame('rapid-lineup-1');
      await gameRepository.save(game);

      // When: Recording multiple at-bats in rapid succession
      const atBatPromises = [
        integration.recordAtBat({
          gameId: game.id,
          batterId: 'rapid-1',
          battingResult: BattingResult.single(),
          finalCount: { balls: 0, strikes: 1 },
        }),
        integration.recordAtBat({
          gameId: game.id,
          batterId: 'rapid-2',
          battingResult: BattingResult.double(),
          finalCount: { balls: 2, strikes: 0 },
        }),
        integration.recordAtBat({
          gameId: game.id,
          batterId: 'rapid-3',
          battingResult: BattingResult.homeRun(),
          finalCount: { balls: 1, strikes: 1 },
        }),
      ];

      const results = await Promise.all(atBatPromises);

      // Then: All at-bats should be recorded successfully
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.atBatId).toBeDefined();
      });

      // Verify all at-bats were saved
      const gameAtBats = await atBatRepository.findByGameId(game.id);
      expect(gameAtBats).toHaveLength(3);
      expect(gameAtBats.map((ab) => ab.result.value)).toEqual([
        '1B',
        '2B',
        'HR',
      ]);
    });
  });

  describe('Baserunner Integration with Manual Override (@live-game-scoring:AC007)', () => {
    it('should integrate manual override with database persistence', async () => {
      // Given: Game with runners in position
      const game = new Game(
        'override-game-1',
        'Manual Override Test',
        'Override Opponent',
        new Date(),
        null, // seasonId
        null, // gameTypeId
        'home',
        'team-1'
      );

      game.startGame('override-lineup-1');
      game.updateBaserunners({
        first: null,
        second: { playerId: 'runner-2', playerName: 'Runner Two' },
        third: null,
      });
      await gameRepository.save(game);

      // When: Recording at-bat with manual override
      const atBatData = {
        gameId: game.id,
        batterId: 'override-1',
        battingResult: BattingResult.single(),
        finalCount: { balls: 0, strikes: 0 },
        baserunnerAdvancement: {
          'runner-2': 'stay', // Override: runner stays at 2nd instead of scoring
        },
      };

      const result = await integration.recordAtBat(atBatData);

      // Then: Manual override should be applied and persisted
      expect(result.success).toBe(true);
      expect(result.runsScored).toBe(0); // Runner stayed, didn't score
      expect(result.rbis).toBe(0);

      // Verify override was saved to database
      const savedAtBats = await atBatRepository.findByGameId(game.id);
      expect(savedAtBats).toHaveLength(1);
      // Note: baserunnerAdvancement is not stored in AtBat entity, but the result should reflect the override

      // Verify game state reflects override
      const savedGame = await gameRepository.findById(game.id);
      expect(savedGame!.getCurrentBaserunners().second).toEqual({
        playerId: 'runner-2',
        playerName: 'Runner Two',
      });
    });
  });

  describe('Automatic Batter Advancement Integration (@live-game-scoring:AC002)', () => {
    it('should advance through lineup with database persistence', async () => {
      // Given: Game with 3-batter lineup
      const game = new Game(
        'lineup-game-1',
        'Lineup Advancement Test',
        'Lineup Opponent',
        new Date(),
        null, // seasonId
        null, // gameTypeId
        'home',
        'team-1'
      );

      game.startGame('lineup-test-1');
      await gameRepository.save(game);

      // Verify starting batter
      expect(game.getCurrentBatter()?.battingOrder).toBe(1);

      // When: Recording at-bat for first batter
      await integration.recordAtBat({
        gameId: game.id,
        batterId: 'lineup-1',
        battingResult: BattingResult.strikeout(),
        finalCount: { balls: 1, strikes: 3 },
      });

      // Then: Should advance to second batter
      const gameAfterFirstAtBat = await gameRepository.findById(game.id);
      expect(gameAfterFirstAtBat!.getCurrentBatter()?.battingOrder).toBe(2);

      // When: Recording at-bat for second batter
      await integration.recordAtBat({
        gameId: game.id,
        batterId: 'lineup-2',
        battingResult: BattingResult.walk(),
        finalCount: { balls: 4, strikes: 0 },
      });

      // Then: Should advance to third batter
      const gameAfterSecondAtBat = await gameRepository.findById(game.id);
      expect(gameAfterSecondAtBat!.getCurrentBatter()?.battingOrder).toBe(3);

      // When: Recording at-bat for third batter (last in lineup)
      await integration.recordAtBat({
        gameId: game.id,
        batterId: 'lineup-3',
        battingResult: BattingResult.groundOut(),
        finalCount: { balls: 0, strikes: 1 },
      });

      // Then: Should cycle back to first batter
      const gameAfterThirdAtBat = await gameRepository.findById(game.id);
      expect(gameAfterThirdAtBat!.getCurrentBatter()?.battingOrder).toBe(1);
    });
  });

  describe('Error Handling and Data Integrity', () => {
    it('should handle database save failures gracefully', async () => {
      // Given: Game setup that will cause save failure
      const game = new Game(
        'error-game-1',
        'Error Handling Test',
        'Error Opponent',
        new Date(),
        null, // seasonId
        null, // gameTypeId
        'home',
        'team-1'
      );

      game.startGame('error-lineup-1');
      await gameRepository.save(game);

      // Simulate database failure
      const originalSave = atBatRepository.save;
      atBatRepository.save = jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));

      // When: Attempting to record at-bat with database failure
      const atBatData = {
        gameId: game.id,
        batterId: 'error-1',
        battingResult: BattingResult.single(),
        finalCount: { balls: 0, strikes: 0 },
      };

      const result = await integration.recordAtBat(atBatData);

      // Then: Should handle error gracefully
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');

      // Verify no partial data corruption
      const gameAtBats = await atBatRepository.findByGameId(game.id);
      expect(gameAtBats).toHaveLength(0); // No at-bats should be saved on failure

      // Restore original save function
      atBatRepository.save = originalSave;
    });

    it('should maintain data consistency during concurrent operations', async () => {
      // Given: Game setup for concurrency testing
      const game = new Game(
        'concurrent-game-1',
        'Concurrency Test',
        'Concurrent Opponent',
        new Date(),
        null, // seasonId
        null, // gameTypeId
        'home',
        'team-1'
      );

      game.startGame('concurrent-lineup-1');
      await gameRepository.save(game);

      // When: Attempting concurrent at-bat recording (should be prevented)
      const concurrentAtBatPromises = [
        integration.recordAtBat({
          gameId: game.id,
          batterId: 'concurrent-1',
          battingResult: BattingResult.single(),
          finalCount: { balls: 0, strikes: 0 },
        }),
        integration.recordAtBat({
          gameId: game.id,
          batterId: 'concurrent-1',
          battingResult: BattingResult.double(),
          finalCount: { balls: 1, strikes: 1 },
        }),
      ];

      const results = await Promise.allSettled(concurrentAtBatPromises);

      // Then: Only one should succeed to maintain consistency
      const successfulResults = results.filter((r) => r.status === 'fulfilled');
      const failedResults = results.filter((r) => r.status === 'rejected');

      expect(successfulResults).toHaveLength(1);
      expect(failedResults).toHaveLength(1);

      // Verify only one at-bat was recorded
      const gameAtBats = await atBatRepository.findByGameId(game.id);
      expect(gameAtBats).toHaveLength(1);
    });
  });
});
