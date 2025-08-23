import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import theme from '@/presentation/theme';
import { AppRoutes } from '@/presentation/routes';
import { ApplicationProvider } from '@/presentation/providers/ApplicationProvider';
import { PWAProvider } from '@/presentation/providers/PWAProvider';

function App() {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <BrowserRouter>
          <ApplicationProvider>
            <PWAProvider>
              <AppRoutes />
            </PWAProvider>
          </ApplicationProvider>
        </BrowserRouter>
      </ChakraProvider>
    </>
  );
}

export default App;
