import { BattingResult, BaserunnerState } from '@/domain';
// Domain service should only work with domain types

export interface AdvancementResult {
  finalBaserunners: BaserunnerState;
  scoringRunners: string[];
  rbis: number;
}

export class BaserunnerAdvancementService {
  // Removed conversion method - domain service should only work with domain types

  /**
   * Calculate standard softball baserunner advancement based on batting result
   */
  public calculateStandardAdvancement(
    initialState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string
  ): AdvancementResult {
    const scoringRunners: string[] = [];
    let rbis = 0;
    let newFirst: string | null = null;
    let newSecond: string | null = null;
    let newThird: string | null = null;

    switch (battingResult.value) {
      case '1B': // Single
        // Batter to first base
        newFirst = batterId;

        // Runner from 3rd scores
        if (initialState.thirdBase) {
          scoringRunners.push(initialState.thirdBase);
          rbis++;
        }

        // Runner from 2nd scores
        if (initialState.secondBase) {
          scoringRunners.push(initialState.secondBase);
          rbis++;
        }

        // Runner from 1st advances to 2nd
        if (initialState.firstBase) {
          newSecond = initialState.firstBase;
        }
        break;

      case '2B': // Double
        // Batter to second base
        newSecond = batterId;

        // All existing runners advance two bases (and score from 2nd/3rd)
        if (initialState.firstBase) {
          scoringRunners.push(initialState.firstBase);
          rbis++;
        }
        if (initialState.secondBase) {
          scoringRunners.push(initialState.secondBase);
          rbis++;
        }
        if (initialState.thirdBase) {
          scoringRunners.push(initialState.thirdBase);
          rbis++;
        }
        break;

      case '3B': // Triple
        // Batter to third base
        newThird = batterId;

        // All existing runners score
        if (initialState.firstBase) {
          scoringRunners.push(initialState.firstBase);
          rbis++;
        }
        if (initialState.secondBase) {
          scoringRunners.push(initialState.secondBase);
          rbis++;
        }
        if (initialState.thirdBase) {
          scoringRunners.push(initialState.thirdBase);
          rbis++;
        }
        break;

      case 'HR': // Home Run
        // All runners score including batter
        if (initialState.firstBase) {
          scoringRunners.push(initialState.firstBase);
          rbis++;
        }
        if (initialState.secondBase) {
          scoringRunners.push(initialState.secondBase);
          rbis++;
        }
        if (initialState.thirdBase) {
          scoringRunners.push(initialState.thirdBase);
          rbis++;
        }
        // Batter scores
        scoringRunners.push(batterId);
        rbis++;
        // Bases are cleared for home runs
        break;

      case 'BB':
      case 'IBB': // Walk/Intentional Walk
        // Batter to first base
        newFirst = batterId;

        // Force advancement only
        if (initialState.firstBase) {
          newSecond = initialState.firstBase;

          // If 2nd base occupied, force to 3rd
          if (initialState.secondBase) {
            newThird = initialState.secondBase;

            // If 3rd base occupied (bases loaded), force home
            if (initialState.thirdBase) {
              scoringRunners.push(initialState.thirdBase);
              rbis++;
            }
          } else {
            // Keep runner from 3rd in place (not forced)
            newThird = initialState.thirdBase;
          }
        } else {
          // No forced advancement if 1st base was empty
          newSecond = initialState.secondBase;
          newThird = initialState.thirdBase;
        }
        break;

      case 'SF': // Sacrifice Fly
        // Batter is out, but runner from 3rd scores
        if (initialState.thirdBase) {
          scoringRunners.push(initialState.thirdBase);
          rbis++;
        }
        // Other runners may advance at scorekeeper's discretion (manual override)
        newFirst = initialState.firstBase;
        newSecond = initialState.secondBase;
        // Third base is now empty after sacrifice fly
        break;

      case 'SO':
      case 'GO':
      case 'AO': // Outs (Strikeout, Ground Out, Air Out)
        // No advancement on outs (unless stealing/wild pitch - manual override)
        newFirst = initialState.firstBase;
        newSecond = initialState.secondBase;
        newThird = initialState.thirdBase;
        break;

      case 'E': // Error
        // Batter reaches base, advancement determined by scorekeeper
        newFirst = batterId;
        // Keep existing runners in place by default (manual override available)
        newSecond = initialState.secondBase;
        newThird = initialState.thirdBase;
        // No RBIs awarded for errors
        break;

      case 'FC': // Fielder's Choice
        // Batter reaches first, advancement determined by play situation
        newFirst = batterId;
        // Default to keeping other runners in place (manual override needed)
        newSecond = initialState.secondBase;
        newThird = initialState.thirdBase;
        break;

      default:
        // Unknown result, keep status quo
        newFirst = initialState.firstBase;
        newSecond = initialState.secondBase;
        newThird = initialState.thirdBase;
        break;
    }

    const finalBaserunners = new BaserunnerState(newFirst, newSecond, newThird);

    return {
      finalBaserunners,
      scoringRunners,
      rbis,
    };
  }

