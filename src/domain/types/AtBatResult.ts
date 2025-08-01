import { BattingResult } from '../values/BattingResult';

/**
 * Interface for at-bat result data from UI components
 */
export interface AtBatResult {
  batterId: string;
  result: BattingResult;
  finalCount: {
    balls: number;
    strikes: number;
  };
  pitchSequence?: string[];
  baserunnerAdvancement?: Record<string, string>;
}

/**
 * Interface for baserunner advancement data
 */
export interface BaserunnerAdvancement
  extends Record<string, string | null | undefined> {
  first?: string | null;
  second?: string | null;
  third?: string | null;
}
