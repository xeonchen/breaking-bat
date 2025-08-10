import { Game } from '../entities/Game';

export interface IGameRepository {
  findById(id: string): Promise<Game | null>;
  save(game: Game): Promise<void>;
  findAll(): Promise<Game[]>;
  delete(id: string): Promise<void>;
}
