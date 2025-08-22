import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { IndexedDBPlayerRepository } from '@/infrastructure/repositories/IndexedDBPlayerRepository';
import { IndexedDBTeamRepository } from '@/infrastructure/repositories/IndexedDBTeamRepository';
import { AddPlayerUseCase } from '@/application/use-cases/AddPlayerUseCase';
import { UpdatePlayerUseCase } from '@/application/use-cases/UpdatePlayerUseCase';
import { RemovePlayerUseCase } from '@/application/use-cases/RemovePlayerUseCase';
import { CreateTeamUseCase } from '@/application/use-cases/CreateTeamUseCase';
import { TeamHydrationService } from '@/presentation/adapters/TeamHydrationService';
import { Position } from '@/domain/values';
import {
  initializeTeamsStore,
  useTeamsStore,
} from '@/presentation/stores/teamsStore';
import TeamsPage from '@/presentation/pages/TeamsPage';
import { createFreshTestDatabase } from '../test-helpers/database';
import theme from '@/presentation/theme';
import Dexie from 'dexie';
import {
  applyUseEffectFix,
  removeUseEffectFix,
} from '@/utils/react-useeffect-fix';

// PresentationPosition is now an enum, no helper needed

describe('Manage Roster Dialog Integration Tests', () => {
  let db: Dexie;
  let teamRepository: IndexedDBTeamRepository;
  let playerRepository: IndexedDBPlayerRepository;
  let teamHydrationService: TeamHydrationService;
  let addPlayerUseCase: AddPlayerUseCase;
  let updatePlayerUseCase: UpdatePlayerUseCase;
  let removePlayerUseCase: RemovePlayerUseCase;
  let createTeamUseCase: CreateTeamUseCase;
  let testTeamId: string;

  // Apply React useEffect fix to handle the underlying useEffect issue
  beforeAll(() => {
    applyUseEffectFix();
  });

  afterAll(() => {
    removeUseEffectFix();
  });

  beforeEach(async () => {
    // Create fresh test database
    db = createFreshTestDatabase();
    await db.open();

    // Initialize repositories and services
    teamRepository = new IndexedDBTeamRepository(db);
    playerRepository = new IndexedDBPlayerRepository(db);
    teamHydrationService = new TeamHydrationService(playerRepository);

    // Initialize use cases
    addPlayerUseCase = new AddPlayerUseCase(playerRepository, teamRepository);
    updatePlayerUseCase = new UpdatePlayerUseCase(
      playerRepository,
      teamRepository
    );
    removePlayerUseCase = new RemovePlayerUseCase(
      playerRepository,
      teamRepository
    );
    createTeamUseCase = new CreateTeamUseCase(teamRepository);

    // Create a simple application service wrapper for integration testing
    const teamApplicationService = {
      getTeams: async (query?: any) => {
        const teams = await teamRepository.findAll();
        return { isSuccess: true, value: teams };
      },
      createTeam: async (command: any) => {
        return await createTeamUseCase.execute(command);
      },
      updateTeam: async (command: any) => {
        // Not implemented for this test
        return { isSuccess: true, value: null };
      },
      deleteTeam: async (teamId: string) => {
        // Not implemented for this test
        return { isSuccess: true, value: null };
      },
      getTeamById: async (teamId: string) => {
        return await teamRepository.findById(teamId);
      },
      addPlayer: async (command: any) => {
        // Map AddPlayerToTeamCommand to AddPlayerCommand
        const addPlayerCommand = {
          teamId: command.teamId,
          name: command.playerName, // Map playerName to name
          jerseyNumber: command.jerseyNumber,
          positions: command.positions.map((pos: string) => ({ value: pos })), // Convert to Position objects
          isActive: command.isActive !== undefined ? command.isActive : true,
        };
        return await addPlayerUseCase.execute(addPlayerCommand);
      },
      updatePlayer: async (command: any) => {
        // Map UpdatePlayerInTeamCommand to UpdatePlayerCommand
        const updatePlayerCommand = {
          playerId: command.playerId,
          name: command.playerName, // Map playerName to name
          jerseyNumber: command.jerseyNumber,
          positions: command.positions.map((pos: string) => ({ value: pos })), // Convert to Position objects
          isActive: command.isActive,
        };
        return await updatePlayerUseCase.execute(updatePlayerCommand);
      },
      removePlayer: async (command: any) => {
        return await removePlayerUseCase.execute(command);
      },
      // Missing interface methods (not used in this test but required for interface compliance)
      archiveTeam: async () => ({ isSuccess: true, value: null }),
      getTeamsBySeason: async () => ({ isSuccess: true, value: [] }),
      searchTeams: async () => ({
        isSuccess: true,
        value: { teams: [], totalCount: 0, hasMore: false },
      }),
      getTeamRoster: async () => ({ isSuccess: true, value: null }),
      getTeamStatistics: async () => ({ isSuccess: true, value: null }),
      isTeamNameAvailable: async () => ({ isSuccess: true, value: true }),
      isJerseyNumberAvailable: async () => ({ isSuccess: true, value: true }),
    };

    // Initialize the store with the application service
    initializeTeamsStore({
      teamApplicationService,
      teamHydrationService,
    });

    // Create a test team
    const teamResult = await createTeamUseCase.execute({
      name: 'Test Red Sox',
      seasonIds: [],
      playerIds: [],
    });
    expect(teamResult.isSuccess).toBe(true);
    expect(teamResult.value).toBeDefined();
    if (teamResult.value) {
      testTeamId = teamResult.value.id;
    }
  }, 15000);

  afterEach(async () => {
    // Allow all pending async operations to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
    });

    if (db) {
      await db.delete();
      db.close();
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }, 15000);

  const renderTeamsPage = (): any => {
    return render(
      <ChakraProvider theme={theme}>
        <ErrorBoundary>
          <TeamsPage />
        </ErrorBoundary>
      </ChakraProvider>
    );
  };

  // Simple error boundary to catch useEffect errors
  class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: any }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
      console.log('🚨 ErrorBoundary caught error:', error);
      return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
      console.log('🚨 ErrorBoundary componentDidCatch:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return React.createElement(
          'div',
          {},
          'Error caught: ' + String(this.state.error)
        );
      }
      return this.props.children;
    }
  }

  // Helper to wait for store operations to complete
  const waitForStoreOperations = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
  };

  describe('Roster Management Workflow', () => {
    it('should show current players when opening manage roster dialog', async () => {
      // First add a player to the team
      const addResult = await addPlayerUseCase.execute({
        teamId: testTeamId,
        name: 'Ted Williams',
        jerseyNumber: 9,
        positions: [Position.leftField()],
        isActive: true,
      });
      expect(addResult.isSuccess).toBe(true);

      await act(async () => {
        renderTeamsPage();
      });

      // Wait for teams to load
      await waitFor(() => {
        expect(screen.getByText('Test Red Sox')).toBeInTheDocument();
      });

      // Click "Manage Roster" button
      const manageRosterButton = screen.getByTestId('manage-roster-button');
      await act(async () => {
        fireEvent.click(manageRosterButton);
      });

      // Wait for dialog to open and show player
      await waitFor(() => {
        expect(screen.getByTestId('team-details-modal')).toBeInTheDocument();
        expect(screen.getByText('Ted Williams')).toBeInTheDocument();
        expect(screen.getByText('#9')).toBeInTheDocument();
      });
    }, 20000);

    it('should open team modal without errors', async () => {
      const user = userEvent.setup();

      // Render and wait for initial load
      renderTeamsPage();

      await waitFor(
        () => {
          expect(screen.getByText('Test Red Sox')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Just try to open the modal - this is where the error occurs
      const manageRosterButton = screen.getByTestId('manage-roster-button');
      await user.click(manageRosterButton);

      await waitFor(
        () => {
          expect(screen.getByTestId('team-details-modal')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // If we get here, the error didn't happen
      expect(true).toBe(true);
    }, 15000);

    it('should update player list immediately after adding a player', async () => {
      const user = userEvent.setup();

      // Render and wait for initial load
      renderTeamsPage();

      await waitFor(
        () => {
          expect(screen.getByText('Test Red Sox')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Open manage roster dialog and wait for it to fully load
      const manageRosterButton = screen.getByTestId('manage-roster-button');
      await user.click(manageRosterButton);

      await waitFor(
        () => {
          expect(screen.getByTestId('team-details-modal')).toBeInTheDocument();
          expect(
            screen.getByTestId('empty-roster-message')
          ).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Click "Add Player" button and wait for modal
      const addPlayerButton = screen.getByTestId('add-player-button');
      await user.click(addPlayerButton);

      await waitFor(
        () => {
          expect(screen.getByTestId('player-add-modal')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Fill in player details
      const nameInput = screen.getByTestId('player-name-input');
      const jerseyInput = screen.getByTestId('player-jersey-input');
      const positionSelect = screen.getByTestId('player-position-select');

      await user.type(nameInput, 'David Ortiz');
      await user.type(jerseyInput, '34');
      await user.selectOptions(positionSelect, 'first-base');

      // Save the player and wait for async operations to complete
      const confirmButton = screen.getByTestId('confirm-add-player');
      await user.click(confirmButton);

      // Wait for player to be added and dialog to close
      await waitFor(() => {
        expect(
          screen.queryByTestId('player-add-modal')
        ).not.toBeInTheDocument();
      });

      // Wait for the player to be added and verify the UI updates
      await waitFor(
        () => {
          expect(screen.getByText('David Ortiz')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      await waitFor(
        () => {
          expect(screen.getByText('#34')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Verify the store has been updated correctly
      const finalStore = useTeamsStore.getState();
      expect(finalStore.selectedTeam?.players).toHaveLength(1);
      expect(finalStore.selectedTeam?.players[0]?.name).toBe('David Ortiz');

      // Verify empty message is gone
      expect(
        screen.queryByTestId('empty-roster-message')
      ).not.toBeInTheDocument();

      // Wait for all store operations to complete before test ends
      await waitForStoreOperations();

      await new Promise((resolve) => setTimeout(resolve, 100));
    }, 25000);

    it('should update player list immediately after removing a player', async () => {
      const user = userEvent.setup();

      // First add a player
      const addResult = await addPlayerUseCase.execute({
        teamId: testTeamId,
        name: 'Mookie Betts',
        jerseyNumber: 50,
        positions: [Position.rightField()],
        isActive: true,
      });
      expect(addResult.isSuccess).toBe(true);
      expect(addResult.value).toBeDefined();
      let playerId = '';
      if (addResult.value) {
        playerId = addResult.value.id;
      }

      renderTeamsPage();

      // Wait for team to load
      await waitFor(() => {
        expect(screen.getByText('Test Red Sox')).toBeInTheDocument();
      });

      // Open manage roster dialog
      const manageRosterButton = screen.getByTestId('manage-roster-button');
      await user.click(manageRosterButton);

      // Wait for dialog and player to appear
      await waitFor(() => {
        expect(screen.getByText('Mookie Betts')).toBeInTheDocument();
        expect(screen.getByText('#50')).toBeInTheDocument();
      });

      // Click remove player button
      const removeButton = screen.getByTestId(`remove-player-${playerId}`);
      await user.click(removeButton);

      // Wait for confirmation modal
      await waitFor(() => {
        expect(screen.getByTestId('remove-player-modal')).toBeInTheDocument();
      });

      // Confirm removal
      const confirmRemoveButton = screen.getByTestId('confirm-remove-button');
      await user.click(confirmRemoveButton);

      // Wait for removal modal to close
      await waitFor(() => {
        expect(
          screen.queryByTestId('remove-player-modal')
        ).not.toBeInTheDocument();
      });

      // Verify player is removed from roster immediately
      await waitFor(() => {
        expect(screen.queryByText('Mookie Betts')).not.toBeInTheDocument();
        expect(screen.getByTestId('empty-roster-message')).toBeInTheDocument();
      });
    }, 25000);

    it('should update player list immediately after editing a player', async () => {
      const user = userEvent.setup();

      // First add a player with a simpler, unique name
      const addResult = await addPlayerUseCase.execute({
        teamId: testTeamId,
        name: 'TestPlayer',
        jerseyNumber: 99,
        positions: [Position.leftField()],
        isActive: true,
      });
      expect(addResult.isSuccess).toBe(true);
      expect(addResult.value).toBeDefined();

      const playerId = addResult.value?.id || '';
      expect(playerId).toBeTruthy();

      renderTeamsPage();

      // Wait for team to load with better error handling
      await waitFor(
        () => {
          expect(screen.getByText('Test Red Sox')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Open manage roster dialog
      const manageRosterButton = screen.getByTestId('manage-roster-button');
      await user.click(manageRosterButton);

      // Wait for dialog and player to appear
      await waitFor(
        () => {
          expect(screen.getByText('TestPlayer')).toBeInTheDocument();
          expect(screen.getByText('#99')).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Click edit player button
      const editButton = screen.getByTestId(`edit-player-${playerId}`);
      await user.click(editButton);

      // Wait for edit modal
      await waitFor(
        () => {
          expect(screen.getByTestId('player-edit-modal')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Update player name with more reliable input handling
      const nameInput = screen.getByTestId('player-name-input');
      expect(nameInput).toHaveValue('TestPlayer'); // Verify initial value

      await user.clear(nameInput);
      await user.type(nameInput, 'UpdatedPlayer');

      // Verify the input was updated
      expect(nameInput).toHaveValue('UpdatedPlayer');

      // Save changes
      const saveButton = screen.getByTestId('save-player-button');
      await user.click(saveButton);

      // Wait for edit modal to close
      await waitFor(
        () => {
          expect(
            screen.queryByTestId('player-edit-modal')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Wait for data to be persisted and UI to update
      await act(async () => {
        // Give more time for the Clean Architecture flow to complete:
        // UI → teamsStore.updatePlayer → Application Layer → Domain → Infrastructure → refresh
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });

      // Add debugging to understand the current state
      console.log('🔍 Current DOM content after player update:');
      const teamDetailsModal = screen.queryByTestId('team-details-modal');
      if (teamDetailsModal) {
        console.log(
          'Team details modal content:',
          teamDetailsModal.textContent
        );
      } else {
        console.log('Team details modal not found');
      }

      // Also check if there are any error messages
      const errorElements = screen.queryAllByText(/error/i);
      if (errorElements.length > 0) {
        console.log(
          'Found error elements:',
          errorElements.map((el) => el.textContent)
        );
      }

      // Verify player name is updated with better error handling and debugging
      await waitFor(
        () => {
          // First check if the original name is still there
          const oldNameElements = screen.queryAllByText('TestPlayer');
          const newNameElements = screen.queryAllByText('UpdatedPlayer');
          const jerseyElements = screen.queryAllByText('#99');

          console.log(
            `🔍 Found ${oldNameElements.length} instances of "TestPlayer"`
          );
          console.log(
            `🔍 Found ${newNameElements.length} instances of "UpdatedPlayer"`
          );
          console.log(`🔍 Found ${jerseyElements.length} instances of "#99"`);

          if (newNameElements.length === 0) {
            console.error(
              '❌ UpdatedPlayer not found. Available player-related text:'
            );
            const modal = screen.getByTestId('team-details-modal');
            const playerTexts = modal.textContent?.match(
              /\b[A-Z][a-z]+Player\b|\b[A-Z][a-z]+\s[A-Z][a-z]+\b|#\d+/g
            );
            console.error('Player-related content:', playerTexts);
          }

          expect(newNameElements.length).toBeGreaterThan(0);
          expect(oldNameElements.length).toBe(0);
          expect(jerseyElements.length).toBeGreaterThan(0);
        },
        {
          timeout: 20000,
          onTimeout: () =>
            new Error(
              'Updated player name "UpdatedPlayer" not found after edit operation. Check console logs for details.'
            ),
        }
      );
    }, 30000);

    it('should handle multiple rapid operations without data inconsistency', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      // Wait for team to load
      await waitFor(() => {
        expect(screen.getByText('Test Red Sox')).toBeInTheDocument();
      });

      // Open manage roster dialog
      const manageRosterButton = screen.getByTestId('manage-roster-button');
      await user.click(manageRosterButton);

      await waitFor(() => {
        expect(screen.getByTestId('team-details-modal')).toBeInTheDocument();
      });

      // Add first player
      let addPlayerButton = screen.getByTestId('add-player-button');
      await user.click(addPlayerButton);

      await waitFor(() => {
        expect(screen.getByTestId('player-add-modal')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('player-name-input'), 'Player 1');
      await user.type(screen.getByTestId('player-jersey-input'), '1');
      await user.click(screen.getByTestId('confirm-add-player'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('player-add-modal')
        ).not.toBeInTheDocument();
        expect(screen.getByText('Player 1')).toBeInTheDocument();
      });

      // Immediately add second player
      addPlayerButton = screen.getByTestId('add-player-button');
      await user.click(addPlayerButton);

      await waitFor(() => {
        expect(screen.getByTestId('player-add-modal')).toBeInTheDocument();
      });

      const nameInput = screen.getByTestId('player-name-input');
      const jerseyInput = screen.getByTestId('player-jersey-input');

      await user.clear(nameInput);
      await user.clear(jerseyInput);
      await user.type(nameInput, 'Player 2');
      await user.type(jerseyInput, '2');
      await user.click(screen.getByTestId('confirm-add-player'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('player-add-modal')
        ).not.toBeInTheDocument();
      });

      // Verify both players are shown
      await waitFor(() => {
        expect(screen.getByText('Player 1')).toBeInTheDocument();
        expect(screen.getByText('Player 2')).toBeInTheDocument();
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
      });
    }, 30000);
  });
});
