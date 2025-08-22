/**
 * ESLint Rule: no-infrastructure-violations
 * Ensures Infrastructure layer only imports from Domain and Application ports (Clean Architecture)
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Infrastructure layer should only import from domain and application ports',
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
      infrastructureViolation:
        'Infrastructure layer cannot import from {{layer}} layer: {{importPath}}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const allowTestFiles = options.allowTestFiles !== false;

    return {
      ImportDeclaration(node) {
        const filePath = context.getFilename();
        const importPath = node.source.value;

        // Only check files in the infrastructure layer
        if (!isInInfrastructureLayer(filePath)) {
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
            messageId: 'infrastructureViolation',
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
 * Check if file is in the infrastructure layer
 */
function isInInfrastructureLayer(filePath) {
  // Normalize path separators and check for infrastructure folder
  const normalizedPath = filePath.replace(/\\/g, '/');
  return normalizedPath.includes('/src/infrastructure/');
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

  // Valid: Domain layer imports are allowed
  if (importPath === '@/domain' || importPath.startsWith('@/domain/')) {
    return null; // Domain imports are allowed
  }
  if (importPath === 'src/domain' || importPath.startsWith('src/domain/')) {
    return null; // Domain imports are allowed
  }

  // Valid: Application layer imports are allowed (especially ports/interfaces)
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

  // Valid: Infrastructure layer internal imports are allowed
  if (
    importPath === '@/infrastructure' ||
    importPath.startsWith('@/infrastructure/')
  ) {
    return null; // Infrastructure internal imports are allowed
  }
  if (
    importPath === 'src/infrastructure' ||
    importPath.startsWith('src/infrastructure/')
  ) {
    return null; // Infrastructure internal imports are allowed
  }

  // Check for presentation layer violations (the main violation for infrastructure)
  if (
    importPath === '@/presentation' ||
    importPath.startsWith('@/presentation/')
  ) {
    return 'presentation';
  }
  if (
    importPath === 'src/presentation' ||
    importPath.startsWith('src/presentation/')
  ) {
    return 'presentation';
  }

  // Check for relative imports to presentation layer
  if (
    importPath === '../presentation' ||
    importPath.startsWith('../presentation/')
  ) {
    return 'presentation';
  }

  // Check for going up multiple levels with precise pattern matching
  if (/^\.\.\/\.\.\/presentation(\/.*)?$/.test(importPath)) {
    return 'presentation';
  }

  // No violation detected
  return null;
}
