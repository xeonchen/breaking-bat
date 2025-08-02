import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import theme from '@/presentation/theme';
import { AppRoutes } from '@/presentation/routes';
import { Providers } from '@/presentation/providers';

function App() {
  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <BrowserRouter>
          <Providers>
            <AppRoutes />
          </Providers>
        </BrowserRouter>
      </ChakraProvider>
    </>
  );
}

export default App;