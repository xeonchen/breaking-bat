import { Team } from '@/domain/entities/Team';
import { Player } from '@/domain/entities/Player';
import { PresentationTeam } from '@/presentation/types/TeamWithPlayers';
import { PlayerMapper } from './PlayerMapper';

/**
 * Mapper utility for converting between Domain Team and PresentationTeam
 *
 * Domain Team has: seasonIds, playerIds (references only)
 * PresentationTeam has: players (embedded PresentationPlayer objects)
 */
export class TeamMapper {
  /**
   * Convert Domain Team (with separate Player entities) to PresentationTeam
   * This is typically used by hydration services that fetch players separately
   */
  public static domainToPresentation(
    domainTeam: Team,
    domainPlayers: Player[] = []
  ): PresentationTeam {
    // Filter players that belong to this team and convert them
    const teamPlayers = domainPlayers
      .filter((player) => player.teamId === domainTeam.id)
      .map((player) => PlayerMapper.domainToPresentation(player));

    return {
      id: domainTeam.id,
      name: domainTeam.name,
      players: teamPlayers,
    };
  }

  /**
   * Convert PresentationTeam back to Domain Team data (loses embedded players)
   * Note: This only extracts team-level data, not the embedded players
   */
  public static presentationToDomainData(presentationTeam: PresentationTeam): {
    id: string;
    name: string;
    seasonIds: string[];
    playerIds: string[];
  } {
    return {
      id: presentationTeam.id,
      name: presentationTeam.name,
      seasonIds: [], // Not available in PresentationTeam
      playerIds: presentationTeam.players.map((player) => player.id),
    };
  }

  /**
   * Create minimal PresentationTeam from Domain Team (without players)
   * Useful when players haven't been hydrated yet
   */
  public static domainToPresentationMinimal(
    domainTeam: Team
  ): PresentationTeam {
    return {
      id: domainTeam.id,
      name: domainTeam.name,
      players: [], // Empty until hydrated
    };
  }

  /**
   * Extract basic team info from PresentationTeam
   */
  public static extractBasicTeamInfo(presentationTeam: PresentationTeam): {
    id: string;
    name: string;
    playerCount: number;
  } {
    return {
      id: presentationTeam.id,
      name: presentationTeam.name,
      playerCount: presentationTeam.players.length,
    };
  }

  /**
   * Validate team data structure
   */
  public static validatePresentationTeam(team: any): team is PresentationTeam {
    return (
      typeof team === 'object' &&
      team !== null &&
      typeof team.id === 'string' &&
      typeof team.name === 'string' &&
      Array.isArray(team.players)
    );
  }

  /**
   * Merge updated player data into a PresentationTeam
   */
  public static updatePlayerInTeam(
    team: PresentationTeam,
    updatedPlayer: import('@/presentation/types/TeamWithPlayers').PresentationPlayer
  ): PresentationTeam {
    return {
      ...team,
      players: team.players.map((player) =>
        player.id === updatedPlayer.id ? updatedPlayer : player
      ),
    };
  }

  /**
   * Add player to PresentationTeam
   */
  public static addPlayerToTeam(
    team: PresentationTeam,
    newPlayer: import('@/presentation/types/TeamWithPlayers').PresentationPlayer
  ): PresentationTeam {
    // Check if player already exists
    if (team.players.some((player) => player.id === newPlayer.id)) {
      return team; // No change if player already exists
    }

    return {
      ...team,
      players: [...team.players, newPlayer],
    };
  }

  /**
   * Remove player from PresentationTeam
   */
  public static removePlayerFromTeam(
    team: PresentationTeam,
    playerId: string
  ): PresentationTeam {
    return {
      ...team,
      players: team.players.filter((player) => player.id !== playerId),
    };
  }
}
