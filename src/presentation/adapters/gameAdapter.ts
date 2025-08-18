import {
  Game,
  Team,
  Player,
  Position,
  BattingResult,
  GameScore,
  HomeAway,
} from '../../domain';
import {
  GameDTO,
  GameScoreDTO,
  TeamDTO,
  PlayerDTO,
  LineupEntryDTO,
} from '../types/presentation-entities';
import {
  PresentationPosition,
  PresentationBattingResult,
  PresentationValueConverter,
} from '../types/presentation-values';

/**
 * Adapter for converting between domain entities and presentation DTOs
 * This maintains Clean Architecture separation of concerns
 */
export class GameAdapter {
  /**
   * Convert domain Game entity to presentation GameDTO
   */
  public static toGameDTO(game: Game): GameDTO {
    const finalScore: GameScoreDTO | undefined = game.finalScore
      ? {
          homeScore: game.finalScore.homeScore,
          awayScore: game.finalScore.awayScore,
          inningScores: game.finalScore.inningScores.map((inning) => ({
            inning: inning.inning,
            homeRuns: inning.homeRuns,
            awayRuns: inning.awayRuns,
          })),
        }
      : undefined;

    return {
      id: game.id,
      name: game.name,
      opponent: game.opponent,
      date: game.date,
      seasonId: game.seasonId || '',
      homeTeamId: game.teamId, // Assuming this is the team ID
      awayTeamId: game.opponent, // This might need adjustment based on actual domain model
      teamId: game.teamId, // For backward compatibility
      gameTypeId: game.gameTypeId || '',
      status: PresentationValueConverter.toPresentationGameStatus(game.status),
      currentInning: 1, // This would come from game state
      isTopInning: true, // This would come from game state
      homeScore: game.finalScore?.homeScore || 0,
      awayScore: game.finalScore?.awayScore || 0,
      lineupId: game.lineupId || undefined,
      currentBatterId: undefined, // This would come from game state
      currentBaserunners: {
        first: null,
        second: null,
        third: null,
      },
      totalInnings: 7, // Standard softball innings
      finalScore,
      createdAt: game.createdAt || new Date(),
      updatedAt: game.updatedAt || new Date(),

      // Helper property implementation
      isAwayGame: game.homeAway === 'away',

      // Helper methods implementation
      isHomeGame: () => game.homeAway === 'home',
      getVenueText: () => (game.homeAway === 'home' ? 'vs' : '@'),
    };
  }

  /**
   * Convert presentation GameDTO to domain Game entity
   */
  public static fromGameDTO(gameDTO: GameDTO): Game {
    // Determine home/away based on team comparison
    const homeAway: HomeAway = gameDTO.isAwayGame ? 'away' : 'home';

    // Create game score from DTO
    const gameScore: GameScore | null = gameDTO.finalScore
      ? {
          homeScore: gameDTO.finalScore.homeScore,
          awayScore: gameDTO.finalScore.awayScore,
          inningScores: gameDTO.finalScore.inningScores.map((inning) => ({
            inning: inning.inning,
            homeRuns: inning.homeRuns,
            awayRuns: inning.awayRuns,
          })),
        }
      : null;

    return new Game(
      gameDTO.id,
      gameDTO.name,
      gameDTO.opponent,
      gameDTO.date,
      gameDTO.seasonId || null,
      gameDTO.gameTypeId || null,
      homeAway,
      gameDTO.homeTeamId,
      PresentationValueConverter.toDomainGameStatus(gameDTO.status) as
        | 'setup'
        | 'in_progress'
        | 'completed'
        | 'suspended',
      gameDTO.lineupId || null,
      [], // inningIds - would be maintained separately
      gameScore,
      gameDTO.createdAt,
      gameDTO.updatedAt
    );
  }

  /**
   * Convert domain Team entity to presentation TeamDTO
   */
  public static toTeamDTO(team: Team): TeamDTO {
    return {
      id: team.id,
      name: team.name,
      isActive: true, // Default value since Team doesn't have isActive property
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  /**
   * Convert domain Player entity to presentation PlayerDTO
   */
  public static toPlayerDTO(player: Player): PlayerDTO {
    return {
      id: player.id,
      name: player.name,
      jerseyNumber: player.jerseyNumber,
      positions: player.positions.map((pos) =>
        PresentationValueConverter.toPresentationPosition(pos.value)
      ),
      isActive: player.isActive,
      teamId: player.teamId,
    };
  }

  /**
   * Convert domain Player to presentation LineupEntryDTO
   */
  public static toLineupEntryDTO(
    player: Player,
    battingOrder: number
  ): LineupEntryDTO {
    return {
      playerId: player.id,
      playerName: player.name,
      jerseyNumber: player.jerseyNumber,
      battingOrder,
      positions: player.positions.map((pos) =>
        PresentationValueConverter.toPresentationPosition(pos.value)
      ),
      isActive: player.isActive,
    };
  }

  /**
   * Convert domain Position to presentation position
   */
  public static toPresentationPosition(
    position: Position
  ): PresentationPosition {
    return PresentationValueConverter.toPresentationPosition(position.value);
  }

  /**
   * Convert domain BattingResult to presentation batting result
   */
  public static toPresentationBattingResult(
    result: BattingResult
  ): PresentationBattingResult {
    return PresentationValueConverter.toPresentationBattingResult(result.value);
  }

  /**
   * Convert presentation batting result to domain BattingResult
   */
  public static fromPresentationBattingResult(
    result: PresentationBattingResult
  ): BattingResult {
    // Use the BattingResult static factory methods based on result type
    switch (result) {
      case PresentationBattingResult.SINGLE:
        return BattingResult.single();
      case PresentationBattingResult.DOUBLE:
        return BattingResult.double();
      case PresentationBattingResult.TRIPLE:
        return BattingResult.triple();
      case PresentationBattingResult.HOME_RUN:
        return BattingResult.homeRun();
      case PresentationBattingResult.WALK:
        return BattingResult.walk();
      case PresentationBattingResult.INTENTIONAL_WALK:
        return BattingResult.intentionalWalk();
      case PresentationBattingResult.STRIKEOUT:
        return BattingResult.strikeout();
      case PresentationBattingResult.GROUND_OUT:
        return BattingResult.groundOut();
      case PresentationBattingResult.AIR_OUT:
        return BattingResult.airOut();
      case PresentationBattingResult.SACRIFICE_FLY:
        return BattingResult.sacrificeFly();
      case PresentationBattingResult.FIELDERS_CHOICE:
        return BattingResult.fieldersChoice();
      case PresentationBattingResult.ERROR:
        return BattingResult.error();
      case PresentationBattingResult.DOUBLE_PLAY:
        return BattingResult.doublePlay();
      case PresentationBattingResult.TRIPLE_PLAY:
        // Note: Triple play not implemented in domain, treating as double play
        return BattingResult.doublePlay();
      default:
        throw new Error(`Unsupported batting result: ${result}`);
    }
  }

  /**
   * Determine if a game is a home game based on team perspective
   */
  public static isHomeGame(game: Game): boolean {
    return game.isHomeGame();
  }
}
