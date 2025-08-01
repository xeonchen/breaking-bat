import Dexie, { Table } from 'dexie';

export interface BreakingBatDatabase extends Dexie {
  teams: Table<any>;
  players: Table<any>;
  seasons: Table<any>;
  gameTypes: Table<any>;
  games: Table<any>;
  innings: Table<any>;
  atBats: Table<any>;
}
