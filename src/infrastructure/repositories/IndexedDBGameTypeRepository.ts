import { GameType } from '@/domain/entities';
import { IGameTypePersistencePort } from '@/application/ports/secondary/IPersistencePorts';
import { getDatabase } from '../database/connection';
import { BreakingBatDatabase } from '../database/types';

export class IndexedDBGameTypeRepository implements IGameTypePersistencePort {
  public async save(gameType: GameType): Promise<GameType> {
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

  public async findById(id: string): Promise<GameType | null> {
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

  public async findAll(): Promise<GameType[]> {
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

  public async findByName(name: string): Promise<GameType | null> {
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

  public async delete(id: string): Promise<void> {
    const db = getDatabase() as BreakingBatDatabase;
    await db.gameTypes.delete(id);
  }

  public async existsByName(name: string): Promise<boolean> {
    const db = getDatabase() as BreakingBatDatabase;
    const gameType = await db.gameTypes.where('name').equals(name).first();
    return !!gameType;
  }

  public async search(query: string): Promise<GameType[]> {
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

  public async findAllOrderedByName(): Promise<GameType[]> {
    return this.findAll(); // Already ordered by name in findAll()
  }

  // Required by IGameTypePersistencePort interface
  public async findDefault(): Promise<GameType | null> {
    // Return the first game type or null if none exist
    const gameTypes = await this.findAll();
    return gameTypes.length > 0 ? gameTypes[0] : null;
  }

  public async exists(id: string): Promise<boolean> {
    const gameType = await this.findById(id);
    return gameType !== null;
  }
}
