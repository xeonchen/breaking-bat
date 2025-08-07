import { Game, GameRepository, GameStatus, HomeAway } from '@/domain';
import { Result } from '../common/Result';
import { v4 as uuidv4 } from 'uuid';

export interface CreateGameCommand {
  name: string;
  teamId: string;
  seasonId: string | null;
  gameTypeId: string | null;
  opponent: string;
  date: Date;
  homeAway: HomeAway;
}

export class CreateGameUseCase {
  constructor(private gameRepository: GameRepository) {}

  public async execute(command: CreateGameCommand): Promise<Result<Game>> {
    try {
      // Validate command
      const validationResult = this.validateCommand(command);
      if (!validationResult.isSuccess) {
        return Result.failure<Game>(
          validationResult.error || 'Validation failed'
        );
      }

      // Create new game
      const gameId = uuidv4();
      const now = new Date();

      const game = new Game(
        gameId,
        command.name.trim(),
        command.opponent.trim(),
        command.date,
        command.seasonId,
        command.gameTypeId,
        command.homeAway,
        command.teamId,
        'setup' as GameStatus,
        null, // lineupId
        [], // inningIds
        null, // finalScore
        now, // createdAt
        now // updatedAt
      );

      // Save game
      const savedGame = await this.gameRepository.save(game);
      return Result.success(savedGame);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(`Failed to create game: ${message}`);
    }
  }

  private validateCommand(command: CreateGameCommand): Result<void> {
    // Validate game name
    if (!command.name || command.name.trim().length === 0) {
      return Result.failure('Game name cannot be empty');
    }

    if (command.name.length > 200) {
      return Result.failure('Game name cannot exceed 200 characters');
    }

    // Validate team ID
    if (!command.teamId || command.teamId.trim().length === 0) {
      return Result.failure('Team ID is required');
    }

    // Validate season ID (only if provided)
    if (
      command.seasonId !== null &&
      (!command.seasonId || command.seasonId.trim().length === 0)
    ) {
      return Result.failure('Season ID cannot be empty when provided');
    }

    // Validate game type ID (only if provided)
    if (
      command.gameTypeId !== null &&
      (!command.gameTypeId || command.gameTypeId.trim().length === 0)
    ) {
      return Result.failure('Game type ID cannot be empty when provided');
    }

    // Validate opponent
    if (!command.opponent || command.opponent.trim().length === 0) {
      return Result.failure('Opponent name is required');
    }

    if (command.opponent.length > 100) {
      return Result.failure('Opponent name cannot exceed 100 characters');
    }

    // Validate date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const gameDate = new Date(command.date);
    gameDate.setHours(0, 0, 0, 0);

    if (gameDate < today) {
      return Result.failure('Game date cannot be in the past');
    }

    // Validate home/away
    if (!['home', 'away'].includes(command.homeAway)) {
      return Result.failure('Home/Away must be either "home" or "away"');
    }

    return Result.success(undefined as void);
  }
}
