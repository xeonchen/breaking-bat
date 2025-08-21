/**
 * Secondary Ports - Persistence Contracts (Application Core Output)
 *
 * These are the "driven" side ports - interfaces that define what
 * our application needs from external systems (databases, file systems, etc.).
 *
 * The infrastructure layer will provide adapters that implement these ports.
 */

import { Team, Player, Game, Season, GameType, AtBat } from '@/domain/entities';

/**
 * Generic Repository Interface
 * Defines common persistence operations
 */
export interface IRepository<TEntity, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
  delete(id: TId): Promise<void>;
  findAll(): Promise<TEntity[]>;
  exists(id: TId): Promise<boolean>;
}

/**
 * Team Persistence Port
 * Defines what the application needs for team persistence
 */
export interface ITeamPersistencePort extends IRepository<Team> {
  findBySeasonId(seasonId: string): Promise<Team[]>;
  findByName(name: string): Promise<Team | null>;
  searchByName(query: string): Promise<Team[]>;
  isNameAvailable(
    organizationId: string,
    name: string,
    excludeTeamId?: string
  ): Promise<boolean>;
  findByOrganization(organizationId: string): Promise<Team[]>;
}

/**
 * Player Persistence Port
 * Defines what the application needs for player persistence
 */
export interface IPlayerPersistencePort extends IRepository<Player> {
  findByTeamId(teamId: string): Promise<Player[]>;
  findByPosition(position: string): Promise<Player[]>;
  findByJerseyNumber(
    teamId: string,
    jerseyNumber: number
  ): Promise<Player | null>;
  searchByName(query: string): Promise<Player[]>;
  isJerseyNumberAvailable(
    teamId: string,
    jerseyNumber: number,
    excludePlayerId?: string
  ): Promise<boolean>;
  isJerseyNumberUnique(
    teamId: string,
    jerseyNumber: number,
    excludePlayerId?: string
  ): Promise<boolean>;
  create(player: Player): Promise<Player>;
  update(player: Player): Promise<Player>;
}

/**
 * Game Persistence Port
 * Defines what the application needs for game persistence
 */
export interface IGamePersistencePort extends IRepository<Game> {
  findCurrent(): Promise<Game | null>;
  findByTeamId(teamId: string): Promise<Game[]>;
  findBySeasonId(seasonId: string): Promise<Game[]>;
  findByStatus(status: string): Promise<Game[]>;
  getLineup(lineupId: string): Promise<string[]>;
  saveLineup(gameId: string, lineupData: LineupData): Promise<void>;
}

/**
 * Season Persistence Port
 */
export interface ISeasonPersistencePort extends IRepository<Season> {
  findByYear(year: number): Promise<Season[]>;
  findCurrent(): Promise<Season | null>;
  isActive(seasonId: string): Promise<boolean>;
}

/**
 * GameType Persistence Port
 */
export interface IGameTypePersistencePort extends IRepository<GameType> {
  findByName(name: string): Promise<GameType | null>;
  findDefault(): Promise<GameType | null>;
}

/**
 * AtBat Persistence Port
 */
export interface IAtBatPersistencePort extends IRepository<AtBat> {
  findByGameId(gameId: string): Promise<AtBat[]>;
  findByBatterId(batterId: string): Promise<AtBat[]>;
  findByInning(
    gameId: string,
    inning: number,
    isTopInning?: boolean
  ): Promise<AtBat[]>;
  findByResult(gameId: string, resultType: string): Promise<AtBat[]>;
  getPlayerStats(gameId: string, playerId: string): Promise<PlayerStatsData>;
}

/**
 * Unit of Work Interface
 * Manages transactional boundaries
 */
export interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

/**
 * Event Store Interface
 * For event sourcing capabilities
 */
export interface IEventStore {
  append<TEvent>(
    streamId: string,
    events: TEvent[],
    expectedVersion?: number
  ): Promise<void>;
  getEvents<TEvent>(streamId: string, fromVersion?: number): Promise<TEvent[]>;
  exists(streamId: string): Promise<boolean>;
}

// Supporting Types
export interface LineupData {
  lineupId: string;
  playerIds: string[];
  defensivePositions: string[];
}

export interface PlayerStatsData {
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
}

export interface PersistenceFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'like';
  value: unknown;
}

export interface PersistenceSortOrder {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PersistenceOptions {
  filters?: PersistenceFilter[];
  sortBy?: PersistenceSortOrder[];
  limit?: number;
  offset?: number;
}
