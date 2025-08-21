import {
  BattingResult,
  BaserunnerState as BaserunnerStateClass,
} from '@/domain';
// Import removed - using domain BaserunnerState class instead

export interface AdvancementResult {
  finalBaserunners: BaserunnerStateClass;
  finalBaserunnersClass: BaserunnerStateClass;
  scoringRunners: string[];
  rbis: number;
}

export class BaserunnerAdvancementService {
  /**
   * Convert interface-style baserunner state to class instance
   */
  private toBaserunnerStateClass(state: BaserunnerState): BaserunnerStateClass {
    return new BaserunnerStateClass(
      state.first?.playerId || null,
      state.second?.playerId || null,
      state.third?.playerId || null
    );
  }

  /**
   * Calculate standard softball baserunner advancement based on batting result
   */
  public calculateStandardAdvancement(
    initialState: BaserunnerState,
    battingResult: BattingResult,
    batterId: string
  ): AdvancementResult {
    const finalBaserunners: BaserunnerState = {
      first: null,
      second: null,
      third: null,
    };
    const scoringRunners: string[] = [];
    let rbis = 0;

    // Get batter name for placement on bases
    const batterName = `Batter ${batterId.slice(-1)}`;

    switch (battingResult.value) {
      case '1B': // Single
        // Batter to first base
        finalBaserunners.first = { playerId: batterId, playerName: batterName };

        // Runner from 3rd scores
        if (initialState.third) {
          scoringRunners.push(initialState.third.playerId);
          rbis++;
        }

        // Runner from 2nd scores
        if (initialState.second) {
          scoringRunners.push(initialState.second.playerId);
          rbis++;
        }

        // Runner from 1st advances to 2nd
        if (initialState.first) {
          finalBaserunners.second = initialState.first;
        }
        break;

      case '2B': // Double
        // Batter to second base
        finalBaserunners.second = {
          playerId: batterId,
          playerName: batterName,
        };

        // All existing runners advance two bases (and score from 2nd/3rd)
        if (initialState.first) {
          scoringRunners.push(initialState.first.playerId);
          rbis++;
        }
        if (initialState.second) {
          scoringRunners.push(initialState.second.playerId);
          rbis++;
        }
        if (initialState.third) {
          scoringRunners.push(initialState.third.playerId);
          rbis++;
        }
        break;

      case '3B': // Triple
        // Batter to third base
        finalBaserunners.third = { playerId: batterId, playerName: batterName };

        // All existing runners score
        if (initialState.first) {
          scoringRunners.push(initialState.first.playerId);
          rbis++;
        }
        if (initialState.second) {
          scoringRunners.push(initialState.second.playerId);
          rbis++;
        }
        if (initialState.third) {
          scoringRunners.push(initialState.third.playerId);
          rbis++;
        }
        break;

      case 'HR': // Home Run
        // All runners score including batter
        if (initialState.first) {
          scoringRunners.push(initialState.first.playerId);
          rbis++;
        }
        if (initialState.second) {
          scoringRunners.push(initialState.second.playerId);
          rbis++;
        }
        if (initialState.third) {
          scoringRunners.push(initialState.third.playerId);
          rbis++;
        }
        // Batter scores
        scoringRunners.push(batterId);
        rbis++;
        break;

      case 'BB':
      case 'IBB': // Walk/Intentional Walk
        // Batter to first base
        finalBaserunners.first = { playerId: batterId, playerName: batterName };

        // Force advancement only
        if (initialState.first) {
          finalBaserunners.second = initialState.first;

          // If 2nd base occupied, force to 3rd
          if (initialState.second) {
            finalBaserunners.third = initialState.second;

            // If 3rd base occupied (bases loaded), force home
            if (initialState.third) {
              scoringRunners.push(initialState.third.playerId);
              rbis++;
            }
          } else {
            // Keep runner from 3rd in place (not forced)
            finalBaserunners.third = initialState.third;
          }
        } else {
          // No forced advancement if 1st base was empty
          finalBaserunners.second = initialState.second;
          finalBaserunners.third = initialState.third;
        }
        break;

      case 'SF': // Sacrifice Fly
        // Batter is out, but runner from 3rd scores
        if (initialState.third) {
          scoringRunners.push(initialState.third.playerId);
          rbis++;
        }
        // Other runners may advance at scorekeeper's discretion (manual override)
        finalBaserunners.first = initialState.first;
        finalBaserunners.second = initialState.second;
        break;

      case 'SO':
      case 'GO':
      case 'AO': // Outs (Strikeout, Ground Out, Air Out)
        // No advancement on outs (unless stealing/wild pitch - manual override)
        finalBaserunners.first = initialState.first;
        finalBaserunners.second = initialState.second;
        finalBaserunners.third = initialState.third;
        break;

      case 'E': // Error
        // Batter reaches base, advancement determined by scorekeeper
        finalBaserunners.first = { playerId: batterId, playerName: batterName };
        // Keep existing runners in place by default (manual override available)
        finalBaserunners.second = initialState.second;
        finalBaserunners.third = initialState.third;
        // No RBIs awarded for errors
        break;

      case 'FC': // Fielder's Choice
        // Batter reaches first, advancement determined by play situation
        finalBaserunners.first = { playerId: batterId, playerName: batterName };
        // Default to keeping other runners in place (manual override needed)
        finalBaserunners.second = initialState.second;
        finalBaserunners.third = initialState.third;
        break;

      default:
        // Unknown result, keep status quo
        finalBaserunners.first = initialState.first;
        finalBaserunners.second = initialState.second;
        finalBaserunners.third = initialState.third;
        break;
    }

    return {
      finalBaserunners,
      finalBaserunnersClass: this.toBaserunnerStateClass(finalBaserunners),
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
    const finalBaserunners: BaserunnerState = {
      first: null,
      second: null,
      third: null,
    };
    const scoringRunners: string[] = [];
    let rbis = 0;

    // Handle batter placement (always goes somewhere unless out)
    const batterName = `Batter ${batterId.slice(-1)}`;
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
        finalBaserunners.first = { playerId: batterId, playerName: batterName };
      } else if (battingResult.value === '2B') {
        finalBaserunners.second = {
          playerId: batterId,
          playerName: batterName,
        };
      } else if (battingResult.value === '3B') {
        finalBaserunners.third = { playerId: batterId, playerName: batterName };
      }
      // Home runs score the batter, so no base placement needed
    }

