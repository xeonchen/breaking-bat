/**
 * Game Application Service Interface
 */

import { Result } from '@/application/common/Result';

// Command DTOs - Write Operations
export interface CreateGameCommand {
  name: string;
  teamId: string;
  opponent: string;
  date: Date;
  location?: string;
  seasonId?: string;
  gameTypeId?: string;
  isHomeGame?: boolean;
}

export interface UpdateGameCommand {
  gameId: string;
  name?: string;
  opponent?: string;
  date?: Date;
  location?: string;
  isHomeGame?: boolean;
}

export interface SetupLineupCommand {
  gameId: string;
  playerIds: string[];
  defensivePositions: string[];
  battingOrder: number[];
  lineupName?: string;
}

export interface StartGameCommand {
  gameId: string;
  startingLineupId: string;
  weather?: string;
  temperature?: number;
  notes?: string;
}

export interface RecordAtBatCommand {
  gameId: string;
  batterId: string;
  battingResult: string;
  description?: string;
  rbis: number;
  runsScored: string[];
  baserunnersBefore: BaserunnerStateData;
  baserunnersAfter: BaserunnerStateData;
  pitchCount?: PitchCountData;
  fieldingCredits?: FieldingCreditData[];
}

export interface EndGameCommand {
  gameId: string;
  finalScore: ScoreData;
  gameEndReason: 'completed' | 'mercy_rule' | 'forfeit' | 'weather' | 'other';
  notes?: string;
}

export interface AddInningCommand {
  gameId: string;
  inningNumber: number;
  isTop: boolean;
}

export interface SubstitutePlayerCommand {
  gameId: string;
  outgoingPlayerId: string;
  incomingPlayerId: string;
  position?: string;
  inning: number;
  reason?: string;
}

// Query DTOs - Read Operations
export interface GetGameByIdQuery {
  gameId: string;
  includeLineups?: boolean;
  includeAtBats?: boolean;
  includeStatistics?: boolean;
}

export interface GetGamesByTeamQuery {
  teamId: string;
  seasonId?: string;
  gameTypeId?: string;
  status?: GameStatus;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface GetGamesBySeasonQuery {
  seasonId: string;
  teamId?: string;
  status?: GameStatus;
  sortBy?: 'date' | 'name' | 'opponent';
  sortDirection?: 'asc' | 'desc';
}

export interface GetCurrentGamesQuery {
  teamId?: string;
  limit?: number;
}

export interface GetGameLineupQuery {
  gameId: string;
  lineupId: string;
}

export interface GetGameStatisticsQuery {
  gameId: string;
  teamId?: string;
  includeBenchPlayers?: boolean;
}

export interface GetInningDetailsQuery {
  gameId: string;
  inningNumber: number;
  isTop?: boolean;
}

// Result DTOs - Response Objects
export interface GameDto {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  opponent: string;
  date: Date;
  location?: string;
  isHomeGame: boolean;
  status: GameStatus;
  seasonId?: string;
  gameTypeId?: string;
  currentInning?: number;
  isTopInning?: boolean;
  score?: ScoreData;
  weather?: WeatherData;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameWithDetailsDto extends GameDto {
  lineups: LineupDto[];
  atBats: AtBatDto[];
  statistics: GameStatisticsDto;
  substitutions: SubstitutionDto[];
}

export interface LineupDto {
  id: string;
  gameId: string;
  name?: string;
  playerIds: string[];
  defensivePositions: string[];
  battingOrder: number[];
  isActive: boolean;
  createdAt: Date;
}

export interface AtBatDto {
  id: string;
  gameId: string;
  batterId: string;
  batterName: string;
  inning: number;
  isTopInning: boolean;
  battingPosition: number;
  result: string;
  description?: string;
  rbis: number;
  runsScored: string[];
  baserunnersBefore: BaserunnerStateData;
  baserunnersAfter: BaserunnerStateData;
  pitchCount?: PitchCountData;
  fieldingCredits?: FieldingCreditData[];
  timestamp: Date;
}

export interface GameStatisticsDto {
  gameId: string;
  teamStatistics: TeamGameStatsDto;
  playerStatistics: PlayerGameStatsDto[];
  inningScores: InningScoreDto[];
  gameFlow: GameFlowEventDto[];
}

export interface TeamGameStatsDto {
  teamId: string;
  runs: number;
  hits: number;
  errors: number;
  leftOnBase: number;
  atBats: number;
  battingAverage: number;
  onBasePercentage: number;
}

export interface PlayerGameStatsDto {
  playerId: string;
  playerName: string;
  position: string;
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  walks: number;
  strikeouts: number;
  battingAverage: number;
  fieldingAttempts: number;
  fieldingErrors: number;
  fieldingPercentage: number;
}

export interface SubstitutionDto {
  id: string;
  gameId: string;
  outgoingPlayerId: string;
  outgoingPlayerName: string;
  incomingPlayerId: string;
  incomingPlayerName: string;
  position?: string;
  inning: number;
  reason?: string;
  timestamp: Date;
}

export interface InningScoreDto {
  inning: number;
  isTop: boolean;
  runs: number;
  hits: number;
  errors: number;
  leftOnBase: number;
}

export interface GameFlowEventDto {
  id: string;
  gameId: string;
  inning: number;
  isTopInning: boolean;
  eventType: 'at_bat' | 'substitution' | 'inning_end' | 'game_end';
  description: string;
  timestamp: Date;
  relatedAtBatId?: string;
  relatedSubstitutionId?: string;
}

// Supporting Data Types
export interface BaserunnerStateData {
  firstBase: string | null;
  secondBase: string | null;
  thirdBase: string | null;
}

export interface ScoreData {
  homeScore: number;
  awayScore: number;
  inningScores: InningScoreData[];
}

export interface InningScoreData {
  inning: number;
  homeRuns: number;
  awayRuns: number;
}

export interface PitchCountData {
  balls: number;
  strikes: number;
  pitchSequence?: string[];
}

export interface FieldingCreditData {
  playerId: string;
  creditType: 'assist' | 'putout' | 'error';
  description?: string;
}

export interface WeatherData {
  conditions: string;
  temperature?: number;
  windSpeed?: number;
  windDirection?: string;
  humidity?: number;
}

export type GameStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'postponed'
  | 'suspended';

/**
 * Game Application Service Interface
 *
 * Provides a high-level API for game management and gameplay operations.
 * Implements CQRS by separating commands (write) from queries (read).
 */
export interface IGameApplicationService {
  // Command Operations (Write Side)

