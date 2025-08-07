import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Layout } from '@/presentation/components/Layout';
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner';

// Lazy load pages for better performance
const TeamsPage = lazy(() => import('@/presentation/pages/TeamsPage'));
const GamePage = lazy(() => import('@/presentation/pages/GamePage'));
const ScoringPage = lazy(() => import('@/presentation/pages/ScoringPage'));
const StatsPage = lazy(() => import('@/presentation/pages/StatsPage'));
const SettingsPage = lazy(() => import('@/presentation/pages/SettingsPage'));

export function AppRoutes() {
  return (
    <Layout>
      <Routes>
        {/* Redirect root to games - games is now the default landing page */}
        <Route path="/" element={<Navigate to="/games" replace />} />

        <Route
          path="/teams"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <TeamsPage />
            </Suspense>
          }
        />
        <Route
          path="/games/:gameId?"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <GamePage />
            </Suspense>
          }
        />
        <Route
          path="/scoring/:gameId"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <ScoringPage />
            </Suspense>
          }
        />
        <Route
          path="/stats"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <StatsPage />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <SettingsPage />
            </Suspense>
          }
        />

        {/* Redirect legacy routes to new locations */}
        <Route
          path="/seasons"
          element={<Navigate to="/settings#game-config" replace />}
        />
        <Route
          path="/game-types"
          element={<Navigate to="/settings#game-config" replace />}
        />
      </Routes>
    </Layout>
  );
}
