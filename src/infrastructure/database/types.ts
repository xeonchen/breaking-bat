import Dexie, { Table } from 'dexie';

// Database record interfaces that match entity structures
export interface TeamRecord {
  id: string;
  name: string;
  seasonIds: string[];
  playerIds: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlayerRecord {
  id: string;
  name: string;
  jerseyNumber: number;
  teamId: string;
  positions: string[]; // Position values serialized as strings
  isActive: boolean;
  statistics: {
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
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SeasonRecord {
  id: string;
  name: string;
  year: number;
  startDate: Date;
  endDate: Date;
  teamIds: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameTypeRecord {
  id: string;
  name: string;
  description?: string;
  ruleVariations?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GameRecord {
  id: string;
  name: string;
  opponent: string;
  date: Date;
  seasonId: string | null;
  gameTypeId: string | null;
  homeAway: 'home' | 'away';
  teamId: string;
  status: 'setup' | 'in_progress' | 'completed' | 'suspended';
  lineupId: string | null;
  inningIds: string[];
  finalScore: {
    homeScore: number;
    awayScore: number;
    inningScores: {
      inning: number;
      homeRuns: number;
      awayRuns: number;
    }[];
  } | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InningRecord {
  id: string;
  gameId: string;
  inningNumber: number;
  isTop: boolean;
  runs: number;
  hits: number;
  errors: number;
  battingTeamId: string;
  isComplete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LineupRecord {
  id: string;
  gameId: string;
  playerIds: string[]; // Array of player IDs in batting order
  defensivePositions: string[]; // Array of defensive positions corresponding to playerIds
  createdAt: Date;
  updatedAt: Date;
}

export interface AtBatRecord {
  id: string;
  gameId: string;
  inningId: string;
  batterId: string;
  battingPosition: number;
  result: string; // BattingResult value
  description: string;
  rbis: number;
  runsScored: string[]; // player IDs who scored
  runningErrors: string[]; // player IDs who made running errors
  baserunnersBefore: {
    firstBase?: string;
    secondBase?: string;
    thirdBase?: string;
  };
  baserunnersAfter: {
    firstBase?: string;
    secondBase?: string;
    thirdBase?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BreakingBatDatabase extends Dexie {
  teams: Table<TeamRecord>;
  players: Table<PlayerRecord>;
  seasons: Table<SeasonRecord>;
  gameTypes: Table<GameTypeRecord>;
  games: Table<GameRecord>;
  lineups: Table<LineupRecord>;
  innings: Table<InningRecord>;
  atBats: Table<AtBatRecord>;
}
