import { BaserunnerState, BattingResult } from '../../../domain/values';
import { IScoringService } from '../../../domain/interfaces';
import {
  IScoringApplicationService,
  PresentationBaserunnerState,
  ScoringAdvancement,
} from '../interfaces/IScoringApplicationService';

/**
 * Application Service implementation for scoring operations
 *
 * Adapts domain scoring service for use by presentation layer
 */
export class ScoringApplicationService implements IScoringApplicationService {
  constructor(private domainScoringService: IScoringService) {}

  public calculateBaserunnerAdvancement(
    battingResult: string,
    currentState: PresentationBaserunnerState,
    batterId: string
  ): ScoringAdvancement {
    // Convert presentation state to domain state
    const domainState = new BaserunnerState(
      currentState.first?.playerId ?? null,
      currentState.second?.playerId ?? null,
      currentState.third?.playerId ?? null
    );

    // Convert string to domain BattingResult
    // TODO: This should be handled by a proper converter from presentation layer
    const domainBattingResult = BattingResult.fromValue(battingResult);

    // Use domain service to calculate advancement
    const domainAdvancement =
      this.domainScoringService.calculateBaserunnerAdvancement(
        domainBattingResult,
        domainState,
        batterId
      );

    // Convert back to presentation format
    const convertPlayer = (
      playerId: string | null
    ): { playerId: string; playerName: string } | null => {
      if (!playerId) return null;
      return { playerId, playerName: `Player ${playerId}` }; // TODO: Get actual player name
    };

    return {
      newState: {
        first: convertPlayer(domainAdvancement.newState.firstBase),
        second: convertPlayer(domainAdvancement.newState.secondBase),
        third: convertPlayer(domainAdvancement.newState.thirdBase),
      },
      runsScored: domainAdvancement.runsScored.map((playerId: string) => ({
        playerId,
        playerName: `Player ${playerId}`,
      })),
    };
  }

  public calculateOuts(battingResult: string): number {
    const domainBattingResult = BattingResult.fromValue(battingResult);
    return this.domainScoringService.calculateOuts(domainBattingResult);
  }

  public async validateAdvancement(
    _battingResult: string,
    _currentState: PresentationBaserunnerState,
    _proposedState: PresentationBaserunnerState
  ): Promise<{ isValid: boolean; errors: string[] }> {
    // TODO: Implement validation logic
    // For now, return always valid
    return { isValid: true, errors: [] };
  }
}
