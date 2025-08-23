import '@testing-library/jest-dom';
import React from 'react';

// Make React available globally for Jest environment
global.React = React;

// Polyfill TextEncoder/TextDecoder for Node.js test environment
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder as unknown as typeof globalThis.TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;

// Polyfill structuredClone for Node.js test environment (required by Chakra UI v3)
if (!global.structuredClone) {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Setup fake-indexeddb for proper IndexedDB testing
import 'fake-indexeddb/auto';

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
  public observe(): void {}
  public unobserve(): void {}
  public disconnect(): void {}
};

// Mock HTMLElement focus property for JSDOM compatibility
// This fixes the "Cannot set property focus" error in Chakra UI components
Object.defineProperty(HTMLElement.prototype, 'focus', {
  writable: true,
  value: function () {
    // Set this element as the active element for testing
    Object.defineProperty(document, 'activeElement', {
      writable: true,
      value: this,
    });
  },
});

// Mock @zag-js/focus-visible to prevent focus-related errors in JSDOM
jest.mock('@zag-js/focus-visible', () => ({
  trackFocusVisible: () => ({
    cleanup: () => {},
  }),
}));

// Enhance HTMLElement focus functionality for better JSDOM compatibility
Object.defineProperty(HTMLInputElement.prototype, 'focus', {
  writable: true,
  value: function () {
    // Set this element as the active element for testing
    Object.defineProperty(document, 'activeElement', {
      writable: true,
      value: this,
    });
    this.dispatchEvent(new Event('focus', { bubbles: true }));
  },
});

Object.defineProperty(HTMLSelectElement.prototype, 'focus', {
  writable: true,
  value: function () {
    // Set this element as the active element for testing
    Object.defineProperty(document, 'activeElement', {
      writable: true,
      value: this,
    });
    this.dispatchEvent(new Event('focus', { bubbles: true }));
  },
});

// Mock scrollTo for JSDOM
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});
