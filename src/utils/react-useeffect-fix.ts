/**
 * React useEffect Fix - Handles cases where useEffect accidentally returns an object instead of cleanup function
 * This patch intercepts useEffect calls and ensures they return proper cleanup functions
 */
import React from 'react';

const originalUseEffect = React.useEffect;

// Track whether we've already patched React
let isPatched = false;

export function applyUseEffectFix() {
  if (isPatched) {
    return;
  }

  React.useEffect = function useEffectPatch(
    effect: React.EffectCallback,
    deps?: React.DependencyList
  ) {
    const wrappedEffect: React.EffectCallback = () => {
      const result = effect();

      // If result is undefined or a function, return as-is
      if (result === undefined || typeof result === 'function') {
        return result;
      }

      // If result is an object that has a cleanup property, extract it
      if (typeof result === 'object' && result !== null) {
        const callStack = new Error('useEffect call stack').stack || '';
        const stackLines = callStack.split('\n');
        const sourceLine =
          stackLines.find((line) => line.includes('/src/')) || stackLines[3];

        console.error(
          '🚨 FOUND PROBLEMATIC useEffect! Returned object instead of function:'
        );
        console.error('📋 Object:', result);
        console.error('📋 Object keys:', Object.keys(result));
        console.error('📍 Source location:', sourceLine?.trim());

        // Type assertion to handle the case where result is an object
        const objectResult = result as Record<string, unknown>;
        if (
          'cleanup' in objectResult &&
          typeof objectResult.cleanup === 'function'
        ) {
          console.warn('⚠️ Fixed: Extracting cleanup function from object');
          return objectResult.cleanup as () => void;
        }
      }

      // If we get here, the useEffect returned something invalid
      // Log the error and return undefined to prevent crash
      console.error(
        '🚨 useEffect returned invalid value:',
        typeof result,
        result
      );
      console.error(
        '📍 This should return either undefined or a cleanup function'
      );

      return undefined;
    };

    return originalUseEffect(wrappedEffect, deps);
  };

  isPatched = true;
  console.log('✅ React useEffect patch applied successfully');
}

export function removeUseEffectFix() {
  React.useEffect = originalUseEffect;
  isPatched = false;
  console.log('✅ React useEffect patch removed');
}