  /**
   * Creates a new game
   */
  createGame(command: CreateGameCommand): Promise<Result<GameDto>>;

  /**
   * Updates an existing game
   */
  updateGame(command: UpdateGameCommand): Promise<Result<GameDto>>;

  /**
   * Sets up a lineup for a game
   */
  setupLineup(command: SetupLineupCommand): Promise<Result<LineupDto>>;

  /**
   * Starts a game with the specified lineup
   */
  startGame(command: StartGameCommand): Promise<Result<GameDto>>;

  /**
   * Records an at-bat result
   */
  recordAtBat(command: RecordAtBatCommand): Promise<Result<AtBatDto>>;

  /**
   * Ends a game with final score
   */
  endGame(command: EndGameCommand): Promise<Result<GameDto>>;

  /**
   * Adds a new inning to the game
   */
  addInning(command: AddInningCommand): Promise<Result<void>>;

  /**
   * Substitutes a player during the game
   */
  substitutePlayer(
    command: SubstitutePlayerCommand
  ): Promise<Result<SubstitutionDto>>;

  // Query Operations (Read Side)

  /**
   * Gets a game by ID with optional includes
   */
  getGameById(
    query: GetGameByIdQuery
  ): Promise<Result<GameWithDetailsDto | null>>;

  /**
   * Gets games by team with filtering
   */
  getGamesByTeam(query: GetGamesByTeamQuery): Promise<
    Result<{
      games: GameDto[];
      totalCount: number;
      hasMore: boolean;
    }>
  >;

  /**
   * Gets games by season
   */
  getGamesBySeason(query: GetGamesBySeasonQuery): Promise<Result<GameDto[]>>;

  /**
   * Gets currently active games
   */
  getCurrentGames(query: GetCurrentGamesQuery): Promise<Result<GameDto[]>>;

  /**
   * Gets a specific lineup for a game
   */
  getGameLineup(query: GetGameLineupQuery): Promise<Result<LineupDto | null>>;

  /**
   * Gets comprehensive game statistics
   */
  getGameStatistics(
    query: GetGameStatisticsQuery
  ): Promise<Result<GameStatisticsDto>>;

  /**
   * Gets details for a specific inning
   */
  getInningDetails(query: GetInningDetailsQuery): Promise<
    Result<{
      atBats: AtBatDto[];
      score: InningScoreDto;
      events: GameFlowEventDto[];
    }>
  >;
}
