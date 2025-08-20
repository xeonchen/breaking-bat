import {
  BattingResult,
  AtBat,
  BaserunnerState as BaserunnerStateClass,
} from '@/domain';
import { BaserunnerState } from '@/domain/types/BaserunnerState';
import { IGameRepository } from '@/domain/repositories/IGameRepository';
import { IAtBatRepository } from '@/domain/repositories/IAtBatRepository';
import { BaseAdvancementCalculator } from '@/domain/services/BaseAdvancementCalculator';
import { BoundaryValidator, CommonBoundaries } from '@/specifications';

export interface RecordAtBatRequest {
  gameId: string;
  batterId: string;
  battingResult: BattingResult;
  finalCount: { balls: number; strikes: number };
  pitchSequence?: string[];
  baserunnerAdvancement?: Record<string, string>;
}

export interface RecordAtBatResponse {
  atBatId: string;
  runsScored: number;
  rbis: number;
  advanceInning: boolean;
  newBaserunners: import('@/domain/types/BaserunnerState').BaserunnerState;
}

export class RecordAtBatUseCase {
  constructor(
    private gameRepository: IGameRepository,
    private atBatRepository: IAtBatRepository
  ) {}

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

  public async execute(
    request: RecordAtBatRequest
  ): Promise<RecordAtBatResponse> {
    // Retrieve the game
    const game = await this.gameRepository.findById(request.gameId);
    if (!game) {
      throw new Error(`Game not found: ${request.gameId}`);
    }

    // Validate game state
    if (game.currentStatus !== 'in_progress') {
      if (game.currentStatus === 'setup') {
        throw new Error('Cannot record at-bat for game not in progress');
      }
      if (game.currentStatus === 'completed') {
        throw new Error('Cannot record at-bat for completed game');
      }
      if (game.currentStatus === 'suspended') {
        throw new Error('Cannot record at-bat for suspended game');
      }
    }

    // Get current game state and validate at domain→application boundary
    const rawBaserunners = game.getCurrentBaserunners();
    const currentBaserunners = BoundaryValidator.validate<BaserunnerState>(
      CommonBoundaries.DOMAIN_TO_APPLICATION,
      rawBaserunners
    );
    const currentBatter = game.getCurrentBatter();

    if (!currentBatter) {
      throw new Error('No current batter found');
    }

    if (currentBatter.playerId !== request.batterId) {
      throw new Error(
        `Expected batter ${currentBatter.playerId}, got ${request.batterId}`
      );
    }

    // Calculate baserunner advancement
    let advancementResult;
    if (
      request.baserunnerAdvancement &&
      Object.keys(request.baserunnerAdvancement).length > 0
    ) {
      // Use manual overrides (simplified implementation)
      // For now, use standard advancement and then apply overrides
      const advancement =
        BaseAdvancementCalculator.calculateStandardAdvancement(
          this.toBaserunnerStateClass(currentBaserunners),
          request.battingResult,
          request.batterId
        );

      // TODO: Implement proper manual overrides if needed
      advancementResult = {
        finalBaserunners: {
          first: advancement.afterState.firstBase
            ? {
                playerId: advancement.afterState.firstBase,
                playerName: `Player ${advancement.afterState.firstBase}`,
              }
            : null,
          second: advancement.afterState.secondBase
            ? {
                playerId: advancement.afterState.secondBase,
                playerName: `Player ${advancement.afterState.secondBase}`,
              }
            : null,
          third: advancement.afterState.thirdBase
            ? {
                playerId: advancement.afterState.thirdBase,
                playerName: `Player ${advancement.afterState.thirdBase}`,
              }
            : null,
        },
        finalBaserunnersClass: advancement.afterState,
        scoringRunners: advancement.runsScored,
        rbis: advancement.runsScored.length,
      };
    } else {
      // Use standard advancement with correct calculator
      const advancement =
        BaseAdvancementCalculator.calculateStandardAdvancement(
          this.toBaserunnerStateClass(currentBaserunners),
          request.battingResult,
          request.batterId
        );

      // Convert to the format expected by the rest of the code
      advancementResult = {
        finalBaserunners: {
          first: advancement.afterState.firstBase
            ? {
                playerId: advancement.afterState.firstBase,
                playerName: `Player ${advancement.afterState.firstBase}`,
              }
            : null,
          second: advancement.afterState.secondBase
            ? {
                playerId: advancement.afterState.secondBase,
                playerName: `Player ${advancement.afterState.secondBase}`,
              }
            : null,
          third: advancement.afterState.thirdBase
            ? {
                playerId: advancement.afterState.thirdBase,
                playerName: `Player ${advancement.afterState.thirdBase}`,
              }
            : null,
        },
        finalBaserunnersClass: advancement.afterState,
        scoringRunners: advancement.runsScored,
        rbis: advancement.runsScored.length,
      };
    }

    // Create AtBat record
    const atBat = new AtBat(
      crypto.randomUUID(),
      request.gameId,
      game.getCurrentInning().toString(), // inningId as string
      request.batterId,
      currentBatter.battingOrder,
      request.battingResult,
      `${request.battingResult.value} result`, // description
      advancementResult.rbis,
      advancementResult.scoringRunners,
      [], // runningErrors - empty for now
      this.toBaserunnerStateClass(currentBaserunners),
      advancementResult.finalBaserunnersClass,
      new Date()
    );

    // Save AtBat first
    await this.atBatRepository.save(atBat);

    // Update game state
    game.updateBaserunners(advancementResult.finalBaserunners);
    game.addRuns(advancementResult.scoringRunners.length);

    // Handle outs and inning advancement
    const outsFromResult = this.calculateOuts(request.battingResult);
    const advanceInning = game.addOuts(outsFromResult);

    if (advanceInning) {
      game.advanceInning();
      game.clearBaserunners();
    }

    // Advance to next batter
    game.advanceToNextBatter();

    // Save game state
    await this.gameRepository.save(game);

    // Validate output at application→presentation boundary
    const finalBaserunners = BoundaryValidator.validate<BaserunnerState>(
      CommonBoundaries.APPLICATION_TO_PRESENTATION,
      game.getCurrentBaserunners()
    );

    return {
      atBatId: atBat.id,
      runsScored: advancementResult.scoringRunners.length,
      rbis: advancementResult.rbis,
      advanceInning,
      newBaserunners: finalBaserunners,
    };
  }

  private calculateOuts(battingResult: BattingResult): number {
    // Calculate how many outs this result produces
    switch (battingResult.value) {
      case 'SO': // Strikeout
      case 'GO': // Ground Out
      case 'AO': // Air Out
        return 1;
      case 'DP': // Double Play
        return 2;
      case 'SF': // Sacrifice Fly (batter out, but RBI possible)
        return 1;
      case 'FC': // Fielder's Choice (depends on situation, assume 1 out)
        return 1;
      default:
        return 0; // Hits, walks, errors don't produce outs
    }
  }
}
