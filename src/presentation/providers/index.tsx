import { ReactNode } from 'react';
import { ErrorBoundary } from '@/presentation/components/ErrorBoundary';
import { PWAProvider } from './PWAProvider';
import { DependencyProvider } from './DependencyProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <DependencyProvider>
        <PWAProvider>{children}</PWAProvider>
      </DependencyProvider>
    </ErrorBoundary>
  );
}
