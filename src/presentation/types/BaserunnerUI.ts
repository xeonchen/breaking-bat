/**
 * Interface for baserunner state used in UI components
 */
export interface BaserunnerUI {
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
