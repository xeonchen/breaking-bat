import { ReactNode, useEffect } from 'react';
import { initializeTeamsStore } from '@/presentation/stores/teamsStore';
import { CreateTeamUseCase } from '@/application/use-cases/CreateTeamUseCase';
import { IndexedDBTeamRepository } from '@/infrastructure/repositories/IndexedDBTeamRepository';
import { IndexedDBPlayerRepository } from '@/infrastructure/repositories/IndexedDBPlayerRepository';

interface DependencyProviderProps {
  children: ReactNode;
}

export function DependencyProvider({
  children,
}: DependencyProviderProps): JSX.Element {
  useEffect(() => {
    // Initialize repositories
    const teamRepository = new IndexedDBTeamRepository();
    const playerRepository = new IndexedDBPlayerRepository();

    // Initialize use cases
    const createTeamUseCase = new CreateTeamUseCase(teamRepository);

    // Initialize stores with dependencies
    initializeTeamsStore({
      teamRepository,
      playerRepository,
      createTeamUseCase,
    });
  }, []);

  return <>{children}</>;
}
