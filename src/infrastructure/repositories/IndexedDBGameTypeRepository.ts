import { GameType } from '@/domain/entities';
import { GameTypeRepository } from '@/domain/repositories';
import { getDatabase } from '../database/connection';
import { BreakingBatDatabase } from '../database/types';

export class IndexedDBGameTypeRepository implements GameTypeRepository {
  async save(gameType: GameType): Promise<GameType> {
    const db = getDatabase() as BreakingBatDatabase;

    const gameTypeData = {
      id: gameType.id,
      name: gameType.name,
      description: gameType.description,
      createdAt: gameType.createdAt || new Date(),
      updatedAt: new Date(),
    };

    await db.gameTypes.put(gameTypeData);

    return new GameType(
      gameTypeData.id,
      gameTypeData.name,
      gameTypeData.description,
      gameTypeData.createdAt,
      gameTypeData.updatedAt
    );
  }

  async findById(id: string): Promise<GameType | null> {
    const db = getDatabase() as BreakingBatDatabase;
    const gameTypeData = await db.gameTypes.get(id);

    if (!gameTypeData) {
      return null;
    }

    return new GameType(
      gameTypeData.id,
      gameTypeData.name,
      gameTypeData.description || '',
      gameTypeData.createdAt,
      gameTypeData.updatedAt
    );
  }

  async findAll(): Promise<GameType[]> {
    const db = getDatabase() as BreakingBatDatabase;
    const gameTypesData = await db.gameTypes.orderBy('name').toArray();

    return gameTypesData.map(
      (gameTypeData) =>
        new GameType(
          gameTypeData.id,
          gameTypeData.name,
          gameTypeData.description || '',
          gameTypeData.createdAt,
          gameTypeData.updatedAt
        )
    );
  }

  async findByName(name: string): Promise<GameType | null> {
    const db = getDatabase() as BreakingBatDatabase;
    const gameTypeData = await db.gameTypes.where('name').equals(name).first();

    if (!gameTypeData) {
      return null;
    }

    return new GameType(
      gameTypeData.id,
      gameTypeData.name,
      gameTypeData.description || '',
      gameTypeData.createdAt,
      gameTypeData.updatedAt
    );
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase() as BreakingBatDatabase;
    await db.gameTypes.delete(id);
  }

  async existsByName(name: string): Promise<boolean> {
    const db = getDatabase() as BreakingBatDatabase;
    const gameType = await db.gameTypes.where('name').equals(name).first();
    return !!gameType;
  }

  async search(query: string): Promise<GameType[]> {
    const db = getDatabase() as BreakingBatDatabase;
    const gameTypesData = await db.gameTypes.toArray();

    const lowerQuery = query.toLowerCase();
    const filteredGameTypes = gameTypesData.filter(
      (gameType) =>
        gameType.name.toLowerCase().includes(lowerQuery) ||
        (gameType.description &&
          gameType.description.toLowerCase().includes(lowerQuery))
    );

    return filteredGameTypes.map(
      (gameTypeData) =>
        new GameType(
          gameTypeData.id,
          gameTypeData.name,
          gameTypeData.description || '',
          gameTypeData.createdAt,
          gameTypeData.updatedAt
        )
    );
  }

  async findAllOrderedByName(): Promise<GameType[]> {
    return this.findAll(); // Already ordered by name in findAll()
  }
}
