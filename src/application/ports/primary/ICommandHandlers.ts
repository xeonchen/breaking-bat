/**
 * Primary Ports - Command Handlers (Application Core Input)
 *
 * These are the "driving" side ports - interfaces that define what
 * external actors (UI, REST APIs, etc.) can request from our application.
 *
 * Following CQRS pattern for clear separation of commands and queries.
 */

import { Result } from '@/application/common/Result';

/**
 * Generic Command Handler Interface
 */
export interface ICommandHandler<TCommand, TResult = void> {
  handle(command: TCommand): Promise<Result<TResult>>;
}

/**
 * Generic Query Handler Interface
 */
export interface IQueryHandler<TQuery, TResult> {
  handle(query: TQuery): Promise<Result<TResult>>;
}

// Team Management Commands
export interface CreateTeamCommand {
  name: string;
  seasonIds?: string[];
}

export interface AddPlayerToTeamCommand {
  teamId: string;
  playerName: string;
  jerseyNumber: number;
  positions: string[];
  isActive: boolean;
}

export interface UpdatePlayerCommand {
  playerId: string;
  playerName?: string;
  jerseyNumber?: number;
  positions?: string[];
  isActive?: boolean;
}

export interface RemovePlayerFromTeamCommand {
  teamId: string;
  playerId: string;
}

// Game Management Commands
export interface CreateGameCommand {
  name: string;
  teamId: string;
  opponent: string;
  date: Date;
  seasonId?: string;
  gameTypeId?: string;
}

export interface SetupLineupCommand {
  gameId: string;
  playerIds: string[];
  defensivePositions: string[];
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
}

// Query Objects
export interface GetTeamsQuery {
  seasonId?: string;
  includeInactive?: boolean;
}

export interface GetGameQuery {
  gameId: string;
}

export interface GetPlayerStatsQuery {
  playerId: string;
  seasonId?: string;
}

export interface GetTeamStatsQuery {
  teamId: string;
  seasonId?: string;
}

// Supporting Data Types
export interface BaserunnerStateData {
  firstBase: string | null;
  secondBase: string | null;
  thirdBase: string | null;
}

export interface PlayerData {
  id: string;
  name: string;
  jerseyNumber: number;
  positions: string[];
  isActive: boolean;
}

export interface TeamData {
  id: string;
  name: string;
  players: PlayerData[];
  seasonIds: string[];
}

export interface GameData {
  id: string;
  name: string;
  teamId: string;
  opponent: string;
  date: Date;
  status: string;
  score?: ScoreData;
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

export interface StatsData {
  battingAverage: number;
  hits: number;
  atBats: number;
  runs: number;
  rbis: number;
  homeRuns: number;
  strikeouts: number;
}
