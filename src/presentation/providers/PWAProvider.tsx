import { ReactNode, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

interface PWAProviderProps {
  children: ReactNode;
}

// Simple PWA registration - will be enhanced with actual service worker later
export function PWAProvider({ children }: PWAProviderProps) {
  const toast = useToast();

  useEffect(() => {
    // Simple service worker registration
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);

          // Check for app updates
          registration.addEventListener('updatefound', () => {
            toast({
              title: 'Update Available',
              description: 'A new version is available. Reload to update.',
              status: 'info',
              duration: 5000,
              isClosable: true,
              position: 'bottom',
            });
          });
        })
        .catch((error) => {
          console.log('SW registration failed: ', error);
        });
    }
    // Explicit return undefined to ensure no Promise is returned
    return;
  }, [toast]);

  return <>{children}</>;
}
