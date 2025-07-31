import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { IndexedDBPlayerRepository } from '@/infrastructure/repositories/IndexedDBPlayerRepository';
import { IndexedDBTeamRepository } from '@/infrastructure/repositories/IndexedDBTeamRepository';
import { AddPlayerUseCase } from '@/application/use-cases/AddPlayerUseCase';
import { CreateTeamUseCase } from '@/application/use-cases/CreateTeamUseCase';
import { Position } from '@/domain';
import { createFreshTestDatabase } from '../test-helpers/database';
import Dexie from 'dexie';

describe('Player Management Integration Tests', () => {
  let db: Dexie;
  let playerRepository: IndexedDBPlayerRepository;
  let teamRepository: IndexedDBTeamRepository;
  let addPlayerUseCase: AddPlayerUseCase;
  let createTeamUseCase: CreateTeamUseCase;
  let testTeamId: string;

  beforeEach(async () => {
    // Create fresh test database with proper schema
    db = createFreshTestDatabase();
    await db.open();
    
    playerRepository = new IndexedDBPlayerRepository(db);
    teamRepository = new IndexedDBTeamRepository(db);
    addPlayerUseCase = new AddPlayerUseCase(playerRepository, teamRepository);
    createTeamUseCase = new CreateTeamUseCase(teamRepository);
    
    // Create a test team first
    const teamResult = await createTeamUseCase.execute({
      name: 'Test Red Sox',
      seasonIds: [],
      playerIds: []
    });
    
    expect(teamResult.isSuccess).toBe(true);
    testTeamId = teamResult.value!.id;
  }, 15000);

  afterEach(async () => {
    if (db) {
      await db.delete();
      db.close();
    }
  }, 10000);

  describe('Player Creation', () => {
    it('should create a player successfully with valid data', async () => {
      const result = await addPlayerUseCase.execute({
        teamId: testTeamId,
        name: 'Ted Williams',
        jerseyNumber: 9,
        position: Position.leftField(),
        isActive: true
      });

      expect(result.isSuccess).toBe(true);
      expect(result.value!.name).toBe('Ted Williams');
      expect(result.value!.jerseyNumber).toBe(9);
    }, 10000);

    it('should prevent duplicate jersey numbers within same team', async () => {
      // Add first player
      const firstResult = await addPlayerUseCase.execute({
        teamId: testTeamId,
        name: 'Ted Williams',
        jerseyNumber: 9,
        position: Position.leftField(),
        isActive: true
      });
      expect(firstResult.isSuccess).toBe(true);

      // Try to add second player with same jersey number
      const secondResult = await addPlayerUseCase.execute({
        teamId: testTeamId,
        name: 'David Ortiz',
        jerseyNumber: 9, // Same jersey number
        position: Position.firstBase(),
        isActive: true
      });

      expect(secondResult.isSuccess).toBe(false);
      expect(secondResult.error).toContain('Jersey number 9 is already in use');
    }, 10000);
  });

  describe('Jersey Number Uniqueness', () => {
    it('should correctly check jersey number uniqueness', async () => {
      // Should be unique initially
      const isUnique1 = await playerRepository.isJerseyNumberUnique(testTeamId, 9);
      expect(isUnique1).toBe(true);

      // Add a player
      await addPlayerUseCase.execute({
        teamId: testTeamId,
        name: 'Ted Williams',
        jerseyNumber: 9,
        position: Position.leftField(),
        isActive: true
      });

      // Should not be unique anymore
      const isUnique2 = await playerRepository.isJerseyNumberUnique(testTeamId, 9);
      expect(isUnique2).toBe(false);

      // Different jersey number should still be unique
      const isUnique3 = await playerRepository.isJerseyNumberUnique(testTeamId, 34);
      expect(isUnique3).toBe(true);
    }, 10000);
  });
});