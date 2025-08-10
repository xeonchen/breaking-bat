import { initializeDatabase } from '@/infrastructure/database/connection';
import { Lineup, LineupPosition } from '@/domain';
import Dexie from 'dexie';

export interface TestPlayerData {
  playerId: string;
  playerName: string;
  battingOrder: number;
}

export class DatabaseHelper {
  private db: Dexie | null = null;

  async initializeTestDatabase(): Promise<void> {
    this.db = initializeDatabase();
  }

  async cleanDatabase(): Promise<void> {
    if (!this.db) return;

    // Use Dexie's table clearing instead of raw IndexedDB
    await Promise.all([
      this.db.table('games').clear(),
      this.db.table('atBats').clear(),
    ]);
  }

  async createTestLineup(
    teamId: string,
    players: TestPlayerData[]
  ): Promise<Lineup> {
    const battingOrder: LineupPosition[] = players.map(
      (player) =>
        new LineupPosition(
          player.battingOrder,
          player.playerId,
          'first-base', // Default position for testing
          true
        )
    );

    const lineup = new Lineup(
      `test-lineup-${Date.now()}`,
      `test-game-${teamId}`,
      battingOrder,
      [], // substitutes
      new Date(),
      new Date()
    );

    // Note: In a real implementation, lineups would be saved to database
    // For testing purposes, we'll just return the lineup object

    return lineup;
  }

  async closeTestDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
