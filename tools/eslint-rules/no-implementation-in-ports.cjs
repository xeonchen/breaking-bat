/**
 * ESLint Rule: no-implementation-in-ports
 * Ensures port directories only contain interfaces and types, not implementations
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Port directories should only contain interfaces and types, not implementations',
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
          allowTypeGuards: {
            type: 'boolean',
            default: true,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      classImplementation:
        'Port directories cannot contain class implementations: {{className}}',
      functionImplementation:
        'Port directories cannot contain function implementations: {{functionName}}',
      methodImplementation:
        'Port interfaces cannot contain method implementations in: {{methodName}}',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const allowTestFiles = options.allowTestFiles !== false;
    const allowTypeGuards = options.allowTypeGuards !== false;

    return {
      ClassDeclaration(node) {
        const filePath = context.getFilename();

        // Only check files in ports directories
        if (!isInPortsDirectory(filePath)) {
          return;
        }

        // Skip test files if allowed
        if (allowTestFiles && isTestFile(filePath)) {
          return;
        }

        // Check if class has any method implementations
        const hasImplementation = node.body.body.some((member) => {
          // Method definitions with bodies (regular methods, getters, setters)
          if (
            member.type === 'MethodDefinition' &&
            member.value &&
            member.value.body &&
            member.value.body.body &&
            member.value.body.body.length > 0
          ) {
            return true;
          }

          // Property definitions with initializers
          if (member.type === 'PropertyDefinition' && member.value) {
            // Allow ALL static properties (regardless of naming convention)
            if (member.static) {
              return false;
            }

            // Flag instance properties with values (non-static properties with initializers)
            return true;
          }

          return false;
        });

        if (hasImplementation) {
          context.report({
            node,
            messageId: 'classImplementation',
            data: {
              className: node.id ? node.id.name : 'Anonymous',
            },
          });
        }
      },

      FunctionDeclaration(node) {
        const filePath = context.getFilename();

        // Only check files in ports directories
        if (!isInPortsDirectory(filePath)) {
          return;
        }

        // Skip test files if allowed
        if (allowTestFiles && isTestFile(filePath)) {
          return;
        }

        // Allow type guards if configured
        if (allowTypeGuards && isTypeGuardFunction(node)) {
          return;
        }

        // Check if function has implementation (body with statements)
        if (node.body && node.body.body && node.body.body.length > 0) {
          context.report({
            node,
            messageId: 'functionImplementation',
            data: {
              functionName: node.id ? node.id.name : 'Anonymous',
            },
          });
        }
      },

      VariableDeclarator(node) {
        const filePath = context.getFilename();

        // Only check files in ports directories
        if (!isInPortsDirectory(filePath)) {
          return;
        }

        // Skip test files if allowed
        if (allowTestFiles && isTestFile(filePath)) {
          return;
        }

        // Check if this is a function expression or arrow function
        if (
          node.init &&
          (node.init.type === 'ArrowFunctionExpression' ||
            node.init.type === 'FunctionExpression')
        ) {
          // Allow type guards if configured
          if (
            allowTypeGuards &&
            node.id &&
            node.id.name &&
            isTypeGuardFunction({ id: node.id })
          ) {
            return;
          }

          // Check if function has implementation (body with statements)
          const functionNode = node.init;
          let hasImplementation = false;

          if (functionNode.type === 'ArrowFunctionExpression') {
            // For arrow functions, check if body is a block statement with statements
            if (
              functionNode.body &&
              functionNode.body.type === 'BlockStatement' &&
              functionNode.body.body &&
              functionNode.body.body.length > 0
            ) {
              hasImplementation = true;
            }
          } else if (functionNode.type === 'FunctionExpression') {
            // For function expressions, check if body has statements
            if (
              functionNode.body &&
              functionNode.body.body &&
              functionNode.body.body.length > 0
            ) {
              hasImplementation = true;
            }
          }

          if (hasImplementation) {
            context.report({
              node,
              messageId: 'functionImplementation',
              data: {
                functionName: node.id ? node.id.name : 'Anonymous',
              },
            });
          }
        }
      },

      // Check for method implementations in interfaces (should not happen in TS but catch it)
      TSInterfaceDeclaration(node) {
        const filePath = context.getFilename();

        // Only check files in ports directories
        if (!isInPortsDirectory(filePath)) {
          return;
        }

        // Skip test files if allowed
        if (allowTestFiles && isTestFile(filePath)) {
          return;
        }

        // Check interface members for any implementations
        if (node.body && node.body.body) {
          node.body.body.forEach((member) => {
            if (
              member.type === 'TSMethodSignature' &&
              member.value &&
              member.value.body
            ) {
              context.report({
                node: member,
                messageId: 'methodImplementation',
                data: {
                  methodName: member.key ? member.key.name : 'Anonymous',
                },
              });
            }
          });
        }
      },
    };
  },
};

/**
 * Check if file is in a ports directory
 */
function isInPortsDirectory(filePath) {
  // Normalize path separators and check for ports folder
  const normalizedPath = filePath.replace(/\\/g, '/');
  return normalizedPath.includes('/ports/');
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
 * Check if function is likely a type guard
 * Type guards typically:
 * - Have names like "is*", "has*", "can*" (but not "validate*")
 * - Are simple validation/checking functions
 * - May or may not have TypeScript type predicates
 */
function isTypeGuardFunction(node) {
  if (!node.id || !node.id.name) {
    return false;
  }

  const name = node.id.name;
  // Consider functions that start with type guard prefixes as allowed
  // These are typically simple validation functions that are acceptable in ports
  const isTypeGuardName = /^(is|has|can)[A-Z]/.test(name);

  return isTypeGuardName;
}
