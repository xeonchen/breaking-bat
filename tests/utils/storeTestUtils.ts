/**
 * Zustand Store Testing Utilities
 *
 * This module provides utilities for testing Zustand stores with persistence middleware.
 * These utilities prevent test pollution and ensure proper test isolation.
 */

/**
 * Clears all browser storage to prevent Zustand persistence pollution between tests.
 * Must be called in beforeEach for any tests involving stores with persist middleware.
 */
export const clearZustandPersistence = (): void => {
  localStorage.clear();
  sessionStorage.clear();
};

/**
 * Resets a Zustand store to clean initial state and clears persistence.
 *
 * @param store - The Zustand store instance
 * @param initialState - The clean initial state object
 */
export const resetZustandStore = <T>(
  store: { setState: (state: Partial<T>) => void },
  initialState: T
): void => {
  clearZustandPersistence();
  store.setState(initialState);
};

/**
 * Standard initial state for teams store testing
 */
export const getCleanTeamsStoreState = () => ({
  teams: [],
  selectedTeam: null,
  loading: false,
  error: null,
  playerStats: {},
});

/**
 * Standard initial state for game store testing
 */
export const getCleanGameStoreState = () => ({
  currentGame: null,
  teams: [],
  lineup: [],
  currentBatter: null,
  currentInning: 1,
  isTopInning: true,
  baserunners: { first: null, second: null, third: null },
  currentCount: { balls: 0, strikes: 0 },
  loading: false,
  error: null,
});

/**
 * Standard initial state for games store testing
 */
export const getCleanGamesStoreState = () => ({
  games: [],
  seasons: [],
  gameTypes: [],
  teams: [],
  selectedGame: null,
  loading: false,
  error: null,
  searchQuery: '',
  statusFilter: 'all' as const,
});

/**
 * Creates a mock function with proper TypeScript typing for Zustand stores
 */
export const createMockStoreMethod = <
  T extends (...args: unknown[]) => unknown,
>(): jest.MockedFunction<T> => {
  return jest.fn() as unknown as jest.MockedFunction<T>;
};

/**
 * Validation helper to ensure all persistent state is cleared
 */
export const validateStorageCleared = (): void => {
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
};