  /**
   * Apply manual overrides to baserunner advancement
   */
  public applyManualOverrides(
    initialState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string,
    manualOverrides: Record<string, string>
  ): AdvancementResult {
    // Validate overrides before applying them
    this.validateManualOverrides(initialState, manualOverrides);

    // Apply manual overrides
    const scoringRunners: string[] = [];
    let rbis = 0;
    let newFirst: string | null = null;
    let newSecond: string | null = null;
    let newThird: string | null = null;

    // Handle batter placement (always goes somewhere unless out)
    if (
      battingResult.isHit() ||
      battingResult.value === 'BB' ||
      battingResult.value === 'IBB' ||
      battingResult.value === 'E' ||
      battingResult.value === 'FC'
    ) {
      if (
        battingResult.value === '1B' ||
        battingResult.value === 'BB' ||
        battingResult.value === 'IBB' ||
        battingResult.value === 'E' ||
        battingResult.value === 'FC'
      ) {
        newFirst = batterId;
      } else if (battingResult.value === '2B') {
        newSecond = batterId;
      } else if (battingResult.value === '3B') {
        newThird = batterId;
      }
      // Home runs score the batter, so no base placement needed
    }

    // Apply overrides for each existing runner
    const runners = [
      { position: 'first', runner: initialState.firstBase },
      { position: 'second', runner: initialState.secondBase },
      { position: 'third', runner: initialState.thirdBase },
    ];

    for (const { position, runner } of runners) {
      if (!runner) continue;

      const override = manualOverrides[runner];
      if (!override) {
        // No override, use standard advancement
        continue;
      }

      switch (override) {
        case 'stay':
          // Runner stays at current base
          if (position === 'first') {
            newFirst = runner;
          } else if (position === 'second') {
            newSecond = runner;
          } else if (position === 'third') {
            newThird = runner;
          }
          break;
        case 'second':
          newSecond = runner;
          break;
        case 'third':
          newThird = runner;
          break;
        case 'home':
          scoringRunners.push(runner);
          // Only count RBI if not on error
          if (battingResult.value !== 'E') {
            rbis++;
          }
          break;
        case 'out':
          // Runner is out, doesn't advance
          break;
      }
    }

    // Note: Batter scoring for HR is already handled in calculateStandardAdvancement
    // This prevents duplicate scoring of the batter

    const finalBaserunners = new BaserunnerState(newFirst, newSecond, newThird);

    return {
      finalBaserunners,
      scoringRunners,
      rbis,
    };
  }

  /**
   * Validate manual overrides don't create impossible scenarios
   */
  private validateManualOverrides(
    initialState: BaserunnerState,
    manualOverrides: Record<string, string>
  ): void {
    // Check for runners passing each other
    // Map initial positions and overrides
    const runnerActions = new Map<number, string>(); // base -> action

    if (initialState.firstBase && manualOverrides[initialState.firstBase]) {
      runnerActions.set(1, manualOverrides[initialState.firstBase]);
    }
    if (initialState.secondBase && manualOverrides[initialState.secondBase]) {
      runnerActions.set(2, manualOverrides[initialState.secondBase]);
    }
    if (initialState.thirdBase && manualOverrides[initialState.thirdBase]) {
      runnerActions.set(3, manualOverrides[initialState.thirdBase]);
    }

    // Check for illegal passing scenarios
    for (let base = 1; base <= 3; base++) {
      const action = runnerActions.get(base);
      if (action === 'home') {
        // This runner is scoring, check if any runner ahead is staying
        for (let aheadBase = base + 1; aheadBase <= 3; aheadBase++) {
          const aheadAction = runnerActions.get(aheadBase);
          if (aheadAction === 'stay') {
            throw new Error('Runner cannot pass another runner');
          }
        }
      }
    }
  }
}
