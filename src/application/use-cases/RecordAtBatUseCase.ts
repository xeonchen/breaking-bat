import {
  AtBatRepository,
  GameRepository,
  AtBat,
  AtBatResult,
  BaserunnerState,
} from '@/domain';
import { Result } from '../common/Result';
import { v4 as uuidv4 } from 'uuid';

export interface RecordAtBatCommand {
  gameId: string;
  batterId: string;
  inning: number;
  isTopInning: boolean;
  result: AtBatResult;
  description: string;
  rbi: number;
  baserunnersBefore: BaserunnerState;
  baserunnersAfter: BaserunnerState;
  runsScored: string[];
}

export class RecordAtBatUseCase {
  constructor(
    private atBatRepository: AtBatRepository,
    private gameRepository: GameRepository
  ) {}

  async execute(command: RecordAtBatCommand): Promise<Result<AtBat>> {
    try {
      // Validate command
      const validationResult = this.validateCommand(command);
      if (!validationResult.isSuccess) {
        return validationResult;
      }

      // Find game
      const game = await this.gameRepository.findById(command.gameId);
      if (!game) {
        return Result.failure('Game not found');
      }

      // Create new at-bat
      const atBatId = uuidv4();
      const timestamp = new Date();

      const atBat = new AtBat(
        atBatId,
        command.gameId,
        command.batterId,
        command.inning,
        command.isTopInning,
        command.result,
        command.description,
        command.rbi,
        command.baserunnersBefore,
        command.baserunnersAfter,
        command.runsScored,
        timestamp
      );

      // Update game score
      (game as any).ourScore += command.rbi;

      // Save at-bat and game
      const savedAtBat = await this.atBatRepository.save(atBat);
      await this.gameRepository.save(game);

      return Result.success(savedAtBat);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(`Failed to record at-bat: ${message}`);
    }
  }

  private validateCommand(command: RecordAtBatCommand): Result<AtBat> {
    // Validate batter ID
    if (!command.batterId || command.batterId.trim().length === 0) {
      return Result.failure('Batter ID is required');
    }

    // Validate inning
    if (command.inning <= 0) {
      return Result.failure('Inning must be a positive number');
    }

    // Validate RBI
    if (command.rbi < 0) {
      return Result.failure('RBI cannot be negative');
    }

    if (command.rbi > 4) {
      return Result.failure('Maximum RBI per at-bat is 4');
    }

    // Validate RBI matches runs scored
    if (command.rbi !== command.runsScored.length) {
      return Result.failure('RBI count must match the number of runs scored');
    }

    // Validate description length
    if (command.description && command.description.length > 500) {
      return Result.failure('Description cannot exceed 500 characters');
    }

    // Business rule validations
    const businessRuleResult = this.validateBusinessRules(command);
    if (!businessRuleResult.isSuccess) {
      return businessRuleResult;
    }

    return Result.success(undefined as any);
  }

  private validateBusinessRules(command: RecordAtBatCommand): Result<AtBat> {
    // Strikeouts and groundouts cannot have RBIs (simplified rule)
    if (
      (command.result === AtBatResult.STRIKEOUT ||
        command.result === AtBatResult.GROUNDOUT) &&
      command.rbi > 0
    ) {
      return Result.failure('Strikeouts and groundouts cannot have RBIs');
    }

    // Validate no duplicate runs scored
    const uniqueRunsScored = new Set(command.runsScored);
    if (uniqueRunsScored.size !== command.runsScored.length) {
      return Result.failure(
        'A player cannot score multiple times in the same at-bat'
      );
    }

    // Validate baserunner state consistency
    const beforeRunners = [
      command.baserunnersBefore.first,
      command.baserunnersBefore.second,
      command.baserunnersBefore.third,
    ].filter((runner) => runner !== null);

    // Check for duplicate baserunners before
    const uniqueBeforeRunners = new Set(beforeRunners);
    if (uniqueBeforeRunners.size !== beforeRunners.length) {
      return Result.failure(
        'A player cannot be on multiple bases at the same time'
      );
    }

    return Result.success(undefined as any);
  }
}