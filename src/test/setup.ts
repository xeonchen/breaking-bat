import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for Node.js test environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock IndexedDB for testing (will be properly implemented with domain layer)
const mockIndexedDB = {
  open: () => ({
    onsuccess: null,
    onerror: null,
    result: {
      createObjectStore: () => ({}),
      transaction: () => ({
        objectStore: () => ({
          add: () => ({ onsuccess: null }),
          put: () => ({ onsuccess: null }),
          get: () => ({ onsuccess: null }),
          delete: () => ({ onsuccess: null }),
        }),
      }),
    },
  }),
};

// Setup fake-indexeddb properly
global.indexedDB = mockIndexedDB as any;

// Mock window.matchMedia for Chakra UI
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