    // Apply overrides for each existing runner
    const runners = [
      { position: 'first', runner: initialState.first },
      { position: 'second', runner: initialState.second },
      { position: 'third', runner: initialState.third },
    ];

    for (const { runner } of runners) {
      if (!runner) continue;

      const override = manualOverrides[runner.playerId];
      if (!override) {
        // No override, use standard advancement
        continue;
      }

      switch (override) {
        case 'stay':
          // Runner stays at current base
          if (runner === initialState.first) {
            finalBaserunners.first = runner;
          } else if (runner === initialState.second) {
            finalBaserunners.second = runner;
          } else if (runner === initialState.third) {
            finalBaserunners.third = runner;
          }
          break;
        case 'second':
          finalBaserunners.second = runner;
          break;
        case 'third':
          finalBaserunners.third = runner;
          break;
        case 'home':
          scoringRunners.push(runner.playerId);
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

    return {
      finalBaserunners,
      finalBaserunnersClass: this.toBaserunnerStateClass(finalBaserunners),
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

    if (initialState.first && manualOverrides[initialState.first.playerId]) {
      runnerActions.set(1, manualOverrides[initialState.first.playerId]);
    }
    if (initialState.second && manualOverrides[initialState.second.playerId]) {
      runnerActions.set(2, manualOverrides[initialState.second.playerId]);
    }
    if (initialState.third && manualOverrides[initialState.third.playerId]) {
      runnerActions.set(3, manualOverrides[initialState.third.playerId]);
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
