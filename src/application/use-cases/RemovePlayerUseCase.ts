import { PlayerRepository, TeamRepository } from '@/domain';
import { Result } from '../common/Result';

export interface RemovePlayerCommand {
  teamId: string;
  playerId: string;
}

export class RemovePlayerUseCase {
  constructor(
    private playerRepository: PlayerRepository,
    private teamRepository: TeamRepository
  ) {}

  public async execute(command: RemovePlayerCommand): Promise<Result<void>> {
    try {
      // Validate command
      const validationResult = this.validateCommand(command);
      if (!validationResult.isSuccess) {
        return validationResult;
      }

      // Check if player exists
      const player = await this.playerRepository.findById(command.playerId);
      if (!player) {
        return Result.failure(`Player with id ${command.playerId} not found`);
      }

      // Check if player belongs to the specified team
      if (player.teamId !== command.teamId) {
        return Result.failure(
          `Player ${command.playerId} does not belong to team ${command.teamId}`
        );
      }

      // Check if team exists
      const team = await this.teamRepository.findById(command.teamId);
      if (!team) {
        return Result.failure(`Team with id ${command.teamId} not found`);
      }

      // Remove player from team roster
      const updatedTeam = team.removePlayer(command.playerId);
      await this.teamRepository.save(updatedTeam);

      // Delete player from repository
      await this.playerRepository.delete(command.playerId);

      return Result.success(undefined as void);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(`Failed to remove player: ${message}`);
    }
  }

  private validateCommand(command: RemovePlayerCommand): Result<void> {
    // Validate team ID
    if (!command.teamId || command.teamId.trim().length === 0) {
      return Result.failure('Team ID is required');
    }

    // Validate player ID
    if (!command.playerId || command.playerId.trim().length === 0) {
      return Result.failure('Player ID is required');
    }

    return Result.success(undefined as void);
  }
}
