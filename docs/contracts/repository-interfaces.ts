/**
 * Repository Interface Contracts
 *
 * Repository interfaces for data persistence following Clean Architecture.
 * These define the contracts for data access without specifying implementation details.
 * Implementations can use IndexedDB, LocalStorage, or other storage mechanisms.
 */

import {
  Team,
  Player,
  Game,
  Season,
  GameType,
  Lineup,
  AtBat,
  Inning,
  Scoreboard,
  ExportPackage,
  ImportSession,
  HomeAway,
  GameStatus,
  ExportFormat,
  ExportScope,
} from './domain-entities';

// Base repository interface with common CRUD operations
export interface BaseRepository<T> {
  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

// Specialized repository interfaces
export interface TeamRepository extends BaseRepository<Team> {
  findBySeasonId(seasonId: string): Promise<Team[]>;
  findByName(name: string): Promise<Team | null>;
  addPlayer(teamId: string, playerId: string): Promise<void>;
  removePlayer(teamId: string, playerId: string): Promise<void>;
  getTeamRoster(teamId: string): Promise<Player[]>;
}

export interface PlayerRepository extends BaseRepository<Player> {
  findByTeamId(teamId: string): Promise<Player[]>;
  findByJerseyNumber(
    teamId: string,
    jerseyNumber: number
  ): Promise<Player | null>;
  findActiveByTeamId(teamId: string): Promise<Player[]>;
  updateStatistics(playerId: string, atBat: AtBat): Promise<void>;
  getPlayerStatistics(
    playerId: string,
    seasonId?: string
  ): Promise<Player['statistics']>;
}

export interface GameRepository extends BaseRepository<Game> {
  findByTeamId(teamId: string): Promise<Game[]>;
  findBySeasonId(seasonId: string): Promise<Game[]>;
  findByStatus(status: GameStatus): Promise<Game[]>;
  findIncompleteGames(): Promise<Game[]>;
  findRecentGames(limit: number): Promise<Game[]>;
  updateStatus(gameId: string, status: GameStatus): Promise<void>;
  addInning(gameId: string, inning: Inning): Promise<void>;
}

export interface SeasonRepository extends BaseRepository<Season> {
  findByYear(year: number): Promise<Season[]>;
  findActive(): Promise<Season[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Season[]>;
}

export interface GameTypeRepository extends BaseRepository<GameType> {
  findByName(name: string): Promise<GameType | null>;
  getDefault(): Promise<GameType>;
}

export interface LineupRepository extends BaseRepository<Lineup> {
  findByGameId(gameId: string): Promise<Lineup | null>;
  updateBattingOrder(
    lineupId: string,
    battingOrder: Lineup['battingOrder']
  ): Promise<void>;
  addSubstitute(lineupId: string, playerId: string): Promise<void>;
  removeSubstitute(lineupId: string, playerId: string): Promise<void>;
  validateLineup(lineup: Lineup): Promise<ValidationError[]>;
}

export interface InningRepository extends BaseRepository<Inning> {
  findByGameId(gameId: string): Promise<Inning[]>;
  findByGameAndNumber(
    gameId: string,
    inningNumber: number
  ): Promise<Inning | null>;
  getCurrentInning(gameId: string): Promise<Inning | null>;
  addAtBat(inningId: string, atBat: AtBat): Promise<void>;
  completeInning(inningId: string): Promise<void>;
}

export interface AtBatRepository extends BaseRepository<AtBat> {
  findByGameId(gameId: string): Promise<AtBat[]>;
  findByInningId(inningId: string): Promise<AtBat[]>;
  findByPlayerId(playerId: string): Promise<AtBat[]>;
  getLastAtBat(gameId: string): Promise<AtBat | null>;
  getAtBatSequence(gameId: string): Promise<AtBat[]>;
}

export interface ScoreboardRepository {
  findByGameId(gameId: string): Promise<Scoreboard | null>;
  updateScore(
    gameId: string,
    homeScore: number,
    awayScore: number
  ): Promise<void>;
  updateCurrentInning(
    gameId: string,
    inning: number,
    teamAtBat: HomeAway
  ): Promise<void>;
  updateCurrentBatter(
    gameId: string,
    playerId: string,
    battingPosition: number
  ): Promise<void>;
  updateBaserunners(
    gameId: string,
    baserunners: Scoreboard['baserunners']
  ): Promise<void>;
  calculateLiveScore(gameId: string): Promise<Scoreboard>;
}

// Export/Import repository interfaces
export interface ExportRepository {
  createExport(
    format: ExportFormat,
    scope: ExportScope,
    filters?: ExportFilters
  ): Promise<ExportPackage>;

