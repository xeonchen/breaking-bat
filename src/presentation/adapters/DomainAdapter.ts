/**
 * Presentation layer adapter for converting from domain to presentation models
 * Follows Clean Architecture: Presentation → Application → Domain dependency flow
 */

import {
  Team as DomainTeam,
  Player as DomainPlayer,
  PlayerStatistics,
  Game as DomainGame,
  Season as DomainSeason,
  GameType as DomainGameType,
  AtBat as DomainAtBat,
} from '@/domain/entities';
import { BattingResult as DomainBattingResult } from '@/domain/values';
import { BaserunnerState as DomainBaserunnerState } from '@/domain/values';

import {
  TeamDTO,
  PlayerDTO,
  GameDTO,
  SeasonDTO,
  GameTypeDTO,
  AtBatDTO,
  PlayerStatisticsDTO,
} from '@/presentation/types/presentation-entities';
import {
  PresentationPosition,
  PresentationBattingResult,
  PresentationBaserunnerState,
  PresentationValueConverter,
} from '@/presentation/types/presentation-values';

/**
 * Presentation layer adapter for converting domain models to presentation DTOs
 * Only converts FROM domain TO presentation (unidirectional)
 */
export class DomainAdapter {
  // ========== Team Conversions ==========

  /**
   * Convert domain Team to TeamDTO
   */
  public static teamToDTO(domainTeam: DomainTeam): TeamDTO {
    return {
      id: domainTeam.id,
      name: domainTeam.name,
      isActive: true, // Default value since Team domain doesn't have isActive
      createdAt: domainTeam.createdAt,
      updatedAt: domainTeam.updatedAt,
    };
  }

  /**
   * Convert domain Teams to TeamDTOs
   */
  public static teamsToDTO(domainTeams: DomainTeam[]): TeamDTO[] {
    return domainTeams.map((team) => this.teamToDTO(team));
  }

  // ========== Player Conversions ==========

  /**
   * Convert domain Player to PlayerDTO
   */
  public static playerToDTO(domainPlayer: DomainPlayer): PlayerDTO {
    return {
      id: domainPlayer.id,
      name: domainPlayer.name,
      jerseyNumber: domainPlayer.jerseyNumber,
      positions: domainPlayer.positions.map((pos) =>
        PresentationValueConverter.toPresentationPosition(pos.value)
      ),
      isActive: domainPlayer.isActive,
      teamId: domainPlayer.teamId,
      statistics: domainPlayer.statistics
        ? this.playerStatisticsToDTO(domainPlayer.statistics)
        : undefined,
    };
  }

  /**
   * Convert domain Players to PlayerDTOs
   */
  public static playersToDTO(domainPlayers: DomainPlayer[]): PlayerDTO[] {
    return domainPlayers.map((player) => this.playerToDTO(player));
  }

  /**
   * Convert domain player statistics to DTO
   */
  public static playerStatisticsToDTO(
    domainStats: PlayerStatistics
  ): PlayerStatisticsDTO {
    return {
      atBats: domainStats.atBats,
      hits: domainStats.hits,
      doubles: domainStats.doubles,
      triples: domainStats.triples,
      homeRuns: domainStats.homeRuns,
      runs: domainStats.runs,
      rbis: domainStats.rbis,
      walks: domainStats.walks,
      strikeouts: domainStats.strikeouts,
      battingAverage: domainStats.battingAverage,
      onBasePercentage: domainStats.onBasePercentage,
      sluggingPercentage: domainStats.sluggingPercentage,
    };
  }

  // ========== Game Conversions ==========

