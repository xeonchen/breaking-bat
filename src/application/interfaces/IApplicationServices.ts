/**
 * Application Layer Service Interfaces
 *
 * These interfaces define the contracts that the Application layer exposes
 * to the Presentation layer. They represent the use cases and business
 * operations available to the UI.
 */

import { Team, Game, Season, GameType, AtBat } from '@/domain/entities';
import { Result } from '../common/Result';

/**
 * Team Management Service Interface
 * Handles all team-related operations
 */
export interface ITeamApplicationService {
  createTeam(command: CreateTeamCommand): Promise<Result<Team>>;
  addPlayer(command: AddPlayerCommand): Promise<Result<void>>;
  updatePlayer(command: UpdatePlayerCommand): Promise<Result<void>>;
  removePlayer(command: RemovePlayerCommand): Promise<Result<void>>;
  getTeams(): Promise<Result<Team[]>>;
  getTeamById(id: string): Promise<Result<Team | null>>;
}

/**
 * Game Management Service Interface
 * Handles all game-related operations
 */
export interface IGameApplicationService {
  createGame(command: CreateGameCommand): Promise<Result<Game>>;
  setupLineup(command: SetupLineupCommand): Promise<Result<void>>;
  recordAtBat(command: RecordAtBatCommand): Promise<Result<AtBat>>;
  getGames(): Promise<Result<Game[]>>;
  getGameById(id: string): Promise<Result<Game | null>>;
  getCurrentGame(): Promise<Result<Game | null>>;
}

/**
 * Data Management Service Interface
 * Handles data initialization and management
 */
export interface IDataApplicationService {
  loadDefaultData(): Promise<Result<LoadDefaultDataResult>>;
  getSeasons(): Promise<Result<Season[]>>;
  getGameTypes(): Promise<Result<GameType[]>>;
}

// Command DTOs
export interface CreateTeamCommand {
  name: string;
  seasonIds?: string[];
  playerIds?: string[];
}

export interface AddPlayerCommand {
  teamId: string;
  name: string;
  jerseyNumber: number;
  positions: string[];
  isActive: boolean;
}

export interface UpdatePlayerCommand {
  playerId: string;
  name?: string;
  jerseyNumber?: number;
  positions?: string[];
  isActive?: boolean;
}

export interface RemovePlayerCommand {
  teamId: string;
  playerId: string;
}

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
  result: string;
  description?: string;
  rbis: number;
  runsScored: string[];
}

export interface LoadDefaultDataResult {
  teamsCreated: number;
  playersCreated: number;
  seasonsCreated: number;
  gameTypesCreated: number;
}
