import { Team, ITeamRepository } from '@/domain';
import { Result } from '../common/Result';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTeamCommand {
  name: string;
  seasonIds?: string[];
  playerIds?: string[];
}

export class CreateTeamUseCase {
  constructor(private teamRepository: ITeamRepository) {}

  public async execute(command: CreateTeamCommand): Promise<Result<Team>> {
    try {
      // Validate command
      const validationResult = this.validateCommand(command);
      if (!validationResult.isSuccess) {
        return Result.failure(validationResult.error || 'Validation failed');
      }

      // Check if team name already exists
      const existingTeam = await this.teamRepository.findByName(command.name);
      if (existingTeam) {
        return Result.failure(`Team name ${command.name} already exists`);
      }

      // Create new team
      const teamId = uuidv4();
      const trimmedName = command.name.trim();

      // Deduplicate arrays with defaults
      const uniqueSeasonIds = [
        ...new Set((command.seasonIds || []).filter((id) => id)),
      ];
      const uniquePlayerIds = [
        ...new Set((command.playerIds || []).filter((id) => id)),
      ];

      const team = new Team(
        teamId,
        trimmedName,
        uniqueSeasonIds,
        uniquePlayerIds
      );

      // Save team
      const savedTeam = await this.teamRepository.save(team);
      return Result.success(savedTeam);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(`Failed to create team: ${message}`);
    }
  }

  private validateCommand(command: CreateTeamCommand): Result<void> {
    // Validate team name
    if (!command.name || command.name.trim().length === 0) {
      return Result.failure('Team name cannot be empty');
    }

    if (command.name.length > 100) {
      return Result.failure('Team name cannot exceed 100 characters');
    }

    // Validate season IDs
    if (
      command.seasonIds &&
      command.seasonIds.some(
        (id) => !id || typeof id !== 'string' || id.trim().length === 0
      )
    ) {
      return Result.failure('All season IDs must be valid non-empty strings');
    }

    // Validate player IDs
    if (
      command.playerIds &&
      command.playerIds.some(
        (id) => !id || typeof id !== 'string' || id.trim().length === 0
      )
    ) {
      return Result.failure('All player IDs must be valid non-empty strings');
    }

    return Result.success(undefined as void);
  }
}
