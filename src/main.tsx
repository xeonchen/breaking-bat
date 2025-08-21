import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ApplicationBootstrap } from './infrastructure/bootstrap/ApplicationBootstrap';

/**
 * Application entry point following Clean Architecture principles
 * Infrastructure layer handles bootstrap and dependency composition
 */
async function startApplication() {
  try {
    // Bootstrap application with Clean Architecture dependency composition
    console.log('🚀 Starting Clean Architecture application...');
    await ApplicationBootstrap.bootstrap();

    // Render React application after successful initialization
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error(
        'Root element not found. Make sure there is a div with id="root" in your HTML.'
      );
    }

    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to start application:', error);

    // Display error to user
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.textContent = `❌ Application Failed to Start: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

// Start the application
startApplication();
