import { Player, PlayerRepository } from '@/domain';
import { Position } from '@/domain/values';
import { Result } from '../common/Result';

export interface UpdatePlayerCommand {
  playerId: string;
  name: string;
  jerseyNumber: number;
  positions: Position[];
  isActive: boolean;
}

export class UpdatePlayerUseCase {
  constructor(private playerRepository: PlayerRepository) {}

  public async execute(command: UpdatePlayerCommand): Promise<Result<Player>> {
    try {
      // Validate command
      const validationResult = this.validateCommand(command);
      if (!validationResult.isSuccess) {
        return Result.failure(validationResult.error || 'Validation failed');
      }

      // Check if player exists
      const existingPlayer = await this.playerRepository.findById(
        command.playerId
      );
      if (!existingPlayer) {
        return Result.failure(`Player with id ${command.playerId} not found`);
      }

      // Check if jersey number is unique (excluding current player)
      const isJerseyUnique = await this.playerRepository.isJerseyNumberUnique(
        existingPlayer.teamId,
        command.jerseyNumber,
        command.playerId
      );
      if (!isJerseyUnique) {
        return Result.failure(
          `Jersey number ${command.jerseyNumber} is already in use for this team`
        );
      }

      // Create updated player
      const updatedPlayer = new Player(
        command.playerId,
        command.name.trim(),
        command.jerseyNumber,
        existingPlayer.teamId, // Keep the same team
        command.positions,
        command.isActive,
        existingPlayer.statistics, // Keep existing statistics
        existingPlayer.createdAt,
        new Date() // Update timestamp
      );

      // Save updated player
      const savedPlayer = await this.playerRepository.update(updatedPlayer);
      return Result.success(savedPlayer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(`Failed to update player: ${message}`);
    }
  }

  private validateCommand(command: UpdatePlayerCommand): Result<void> {
    // Validate player ID
    if (!command.playerId || command.playerId.trim().length === 0) {
      return Result.failure('Player ID is required');
    }

    // Validate player name
    if (!command.name || command.name.trim().length === 0) {
      return Result.failure('Player name cannot be empty');
    }

    if (command.name.length > 100) {
      return Result.failure('Player name cannot exceed 100 characters');
    }

    // Validate jersey number
    if (!Number.isInteger(command.jerseyNumber)) {
      return Result.failure('Jersey number must be a valid integer');
    }

    if (command.jerseyNumber < 0 || command.jerseyNumber > 999) {
      return Result.failure('Jersey number must be between 0 and 999');
    }

    // Validate positions
    if (!command.positions || command.positions.length === 0) {
      return Result.failure('At least one position is required');
    }

    return Result.success(undefined as void);
  }
}
