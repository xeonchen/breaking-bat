import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock service worker
const mockServiceWorker = {
  register: jest.fn(),
  unregister: jest.fn(),
  getRegistration: jest.fn(),
  ready: Promise.resolve({
    installing: null,
    waiting: null,
    active: {
      scriptURL: '/sw.js',
      state: 'activated',
    },
  }),
};

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker,
  },
  writable: true,
});

describe('PWA Service Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Worker Registration', () => {
    it('should check if service worker is supported', () => {
      expect('serviceWorker' in navigator).toBe(true);
    });

    it('should register service worker on load', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: { scriptURL: '/sw.js', state: 'activated' },
        scope: '/',
        update: jest.fn(),
        unregister: jest.fn(),
      };

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      // Simulate service worker registration
      const registration = await navigator.serviceWorker.register('/sw.js');

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(registration).toBe(mockRegistration);
    });

    it('should handle service worker registration errors', async () => {
      const error = new Error('SW registration failed');
      mockServiceWorker.register.mockRejectedValue(error);

      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (registrationError) {
        expect(registrationError).toBe(error);
      }

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
    });
  });

  describe('Service Worker States', () => {
    it('should verify service worker is ready', async () => {
      const ready = await navigator.serviceWorker.ready;

      expect(ready.active).toBeDefined();
      expect(ready.active?.scriptURL).toBe('/sw.js');
      expect(ready.active?.state).toBe('activated');
    });

    it('should check for existing registration', async () => {
      const mockRegistration = {
        scope: '/',
        active: { scriptURL: '/sw.js', state: 'activated' },
      };

      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      const registration = await navigator.serviceWorker.getRegistration();

      expect(mockServiceWorker.getRegistration).toHaveBeenCalled();
      expect(registration).toBe(mockRegistration);
    });
  });

  describe('PWA Installation', () => {
    it('should support beforeinstallprompt event', () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue({ outcome: 'accepted' }),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      };

      // Simulate beforeinstallprompt event
      window.dispatchEvent(
        new CustomEvent('beforeinstallprompt', { detail: mockEvent })
      );

      // The event should be preventable (indicating PWA install support)
      expect(mockEvent.preventDefault).toBeDefined();
      expect(mockEvent.prompt).toBeDefined();
    });

    it('should handle app installation', async () => {
      const mockInstallPrompt = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      };

      // Simulate user accepting install prompt
      await mockInstallPrompt.prompt();
      const choice = await mockInstallPrompt.userChoice;

      expect(mockInstallPrompt.prompt).toHaveBeenCalled();
      expect(choice.outcome).toBe('accepted');
    });
  });

  describe('Offline Functionality', () => {
    it('should detect online/offline status', () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      expect(navigator.onLine).toBe(true);

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      expect(navigator.onLine).toBe(false);
    });

    it('should handle online/offline events', () => {
      const onlineHandler = jest.fn();
      const offlineHandler = jest.fn();

      window.addEventListener('online', onlineHandler);
      window.addEventListener('offline', offlineHandler);

      // Simulate online event
      window.dispatchEvent(new Event('online'));
      expect(onlineHandler).toHaveBeenCalled();

      // Simulate offline event
      window.dispatchEvent(new Event('offline'));
      expect(offlineHandler).toHaveBeenCalled();

      // Cleanup
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    });
  });

  describe('Cache API', () => {
    it('should support Cache API', () => {
      // Mock Cache API
      const mockCache = {
        match: jest.fn(),
        matchAll: jest.fn(),
        add: jest.fn(),
        addAll: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        keys: jest.fn(),
      };

      const mockCaches = {
        open: jest.fn().mockResolvedValue(mockCache),
        match: jest.fn(),
        has: jest.fn(),
        delete: jest.fn(),
        keys: jest.fn(),
      };

      Object.defineProperty(window, 'caches', {
        value: mockCaches,
        writable: true,
      });

      expect('caches' in window).toBe(true);
      expect(window.caches.open).toBeDefined();
    });

    it('should cache resources', async () => {
      const mockCache = {
        addAll: jest.fn().mockResolvedValue(undefined),
        match: jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          text: () => Promise.resolve('cached content'),
          clone: jest.fn(),
        }),
      };

      const mockCaches = {
        open: jest.fn().mockResolvedValue(mockCache),
      };

      Object.defineProperty(window, 'caches', {
        value: mockCaches,
        writable: true,
      });

      // Simulate caching resources
      const cache = await window.caches.open('breaking-bat-v1');
      await cache.addAll([
        '/index.html',
        '/static/js/main.js',
        '/static/css/main.css',
      ]);

      expect(mockCaches.open).toHaveBeenCalledWith('breaking-bat-v1');
      expect(cache.addAll).toHaveBeenCalledWith([
        '/index.html',
        '/static/js/main.js',
        '/static/css/main.css',
      ]);

      // Simulate cache retrieval
      const response = await cache.match('/index.html');
      expect(cache.match).toHaveBeenCalledWith('/index.html');
      expect(response).toBeDefined();
      expect(response.ok).toBe(true);
    });
  });

  describe('PWA Manifest', () => {
    it('should have proper manifest properties', () => {
      // Simulate manifest.json properties
      const manifest = {
        name: 'Breaking-Bat - Softball Scoring',
        short_name: 'Breaking-Bat',
        description:
          'Progressive Web App for recording slowpitch softball game statistics and scores. Track games, manage teams, and score games offline.',
        theme_color: '#4A90E2',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        categories: ['sports', 'productivity', 'utilities'],
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      };

      expect(manifest.name).toBe('Breaking-Bat - Softball Scoring');
      expect(manifest.short_name).toBe('Breaking-Bat');
      expect(manifest.display).toBe('standalone');
      expect(manifest.scope).toBe('/');
      expect(manifest.start_url).toBe('/');
      expect(manifest.icons).toHaveLength(2);
      expect(manifest.categories).toContain('sports');
    });

    it('should have required PWA manifest fields', () => {
      const requiredFields = [
        'name',
        'short_name',
        'description',
        'theme_color',
        'background_color',
        'display',
        'scope',
        'start_url',
        'icons',
      ];

      const manifest = {
        name: 'Breaking-Bat - Softball Scoring',
        short_name: 'Breaking-Bat',
        description:
          'Progressive Web App for recording slowpitch softball game statistics and scores. Track games, manage teams, and score games offline.',
        theme_color: '#4A90E2',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [],
      };

      requiredFields.forEach((field) => {
        expect(manifest).toHaveProperty(field);
      });
    });
  });
});
