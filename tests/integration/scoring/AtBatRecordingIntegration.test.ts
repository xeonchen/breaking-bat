import { AtBatRecordingIntegration } from '@/integration/AtBatRecordingIntegration';
import { GameRepository } from '@/infrastructure/repositories/GameRepository';
import { AtBatRepository } from '@/infrastructure/repositories/AtBatRepository';
import { BaserunnerAdvancementService } from '@/domain/services/BaserunnerAdvancementService';
import { RecordAtBatUseCase } from '@/application/usecases/RecordAtBatUseCase';
import { BattingResult, Game, AtBat } from '@/domain';
import { DatabaseHelper } from '@/tests/helpers/DatabaseHelper';

describe('At-Bat Recording Integration Tests (@AC001, @AC002, @AC005)', () => {
  let integration: AtBatRecordingIntegration;
  let gameRepository: GameRepository;
  let atBatRepository: AtBatRepository;
  let baserunnerService: BaserunnerAdvancementService;
  let recordAtBatUseCase: RecordAtBatUseCase;
  let dbHelper: DatabaseHelper;

  beforeAll(async () => {
    // Initialize real database for integration testing
    dbHelper = new DatabaseHelper();
    await dbHelper.initializeTestDatabase();
  });

  beforeEach(async () => {
    // Clean database and initialize services
    await dbHelper.cleanDatabase();

    gameRepository = new GameRepository();
    atBatRepository = new AtBatRepository();
    baserunnerService = new BaserunnerAdvancementService();
    recordAtBatUseCase = new RecordAtBatUseCase(
      gameRepository,
      atBatRepository,
      baserunnerService
    );

    integration = new AtBatRecordingIntegration(recordAtBatUseCase);
  });

  afterAll(async () => {
    await dbHelper.closeTestDatabase();
  });

  describe('End-to-End At-Bat Recording (@AC001)', () => {
    it('should record complete at-bat with real database persistence', async () => {
      // Given: A real game setup with lineup
      const game = new Game(
        'integration-game-1',
        'Integration Test Game',
        'team-1',
        'Test Opponent',
        new Date(),
        'home'
      );

      // Setup game with real lineup data
      const lineup = await dbHelper.createTestLineup('team-1', [
        { playerId: 'player-1', playerName: 'John Smith', battingOrder: 1 },
        { playerId: 'player-2', playerName: 'Jane Doe', battingOrder: 2 },
        { playerId: 'player-3', playerName: 'Bob Wilson', battingOrder: 3 },
      ]);

      game.startGame(lineup.id);
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
        'team-1',
        'Rapid Opponent',
        new Date(),
        'home'
      );

      const lineup = await dbHelper.createTestLineup('team-1', [
        { playerId: 'rapid-1', playerName: 'Rapid One', battingOrder: 1 },
        { playerId: 'rapid-2', playerName: 'Rapid Two', battingOrder: 2 },
        { playerId: 'rapid-3', playerName: 'Rapid Three', battingOrder: 3 },
      ]);

      game.startGame(lineup.id);
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

  describe('Baserunner Integration with Manual Override (@AC005)', () => {
    it('should integrate manual override with database persistence', async () => {
      // Given: Game with runners in position
      const game = new Game(
        'override-game-1',
        'Manual Override Test',
        'team-1',
        'Override Opponent',
        new Date(),
        'home'
      );

      const lineup = await dbHelper.createTestLineup('team-1', [
        { playerId: 'override-1', playerName: 'Override One', battingOrder: 1 },
      ]);

      game.startGame(lineup.id);
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
      expect(savedAtBats[0].baserunnerAdvancement).toEqual({
        'runner-2': 'stay',
      });

      // Verify game state reflects override
      const savedGame = await gameRepository.findById(game.id);
      expect(savedGame!.getCurrentBaserunners().second).toEqual({
        playerId: 'runner-2',
        playerName: 'Runner Two',
      });
    });
  });

  describe('Automatic Batter Advancement Integration (@AC002)', () => {
    it('should advance through lineup with database persistence', async () => {
      // Given: Game with 3-batter lineup
      const game = new Game(
        'lineup-game-1',
        'Lineup Advancement Test',
        'team-1',
        'Lineup Opponent',
        new Date(),
        'home'
      );

      const lineup = await dbHelper.createTestLineup('team-1', [
        { playerId: 'lineup-1', playerName: 'First Batter', battingOrder: 1 },
        { playerId: 'lineup-2', playerName: 'Second Batter', battingOrder: 2 },
        { playerId: 'lineup-3', playerName: 'Third Batter', battingOrder: 3 },
      ]);

      game.startGame(lineup.id);
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
        'team-1',
        'Error Opponent',
        new Date(),
        'home'
      );

      const lineup = await dbHelper.createTestLineup('team-1', [
        { playerId: 'error-1', playerName: 'Error One', battingOrder: 1 },
      ]);

      game.startGame(lineup.id);
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
        'team-1',
        'Concurrent Opponent',
        new Date(),
        'home'
      );

      const lineup = await dbHelper.createTestLineup('team-1', [
        {
          playerId: 'concurrent-1',
          playerName: 'Concurrent One',
          battingOrder: 1,
        },
      ]);

      game.startGame(lineup.id);
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
