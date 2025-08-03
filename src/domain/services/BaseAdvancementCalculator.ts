import { BaserunnerState } from '../values/BaserunnerState';
import { BattingResult } from '../values/BattingResult';

/**
 * Calculates standard base advancement patterns for slow-pitch softball
 * These represent the "normal" advancement without aggressive running or errors
 */
export class BaseAdvancementCalculator {
  /**
   * Calculate standard advancement for all runners and batter based on hit type
   * This represents the default, conservative advancement pattern
   */
  static calculateStandardAdvancement(
    beforeState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string
  ): {
    afterState: BaserunnerState;
    runsScored: string[];
    batterPosition: 'first' | 'second' | 'third' | 'home';
  } {
    const result = battingResult.value;
    
    // Handle non-advancement results
    if (result === 'SO' || result === 'GO' || result === 'AO') {
      return {
        afterState: beforeState,
        runsScored: [],
        batterPosition: 'first', // Doesn't matter for outs
      };
    }

    // Handle walks (force advancement only)
    if (result === 'BB' || result === 'IBB') {
      return this.calculateWalkAdvancement(beforeState, batterId);
    }

    // Handle sacrifice fly (batter out, runners may advance)
    if (result === 'SF') {
      return this.calculateSacrificeAdvancement(beforeState);
    }

    // Handle hits
    switch (result) {
      case '1B':
        return this.calculateSingleAdvancement(beforeState, batterId);
      case '2B':
        return this.calculateDoubleAdvancement(beforeState, batterId);
      case '3B':
        return this.calculateTripleAdvancement(beforeState, batterId);
      case 'HR':
        return this.calculateHomeRunAdvancement(beforeState, batterId);
      case 'FC':
        return this.calculateFieldersChoiceAdvancement(beforeState, batterId);
      case 'DP':
        return this.calculateDoublePlayAdvancement(beforeState, batterId);
      default:
        throw new Error(`Unknown batting result: ${result}`);
    }
  }

  private static calculateWalkAdvancement(
    beforeState: BaserunnerState,
    batterId: string
  ): {
    afterState: BaserunnerState;
    runsScored: string[];
    batterPosition: 'first' | 'second' | 'third' | 'home';
  } {
    const runsScored: string[] = [];
    let newFirst = beforeState.firstBase;
    let newSecond = beforeState.secondBase;
    let newThird = beforeState.thirdBase;

    // Force advancement only - runners advance only if they must
    if (beforeState.firstBase) {
      // Runner on first must move to second
      if (beforeState.secondBase) {
        // Runner on second must move to third
        if (beforeState.thirdBase) {
          // Runner on third scores (bases loaded walk)
          runsScored.push(beforeState.thirdBase);
        }
        newThird = beforeState.secondBase;
      }
      newSecond = beforeState.firstBase;
    }

    // Batter always goes to first on walk
    newFirst = batterId;

    return {
      afterState: new BaserunnerState(newFirst, newSecond, newThird),
      runsScored,
      batterPosition: 'first',
    };
  }

  private static calculateSacrificeAdvancement(
    beforeState: BaserunnerState
  ): {
    afterState: BaserunnerState;
    runsScored: string[];
    batterPosition: 'first' | 'second' | 'third' | 'home';
  } {
    const runsScored: string[] = [];
    
    // Standard sacrifice fly: runner on third scores
    if (beforeState.thirdBase) {
      runsScored.push(beforeState.thirdBase);
    }

    // Other runners may advance one base (conservative)
    const newFirst = null; // Batter is out
    const newSecond = beforeState.firstBase;
    const newThird = beforeState.secondBase;

    return {
      afterState: new BaserunnerState(newFirst, newSecond, newThird),
      runsScored,
      batterPosition: 'first', // Doesn't matter for sacrifice
    };
  }

  private static calculateSingleAdvancement(
    beforeState: BaserunnerState,
    batterId: string
  ): {
    afterState: BaserunnerState;
    runsScored: string[];
    batterPosition: 'first' | 'second' | 'third' | 'home';
  } {
    const runsScored: string[] = [];

    // Standard single advancement: all runners advance one base
    if (beforeState.thirdBase) {
      runsScored.push(beforeState.thirdBase);
    }

    const newFirst = batterId;
    const newSecond = beforeState.firstBase;
    const newThird = beforeState.secondBase;

    return {
      afterState: new BaserunnerState(newFirst, newSecond, newThird),
      runsScored,
      batterPosition: 'first',
    };
  }

