import {
  PresentationPosition,
  PresentationGameStatus,
  PresentationBaserunnerState,
} from './presentation-values';

/**
 * Presentation layer DTOs for domain entities
 * These provide a clean interface for the presentation layer without domain dependencies
 */

/**
 * Player DTO for presentation layer
 */
export interface PlayerDTO {
  id: string;
  name: string;
  jerseyNumber: number;
  positions: PresentationPosition[];
  isActive: boolean;
  teamId: string;
  statistics?: PlayerStatisticsDTO;
}

/**
 * Player statistics DTO for presentation layer
 */
export interface PlayerStatisticsDTO {
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  runs: number;
  rbis: number;
  walks: number;
  strikeouts: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
}

/**
 * Team DTO for presentation layer
 */
export interface TeamDTO {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Team with players DTO for presentation layer
 */
export interface TeamWithPlayersDTO {
  id: string;
  name: string;
  players: PlayerDTO[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Game DTO for presentation layer
 */
export interface GameDTO {
  id: string;
  name: string;
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  gameTypeId: string;
  status: PresentationGameStatus;
  currentInning: number;
  isTopInning: boolean;
  homeScore: number;
  awayScore: number;
  lineupId?: string;
  currentBatterId?: string;
  currentBaserunners: PresentationBaserunnerState;
  totalInnings: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Season DTO for presentation layer
 */
export interface SeasonDTO {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Game type DTO for presentation layer
 */
export interface GameTypeDTO {
  id: string;
  name: string;
  inningsCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * At-bat DTO for presentation layer
 */
export interface AtBatDTO {
  id: string;
  gameId: string;
  inningId: string;
  batterId: string;
  pitchCount: number;
  result: string; // Will be converted to/from PresentationBattingResult
  description: string;
  rbis: number;
  runsScored: string[];
  outsRecorded: string[];
  baserunnersBefore: PresentationBaserunnerState;
  baserunnersAfter: PresentationBaserunnerState;
  createdAt: Date;
}

/**
 * Lineup entry DTO for presentation layer
 */
export interface LineupEntryDTO {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  battingOrder: number;
  positions: PresentationPosition[];
  isActive: boolean;
}

/**
 * Lineup DTO for presentation layer
 */
export interface LineupDTO {
  id: string;
  gameId: string;
  entries: LineupEntryDTO[];
  createdAt: Date;
  updatedAt: Date;
}
