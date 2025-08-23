/**
 * Application Provider - Presentation Layer (Clean Architecture Compliant)
 *
 * Provides access to application services through the ApplicationFacade.
 * This ensures proper dependency direction and layer separation.
 *
 * CLEAN ARCHITECTURE COMPLIANCE:
 * - No direct infrastructure imports
 * - Uses ApplicationFacade as the only entry point to application layer
 * - Presentation layer remains isolated from infrastructure concerns
 */

import { ReactNode, createContext, useContext } from 'react';
import {
  IApplicationFacade,
  getApplicationFacade,
} from '@/application/facade/ApplicationFacade';

/**
 * Context for providing application facade to React components
 * This is the ONLY way presentation layer accesses application services
 */
const ApplicationContext = createContext<IApplicationFacade | null>(null);

interface ApplicationProviderProps {
  children: ReactNode;
}

/**
 * Application Provider component
 * Provides access to application services through the facade pattern
 */
export function ApplicationProvider({ children }: ApplicationProviderProps) {
  // Get the application facade (Clean Architecture boundary)
  const applicationFacade = getApplicationFacade();

  return (
    <ApplicationContext.Provider value={applicationFacade}>
      {children}
    </ApplicationContext.Provider>
  );
}

/**
 * Hook to access the application facade
 * This is the primary way components access application services
 */
export function useApplicationFacade(): IApplicationFacade {
  const facade = useContext(ApplicationContext);

  if (!facade) {
    throw new Error(
      'useApplicationFacade must be used within an ApplicationProvider. ' +
        'Make sure your component is wrapped with ApplicationProvider and ' +
        'the application has been properly bootstrapped.'
    );
  }

  return facade;
}

/**
 * Convenience hooks for accessing specific application services
 * These provide a clean, focused API for components
 */

export function useTeamService() {
  const facade = useApplicationFacade();
  return facade.teamService;
}

export function useGameService() {
  const facade = useApplicationFacade();
  return facade.gameService;
}

export function useStatisticsService() {
  const facade = useApplicationFacade();
  return facade.statisticsService;
}

export function useDataService() {
  const facade = useApplicationFacade();
  return facade.dataService;
}
