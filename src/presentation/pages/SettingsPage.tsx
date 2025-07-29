import { Box, Heading, Text } from '@chakra-ui/react';

export default function SettingsPage(): JSX.Element {
  return (
    <Box>
      <Heading mb={4}>Settings</Heading>
      <Text>Application settings and preferences will be managed here.</Text>
    </Box>
  );
}