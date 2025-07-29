/**
 * Domain Entity Interfaces
 * 
 * Core business entities for the Breaking-Bat slowpitch softball scoring app.
 * These interfaces define the structure of our domain objects following 
 * Clean Architecture principles.
 */

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Core domain entities
export interface Team extends BaseEntity {
  name: string;
  seasonIds: string[];
  playerIds: string[];
}

export interface Season extends BaseEntity {
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  teamIds: string[];
}

export interface GameType extends BaseEntity {
  name: string;
  description: string;
}

export interface Player extends BaseEntity {
  name: string;
  jerseyNumber: number;
  position?: Position;
  teamId: string;
  isActive: boolean;
  statistics: PlayerStatistics;
}

export interface Game extends BaseEntity {
  name: string;
  opponent: string;
  date: Date;
  seasonId: string;
  gameTypeId: string;
  homeAway: HomeAway;
  teamId: string;
  status: GameStatus;
  lineup?: Lineup;
  innings: Inning[];
  finalScore?: GameScore;
}

export interface Lineup extends BaseEntity {
  gameId: string;
  battingOrder: LineupPosition[];
  substitutes: string[]; // player IDs
}

export interface LineupPosition {
  battingOrder: number;
  playerId: string;
  defensivePosition: Position;
  isStarting: boolean;
}

export interface Inning extends BaseEntity {
  gameId: string;
  number: number;
  teamAtBat: HomeAway;
  runsScored: number;
  atBats: AtBat[];
  isComplete: boolean;
}

export interface AtBat extends BaseEntity {
  gameId: string;
  inningId: string;
  batterId: string;
  battingPosition: number;
  result: BattingResult;
  rbis: number;
  runsScored: string[]; // player IDs who scored
  baserunnersBefore: BaserunnerState;
  baserunnersAfter: BaserunnerState;
  timestamp: Date;
}

export interface BaserunnerState {
  firstBase: string | null; // player ID
  secondBase: string | null; // player ID
  thirdBase: string | null; // player ID
}

export interface GameScore {
  homeScore: number;
  awayScore: number;
  inningScores: InningScore[];
}

export interface InningScore {
  inning: number;
  homeRuns: number;
  awayRuns: number;
}

export interface PlayerStatistics {
  games: number;
  atBats: number;
  hits: number;
  runs: number;
  rbis: number;
  singles: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  walks: number;
  strikeouts: number;
  battingAverage: number;
  onBasePercentage: number;
  sluggingPercentage: number;
}

export interface Scoreboard {
  gameId: string;
  currentInning: number;
  teamAtBat: HomeAway;
  homeScore: number;
  awayScore: number;
  inningScores: InningScore[];
  currentBatter?: {
    playerId: string;
    battingPosition: number;
  };
  baserunners: BaserunnerState;
}

// Export/Import data structures
export interface ExportPackage {
  id: string;
  format: ExportFormat;
  scope: ExportScope;
  data: ExportData;
  metadata: ExportMetadata;
  createdAt: Date;
  version: string;
}

export interface ExportData {
  teams?: Team[];
  players?: Player[];
  games?: Game[];
  seasons?: Season[];
  gameTypes?: GameType[];
}

export interface ExportMetadata {
  appVersion: string;
  exportedBy: string;
  totalRecords: number;
  dataIntegrity: string; // hash
}

export interface ImportSession {
  id: string;
  fileName: string;
  status: ImportStatus;
  validationResults: ValidationResult[];
  conflicts: DataConflict[];
  importedCount: number;
  createdAt: Date;
}

export interface ValidationResult {
  entity: string;
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface DataConflict {
  entityType: string;
  entityId: string;
  field: string;
  existingValue: any;
  newValue: any;
  resolution?: 'keep_existing' | 'use_new' | 'merge';
}

// Enums and type unions
export type Position = 
  | 'pitcher' 
  | 'catcher' 
  | 'first-base' 
  | 'second-base' 
  | 'third-base' 
  | 'shortstop' 
  | 'left-field' 
  | 'center-field' 
  | 'right-field';

export type HomeAway = 'home' | 'away';

export type GameStatus = 'setup' | 'in_progress' | 'completed' | 'suspended';

export type BattingResult = 
  | '1B'  // Single
  | '2B'  // Double  
  | '3B'  // Triple
  | 'HR'  // Home Run
  | 'BB'  // Base on Balls (Walk)
  | 'IBB' // Intentional Base on Balls
  | 'SF'  // Sacrifice Fly
  | 'E'   // Error
  | 'FC'  // Fielder's Choice
  | 'SO'  // Strikeout
  | 'GO'  // Ground Out
  | 'AO'  // Air Out
  | 'DP'; // Double Play

export type ExportFormat = 'JSON' | 'CSV';

export type ExportScope = 'single_game' | 'team_season' | 'all_data';

export type ImportStatus = 'pending' | 'validating' | 'importing' | 'completed' | 'failed';

export type ImportStrategy = 'merge' | 'replace' | 'skip_duplicates';