  /**
   * Convert domain Game to GameDTO
   */
  public static gameToDTO(domainGame: DomainGame): GameDTO {
    return {
      id: domainGame.id,
      name: domainGame.name,
      opponent: domainGame.opponent,
      date: domainGame.date,
      seasonId: domainGame.seasonId || '',
      homeTeamId: domainGame.teamId, // Current team
      awayTeamId: domainGame.opponent, // Opponent
      gameTypeId: domainGame.gameTypeId || '',
      teamId: domainGame.teamId, // For compatibility
      status: PresentationValueConverter.toPresentationGameStatus(
        domainGame.status
      ),
      currentInning: 1, // Default or from game state
      isTopInning: true, // Default or from game state
      homeScore: domainGame.scoreboard?.homeScore || 0,
      awayScore: domainGame.scoreboard?.awayScore || 0,
      lineupId: domainGame.lineupId || undefined,
      currentBatterId: undefined, // From game state
      currentBaserunners: {
        first: null,
        second: null,
        third: null,
      }, // Default empty baserunners
      totalInnings: 7, // Standard softball
      finalScore: domainGame.scoreboard
        ? domainGame.scoreboard.toGameScore()
        : undefined,
      createdAt: domainGame.createdAt || new Date(),
      updatedAt: domainGame.updatedAt || new Date(),

      // Helper methods (mirroring domain entity API)
      isAwayGame: () => domainGame.homeAway === 'away',
      isHomeGame: () => domainGame.homeAway === 'home',
      getVenueText: () => (domainGame.homeAway === 'home' ? 'vs' : '@'),
    };
  }

  /**
   * Convert domain Games to GameDTOs
   */
  public static gamesToDTO(domainGames: DomainGame[]): GameDTO[] {
    return domainGames.map((game) => this.gameToDTO(game));
  }

  // ========== Season Conversions ==========

  /**
   * Convert domain Season to SeasonDTO
   */
  public static seasonToDTO(domainSeason: DomainSeason): SeasonDTO {
    return {
      id: domainSeason.id,
      name: domainSeason.name,
      startDate: domainSeason.startDate,
      endDate: domainSeason.endDate,
      isActive: domainSeason.isActive(),
      createdAt: domainSeason.createdAt,
      updatedAt: domainSeason.updatedAt,
    };
  }

  /**
   * Convert domain Seasons to SeasonDTOs
   */
  public static seasonsToDTO(domainSeasons: DomainSeason[]): SeasonDTO[] {
    return domainSeasons.map((season) => this.seasonToDTO(season));
  }

  // ========== GameType Conversions ==========

  /**
   * Convert domain GameType to GameTypeDTO
   */
  public static gameTypeToDTO(domainGameType: DomainGameType): GameTypeDTO {
    return {
      id: domainGameType.id,
      name: domainGameType.name,
      inningsCount: 7, // Default softball innings
      isActive: true, // Default value since GameType domain doesn't have isActive
      createdAt: domainGameType.createdAt,
      updatedAt: domainGameType.updatedAt,
    };
  }

  /**
   * Convert domain GameTypes to GameTypeDTOs
   */
  public static gameTypesToDTO(
    domainGameTypes: DomainGameType[]
  ): GameTypeDTO[] {
    return domainGameTypes.map((gameType) => this.gameTypeToDTO(gameType));
  }

  // ========== AtBat Conversions ==========

  /**
   * Convert domain AtBat to AtBatDTO
   */
  public static atBatToDTO(domainAtBat: DomainAtBat): AtBatDTO {
    return {
      id: domainAtBat.id,
      gameId: domainAtBat.gameId,
      inningId: domainAtBat.inningId,
      batterId: domainAtBat.batterId,
      pitchCount: 0, // Default value since AtBat domain doesn't have pitchCount
      result: domainAtBat.result.value,
      description: domainAtBat.description,
      rbis: domainAtBat.rbis,
      runsScored: [], // Default empty array since AtBat domain has different structure
      outsRecorded: [], // Default empty array since AtBat domain doesn't have outsRecorded
      baserunnersBefore: {
        first: null,
        second: null,
        third: null,
      }, // Default empty baserunners since types don't match
      baserunnersAfter: {
        first: null,
        second: null,
        third: null,
      }, // Default empty baserunners since types don't match
      createdAt: domainAtBat.createdAt,
    };
  }

  /**
   * Convert domain AtBats to AtBatDTOs
   */
  public static atBatsToDTO(domainAtBats: DomainAtBat[]): AtBatDTO[] {
    return domainAtBats.map((atBat) => this.atBatToDTO(atBat));
  }

  // ========== Baserunner State Conversions ==========

