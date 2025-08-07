import { Result } from '@/application/common/Result';

describe('Result', () => {
  describe('Constructor validation', () => {
    it('should throw error when creating success result with error', () => {
      expect(() => {
        // Access private constructor through static method that bypasses validation
        (Result as any).success('value').error = 'some error';
        new (Result as any)(true, 'value', 'some error');
      }).toThrow('Success result cannot have an error');
    });

    it('should throw error when creating failure result without error message', () => {
      expect(() => {
        new (Result as any)(false, undefined, undefined);
      }).toThrow('Failure result must have an error message');
    });

    it('should throw error when creating failure result with empty error message', () => {
      expect(() => {
        new (Result as any)(false, undefined, '');
      }).toThrow('Failure result must have an error message');
    });
  });

  describe('Static factory methods', () => {
    it('should create successful result', () => {
      const result = Result.success('test value');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('test value');
      expect(result.error).toBeUndefined();
    });

    it('should create successful result with null value', () => {
      const result = Result.success(null);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(null);
      expect(result.error).toBeUndefined();
    });

    it('should create successful result with undefined value', () => {
      const result = Result.success(undefined);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(undefined);
      expect(result.error).toBeUndefined();
    });

    it('should create failure result', () => {
      const result = Result.failure<string>('test error');

      expect(result.isSuccess).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.error).toBe('test error');
    });

    it('should create failure result with complex error message', () => {
      const errorMessage = 'Complex error: validation failed on field "email"';
      const result = Result.failure<number>(errorMessage);

      expect(result.isSuccess).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.error).toBe(errorMessage);
    });
  });

  describe('wrap method', () => {
    it('should wrap successful async operation', async () => {
      const operation = async () => 'success value';

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('success value');
      expect(result.error).toBeUndefined();
    });

    it('should wrap successful async operation with complex return type', async () => {
      const complexObject = { id: 1, name: 'test', items: [1, 2, 3] };
      const operation = async () => complexObject;

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(complexObject);
      expect(result.error).toBeUndefined();
    });

    it('should wrap failing async operation with Error', async () => {
      const operation = async () => {
        throw new Error('operation failed');
      };

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.error).toBe('operation failed');
    });

    it('should wrap failing async operation with string error', async () => {
      const operation = async () => {
        throw 'string error';
      };

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.error).toBe('string error');
    });

    it('should wrap failing async operation with number error', async () => {
      const operation = async () => {
        throw 404;
      };

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.error).toBe('404');
    });

    it('should wrap failing async operation with null error', async () => {
      const operation = async () => {
        throw null;
      };

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.error).toBe('null');
    });

    it('should wrap failing async operation with undefined error', async () => {
      const operation = async () => {
        throw undefined;
      };

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(false);
      expect(result.value).toBeUndefined();
      expect(result.error).toBe('undefined');
    });

    it('should wrap operation that returns null', async () => {
      const operation = async () => null;

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(null);
      expect(result.error).toBeUndefined();
    });

    it('should wrap operation that returns undefined', async () => {
      const operation = async () => undefined;

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(undefined);
      expect(result.error).toBeUndefined();
    });
  });

  describe('map method', () => {
    it('should map successful result value', () => {
      const result = Result.success(5);

      const mappedResult = result.map((x) => x * 2);

      expect(mappedResult.isSuccess).toBe(true);
      expect(mappedResult.value).toBe(10);
      expect(mappedResult.error).toBeUndefined();
    });

    it('should map successful result to different type', () => {
      const result = Result.success(5);

      const mappedResult = result.map((x) => `Number: ${x}`);

      expect(mappedResult.isSuccess).toBe(true);
      expect(mappedResult.value).toBe('Number: 5');
      expect(mappedResult.error).toBeUndefined();
    });

    it('should map successful result with null value', () => {
      const result = Result.success<number | null>(null);

      const mappedResult = result.map((x) => (x ? x * 2 : 0));

      expect(mappedResult.isSuccess).toBe(true);
      expect(mappedResult.value).toBe(0);
      expect(mappedResult.error).toBeUndefined();
    });

    it('should not map failure result', () => {
      const result = Result.failure<number>('original error');

      const mappedResult = result.map((x) => x * 2);

      expect(mappedResult.isSuccess).toBe(false);
      expect(mappedResult.value).toBeUndefined();
      expect(mappedResult.error).toBe('original error');
    });

    it('should handle mapping function that throws', () => {
      const result = Result.success(5);

      expect(() => {
        result.map(() => {
          throw new Error('mapping failed');
        });
      }).toThrow('mapping failed');
    });

    it('should not map result with undefined value', () => {
      // Create a result that has success=true but value=undefined
      // However, Result.map() treats undefined values as missing and returns failure
      const result = Result.success(undefined);

      const mappedResult = result.map((x) => (x ? x.toString() : 'default'));

      expect(mappedResult.isSuccess).toBe(false);
      expect(mappedResult.error).toBe('Unknown error');
    });

    it('should handle failure result with fallback error message in map', () => {
      // This tests the fallback error message path by creating a failure result
      // and then forcing its error to be undefined
      const result = Result.failure<number>('test error');
      // Force error to be undefined to test the fallback
      (result as any).error = undefined;

      const mappedResult = result.map((x) => x * 2);

      expect(mappedResult.isSuccess).toBe(false);
      expect(mappedResult.error).toBe('Unknown error');
    });
  });

  describe('flatMap method', () => {
    it('should flatMap successful result', () => {
      const result = Result.success(5);

      const flatMappedResult = result.flatMap((x) => Result.success(x * 2));

      expect(flatMappedResult.isSuccess).toBe(true);
      expect(flatMappedResult.value).toBe(10);
      expect(flatMappedResult.error).toBeUndefined();
    });

    it('should flatMap successful result to failure', () => {
      const result = Result.success(5);

      const flatMappedResult = result.flatMap((_x) =>
        Result.failure<number>('flatMap error')
      );

      expect(flatMappedResult.isSuccess).toBe(false);
      expect(flatMappedResult.value).toBeUndefined();
      expect(flatMappedResult.error).toBe('flatMap error');
    });

    it('should flatMap successful result to different type', () => {
      const result = Result.success(5);

      const flatMappedResult = result.flatMap((x) =>
        Result.success(`Number: ${x}`)
      );

      expect(flatMappedResult.isSuccess).toBe(true);
      expect(flatMappedResult.value).toBe('Number: 5');
      expect(flatMappedResult.error).toBeUndefined();
    });

    it('should not flatMap failure result', () => {
      const result = Result.failure<number>('original error');

      const flatMappedResult = result.flatMap((x) => Result.success(x * 2));

      expect(flatMappedResult.isSuccess).toBe(false);
      expect(flatMappedResult.value).toBeUndefined();
      expect(flatMappedResult.error).toBe('original error');
    });

    it('should handle flatMapping function that throws', () => {
      const result = Result.success(5);

      expect(() => {
        result.flatMap(() => {
          throw new Error('flatMapping failed');
        });
      }).toThrow('flatMapping failed');
    });

    it('should flatMap result with null value', () => {
      const result = Result.success<number | null>(null);

      const flatMappedResult = result.flatMap((x) =>
        x !== null ? Result.success(x * 2) : Result.success(0)
      );

      expect(flatMappedResult.isSuccess).toBe(true);
      expect(flatMappedResult.value).toBe(0);
    });

    it('should handle failure result with fallback error message in flatMap', () => {
      const result = Result.failure<number>('test error');
      // Force error to be undefined to test the fallback
      (result as any).error = undefined;

      const flatMappedResult = result.flatMap((x) => Result.success(x * 2));

      expect(flatMappedResult.isSuccess).toBe(false);
      expect(flatMappedResult.error).toBe('Unknown error');
    });
  });

  describe('getValueOrThrow method', () => {
    it('should return value for successful result', () => {
      const result = Result.success('test value');

      expect(result.getValueOrThrow()).toBe('test value');
    });

    it('should return null value for successful result', () => {
      const result = Result.success(null);

      expect(result.getValueOrThrow()).toBe(null);
    });

    it('should throw for successful result with undefined value', () => {
      const result = Result.success(undefined);

      // Result treats undefined value as missing value in getValueOrThrow
      expect(() => result.getValueOrThrow()).toThrow('Unknown error');
    });

    it('should throw error for failure result', () => {
      const result = Result.failure<string>('test error');

      expect(() => result.getValueOrThrow()).toThrow('test error');
    });

    it('should throw with fallback message when error is undefined', () => {
      const result = Result.failure<string>('test error');
      // Force error to be undefined to test the fallback
      (result as any).error = undefined;

      expect(() => result.getValueOrThrow()).toThrow('Unknown error');
    });
  });

  describe('getValueOrDefault method', () => {
    it('should return value for successful result', () => {
      const result = Result.success('test value');

      expect(result.getValueOrDefault('default')).toBe('test value');
    });

    it('should return null value for successful result with null', () => {
      const result = Result.success(null);

      expect(result.getValueOrDefault('default')).toBe(null);
    });

    it('should return default for successful result with undefined', () => {
      const result = Result.success(undefined);

      // Result treats undefined value as missing, so returns default
      expect(result.getValueOrDefault('default')).toBe('default');
    });

    it('should return default for failure result', () => {
      const result = Result.failure<string>('test error');

      expect(result.getValueOrDefault('default')).toBe('default');
    });

    it('should return default for failure result with complex default', () => {
      const defaultObj = { id: 1, name: 'default' };
      const result = Result.failure<typeof defaultObj>('test error');

      expect(result.getValueOrDefault(defaultObj)).toBe(defaultObj);
    });

    it('should return complex value for successful result', () => {
      const value = { id: 1, name: 'test', items: [1, 2, 3] };
      const result = Result.success(value);

      expect(
        result.getValueOrDefault({ id: 0, name: 'default', items: [] })
      ).toBe(value);
    });
  });

  describe('Complex scenarios and edge cases', () => {
    it('should chain multiple map operations on success', () => {
      const result = Result.success(5)
        .map((x) => x * 2)
        .map((x) => x + 1)
        .map((x) => `Result: ${x}`);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('Result: 11');
    });

    it('should chain multiple map operations with failure', () => {
      const result = Result.failure<number>('initial error')
        .map((x) => x * 2)
        .map((x) => x + 1)
        .map((x) => `Result: ${x}`);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('initial error');
    });

    it('should chain flatMap operations on success', () => {
      const result = Result.success(5)
        .flatMap((x) => Result.success(x * 2))
        .flatMap((x) => Result.success(`Value: ${x}`));

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('Value: 10');
    });

    it('should chain flatMap operations with intermediate failure', () => {
      const result = Result.success(5)
        .flatMap((_x) => Result.failure<number>('intermediate error'))
        .flatMap((x) => Result.success(`Value: ${x}`));

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('intermediate error');
    });

    it('should handle mixed map and flatMap operations', () => {
      const result = Result.success(5)
        .map((x) => x * 2)
        .flatMap((x) => Result.success(x + 1))
        .map((x) => `Final: ${x}`);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('Final: 11');
    });

    it('should wrap async operation that returns Promise.resolve', async () => {
      const operation = () => Promise.resolve('resolved value');

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('resolved value');
    });

    it('should wrap async operation that returns Promise.reject', async () => {
      const operation = () => Promise.reject(new Error('rejected'));

      const result = await Result.wrap(operation);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe('rejected');
    });
  });
});
