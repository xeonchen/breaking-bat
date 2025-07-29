import { ReactNode } from 'react';
import { ErrorBoundary } from '@/presentation/components/ErrorBoundary';
import { PWAProvider } from './PWAProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps): JSX.Element {
  return (
    <ErrorBoundary>
      <PWAProvider>
        {children}
      </PWAProvider>
    </ErrorBoundary>
  );
}