import { IGameRepository, IPlayerRepository, Position } from '@/domain';
import { Result } from '../common/Result';

export interface LineupPosition {
  battingOrder: number;
  playerId: string;
  position: Position;
}

export interface SetupLineupCommand {
  gameId: string;
  lineupPositions: LineupPosition[];
  substitutes: string[];
}

export class SetupLineupUseCase {
  constructor(
    private gameRepository: IGameRepository,
    private playerRepository: IPlayerRepository
  ) {}

  public async execute(command: SetupLineupCommand): Promise<Result<void>> {
    try {
      // Validate command structure first
      const validationResult = await this.validateCommand(command);
      if (!validationResult.isSuccess) {
        return validationResult;
      }

      // Find game
      const game = await this.gameRepository.findById(command.gameId);
      if (!game) {
        return Result.failure('Game not found');
      }

      // Verify all players exist
      const allPlayerIds = [
        ...command.lineupPositions.map((lp) => lp.playerId),
        ...command.substitutes,
      ];

      for (const playerId of allPlayerIds) {
        const player = await this.playerRepository.findById(playerId);
        if (!player) {
          const isSubstitute = command.substitutes.includes(playerId);
          const playerType = isSubstitute ? 'Substitute player' : 'Player';
          return Result.failure(`${playerType} ${playerId} not found`);
        }
      }

      // Update game with lineup - using Object.defineProperty to avoid any types
      Object.defineProperty(game, 'lineupPositions', {
        value: command.lineupPositions,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      Object.defineProperty(game, 'substitutes', {
        value: command.substitutes,
        writable: true,
        enumerable: true,
        configurable: true,
      });

      // Save game
      await this.gameRepository.save(game);
      return Result.success(undefined as void);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(`Failed to setup lineup: ${message}`);
    }
  }

  private async validateCommand(
    command: SetupLineupCommand
  ): Promise<Result<void>> {
    // Validate lineup size
    if (command.lineupPositions.length !== 10) {
      return Result.failure('Lineup must have exactly 10 players');
    }

    // Validate batting orders are 1-10
    const battingOrders = command.lineupPositions
      .map((lp) => lp.battingOrder)
      .sort((a, b) => a - b); // Ensure numeric sort
    const expectedOrders = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    if (!this.arraysEqual(battingOrders, expectedOrders)) {
      return Result.failure('Batting orders must be exactly 1 through 10');
    }

    // Validate no duplicate players in lineup
    const playerIds = command.lineupPositions.map((lp) => lp.playerId);
    const uniquePlayerIds = new Set(playerIds);

    if (uniquePlayerIds.size !== playerIds.length) {
      return Result.failure('Each player can only appear once in the lineup');
    }

    // Validate no duplicate positions
    const positions = command.lineupPositions.map((lp) => lp.position);
    const positionValues = positions.map((pos) => pos.value);
    const uniquePositionValues = new Set(positionValues);

    if (uniquePositionValues.size !== positionValues.length) {
      return Result.failure('Each position can only be assigned to one player');
    }

    // Validate all required positions are covered
    const requiredPositionValues = new Set([
      'pitcher',
      'catcher',
      'first-base',
      'second-base',
      'third-base',
      'shortstop',
      'left-field',
      'center-field',
      'right-field',
      'short-fielder',
    ]);

    const actualPositionValues = new Set(positions.map((pos) => pos.value));

    if (
      actualPositionValues.size !== requiredPositionValues.size ||
      ![...requiredPositionValues].every((val) => actualPositionValues.has(val))
    ) {
      return Result.failure('All required defensive positions must be filled');
    }

    // Validate substitutes
    if (command.substitutes.length > 0) {
      // Check no substitute is in the lineup
      for (const substituteId of command.substitutes) {
        if (playerIds.includes(substituteId)) {
          return Result.failure(
            `Substitute ${substituteId} is already in the starting lineup`
          );
        }
      }

      // Check no duplicate substitutes
      const uniqueSubstitutes = new Set(command.substitutes);
      if (uniqueSubstitutes.size !== command.substitutes.length) {
        const duplicates = command.substitutes.filter(
          (id, index) => command.substitutes.indexOf(id) !== index
        );
        return Result.failure(
          `Substitute ${duplicates[0]} appears multiple times`
        );
      }
    }

    return Result.success(undefined as void);
  }

  private arraysEqual(arr1: number[], arr2: number[]): boolean {
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }

    return true;
  }
}