  private static calculateDoubleAdvancement(
    beforeState: BaserunnerState,
    batterId: string
  ): {
    afterState: BaserunnerState;
    runsScored: string[];
    batterPosition: 'first' | 'second' | 'third' | 'home';
  } {
    const runsScored: string[] = [];

    // Standard double advancement: all runners advance two bases
    if (beforeState.thirdBase) {
      runsScored.push(beforeState.thirdBase);
    }
    if (beforeState.secondBase) {
      runsScored.push(beforeState.secondBase);
    }

    const newFirst = null;
    const newSecond = batterId;
    const newThird = beforeState.firstBase;

    return {
      afterState: new BaserunnerState(newFirst, newSecond, newThird),
      runsScored,
      batterPosition: 'second',
    };
  }

  private static calculateTripleAdvancement(
    beforeState: BaserunnerState,
    batterId: string
  ): {
    afterState: BaserunnerState;
    runsScored: string[];
    batterPosition: 'first' | 'second' | 'third' | 'home';
  } {
    const runsScored: string[] = [];

    // Standard triple advancement: all runners score
    if (beforeState.firstBase) {
      runsScored.push(beforeState.firstBase);
    }
    if (beforeState.secondBase) {
      runsScored.push(beforeState.secondBase);
    }
    if (beforeState.thirdBase) {
      runsScored.push(beforeState.thirdBase);
    }

    const newFirst = null;
    const newSecond = null;
    const newThird = batterId;

    return {
      afterState: new BaserunnerState(newFirst, newSecond, newThird),
      runsScored,
      batterPosition: 'third',
    };
  }

  private static calculateHomeRunAdvancement(
    beforeState: BaserunnerState,
    batterId: string
  ): {
    afterState: BaserunnerState;
    runsScored: string[];
    batterPosition: 'first' | 'second' | 'third' | 'home';
  } {
    const runsScored: string[] = [];

    // Home run: everyone scores
    if (beforeState.firstBase) {
      runsScored.push(beforeState.firstBase);
    }
    if (beforeState.secondBase) {
      runsScored.push(beforeState.secondBase);
    }
    if (beforeState.thirdBase) {
      runsScored.push(beforeState.thirdBase);
    }
    runsScored.push(batterId); // Batter scores too

    return {
      afterState: BaserunnerState.empty(),
      runsScored,
      batterPosition: 'home',
    };
  }

  private static calculateFieldersChoiceAdvancement(
    beforeState: BaserunnerState,
    batterId: string
  ): {
    afterState: BaserunnerState;
    runsScored: string[];
    batterPosition: 'first' | 'second' | 'third' | 'home';
  } {
    // Fielder's choice: batter reaches, lead runner typically out
    // This is simplified - actual fielder's choice can be complex
    const newFirst = batterId;
    let newSecond = beforeState.secondBase;
    let newThird = beforeState.thirdBase;
    
    // If runner on first, they're typically the one forced out
    if (beforeState.firstBase) {
      // Runner on first is out, no advancement for other runners
      newSecond = beforeState.secondBase;
      newThird = beforeState.thirdBase;
    } else {
      // No force play, runners advance normally
      newSecond = beforeState.firstBase;
      newThird = beforeState.secondBase;
    }

    return {
      afterState: new BaserunnerState(newFirst, newSecond, newThird),
      runsScored: [], // Standard fielder's choice doesn't score runs
      batterPosition: 'first',
    };
  }

  private static calculateDoublePlayAdvancement(
    beforeState: BaserunnerState,
    batterId: string
  ): {
    afterState: BaserunnerState;
    runsScored: string[];
    batterPosition: 'out';
  } {
    // Double play: batter is out and typically one base runner is also out
    // Usually the force runner (runner on first) is out
    // Other runners may or may not advance depending on the play
    
    // For simplicity, assume batter + lead runner are out, others stay
    const newFirst = null;
    const newSecond = beforeState.secondBase;
    const newThird = beforeState.thirdBase;
    
    // If runner on first, they're typically the second out
    if (beforeState.firstBase) {
      // Runner on first is out (force play)
      // Other runners might stay or advance depending on timing
    }
    
    return {
      afterState: new BaserunnerState(newFirst, newSecond, newThird),
      runsScored: [], // Double plays typically don't score runs
      batterPosition: 'out',
    };
  }

  /**
   * Calculate which runs should count as RBIs (earned by the hit, not errors)
   * In standard advancement, all runs scored are earned by the hit
   */
  static calculateStandardRBIs(
    runsScored: string[],
    battingResult: BattingResult
  ): string[] {
    // In standard advancement, all runs are earned by the hit (not errors)
    const result = battingResult.value;
    
    // No RBIs for strikeouts, ground outs, or air outs (unless rare scenarios)
    if (result === 'SO' || result === 'GO' || result === 'AO') {
      return [];
    }

    // All runs scored in standard scenarios are earned by the hit
    return [...runsScored];
  }
}