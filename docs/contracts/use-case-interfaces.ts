/**
 * Use Case Interface Contracts
 * 
 * Application layer use cases that orchestrate business logic.
 * These interfaces define the application's core functionality following
 * Clean Architecture principles. Each use case represents a specific
 * business operation that the application can perform.
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
  BattingResult,
  BaserunnerState,
  ExportPackage,
  ImportSession,
  HomeAway,
  ExportFormat,
  ExportScope
} from './domain-entities';

// Common result types
export interface UseCaseResult<T> {
  success: boolean;
  data?: T;
  error?: UseCaseError;
}

export interface UseCaseError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Team Management Use Cases
export interface CreateTeamUseCase {
  execute(request: CreateTeamRequest): Promise<UseCaseResult<Team>>;
}

export interface CreateTeamRequest {
  name: string;
  seasonId?: string;
}

export interface GetTeamRosterUseCase {
  execute(teamId: string): Promise<UseCaseResult<Player[]>>;
}

export interface AddPlayerToTeamUseCase {
  execute(request: AddPlayerRequest): Promise<UseCaseResult<Player>>;
}

export interface AddPlayerRequest {
  teamId: string;
  name: string;
  jerseyNumber: number;
  position?: string;
}

export interface UpdatePlayerUseCase {
  execute(request: UpdatePlayerRequest): Promise<UseCaseResult<Player>>;
}

export interface UpdatePlayerRequest {
  playerId: string;
  name?: string;
  jerseyNumber?: number;
  position?: string;
  isActive?: boolean;
}

// Season Management Use Cases
export interface CreateSeasonUseCase {
  execute(request: CreateSeasonRequest): Promise<UseCaseResult<Season>>;
}

export interface CreateSeasonRequest {
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
}

export interface GetActiveSeasonUseCase {
  execute(): Promise<UseCaseResult<Season[]>>;
}

// Game Setup Use Cases
export interface CreateGameUseCase {
  execute(request: CreateGameRequest): Promise<UseCaseResult<Game>>;
}

export interface CreateGameRequest {
  name: string;
  opponent: string;
  date: Date;
  seasonId: string;
  gameTypeId: string;
  homeAway: HomeAway;
  teamId: string;
}

export interface SetupLineupUseCase {
  execute(request: SetupLineupRequest): Promise<UseCaseResult<Lineup>>;
}

export interface SetupLineupRequest {
  gameId: string;
  battingOrder: LineupPlayerRequest[];
  substitutes?: string[]; // player IDs
}

export interface LineupPlayerRequest {
  playerId: string;
  battingPosition: number;
  defensivePosition: string;
}

export interface ValidateLineupUseCase {
  execute(lineupRequest: SetupLineupRequest): Promise<UseCaseResult<LineupValidation>>;
}

export interface LineupValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface StartGameUseCase {
  execute(gameId: string): Promise<UseCaseResult<Game>>;
}

// Live Scoring Use Cases
export interface RecordAtBatUseCase {
  execute(request: RecordAtBatRequest): Promise<UseCaseResult<AtBatResult>>;
}

export interface RecordAtBatRequest {
  gameId: string;
  battingResult: BattingResult;
  baserunnerAdvancement?: BaserunnerAdvancement;
  customRBIs?: number;
}

export interface BaserunnerAdvancement {
  firstToSecond?: boolean;
  secondToThird?: boolean;
  thirdToHome?: boolean;
  batterAdvancement?: number; // bases advanced by batter
}

export interface AtBatResult {
  atBat: AtBat;
  updatedScoreboard: Scoreboard;
  nextBatter: {
    playerId: string;
    battingPosition: number;
  };
  runsScored: number;
}

export interface GetCurrentGameStateUseCase {
  execute(gameId: string): Promise<UseCaseResult<GameState>>;
}

export interface GameState {
  game: Game;
  scoreboard: Scoreboard;
  currentInning: Inning;
  lineup: Lineup;
  lastAtBat?: AtBat;
}

export interface AdvanceToNextBatterUseCase {
  execute(gameId: string): Promise<UseCaseResult<NextBatterInfo>>;
}

export interface NextBatterInfo {
  playerId: string;
  battingPosition: number;
  playerName: string;
  isSubstitute: boolean;
}

export interface UpdateScoreboardUseCase {
  execute(request: UpdateScoreboardRequest): Promise<UseCaseResult<Scoreboard>>;
}

export interface UpdateScoreboardRequest {
  gameId: string;
  homeScore?: number;
  awayScore?: number;
  currentInning?: number;
  teamAtBat?: HomeAway;
}

export interface CalculateStatisticsUseCase {
  execute(request: StatisticsRequest): Promise<UseCaseResult<StatisticsResult>>;
}

export interface StatisticsRequest {
  playerId?: string;
  teamId?: string;
  gameId?: string;
  seasonId?: string;
}

export interface StatisticsResult {
  playerStats?: Player['statistics'][];
  teamStats?: TeamStatistics;
  gameStats?: GameStatistics;
}

export interface TeamStatistics {
  teamId: string;
  games: number;
  wins: number;
  losses: number;
  totalRuns: number;
  totalHits: number;
  battingAverage: number;
}

export interface GameStatistics {
  gameId: string;
  totalAtBats: number;
  totalHits: number;
  totalRuns: number;
  innings: number;
  topPerformers: PlayerPerformance[];
}

export interface PlayerPerformance {
  playerId: string;
  playerName: string;
  hits: number;
  runs: number;
  rbis: number;
}

// Game Management Use Cases
export interface CompleteGameUseCase {
  execute(gameId: string): Promise<UseCaseResult<Game>>;
}

export interface GetGameHistoryUseCase {
  execute(request: GameHistoryRequest): Promise<UseCaseResult<Game[]>>;
}

export interface GameHistoryRequest {
  teamId?: string;
  seasonId?: string;
  limit?: number;
  offset?: number;
}

export interface GetIncompleteGamesUseCase {
  execute(): Promise<UseCaseResult<Game[]>>;
}

export interface ResumeGameUseCase {
  execute(gameId: string): Promise<UseCaseResult<GameState>>;
}

// Data Management Use Cases
export interface ExportDataUseCase {
  execute(request: ExportDataRequest): Promise<UseCaseResult<ExportPackage>>;
}

export interface ExportDataRequest {
  format: ExportFormat;
  scope: ExportScope;
  filters?: {
    teamIds?: string[];
    seasonIds?: string[];
    gameIds?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

export interface ImportDataUseCase {
  execute(request: ImportDataRequest): Promise<UseCaseResult<ImportResult>>;
}

export interface ImportDataRequest {
  file: File;
  strategy: {
    conflictResolution: 'merge' | 'replace' | 'skip';
    validateReferences: boolean;
    createMissingReferences: boolean;
  };
}

export interface ImportResult {
  success: boolean;
  importedRecords: number;
  skippedRecords: number;
  errors: string[];
  summary: {
    teams: number;
    players: number;
    games: number;
    seasons: number;
  };
}

export interface BackupDataUseCase {
  execute(): Promise<UseCaseResult<Blob>>;
}

export interface RestoreDataUseCase {
  execute(backupFile: File): Promise<UseCaseResult<RestoreResult>>;
}

export interface RestoreResult {
  success: boolean;
  restoredRecords: number;
  warnings: string[];
}

// Search and Query Use Cases
export interface SearchPlayersUseCase {
  execute(request: SearchPlayersRequest): Promise<UseCaseResult<Player[]>>;
}

export interface SearchPlayersRequest {
  query: string;
  teamId?: string;
  isActive?: boolean;
  limit?: number;
}

export interface SearchGamesUseCase {
  execute(request: SearchGamesRequest): Promise<UseCaseResult<Game[]>>;
}

export interface SearchGamesRequest {
  query?: string;
  teamId?: string;
  seasonId?: string;
  opponent?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  limit?: number;
}

export interface GetDashboardDataUseCase {
  execute(teamId?: string): Promise<UseCaseResult<DashboardData>>;
}

export interface DashboardData {
  recentGames: Game[];
  incompleteGames: Game[];
  teamSummary: TeamSummary[];
  recentActivity: Activity[];
}

export interface TeamSummary {
  team: Team;
  currentSeason: Season;
  gamesPlayed: number;
  lastGameDate?: Date;
  topPlayers: PlayerPerformance[];
}

export interface Activity {
  id: string;
  type: 'game_created' | 'game_completed' | 'player_added' | 'team_created';
  description: string;
  timestamp: Date;
  relatedEntity: {
    type: string;
    id: string;
    name: string;
  };
}

// Auto-save and Session Management Use Cases
export interface AutoSaveUseCase {
  execute(data: AutoSaveData): Promise<UseCaseResult<void>>;
}

export interface AutoSaveData {
  entityType: string;
  entityId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface RestoreSessionUseCase {
  execute(): Promise<UseCaseResult<SessionData>>;
}

export interface SessionData {
  lastActiveGame?: Game;
  preferences: UserPreferences;
  recentActivity: Activity[];
}

export interface UserPreferences {
  autoSave: boolean;
  defaultExportFormat: ExportFormat;
  confirmActions: boolean;
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
}