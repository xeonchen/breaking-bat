/**
 * ESLint Rule: no-domain-violations
 * Ensures Domain layer doesn't import from other layers (Clean Architecture)
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Domain layer should not import from other layers',
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
      domainViolation:
        'Domain layer cannot import from {{layer}} layer: {{importPath}}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const allowTestFiles = options.allowTestFiles !== false;

    return {
      ImportDeclaration(node) {
        const filePath = context.getFilename();
        const importPath = node.source.value;

        // Only check files in the domain layer
        if (!isInDomainLayer(filePath)) {
          return;
        }

        // Skip test files if configured to do so
        if (allowTestFiles && isTestFile(filePath)) {
          return;
        }

        // Check for violations
        const violatingLayer = getViolatingLayer(importPath);
        if (violatingLayer) {
          context.report({
            node,
            messageId: 'domainViolation',
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
 * Check if file is in the domain layer
 */
function isInDomainLayer(filePath) {
  // Normalize path separators and check for domain folder
  const normalizedPath = filePath.replace(/\\/g, '/');
  return normalizedPath.includes('/src/domain/');
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

  // Check for absolute imports using path aliases
  if (
    importPath === '@/application' ||
    importPath.startsWith('@/application/')
  ) {
    return 'application';
  }
  if (
    importPath === '@/infrastructure' ||
    importPath.startsWith('@/infrastructure/')
  ) {
    return 'infrastructure';
  }
  if (
    importPath === '@/presentation' ||
    importPath.startsWith('@/presentation/')
  ) {
    return 'presentation';
  }

  // Check for direct src/ prefix imports
  if (
    importPath === 'src/application' ||
    importPath.startsWith('src/application/')
  ) {
    return 'application';
  }
  if (
    importPath === 'src/infrastructure' ||
    importPath.startsWith('src/infrastructure/')
  ) {
    return 'infrastructure';
  }
  if (
    importPath === 'src/presentation' ||
    importPath.startsWith('src/presentation/')
  ) {
    return 'presentation';
  }

  // Check for relative imports - be very specific to avoid false positives
  // Only match if it's exactly ../layername or ../layername/something
  if (
    importPath === '../application' ||
    importPath.startsWith('../application/')
  ) {
    return 'application';
  }
  if (
    importPath === '../infrastructure' ||
    importPath.startsWith('../infrastructure/')
  ) {
    return 'infrastructure';
  }
  if (
    importPath === '../presentation' ||
    importPath.startsWith('../presentation/')
  ) {
    return 'presentation';
  }

  // Check for going up multiple levels with precise pattern matching
  // Use regex to ensure we match exactly ../../layername or ../../layername/something
  if (/^\.\.\/\.\.\/application(\/.*)?$/.test(importPath)) {
    return 'application';
  }
  if (/^\.\.\/\.\.\/infrastructure(\/.*)?$/.test(importPath)) {
    return 'infrastructure';
  }
  if (/^\.\.\/\.\.\/presentation(\/.*)?$/.test(importPath)) {
    return 'presentation';
  }

  // No violation detected
  return null;
}
