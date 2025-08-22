/**
 * ESLint Rule: no-application-violations
 * Ensures Application layer only imports from Domain layer (Clean Architecture)
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Application layer should only import from domain layer',
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
      applicationViolation:
        'Application layer cannot import from {{layer}} layer: {{importPath}}',
      frameworkViolation:
        'Application layer should not import framework-specific code: {{importPath}}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const allowTestFiles = options.allowTestFiles !== false;

    return {
      ImportDeclaration(node) {
        const filePath = context.getFilename();
        const importPath = node.source.value;

        // Only check files in the application layer
        if (!isInApplicationLayer(filePath)) {
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
            messageId: 'applicationViolation',
            data: {
              layer: violatingLayer,
              importPath: importPath,
            },
          });
        }

        // Check for framework violations
        const frameworkViolation = isFrameworkImport(importPath);
        if (frameworkViolation) {
          context.report({
            node,
            messageId: 'frameworkViolation',
            data: {
              importPath: importPath,
            },
          });
        }
      },
    };
  },
};

/**
 * Check if file is in the application layer
 */
function isInApplicationLayer(filePath) {
  // Normalize path separators and check for application folder
  const normalizedPath = filePath.replace(/\\/g, '/');
  return normalizedPath.includes('/src/application/');
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

  // Valid: Application layer internal imports are allowed
  if (
    importPath === '@/application' ||
    importPath.startsWith('@/application/')
  ) {
    return null; // Application internal imports are allowed
  }
  if (
    importPath === 'src/application' ||
    importPath.startsWith('src/application/')
  ) {
    return null; // Application internal imports are allowed
  }

  // Check for infrastructure layer violations
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

  // Check for presentation layer violations
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

  // Check for relative imports to other layers
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
  if (/^\.\.\/\.\.\/infrastructure(\/.*)?$/.test(importPath)) {
    return 'infrastructure';
  }
  if (/^\.\.\/\.\.\/presentation(\/.*)?$/.test(importPath)) {
    return 'presentation';
  }

  // No violation detected
  return null;
}

/**
 * Check if import is a framework-specific library that violates Clean Architecture
 * Application layer should be framework-agnostic
 */
function isFrameworkImport(importPath) {
  // Framework imports that violate Clean Architecture principles
  const frameworkPatterns = [
    /^react$/,
    /^react\//,
    /^vue$/,
    /^vue\//,
    /^@vue\//,
    /^express$/,
    /^express\//,
    /^fastify$/,
    /^@nestjs\//,
    /^next$/,
    /^next\//,
    /^nuxt$/,
    /^@angular\//,
    /^@ionic\//,
    /^@material-ui\//,
    /^@mui\//,
    /^antd$/,
    /^axios$/,
    /^fetch$/,
  ];

  // Allow Node.js built-in modules and utility libraries
  const allowedPatterns = [
    /^fs$/,
    /^path$/,
    /^crypto$/,
    /^util$/,
    /^uuid$/,
    /^lodash$/,
    /^date-fns$/,
    /^zod$/,
    /^joi$/,
    /^class-validator$/,
    /^class-transformer$/,
  ];

  // Check if it's an allowed pattern first
  for (const pattern of allowedPatterns) {
    if (pattern.test(importPath)) {
      return false;
    }
  }

  // Check for framework violations
  for (const pattern of frameworkPatterns) {
    if (pattern.test(importPath)) {
      return true;
    }
  }

  return false;
}
