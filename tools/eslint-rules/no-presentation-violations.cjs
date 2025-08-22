/**
 * ESLint Rule: no-presentation-violations
 * Ensures Presentation layer only imports from Domain and Application layers (Clean Architecture)
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Presentation layer should only import from domain and application layers',
      category: 'Clean Architecture',
      recommended: true,
    },
    fixable: null,
    schema: [
      {
        type: 'object',
        properties: {
          allowTestFiles: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      presentationViolation:
        'Presentation layer cannot import from {{layer}} layer: {{importPath}}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const allowTestFiles = options.allowTestFiles !== false;

    return {
      ImportDeclaration(node) {
        const filePath = context.getFilename();
        const importPath = node.source.value;

        // Only check files in the presentation layer
        if (!isInPresentationLayer(filePath)) {
          return;
        }

        // Skip test files if configured to do so
        if (allowTestFiles && isTestFile(filePath)) {
          return;
        }

        // Check for architecture violations
        const violatingLayer = getViolatingLayer(importPath);
        if (violatingLayer) {
          context.report({
            node,
            messageId: 'presentationViolation',
            data: {
              layer: violatingLayer,
              importPath: importPath,
            },
          });
        }
      },
    };
  },
};

/**
 * Check if file is in the presentation layer
 */
function isInPresentationLayer(filePath) {
  // Normalize path separators and check for presentation folder
  const normalizedPath = filePath.replace(/\\/g, '/');
  return normalizedPath.includes('/src/presentation/');
}

/**
 * Check if file is a test file
 */
function isTestFile(filePath) {
  return (
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) ||
    filePath.includes('__tests__')
  );
}

/**
 * Determine which layer is being imported (if it's a violation)
 * Returns the layer name if it's a violation, null otherwise
 */
function getViolatingLayer(importPath) {
  // Performance optimization: early return for same-level imports
  if (importPath.startsWith('.') && !importPath.includes('..')) {
    return null; // Same-level import, definitely safe
  }

  // Valid: Domain layer imports are allowed (for types and entities)
  if (importPath === '@/domain' || importPath.startsWith('@/domain/')) {
    return null; // Domain imports are allowed
  }
  if (importPath === 'src/domain' || importPath.startsWith('src/domain/')) {
    return null; // Domain imports are allowed
  }

  // Valid: Application layer imports are allowed (use cases, services, DTOs)
  if (
    importPath === '@/application' ||
    importPath.startsWith('@/application/')
  ) {
    return null; // Application imports are allowed
  }
  if (
    importPath === 'src/application' ||
    importPath.startsWith('src/application/')
  ) {
    return null; // Application imports are allowed
  }

  // Valid: Presentation layer internal imports are allowed
  if (
    importPath === '@/presentation' ||
    importPath.startsWith('@/presentation/')
  ) {
    return null; // Presentation internal imports are allowed
  }
  if (
    importPath === 'src/presentation' ||
    importPath.startsWith('src/presentation/')
  ) {
    return null; // Presentation internal imports are allowed
  }

  // Check for infrastructure layer violations (the main violation for presentation)
  if (
    importPath === '@/infrastructure' ||
    importPath.startsWith('@/infrastructure/')
  ) {
    return 'infrastructure';
  }
  if (
    importPath === 'src/infrastructure' ||
    importPath.startsWith('src/infrastructure/')
  ) {
    return 'infrastructure';
  }

  // Check for relative imports to infrastructure layer
  if (
    importPath === '../infrastructure' ||
    importPath.startsWith('../infrastructure/')
  ) {
    return 'infrastructure';
  }

  // Check for going up multiple levels with precise pattern matching
  if (/^\.\.\/\.\.\/infrastructure(\/.*)?$/.test(importPath)) {
    return 'infrastructure';
  }

  // No violation detected
  return null;
}
