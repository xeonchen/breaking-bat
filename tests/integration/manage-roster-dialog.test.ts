import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { IndexedDBPlayerRepository } from '@/infrastructure/repositories/IndexedDBPlayerRepository';
import { IndexedDBTeamRepository } from '@/infrastructure/repositories/IndexedDBTeamRepository';
import { AddPlayerUseCase } from '@/application/use-cases/AddPlayerUseCase';
import { UpdatePlayerUseCase } from '@/application/use-cases/UpdatePlayerUseCase';
import { RemovePlayerUseCase } from '@/application/use-cases/RemovePlayerUseCase';
import { CreateTeamUseCase } from '@/application/use-cases/CreateTeamUseCase';
import { TeamHydrationService } from '@/presentation/services/TeamHydrationService';
import { initializeTeamsStore } from '@/presentation/stores/teamsStore';
import TeamsPage from '@/presentation/pages/TeamsPage';
import { createFreshTestDatabase } from '../test-helpers/database';
import { Team, Position } from '@/domain';
import theme from '@/presentation/theme';
import Dexie from 'dexie';

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

  beforeEach(async () => {
    // Create fresh test database
    db = createFreshTestDatabase();
    await db.open();

    // Initialize repositories and services
    teamRepository = new IndexedDBTeamRepository(db);
    playerRepository = new IndexedDBPlayerRepository(db);
    teamHydrationService = new TeamHydrationService(teamRepository, playerRepository);
    
    // Initialize use cases
    addPlayerUseCase = new AddPlayerUseCase(playerRepository, teamRepository);
    updatePlayerUseCase = new UpdatePlayerUseCase(playerRepository, teamRepository);
    removePlayerUseCase = new RemovePlayerUseCase(playerRepository, teamRepository);
    createTeamUseCase = new CreateTeamUseCase(teamRepository);

    // Initialize the store with real dependencies
    initializeTeamsStore({
      teamRepository,
      playerRepository,
      teamHydrationService,
      createTeamUseCase,
      addPlayerUseCase,
      updatePlayerUseCase,
      removePlayerUseCase,
    });

    // Create a test team
    const teamResult = await createTeamUseCase.execute({
      name: 'Test Red Sox',
      seasonIds: [],
      playerIds: [],
    });
    expect(teamResult.isSuccess).toBe(true);
    testTeamId = teamResult.value!.id;
  }, 15000);

  afterEach(async () => {
    if (db) {
      await db.delete();
      db.close();
    }
  }, 10000);

  const renderTeamsPage = () => {
    return render(
      <ChakraProvider theme={theme}>
        <TeamsPage />
      </ChakraProvider>
    );
  };

  describe('Roster Management Workflow', () => {
    it('should show current players when opening manage roster dialog', async () => {
      // First add a player to the team
      const addResult = await addPlayerUseCase.execute({
        teamId: testTeamId,
        name: 'Ted Williams',
        jerseyNumber: 9,
        position: Position.leftField(),
        isActive: true,
      });
      expect(addResult.isSuccess).toBe(true);

      renderTeamsPage();

      // Wait for teams to load
      await waitFor(() => {
        expect(screen.getByText('Test Red Sox')).toBeInTheDocument();
      });

      // Click "Manage Roster" button
      const manageRosterButton = screen.getByTestId('manage-roster-button');
      fireEvent.click(manageRosterButton);

      // Wait for dialog to open and show player
      await waitFor(() => {
        expect(screen.getByTestId('team-details-modal')).toBeInTheDocument();
        expect(screen.getByText('Ted Williams')).toBeInTheDocument();
        expect(screen.getByText('#9')).toBeInTheDocument();
      });
    }, 20000);

    it('should update player list immediately after adding a player', async () => {
      const user = userEvent.setup();
      renderTeamsPage();

      // Wait for team to load
      await waitFor(() => {
        expect(screen.getByText('Test Red Sox')).toBeInTheDocument();
      });

      // Open manage roster dialog
      const manageRosterButton = screen.getByTestId('manage-roster-button');
      await user.click(manageRosterButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByTestId('team-details-modal')).toBeInTheDocument();
      });

      // Initially should show "No players on the roster"
      expect(screen.getByTestId('empty-roster-message')).toBeInTheDocument();

      // Click "Add Player" button
      const addPlayerButton = screen.getByTestId('add-player-button');
      await user.click(addPlayerButton);

      // Wait for add player modal
      await waitFor(() => {
        expect(screen.getByTestId('player-add-modal')).toBeInTheDocument();
      });

      // Fill in player details
      const nameInput = screen.getByTestId('player-name-input');
      const jerseyInput = screen.getByTestId('player-jersey-input');
      const positionSelect = screen.getByTestId('player-position-select');

      await user.clear(nameInput);
      await user.type(nameInput, 'David Ortiz');
      await user.clear(jerseyInput);
      await user.type(jerseyInput, '34');
      await user.selectOptions(positionSelect, 'first-base');

      // Save the player
      const confirmButton = screen.getByTestId('confirm-add-player');
      await user.click(confirmButton);

      // Wait for player to be added and dialog to close
      await waitFor(() => {
        expect(screen.queryByTestId('player-add-modal')).not.toBeInTheDocument();
      });

      // Verify player appears in the roster immediately
      await waitFor(() => {
        expect(screen.getByText('David Ortiz')).toBeInTheDocument();
        expect(screen.getByText('#34')).toBeInTheDocument();
        expect(screen.queryByTestId('empty-roster-message')).not.toBeInTheDocument();
      });
    }, 25000);

    it('should update player list immediately after removing a player', async () => {
      const user = userEvent.setup();

      // First add a player
      const addResult = await addPlayerUseCase.execute({
        teamId: testTeamId,
        name: 'Mookie Betts',
        jerseyNumber: 50,
        position: Position.rightField(),
        isActive: true,
      });
      expect(addResult.isSuccess).toBe(true);
      const playerId = addResult.value!.id;

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
        expect(screen.queryByTestId('remove-player-modal')).not.toBeInTheDocument();
      });

      // Verify player is removed from roster immediately
      await waitFor(() => {
        expect(screen.queryByText('Mookie Betts')).not.toBeInTheDocument();
        expect(screen.getByTestId('empty-roster-message')).toBeInTheDocument();
      });
    }, 25000);

    it('should update player list immediately after editing a player', async () => {
      const user = userEvent.setup();

      // First add a player
      const addResult = await addPlayerUseCase.execute({
        teamId: testTeamId,
        name: 'Carl Yastrzemski',
        jerseyNumber: 8,
        position: Position.leftField(),
        isActive: true,
      });
      expect(addResult.isSuccess).toBe(true);
      const playerId = addResult.value!.id;

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
        expect(screen.getByText('Carl Yastrzemski')).toBeInTheDocument();
        expect(screen.getByText('#8')).toBeInTheDocument();
      });

      // Click edit player button
      const editButton = screen.getByTestId(`edit-player-${playerId}`);
      await user.click(editButton);

      // Wait for edit modal
      await waitFor(() => {
        expect(screen.getByTestId('player-edit-modal')).toBeInTheDocument();
      });

      // Update player name
      const nameInput = screen.getByTestId('player-name-input');
      await user.clear(nameInput);
      await user.type(nameInput, 'Yaz');

      // Save changes
      const saveButton = screen.getByTestId('save-player-button');
      await user.click(saveButton);

      // Wait for edit modal to close
      await waitFor(() => {
        expect(screen.queryByTestId('player-edit-modal')).not.toBeInTheDocument();
      });

      // Verify player name is updated immediately
      await waitFor(() => {
        expect(screen.getByText('Yaz')).toBeInTheDocument();
        expect(screen.queryByText('Carl Yastrzemski')).not.toBeInTheDocument();
        expect(screen.getByText('#8')).toBeInTheDocument(); // Jersey should remain the same
      });
    }, 25000);

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
        expect(screen.queryByTestId('player-add-modal')).not.toBeInTheDocument();
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
        expect(screen.queryByTestId('player-add-modal')).not.toBeInTheDocument();
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