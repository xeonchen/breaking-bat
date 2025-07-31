import { Position } from '@/domain/values';

/**
 * Presentation layer Player interface (matches what TeamManagement expects)
 */
export interface PresentationPlayer {
  id: string;
  name: string;
  jerseyNumber: string; // String for form compatibility
  positions: Position[];
  isActive: boolean;
}

/**
 * Presentation layer Team interface with embedded players (matches what TeamManagement expects)
 */
export interface PresentationTeam {
  id: string;
  name: string;
  players: PresentationPlayer[];
}

/**
 * Player statistics interface for presentation layer
 */
export interface PlayerStats {
  avg: number;
  hits: number;
  atBats: number;
  rbi: number;
}
