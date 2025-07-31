import { Player, PlayerRepository, TeamRepository } from '@/domain';
import { Position } from '@/domain/values';
import { Result } from '../common/Result';
import { v4 as uuidv4 } from 'uuid';

export interface AddPlayerCommand {
  teamId: string;
  name: string;
  jerseyNumber: number;
  positions: Position[];
  isActive: boolean;
}

export class AddPlayerUseCase {
  constructor(
    private playerRepository: PlayerRepository,
    private teamRepository: TeamRepository
  ) {}

  async execute(command: AddPlayerCommand): Promise<Result<Player>> {
    try {
      // Validate command
      const validationResult = this.validateCommand(command);
      if (!validationResult.isSuccess) {
        return Result.failure(validationResult.error!);
      }

      // Check if team exists
      const team = await this.teamRepository.findById(command.teamId);
      if (!team) {
        return Result.failure(`Team with id ${command.teamId} not found`);
      }

      // Check if team can add more players
      if (!team.canAddPlayer()) {
        return Result.failure('Team roster is full (maximum 25 players)');
      }

      // Check if jersey number is unique within the team
      console.log(
        `🔍 Checking jersey number uniqueness: team=${command.teamId}, jersey=${command.jerseyNumber}`
      );
      const isJerseyUnique = await this.playerRepository.isJerseyNumberUnique(
        command.teamId,
        command.jerseyNumber
      );
      console.log(`✅ Jersey number unique check result: ${isJerseyUnique}`);
      if (!isJerseyUnique) {
        return Result.failure(
          `Jersey number ${command.jerseyNumber} is already in use for this team`
        );
      }

      // Create new player
      const playerId = uuidv4();
      const player = new Player(
        playerId,
        command.name.trim(),
        command.jerseyNumber,
        command.teamId,
        command.positions,
        command.isActive
      );

      // Save player
      const savedPlayer = await this.playerRepository.create(player);

      // Update team with new player
      const updatedTeam = team.addPlayer(playerId);
      await this.teamRepository.save(updatedTeam);

      return Result.success(savedPlayer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(`Failed to add player: ${message}`);
    }
  }

  private validateCommand(command: AddPlayerCommand): Result<void> {
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

    // Validate team ID
    if (!command.teamId || command.teamId.trim().length === 0) {
      return Result.failure('Team ID is required');
    }

    // Validate positions
    if (!command.positions || command.positions.length === 0) {
      return Result.failure('At least one position is required');
    }

    return Result.success(undefined as void);
  }
}
