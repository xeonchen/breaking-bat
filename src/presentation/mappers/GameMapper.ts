import {
  GameDto,
  ScoreData,
} from '@/application/services/interfaces/IGameApplicationService';
import {
  PresentationGame,
  PresentationGameMethods,
  PresentationGameScore,
  PresentationGameStatus,
} from '@/presentation/interfaces/IPresentationServices';
import { GameStatus as ApplicationGameStatus } from '@/application/services/interfaces/IGameApplicationService';

/**
 * Game Mapper - Clean Architecture Type Bridge
 *
 * Maps between Application GameDto and Presentation PresentationGame types
 * following Clean Architecture dependency direction (Presentation → Application → Domain)
 */
export class GameMapper {
  /**
   * Convert Application GameDto to PresentationGame with methods
   */
  public static dtoToPresentation(gameDto: GameDto): PresentationGame {
    return new PresentationGameImpl(gameDto);
  }

  /**
   * Convert array of GameDto to PresentationGame array
   */
  public static dtoArrayToPresentation(
    gameDtos: GameDto[]
  ): PresentationGame[] {
    return gameDtos.map((dto) => this.dtoToPresentation(dto));
  }

  /**
   * Convert ApplicationGameStatus to PresentationGameStatus
   */
  public static statusToPresentation(
    status: ApplicationGameStatus
  ): PresentationGameStatus {
    const statusMap: Record<ApplicationGameStatus, PresentationGameStatus> = {
      scheduled: 'setup',
      in_progress: 'in_progress',
      completed: 'completed',
      cancelled: 'suspended',
      postponed: 'suspended',
      suspended: 'suspended',
    };
    // eslint-disable-next-line security/detect-object-injection
    return statusMap[status] || 'setup';
  }

  /**
   * Convert PresentationGameStatus to ApplicationGameStatus
   */
  public static statusFromPresentation(
    status: PresentationGameStatus
  ): ApplicationGameStatus {
    const statusMap: Record<PresentationGameStatus, ApplicationGameStatus> = {
      setup: 'scheduled',
      in_progress: 'in_progress',
      completed: 'completed',
      suspended: 'cancelled',
    };
    // eslint-disable-next-line security/detect-object-injection
    return statusMap[status] || 'scheduled';
  }

  /**
   * Convert ScoreData to PresentationGameScore
   */
  public static scoreToPresentation(score: ScoreData): PresentationGameScore {
    return {
      homeScore: score.homeScore,
      awayScore: score.awayScore,
    };
  }

  /**
   * Convert PresentationGameScore to ScoreData
   */
  public static scoreFromPresentation(score: PresentationGameScore): ScoreData {
    return {
      homeScore: score.homeScore,
      awayScore: score.awayScore,
      inningScores: [], // Will be populated from actual game data
    };
  }
}

/**
 * Implementation of PresentationGame that wraps GameDto and adds required methods
 */
class PresentationGameImpl implements PresentationGame {
  constructor(private readonly gameDto: GameDto) {}

  // Delegate properties to wrapped GameDto
  public get id(): string {
    return this.gameDto.id;
  }
  public get name(): string {
    return this.gameDto.name;
  }
  public get teamId(): string {
    return this.gameDto.teamId;
  }
  public get teamName(): string {
    return this.gameDto.teamName;
  }
  public get opponent(): string {
    return this.gameDto.opponent;
  }
  public get date(): Date {
    return this.gameDto.date;
  }
  public get lineupId(): string | undefined {
    return this.gameDto.lineupId;
  }

  public get status(): PresentationGameStatus {
    return GameMapper.statusToPresentation(this.gameDto.status);
  }

  public get finalScore(): PresentationGameScore | undefined {
    return this.gameDto.score
      ? GameMapper.scoreToPresentation(this.gameDto.score)
      : undefined;
  }

  // Implement required methods
  public getVenueText(): string {
    const location = this.gameDto.location || 'Unknown Location';
    const homeAway = this.gameDto.isHomeGame ? 'vs' : '@';
    return `${homeAway} ${location}`;
  }

  public setLineup(lineupId: string): PresentationGameMethods {
    // Return a new instance with the lineup ID set
    // Note: This is a pure function that doesn't mutate the original
    const updatedDto = { ...this.gameDto, lineupId };
    return new PresentationGameImpl(updatedDto);
  }
}
