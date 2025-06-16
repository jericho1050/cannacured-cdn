type Success<T> = [T, null];
type Failure = [null, Error];
type Result<T> = Success<T> | Failure;

export function catchSync<T>(fn: () => T): Result<T> {
  try {
    return [fn(), null] as const;
  } catch (e) {
    return [null, e as Error] as const;
  }
}
