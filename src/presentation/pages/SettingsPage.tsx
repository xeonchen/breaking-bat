import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { DownloadIcon, AddIcon } from '@chakra-ui/icons';
import { SeasonsManagement } from '@/presentation/components/settings/SeasonsManagement';
import { GameTypesManagement } from '@/presentation/components/settings/GameTypesManagement';
import { useGamesStore } from '@/presentation/stores/gamesStore';

export default function SettingsPage() {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const toast = useToast();
  const { loadDefaultData, loading } = useGamesStore();

  const handleExportData = () => {
    console.log('🔄 Export data clicked');
    // TODO: Implement actual data export functionality
    alert('Data export functionality will be implemented here');
  };

  const handleLoadSampleData = async () => {
    try {
      console.log('🔄 Load sample data clicked');
      const result = await loadDefaultData();
      toast({
        title: 'Sample Data Loaded Successfully!',
        description: result.message,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to load sample data:', error);
      toast({
        title: 'Failed to Load Sample Data',
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={6} data-testid="settings-page">
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading mb={4}>Settings</Heading>
          <Text>Manage your application settings and game configuration.</Text>
        </Box>

        <Tabs variant="line" colorScheme="brand">
          <TabList borderColor={borderColor}>
            <Tab data-testid="general-tab">General</Tab>
            <Tab data-testid="game-config-tab">Game Configuration</Tab>
          </TabList>

          <TabPanels>
            {/* General Settings Tab */}
            <TabPanel px={0} py={6}>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="md" mb={4}>
                    Data Management
                  </Heading>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <Text
                        data-testid="load-sample-data-description"
                        mb={2}
                        fontSize="sm"
                        color="gray.600"
                      >
                        Load sample teams with MLB fantasy players, seasons, and
                        game types for testing
                      </Text>
                      <Button
                        data-testid="load-sample-data-button"
                        leftIcon={<AddIcon />}
                        colorScheme="blue"
                        onClick={handleLoadSampleData}
                        isLoading={loading}
                        loadingText="Loading Sample Data..."
                      >
                        Load Sample Data
                      </Button>
                    </Box>
                    <Box>
                      <Text mb={2} fontSize="sm" color="gray.600">
                        Export all your current data
                      </Text>
                      <Button
                        data-testid="export-data-button"
                        leftIcon={<DownloadIcon />}
                        colorScheme="green"
                        onClick={handleExportData}
                      >
                        Export Data
                      </Button>
                    </Box>
                  </VStack>
                </Box>

                <Box>
                  <Heading size="md" mb={4}>
                    Application Settings
                  </Heading>
                  <Text color="gray.500">
                    Theme preferences, notifications, and other general settings
                    will be available here.
                  </Text>
                </Box>
              </VStack>
            </TabPanel>

            {/* Game Configuration Tab */}
            <TabPanel px={0} py={6}>
              <VStack spacing={8} align="stretch">
                {/* Seasons Management Section */}
                <Box data-testid="seasons-section">
                  <SeasonsManagement />
                </Box>

                {/* Game Types Management Section */}
                <Box data-testid="game-types-section">
                  <GameTypesManagement />
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
}
