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
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { SeasonsManagement } from '@/presentation/components/settings/SeasonsManagement';
import { GameTypesManagement } from '@/presentation/components/settings/GameTypesManagement';

export default function SettingsPage() {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleExportData = () => {
    console.log('🔄 Export data clicked');
    // TODO: Implement actual data export functionality
    alert('Data export functionality will be implemented here');
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
                  <Button
                    data-testid="export-data-button"
                    leftIcon={<DownloadIcon />}
                    colorScheme="green"
                    onClick={handleExportData}
                  >
                    Export Data
                  </Button>
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
