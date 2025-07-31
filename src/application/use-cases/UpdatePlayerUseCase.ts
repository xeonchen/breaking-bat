import { Player, PlayerRepository } from '@/domain';
import { Position } from '@/domain/values';
import { Result } from '../common/Result';

export interface UpdatePlayerCommand {
  playerId: string;
  name: string;
  jerseyNumber: number;
  position: Position;
  isActive: boolean;
}

export class UpdatePlayerUseCase {
  constructor(private playerRepository: PlayerRepository) {}

  async execute(command: UpdatePlayerCommand): Promise<Result<Player>> {
    try {
      // Validate command
      const validationResult = this.validateCommand(command);
      if (!validationResult.isSuccess) {
        return Result.failure(validationResult.error!);
      }

      // Check if player exists
      const existingPlayer = await this.playerRepository.findById(command.playerId);
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
        command.position,
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

    if (command.jerseyNumber < 1 || command.jerseyNumber > 99) {
      return Result.failure('Jersey number must be between 1 and 99');
    }

    // Validate position
    if (!command.position) {
      return Result.failure('Position is required');
    }

    return Result.success(undefined as void);
  }
}