import { Team as DomainTeam, Player as DomainPlayer, PlayerRepository } from '@/domain';
import { PresentationTeam, PresentationPlayer } from '../types/TeamWithPlayers';

/**
 * Service to convert domain teams to presentation teams with hydrated player data
 */
export class TeamHydrationService {
  constructor(private playerRepository: PlayerRepository) {}

  /**
   * Convert domain team to presentation team with embedded players
   */
  async hydrateTeam(domainTeam: DomainTeam): Promise<PresentationTeam> {
    // Load all players for this team
    const domainPlayers = await this.playerRepository.findByTeamId(domainTeam.id);
    
    // Convert domain players to presentation players
    const presentationPlayers: PresentationPlayer[] = domainPlayers.map(
      this.convertDomainPlayerToPresentation
    );

    return {
      id: domainTeam.id,
      name: domainTeam.name,
      players: presentationPlayers,
    };
  }

  /**
   * Convert multiple domain teams to presentation teams
   */
  async hydrateTeams(domainTeams: DomainTeam[]): Promise<PresentationTeam[]> {
    const hydratedTeams = await Promise.all(
      domainTeams.map((team) => this.hydrateTeam(team))
    );
    return hydratedTeams;
  }

  /**
   * Convert domain player to presentation player
   */
  private convertDomainPlayerToPresentation(domainPlayer: DomainPlayer): PresentationPlayer {
    return {
      id: domainPlayer.id,
      name: domainPlayer.name,
      jerseyNumber: domainPlayer.jerseyNumber.toString(), // Convert to string for forms
      position: domainPlayer.position!,
      isActive: domainPlayer.isActive,
    };
  }

  /**
   * Convert presentation player back to domain-compatible format for use cases
   */
  static convertPresentationPlayerToDomain(presentationPlayer: PresentationPlayer): {
    name: string;
    jerseyNumber: number;
    position: any;
    isActive: boolean;
  } {
    return {
      name: presentationPlayer.name,
      jerseyNumber: parseInt(presentationPlayer.jerseyNumber, 10),
      position: presentationPlayer.position,
      isActive: presentationPlayer.isActive,
    };
  }
}