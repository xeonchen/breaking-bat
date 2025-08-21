import { ReactNode } from 'react';
import { ErrorBoundary } from '@/presentation/components/ErrorBoundary';
import { PWAProvider } from './PWAProvider';
import { ApplicationProvider } from './ApplicationProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ApplicationProvider>
        <PWAProvider>{children}</PWAProvider>
      </ApplicationProvider>
    </ErrorBoundary>
  );
}
