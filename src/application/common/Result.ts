/**
 * Result type for use case operations
 * Implements Railway-Oriented Programming pattern for error handling
 */
export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly value?: T;
  public readonly error?: string;

  private constructor(isSuccess: boolean, value?: T, error?: string) {
    this.isSuccess = isSuccess;
    this.value = value;
    this.error = error;

    // Ensure internal consistency
    if (isSuccess && error) {
      throw new Error('Success result cannot have an error');
    }
    if (!isSuccess && !error) {
      throw new Error('Failure result must have an error message');
    }
  }

  /**
   * Create a successful result
   */
  public static success<T>(value: T): Result<T> {
    return new Result<T>(true, value);
  }

  /**
   * Create a failure result
   */
  public static failure<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  /**
   * Execute a function and wrap result/error in Result type
   */
  public static async wrap<T>(operation: () => Promise<T>): Promise<Result<T>> {
    try {
      const value = await operation();
      return Result.success(value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(message);
    }
  }

  /**
   * Map the value if success, otherwise return the same failure
   */
  public map<U>(fn: (value: T) => U): Result<U> {
    if (this.isSuccess && this.value !== undefined) {
      return Result.success(fn(this.value));
    }
    return Result.failure<U>(this.error!);
  }

  /**
   * Chain operations that return Results
   */
  public flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isSuccess && this.value !== undefined) {
      return fn(this.value);
    }
    return Result.failure<U>(this.error!);
  }

  /**
   * Get value or throw error
   */
  public getValueOrThrow(): T {
    if (this.isSuccess && this.value !== undefined) {
      return this.value;
    }
    throw new Error(this.error || 'Unknown error');
  }

  /**
   * Get value or return default
   */
  public getValueOrDefault(defaultValue: T): T {
    return this.isSuccess && this.value !== undefined
      ? this.value
      : defaultValue;
  }
}
