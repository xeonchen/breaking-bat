import { Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';

export default function SettingsPage(): JSX.Element {
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
          <Text>Application settings and preferences will be managed here.</Text>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Data Management</Heading>
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
  );
}