  exportToFile(exportPackage: ExportPackage): Promise<Blob>;

  getExportHistory(): Promise<ExportPackage[]>;

  deleteExport(exportId: string): Promise<void>;
}

export interface ImportRepository {
  validateImportFile(file: File): Promise<ValidationResult>;

  createImportSession(file: File): Promise<ImportSession>;

  processImport(
    sessionId: string,
    strategy: ImportStrategy,
    conflictResolutions?: ConflictResolution[]
  ): Promise<ImportResult>;

  getImportHistory(): Promise<ImportSession[]>;
}

// Storage management interface
export interface StorageRepository {
  getStorageInfo(): Promise<StorageInfo>;
  clearStorage(): Promise<void>;
  compactDatabase(): Promise<void>;
  createBackup(): Promise<Blob>;
  restoreFromBackup(backupFile: File): Promise<void>;
  migrateData(fromVersion: string, toVersion: string): Promise<void>;
}

// Search and query interface
export interface SearchRepository {
  searchPlayers(query: string, teamId?: string): Promise<Player[]>;
  searchGames(query: string, filters?: GameSearchFilters): Promise<Game[]>;
  searchTeams(query: string): Promise<Team[]>;
  getRecentActivity(limit: number): Promise<ActivityRecord[]>;
}

// Supporting types and interfaces
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ExportFilters {
  teamIds?: string[];
  seasonIds?: string[];
  gameIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeStatistics?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  metadata: {
    recordCount: number;
    fileSize: number;
    format: string;
  };
}

export interface ImportStrategy {
  conflictResolution: 'merge' | 'replace' | 'skip' | 'ask';
  validateReferences: boolean;
  createMissingReferences: boolean;
}

export interface ConflictResolution {
  entityId: string;
  field: string;
  resolution: 'keep_existing' | 'use_new' | 'merge';
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: ValidationError[];
  createdEntities: {
    teams: number;
    players: number;
    games: number;
    seasons: number;
  };
}

export interface StorageInfo {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  itemCounts: {
    teams: number;
    players: number;
    games: number;
    seasons: number;
    atBats: number;
  };
  lastBackup?: Date;
}

export interface GameSearchFilters {
  teamId?: string;
  seasonId?: string;
  gameTypeId?: string;
  status?: GameStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  opponent?: string;
}

export interface ActivityRecord {
  id: string;
  type: 'game_created' | 'game_completed' | 'player_added' | 'team_created';
  entityId: string;
  entityName: string;
  timestamp: Date;
  description: string;
}

// Repository factory interface for dependency injection
export interface RepositoryFactory {
  createTeamRepository(): TeamRepository;
  createPlayerRepository(): PlayerRepository;
  createGameRepository(): GameRepository;
  createSeasonRepository(): SeasonRepository;
  createGameTypeRepository(): GameTypeRepository;
  createLineupRepository(): LineupRepository;
  createInningRepository(): InningRepository;
  createAtBatRepository(): AtBatRepository;
  createScoreboardRepository(): ScoreboardRepository;
  createExportRepository(): ExportRepository;
  createImportRepository(): ImportRepository;
  createStorageRepository(): StorageRepository;
  createSearchRepository(): SearchRepository;
}
