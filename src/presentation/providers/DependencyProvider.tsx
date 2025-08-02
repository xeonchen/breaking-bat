import { ReactNode, useEffect } from 'react';
import { initializeTeamsStore } from '@/presentation/stores/teamsStore';
import { initializeGamesStore } from '@/presentation/stores/gamesStore';
import { CreateTeamUseCase } from '@/application/use-cases/CreateTeamUseCase';
import { CreateGameUseCase } from '@/application/use-cases/CreateGameUseCase';
import { AddPlayerUseCase } from '@/application/use-cases/AddPlayerUseCase';
import { UpdatePlayerUseCase } from '@/application/use-cases/UpdatePlayerUseCase';
import { RemovePlayerUseCase } from '@/application/use-cases/RemovePlayerUseCase';
import { IndexedDBTeamRepository } from '@/infrastructure/repositories/IndexedDBTeamRepository';
import { IndexedDBPlayerRepository } from '@/infrastructure/repositories/IndexedDBPlayerRepository';
import { IndexedDBGameRepository } from '@/infrastructure/repositories/IndexedDBGameRepository';
import { IndexedDBSeasonRepository } from '@/infrastructure/repositories/IndexedDBSeasonRepository';
import { IndexedDBGameTypeRepository } from '@/infrastructure/repositories/IndexedDBGameTypeRepository';
import { TeamHydrationService } from '@/presentation/services/TeamHydrationService';

interface DependencyProviderProps {
  children: ReactNode;
}

export function DependencyProvider({
  children,
}: DependencyProviderProps) {
  useEffect(() => {
    // Initialize repositories
    const teamRepository = new IndexedDBTeamRepository();
    const playerRepository = new IndexedDBPlayerRepository();
    const gameRepository = new IndexedDBGameRepository();
    const seasonRepository = new IndexedDBSeasonRepository();
    const gameTypeRepository = new IndexedDBGameTypeRepository();

    // Initialize services
    const teamHydrationService = new TeamHydrationService(playerRepository);

    // Initialize use cases
    const createTeamUseCase = new CreateTeamUseCase(teamRepository);
    const createGameUseCase = new CreateGameUseCase(gameRepository);
    const addPlayerUseCase = new AddPlayerUseCase(
      playerRepository,
      teamRepository
    );
    const updatePlayerUseCase = new UpdatePlayerUseCase(playerRepository);
    const removePlayerUseCase = new RemovePlayerUseCase(
      playerRepository,
      teamRepository
    );

    // Initialize stores with dependencies
    initializeTeamsStore({
      teamRepository,
      playerRepository,
      teamHydrationService,
      createTeamUseCase,
      addPlayerUseCase,
      updatePlayerUseCase,
      removePlayerUseCase,
    });

    initializeGamesStore({
      gameRepository,
      seasonRepository,
      gameTypeRepository,
      teamRepository,
      createGameUseCase,
    });
  }, []);

  return <>{children}</>;
}
