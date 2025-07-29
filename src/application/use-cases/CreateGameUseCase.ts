import { Game, GameRepository, GameStatus } from '@/domain';
import { Result } from '../common/Result';
import { v4 as uuidv4 } from 'uuid';

export interface CreateGameCommand {
  name: string;
  teamId: string;
  seasonId: string;
  gameTypeId: string;
  opponent: string;
  date: Date;
  time: string;
  location: string;
  isHomeGame: boolean;
}

export class CreateGameUseCase {
  constructor(private gameRepository: GameRepository) {}

  async execute(command: CreateGameCommand): Promise<Result<Game>> {
    try {
      // Validate command
      const validationResult = this.validateCommand(command);
      if (!validationResult.isSuccess) {
        return validationResult;
      }

      // Create new game
      const gameId = uuidv4();
      const now = new Date();

      const game = new Game(
        gameId,
        command.name.trim(),
        command.teamId,
        command.seasonId,
        command.gameTypeId,
        command.opponent.trim(),
        command.date,
        command.time,
        command.location.trim(),
        command.isHomeGame,
        GameStatus.SETUP,
        0, // ourScore
        0, // opponentScore
        1, // currentInning
        true, // isTopInning - visitors bat first
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

    // Validate season ID
    if (!command.seasonId || command.seasonId.trim().length === 0) {
      return Result.failure('Season ID is required');
    }

    // Validate game type ID
    if (!command.gameTypeId || command.gameTypeId.trim().length === 0) {
      return Result.failure('Game type ID is required');
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

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(command.time)) {
      return Result.failure('Time must be in HH:MM format');
    }

    // Validate location (optional but has max length)
    if (command.location && command.location.length > 200) {
      return Result.failure('Location cannot exceed 200 characters');
    }

    return Result.success(undefined as void);
  }
}
