import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import SeasonsPage from '@/presentation/pages/SeasonsPage';
import theme from '@/presentation/theme';
import { useGamesStore } from '@/presentation/stores/gamesStore';
import { Season } from '@/domain';

// Mock the games store
jest.mock('@/presentation/stores/gamesStore');

// Mock window.confirm
const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

describe('SeasonsPage Component', () => {
  const mockSeasons = [
    new Season(
      '1',
      '2024 Regular Season',
      2024,
      new Date('2024-03-01'),
      new Date('2024-09-30'),
      ['team1', 'team2']
    ),
    new Season(
      '2',
      '2024 Playoffs',
      2024,
      new Date('2024-10-01'),
      new Date('2024-10-31'),
      []
    ),
    new Season(
      '3',
      '2025 Season',
      2025,
      new Date('2025-04-01'),
      new Date('2025-10-31'),
      []
    ),
  ];

  const mockStore = {
    seasons: mockSeasons,
    loading: false,
    loadSeasons: jest.fn(),
    createSeason: jest.fn(),
    updateSeason: jest.fn(),
    deleteSeason: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useGamesStore as any).mockReturnValue(mockStore);
  });

  const renderSeasonsPage = () => {
    return render(
      <ChakraProvider theme={theme}>
        <SeasonsPage />
      </ChakraProvider>
    );
  };

  describe('Basic Rendering', () => {
    it('should render seasons page with main title', () => {
      renderSeasonsPage();

      expect(screen.getByTestId('seasons-page')).toBeInTheDocument();
      expect(screen.getByText('Seasons')).toBeInTheDocument();
      expect(screen.getByTestId('create-season-button')).toBeInTheDocument();
    });

    it('should load seasons on mount', () => {
      renderSeasonsPage();

      expect(mockStore.loadSeasons).toHaveBeenCalledTimes(1);
    });

    it('should render create season button with correct text and icon', () => {
      renderSeasonsPage();

      const createButton = screen.getByTestId('create-season-button');
      expect(createButton).toHaveTextContent('Create Season');
      expect(createButton).toHaveAttribute('aria-label', 'Create new season');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      (useGamesStore as any).mockReturnValue({
        ...mockStore,
        loading: true,
      });

      renderSeasonsPage();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('seasons-page')).not.toBeInTheDocument();
    });
  });

  describe('Seasons Display', () => {
    it('should render seasons grid when seasons exist', () => {
      renderSeasonsPage();

      expect(screen.getByTestId('seasons-grid')).toBeInTheDocument();
      expect(screen.getByText('2024 Regular Season')).toBeInTheDocument();
      expect(screen.getByText('2024 Playoffs')).toBeInTheDocument();
      expect(screen.getByText('2025 Season')).toBeInTheDocument();
    });

    it('should render season details including year and dates', () => {
      renderSeasonsPage();

      // Check for years
      expect(screen.getAllByText('2024')).toHaveLength(2);
      expect(screen.getByText('2025')).toBeInTheDocument();

      // Check for formatted dates (should show localized date strings)
      expect(screen.getByText('3/1/2024 - 9/30/2024')).toBeInTheDocument();
    });

    it('should render season duration', () => {
      renderSeasonsPage();

      // Should show duration for each season
      const durationTexts = screen.getAllByText(/Duration: \d+ days/);
      expect(durationTexts.length).toBeGreaterThan(0);
    });

    it('should render status badges for seasons', () => {
      renderSeasonsPage();

      // Should show status badges - exact status depends on current date
      const badges = screen.getAllByText(/Active|Ended|Upcoming/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should render edit and delete buttons for each season', () => {
      renderSeasonsPage();

      mockSeasons.forEach((season) => {
        expect(
          screen.getByTestId(`edit-season-${season.id}`)
        ).toBeInTheDocument();
        expect(
          screen.getByTestId(`delete-season-${season.id}`)
        ).toBeInTheDocument();
      });
    });

    it('should show empty state when no seasons exist', () => {
      (useGamesStore as any).mockReturnValue({
        ...mockStore,
        seasons: [],
      });

      renderSeasonsPage();

      expect(screen.getByTestId('no-seasons-message')).toBeInTheDocument();
      expect(screen.getByText('No seasons found')).toBeInTheDocument();
      expect(
        screen.getByText('Create your first season to get started')
      ).toBeInTheDocument();
    });
  });

  describe('Create Season Modal', () => {
    it('should open create modal when create button is clicked', async () => {
      renderSeasonsPage();

      const createButton = screen.getByTestId('create-season-button');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Create New Season')).toBeInTheDocument();
      });

      expect(screen.getByTestId('season-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('season-year-input')).toBeInTheDocument();
      expect(screen.getByTestId('season-start-date')).toBeInTheDocument();
      expect(screen.getByTestId('season-end-date')).toBeInTheDocument();
    });

    it('should have correct form fields in create modal', async () => {
      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        expect(screen.getByLabelText('Season name')).toBeInTheDocument();
        expect(screen.getByLabelText('Season year')).toBeInTheDocument();
        expect(screen.getByLabelText('Start date')).toBeInTheDocument();
        expect(screen.getByLabelText('End date')).toBeInTheDocument();
      });

      expect(
        screen.getByPlaceholderText('e.g., 2024 Regular Season')
      ).toBeInTheDocument();
    });

    it('should default year input to current year', async () => {
      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        const yearInput = screen.getByTestId(
          'season-year-input'
        ) as HTMLInputElement;
        expect(yearInput.value).toBe(new Date().getFullYear().toString());
      });
    });

    it('should validate required fields', async () => {
      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        expect(screen.getByTestId('confirm-create-season')).toBeInTheDocument();
      });

      // Try to submit without required fields
      fireEvent.click(screen.getByTestId('confirm-create-season'));

      await waitFor(() => {
        expect(screen.getByText('Season name is required')).toBeInTheDocument();
        expect(screen.getByText('Start date is required')).toBeInTheDocument();
        expect(screen.getByText('End date is required')).toBeInTheDocument();
      });
    });

    it('should validate date order', async () => {
      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        const nameInput = screen.getByTestId('season-name-input');
        const startDateInput = screen.getByTestId('season-start-date');
        const endDateInput = screen.getByTestId('season-end-date');

        fireEvent.change(nameInput, { target: { value: 'Test Season' } });
        fireEvent.change(startDateInput, { target: { value: '2024-10-01' } });
        fireEvent.change(endDateInput, { target: { value: '2024-09-01' } });
      });

      fireEvent.click(screen.getByTestId('confirm-create-season'));

      await waitFor(() => {
        expect(
          screen.getByText('End date must be after start date')
        ).toBeInTheDocument();
      });
    });

    it('should call createSeason on valid form submission', async () => {
      mockStore.createSeason.mockResolvedValue(undefined);

      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        const nameInput = screen.getByTestId('season-name-input');
        const startDateInput = screen.getByTestId('season-start-date');
        const endDateInput = screen.getByTestId('season-end-date');

        fireEvent.change(nameInput, { target: { value: 'New Season' } });
        fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
        fireEvent.change(endDateInput, { target: { value: '2024-09-30' } });
      });

      fireEvent.click(screen.getByTestId('confirm-create-season'));

      await waitFor(() => {
        expect(mockStore.createSeason).toHaveBeenCalledWith({
          name: 'New Season',
          year: new Date().getFullYear(),
          startDate: new Date('2024-03-01'),
          endDate: new Date('2024-09-30'),
        });
      });
    });
  });

  describe('Edit Season Modal', () => {
    it('should open edit modal when edit button is clicked', async () => {
      renderSeasonsPage();

      const editButton = screen.getByTestId('edit-season-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByText('Edit Season')).toBeInTheDocument();
      });

      // Should populate form with existing data
      expect(
        screen.getByDisplayValue('2024 Regular Season')
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-03-01')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2024-09-30')).toBeInTheDocument();
    });

    it('should populate form with existing season data', async () => {
      renderSeasonsPage();

      const editButton = screen.getByTestId('edit-season-2');
      fireEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByDisplayValue('2024 Playoffs')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-10-01')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2024-10-31')).toBeInTheDocument();
      });
    });

    it('should call updateSeason on valid form submission', async () => {
      mockStore.updateSeason.mockResolvedValue(undefined);

      renderSeasonsPage();

      const editButton = screen.getByTestId('edit-season-1');
      fireEvent.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByTestId('season-name-input');
        fireEvent.change(nameInput, { target: { value: 'Updated Season' } });
      });

      fireEvent.click(screen.getByTestId('confirm-create-season'));

      await waitFor(() => {
        expect(mockStore.updateSeason).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Season', () => {
    it('should show confirmation dialog when delete button is clicked', () => {
      renderSeasonsPage();

      const deleteButton = screen.getByTestId('delete-season-1');
      fireEvent.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete this season?'
      );
    });

    it('should call deleteSeason when confirmed', async () => {
      mockStore.deleteSeason.mockResolvedValue(undefined);
      confirmSpy.mockReturnValue(true);

      renderSeasonsPage();

      const deleteButton = screen.getByTestId('delete-season-1');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockStore.deleteSeason).toHaveBeenCalledWith('1');
      });
    });

    it('should not delete when canceled', () => {
      confirmSpy.mockReturnValue(false);

      renderSeasonsPage();

      const deleteButton = screen.getByTestId('delete-season-1');
      fireEvent.click(deleteButton);

      expect(mockStore.deleteSeason).not.toHaveBeenCalled();
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when cancel button is clicked', async () => {
      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Season')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Create New Season')).not.toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        expect(screen.getByText('Create New Season')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Create New Season')).not.toBeInTheDocument();
      });
    });

    it('should reset form when modal is closed and reopened', async () => {
      renderSeasonsPage();

      // Open modal and fill form
      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        const nameInput = screen.getByTestId('season-name-input');
        fireEvent.change(nameInput, { target: { value: 'Test Season' } });
      });

      // Close modal
      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Create New Season')).not.toBeInTheDocument();
      });

      // Reopen modal
      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        const nameInput = screen.getByTestId(
          'season-name-input'
        ) as HTMLInputElement;
        expect(nameInput.value).toBe('');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderSeasonsPage();

      const mainContent = screen.getByTestId('seasons-page');
      expect(mainContent).toHaveAttribute('role', 'main');
      expect(mainContent).toHaveAttribute(
        'aria-label',
        'Seasons Management Page'
      );

      mockSeasons.forEach((season) => {
        const card = screen.getByTestId(
          `season-${season.name.toLowerCase().replace(/\s+/g, '-')}`
        );
        expect(card).toHaveAttribute('role', 'article');
        expect(card).toHaveAttribute('aria-label', `Season: ${season.name}`);
      });
    });

    it('should have proper button labels', () => {
      renderSeasonsPage();

      mockSeasons.forEach((season) => {
        const editButton = screen.getByTestId(`edit-season-${season.id}`);
        const deleteButton = screen.getByTestId(`delete-season-${season.id}`);

        expect(editButton).toHaveAttribute('aria-label', `Edit ${season.name}`);
        expect(deleteButton).toHaveAttribute(
          'aria-label',
          `Delete ${season.name}`
        );
      });
    });

    it('should have proper heading hierarchy', () => {
      renderSeasonsPage();

      const heading = screen.getByRole('heading', { name: 'Seasons' });
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible form inputs', async () => {
      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        expect(screen.getByLabelText('Season name')).toBeInTheDocument();
        expect(screen.getByLabelText('Season year')).toBeInTheDocument();
        expect(screen.getByLabelText('Start date')).toBeInTheDocument();
        expect(screen.getByLabelText('End date')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle create season errors', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockStore.createSeason.mockRejectedValue(new Error('Create failed'));

      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        const nameInput = screen.getByTestId('season-name-input');
        const startDateInput = screen.getByTestId('season-start-date');
        const endDateInput = screen.getByTestId('season-end-date');

        fireEvent.change(nameInput, { target: { value: 'Test' } });
        fireEvent.change(startDateInput, { target: { value: '2024-03-01' } });
        fireEvent.change(endDateInput, { target: { value: '2024-09-30' } });
      });

      fireEvent.click(screen.getByTestId('confirm-create-season'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to save season:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle delete season errors', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      confirmSpy.mockReturnValue(true);
      mockStore.deleteSeason.mockRejectedValue(new Error('Delete failed'));

      renderSeasonsPage();

      const deleteButton = screen.getByTestId('delete-season-1');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to delete season:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Year Input Handling', () => {
    it('should handle invalid year input gracefully', async () => {
      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        const yearInput = screen.getByTestId('season-year-input');
        fireEvent.change(yearInput, { target: { value: 'invalid' } });
      });

      // Should default back to current year
      const yearInput = screen.getByTestId(
        'season-year-input'
      ) as HTMLInputElement;
      expect(yearInput.value).toBe(new Date().getFullYear().toString());
    });

    it('should respect year input constraints', async () => {
      renderSeasonsPage();

      fireEvent.click(screen.getByTestId('create-season-button'));

      await waitFor(() => {
        const yearInput = screen.getByTestId('season-year-input');
        expect(yearInput).toHaveAttribute('min', '1900');
        expect(yearInput).toHaveAttribute('max', '2100');
      });
    });
  });
});