  /**
   * Convert domain BaserunnerState to PresentationBaserunnerState
   */
  public static baserunnerStateToPresentation(
    domainState: DomainBaserunnerState
  ): PresentationBaserunnerState {
    return {
      first: domainState.firstBase
        ? {
            playerId: domainState.firstBase,
            playerName: `Player ${domainState.firstBase.slice(-4)}`,
          }
        : null,
      second: domainState.secondBase
        ? {
            playerId: domainState.secondBase,
            playerName: `Player ${domainState.secondBase.slice(-4)}`,
          }
        : null,
      third: domainState.thirdBase
        ? {
            playerId: domainState.thirdBase,
            playerName: `Player ${domainState.thirdBase.slice(-4)}`,
          }
        : null,
    };
  }

  /**
   * Convert PresentationBaserunnerState to domain BaserunnerState
   */
  public static baserunnerStateToDomain(
    presentationState: PresentationBaserunnerState
  ): DomainBaserunnerState {
    return new DomainBaserunnerState(
      presentationState.first?.playerId || null,
      presentationState.second?.playerId || null,
      presentationState.third?.playerId || null
    );
  }

  // ========== Value Object Conversions ==========

  /**
   * Convert presentation batting result to domain BattingResult
   */
  public static presentationBattingResultToDomain(
    presentationResult: PresentationBattingResult
  ): DomainBattingResult {
    return new DomainBattingResult(
      PresentationValueConverter.toDomainBattingResult(presentationResult)
    );
  }

  /**
   * Convert domain BattingResult to presentation batting result
   */
  public static domainBattingResultToPresentation(
    domainResult: DomainBattingResult
  ): PresentationBattingResult {
    return PresentationValueConverter.toPresentationBattingResult(
      domainResult.value
    );
  }

  // ========== Form Data Conversions ==========

  /**
   * Convert presentation form data to domain-compatible format
   */
  public static presentationPlayerFormToDomain(formData: {
    name: string;
    jerseyNumber: string;
    positions: PresentationPosition[];
    isActive: boolean;
  }): {
    name: string;
    jerseyNumber: number;
    positions: string[];
    isActive: boolean;
  } {
    return {
      name: formData.name,
      jerseyNumber: parseInt(formData.jerseyNumber, 10),
      positions: formData.positions.map((pos) =>
        PresentationValueConverter.toDomainPosition(pos)
      ),
      isActive: formData.isActive,
    };
  }

  /**
   * Convert presentation team form data to domain-compatible format
   */
  public static presentationTeamFormToDomain(formData: {
    name: string;
    isActive: boolean;
  }): {
    name: string;
    isActive: boolean;
  } {
    return {
      name: formData.name,
      isActive: formData.isActive,
    };
  }

  // ========== Reverse Conversion Methods ==========

  /**
   * Convert GameDTO back to domain Game entity (for compatibility with old gameAdapter)
   */
  public static gameDTOToDomain(gameDTO: GameDTO): DomainGame {
    // This is primarily for backward compatibility during the transition
    // The consolidated Game entity uses Scoreboard instead of GameScore
    const legacyFormat = {
      id: gameDTO.id,
      name: gameDTO.name,
      opponent: gameDTO.opponent,
      date: gameDTO.date,
      seasonId: gameDTO.seasonId || null,
      gameTypeId: gameDTO.gameTypeId || null,
      homeAway: gameDTO.isAwayGame() ? ('away' as const) : ('home' as const),
      teamId: gameDTO.homeTeamId,
      status: gameDTO.status,
      lineupId: gameDTO.lineupId || null,
      inningIds: [],
      finalScore: gameDTO.finalScore
        ? {
            homeScore: gameDTO.finalScore.homeScore,
            awayScore: gameDTO.finalScore.awayScore,
            inningScores: gameDTO.finalScore.inningScores || [],
          }
        : null,
      createdAt: gameDTO.createdAt,
      updatedAt: gameDTO.updatedAt,
    };

    return DomainGame.fromLegacy(legacyFormat);
  }

  /**
   * Convert presentation position to domain Position (for compatibility)
   */
  public static presentationPositionToDomain(
    presentationPosition: PresentationPosition
  ): string {
    return PresentationValueConverter.toDomainPosition(presentationPosition);
  }

  /**
   * Convert domain position to presentation Position (for compatibility)
   */
  public static domainPositionToPresentation(
    domainPosition: string
  ): PresentationPosition {
    return PresentationValueConverter.toPresentationPosition(domainPosition);
  }
}
