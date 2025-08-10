/**
 * Interface for baserunner state used in live scoring
 */
export interface BaserunnerState {
  first: { playerId: string; playerName: string } | null;
  second: { playerId: string; playerName: string } | null;
  third: { playerId: string; playerName: string } | null;
}

/**
 * Type for manual baserunner advancement override
 */
export type BaserunnerAdvancement = Record<
  string,
  'stay' | 'first' | 'second' | 'third' | 'home' | 'out'
>;
