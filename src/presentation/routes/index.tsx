import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';
import { Layout } from '@/presentation/components/Layout';
import { LoadingSpinner } from '@/presentation/components/LoadingSpinner';

// Lazy load pages for better performance
const HomePage = lazy(() => import('@/presentation/pages/HomePage'));
const TeamsPage = lazy(() => import('@/presentation/pages/TeamsPage'));
const SeasonsPage = lazy(() => import('@/presentation/pages/SeasonsPage'));
const GameTypesPage = lazy(() => import('@/presentation/pages/GameTypesPage'));
const GamePage = lazy(() => import('@/presentation/pages/GamePage'));
const ScoringPage = lazy(() => import('@/presentation/pages/ScoringPage'));
const StatsPage = lazy(() => import('@/presentation/pages/StatsPage'));
const SettingsPage = lazy(() => import('@/presentation/pages/SettingsPage'));

export function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/teams"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <TeamsPage />
            </Suspense>
          }
        />
        <Route
          path="/seasons"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <SeasonsPage />
            </Suspense>
          }
        />
        <Route
          path="/game-types"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <GameTypesPage />
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
      </Routes>
    </Layout>
  );
}

// Import Suspense from React
import { Suspense } from 'react';
