import { ReactNode, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useToast } from '@chakra-ui/react';

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps): JSX.Element {
  const toast = useToast();

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast({
        title: 'App Ready',
        description: 'App is ready to work offline',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'bottom',
      });
    }
  }, [offlineReady, toast]);

  useEffect(() => {
    if (needRefresh) {
      toast({
        title: 'Update Available',
        description: 'Click to reload and get the latest version',
        status: 'info',
        duration: null,
        isClosable: true,
        position: 'bottom',
        onCloseComplete: () => setNeedRefresh(false),
        action: (
          <button
            onClick={() => updateServiceWorker(true)}
            style={{
              background: '#4A90E2',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        ),
      });
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker, toast]);

  return <>{children}</>;
}