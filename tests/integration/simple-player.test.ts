import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { IndexedDBPlayerRepository } from '@/infrastructure/repositories/IndexedDBPlayerRepository';
import { IndexedDBTeamRepository } from '@/infrastructure/repositories/IndexedDBTeamRepository';
import { AddPlayerUseCase } from '@/application/use-cases/AddPlayerUseCase';
import { CreateTeamUseCase } from '@/application/use-cases/CreateTeamUseCase';
import { Position } from '@/domain';
import Dexie from 'dexie';

describe('Simple Player Creation Test', () => {
  let db: Dexie;
  let playerRepository: IndexedDBPlayerRepository;
  let teamRepository: IndexedDBTeamRepository;
  let addPlayerUseCase: AddPlayerUseCase;
  let createTeamUseCase: CreateTeamUseCase;
  let testTeamId: string;

  beforeAll(async () => {
    // Create a simple test database
    const dbName = `test-simple-${Date.now()}`;
    db = new Dexie(dbName);
    
    // Schema with compound index
    db.version(1).stores({
      teams: '++id, name, *seasonIds, *playerIds',
      players: '++id, name, jerseyNumber, teamId, position, isActive, statistics, [teamId+jerseyNumber]',
    });
    
    await db.open();
    console.log('✅ Database opened successfully');
    
    // Initialize repositories and use cases
    playerRepository = new IndexedDBPlayerRepository(db);
    teamRepository = new IndexedDBTeamRepository(db);
    addPlayerUseCase = new AddPlayerUseCase(playerRepository, teamRepository);
    createTeamUseCase = new CreateTeamUseCase(teamRepository);
    
    // Create a test team
    console.log('🏀 Creating test team...');
    const teamResult = await createTeamUseCase.execute({
      name: 'Test Red Sox',
      seasonIds: [],
      playerIds: []
    });
    
    console.log('Team creation result:', teamResult);
    expect(teamResult.isSuccess).toBe(true);
    testTeamId = teamResult.value!.id;
    console.log('✅ Test team created with ID:', testTeamId);
  });

  afterAll(async () => {
    if (db) {
      console.log('🧹 Cleaning up database...');
      await db.delete();
      db.close();
      console.log('✅ Database cleaned up');
    }
  });

  it('should create a player with compound index', async () => {
    console.log('🎯 Testing player creation...');
    
    const result = await addPlayerUseCase.execute({
      teamId: testTeamId,
      name: 'Ted Williams',
      jerseyNumber: 9,
      position: Position.leftField(),
      isActive: true
    });

    console.log('Player creation result:', result);
    
    expect(result.isSuccess).toBe(true);
    expect(result.value!.name).toBe('Ted Williams');
    expect(result.value!.jerseyNumber).toBe(9);
    
    console.log('✅ Player created successfully');
  });

  it('should prevent duplicate jersey numbers', async () => {
    console.log('🎯 Testing duplicate jersey prevention...');
    
    // This should fail since Ted Williams already has jersey 9
    const result = await addPlayerUseCase.execute({
      teamId: testTeamId,
      name: 'David Ortiz',
      jerseyNumber: 9, // Same jersey number
      position: Position.firstBase(),
      isActive: true
    });

    console.log('Duplicate jersey result:', result);
    
    expect(result.isSuccess).toBe(false);
    expect(result.error).toContain('Jersey number 9 is already in use');
    
    console.log('✅ Duplicate jersey correctly prevented');
  });
});