import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import GameTypesPage from '@/presentation/pages/GameTypesPage';
import theme from '@/presentation/theme';
import { useGamesStore } from '@/presentation/stores/gamesStore';
import { GameType } from '@/domain';

// Mock the games store
jest.mock('@/presentation/stores/gamesStore');

// Mock window.confirm
const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

describe('GameTypesPage Component', () => {
  const mockGameTypes = [
    new GameType('1', 'Regular Season', 'Standard league games'),
    new GameType('2', 'Playoffs', 'Playoff tournament games'),
    new GameType('3', 'Scrimmage', ''),
  ];

  const mockStore = {
    gameTypes: mockGameTypes,
    loading: false,
    loadGameTypes: jest.fn(),
    createGameType: jest.fn(),
    updateGameType: jest.fn(),
    deleteGameType: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGamesStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  const renderGameTypesPage = () => {
    return render(
      <ChakraProvider theme={theme}>
        <GameTypesPage />
      </ChakraProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render game types page with main title', () => {
      renderGameTypesPage();

      expect(screen.getByTestId('game-types-page')).toBeInTheDocument();
      expect(screen.getByText('Game Types')).toBeInTheDocument();
      expect(screen.getByTestId('create-game-type-button')).toBeInTheDocument();
    });

    it('should load game types on mount', () => {
      renderGameTypesPage();

      expect(mockStore.loadGameTypes).toHaveBeenCalledTimes(1);
    });

    it('should render create game type button with correct text and icon', () => {
      renderGameTypesPage();

      const createButton = screen.getByTestId('create-game-type-button');
      expect(createButton).toHaveTextContent('Create Game Type');
      expect(createButton).toHaveAttribute(
        'aria-label',
        'Create new game type'
      );
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      (useGamesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        loading: true,
      });

      renderGameTypesPage();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('game-types-page')).not.toBeInTheDocument();
    });
  });

  describe('Game Types Display', () => {
    it('should render game types grid when game types exist', () => {
      renderGameTypesPage();

      expect(screen.getByTestId('game-types-grid')).toBeInTheDocument();
      expect(screen.getByText('Regular Season')).toBeInTheDocument();
      expect(screen.getByText('Playoffs')).toBeInTheDocument();
      expect(screen.getByText('Scrimmage')).toBeInTheDocument();
    });

    it('should render game type descriptions when available', () => {
      renderGameTypesPage();

      expect(screen.getByText('Standard league games')).toBeInTheDocument();
      expect(screen.getByText('Playoff tournament games')).toBeInTheDocument();
    });

    it('should not render description when not available', () => {
      renderGameTypesPage();

      // Scrimmage game type has empty description, so it shouldn't render description text
      const scrimmageCard = screen.getByTestId('game-type-scrimmage');
      expect(scrimmageCard).toBeInTheDocument();
      expect(scrimmageCard).toHaveTextContent('Scrimmage');

      // Should not have description text
      expect(scrimmageCard.textContent).not.toContain('Standard league games');
    });

    it('should render edit and delete buttons for each game type', () => {
      renderGameTypesPage();

      mockGameTypes.forEach((gameType) => {
        expect(
          screen.getByTestId(`edit-game-type-${gameType.id}`)
        ).toBeInTheDocument();
        expect(
          screen.getByTestId(`delete-game-type-${gameType.id}`)
        ).toBeInTheDocument();
      });
    });

    it('should show empty state when no game types exist', () => {
      (useGamesStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        gameTypes: [],
      });

      renderGameTypesPage();

      expect(screen.getByTestId('no-game-types-message')).toBeInTheDocument();
      expect(screen.getByText('No game types found')).toBeInTheDocument();
      expect(
        screen.getByText('Create your first game type to get started')
      ).toBeInTheDocument();
    });
  });

  describe('Create Game Type Modal', () => {
    it('should open create modal when create button is clicked', async () => {
      renderGameTypesPage();

      const createButton = screen.getByTestId('create-game-type-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Game Type')).toBeInTheDocument();
      });

      expect(screen.getByTestId('game-type-name-input')).toBeInTheDocument();
      expect(
        screen.getByTestId('game-type-description-input')
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('confirm-create-game-type')
      ).toBeInTheDocument();
    });

    it('should have correct form fields in create modal', async () => {
      renderGameTypesPage();

      fireEvent.click(screen.getByTestId('create-game-type-button'));

      await waitFor(() => {
        expect(screen.getByLabelText('Game type name')).toBeInTheDocument();
        expect(
          screen.getByLabelText('Game type description')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByPlaceholderText(
          'e.g., Regular Season, Playoffs, Tournament'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Describe this game type...')
      ).toBeInTheDocument();
    });

    it('should validate form inputs', async () => {
      renderGameTypesPage();

      fireEvent.click(screen.getByTestId('create-game-type-button'));

      await waitFor(() => {
        expect(
          screen.getByTestId('confirm-create-game-type')
        ).toBeInTheDocument();
      });

      // Try to submit without name
      fireEvent.click(screen.getByTestId('confirm-create-game-type'));

      await waitFor(() => {
        expect(
          screen.getByText('Game type name is required')
        ).toBeInTheDocument();
      });
    });

    it('should validate name length', async () => {
      renderGameTypesPage();

      fireEvent.click(screen.getByTestId('create-game-type-button'));

      await waitFor(() => {
        const nameInput = screen.getByTestId('game-type-name-input');
        fireEvent.change(nameInput, { target: { value: 'a'.repeat(101) } });
      });

      fireEvent.click(screen.getByTestId('confirm-create-game-type'));

      await waitFor(() => {
        expect(
          screen.getByText('Game type name cannot exceed 100 characters')
        ).toBeInTheDocument();
      });
    });

    it('should validate description length', async () => {
      renderGameTypesPage();

      fireEvent.click(screen.getByTestId('create-game-type-button'));

      await waitFor(() => {
        const nameInput = screen.getByTestId('game-type-name-input');
        const descInput = screen.getByTestId('game-type-description-input');

        fireEvent.change(nameInput, { target: { value: 'Test Game Type' } });
        fireEvent.change(descInput, { target: { value: 'a'.repeat(501) } });
      });

      fireEvent.click(screen.getByTestId('confirm-create-game-type'));

      await waitFor(() => {
        expect(
          screen.getByText('Description cannot exceed 500 characters')
        ).toBeInTheDocument();
      });
    });

    it('should call createGameType on valid form submission', async () => {
      mockStore.createGameType.mockResolvedValue(undefined);

      renderGameTypesPage();

      fireEvent.click(screen.getByTestId('create-game-type-button'));

      await waitFor(() => {
        const nameInput = screen.getByTestId('game-type-name-input');
        const descInput = screen.getByTestId('game-type-description-input');

        fireEvent.change(nameInput, { target: { value: 'New Game Type' } });
        fireEvent.change(descInput, { target: { value: 'New description' } });
      });

      fireEvent.click(screen.getByTestId('confirm-create-game-type'));

      await waitFor(() => {
        expect(mockStore.createGameType).toHaveBeenCalledWith({
          name: 'New Game Type',
          description: 'New description',
        });
      });
    });
  });

  describe('Edit Game Type Modal', () => {
    it('should open edit modal when edit button is clicked', async () => {
      renderGameTypesPage();

      const editButton = screen.getByTestId('edit-game-type-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Game Type')).toBeInTheDocument();
      });

      // Should populate form with existing data
      expect(screen.getByDisplayValue('Regular Season')).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('Standard league games')
      ).toBeInTheDocument();
    });

    it('should populate form with existing game type data', async () => {
      renderGameTypesPage();

      const editButton = screen.getByTestId('edit-game-type-2');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Playoffs')).toBeInTheDocument();
        expect(
          screen.getByDisplayValue('Playoff tournament games')
        ).toBeInTheDocument();
      });
    });

    it('should call updateGameType on valid form submission', async () => {
      mockStore.updateGameType.mockResolvedValue(undefined);

      renderGameTypesPage();

      const editButton = screen.getByTestId('edit-game-type-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByTestId('game-type-name-input');
        fireEvent.change(nameInput, { target: { value: 'Updated Game Type' } });
      });

      fireEvent.click(screen.getByTestId('confirm-create-game-type'));

      await waitFor(() => {
        expect(mockStore.updateGameType).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Game Type', () => {
    it('should show confirmation dialog when delete button is clicked', () => {
      renderGameTypesPage();

      const deleteButton = screen.getByTestId('delete-game-type-1');
      fireEvent.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this game type?'
      );
    });

    it('should call deleteGameType when confirmed', async () => {
      mockStore.deleteGameType.mockResolvedValue(undefined);
      confirmSpy.mockReturnValue(true);

      renderGameTypesPage();

      const deleteButton = screen.getByTestId('delete-game-type-1');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockStore.deleteGameType).toHaveBeenCalledWith('1');
      });
    });

    it('should not delete when canceled', () => {
      confirmSpy.mockReturnValue(false);

      renderGameTypesPage();

      const deleteButton = screen.getByTestId('delete-game-type-1');
      fireEvent.click(deleteButton);

      expect(mockStore.deleteGameType).not.toHaveBeenCalled();
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when cancel button is clicked', async () => {
      renderGameTypesPage();

      fireEvent.click(screen.getByTestId('create-game-type-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Game Type')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(
          screen.queryByText('Create New Game Type')
        ).not.toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      renderGameTypesPage();

      fireEvent.click(screen.getByTestId('create-game-type-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Game Type')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Create New Game Type')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderGameTypesPage();

      const mainContent = screen.getByTestId('game-types-page');
      expect(mainContent).toHaveAttribute('role', 'main');
      expect(mainContent).toHaveAttribute(
        'aria-label',
        'Game Types Management Page'
      );

      mockGameTypes.forEach((gameType) => {
        const card = screen.getByTestId(
          `game-type-${gameType.name.toLowerCase().replace(/\s+/g, '-')}`
        );
        expect(card).toHaveAttribute('role', 'article');
        expect(card).toHaveAttribute(
          'aria-label',
          `Game Type: ${gameType.name}`
        );
      });
    });

    it('should have proper button labels', () => {
      renderGameTypesPage();

      mockGameTypes.forEach((gameType) => {
        const editButton = screen.getByTestId(`edit-game-type-${gameType.id}`);
        const deleteButton = screen.getByTestId(
          `delete-game-type-${gameType.id}`
        );

        expect(editButton).toHaveAttribute(
          'aria-label',
          `Edit ${gameType.name}`
        );
        expect(deleteButton).toHaveAttribute(
          'aria-label',
          `Delete ${gameType.name}`
        );
      });
    });

    it('should have proper heading hierarchy', () => {
      renderGameTypesPage();

      const heading = screen.getByRole('heading', { name: 'Game Types' });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle create game type errors', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockStore.createGameType.mockRejectedValue(new Error('Create failed'));

      renderGameTypesPage();

      fireEvent.click(screen.getByTestId('create-game-type-button'));

      await waitFor(() => {
        const nameInput = screen.getByTestId('game-type-name-input');
        fireEvent.change(nameInput, { target: { value: 'Test' } });
      });

      fireEvent.click(screen.getByTestId('confirm-create-game-type'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to save game type:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle delete game type errors', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      confirmSpy.mockReturnValue(true);
      mockStore.deleteGameType.mockRejectedValue(new Error('Delete failed'));

      renderGameTypesPage();

      const deleteButton = screen.getByTestId('delete-game-type-1');
      fireEvent.click(deleteButton);

      // Wait for the async operation to complete
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to delete game type:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
