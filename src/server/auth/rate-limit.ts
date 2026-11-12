type Attempt = {
  failures: number;
  resetAt: number;
};

export type LoginLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type LoginLimiter = {
  check(key: string): LoginLimitResult;
  recordFailure(key: string): void;
  clear(key: string): void;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
const PRUNE_THRESHOLD = 5_000;

export function createLoginLimiter(): LoginLimiter {
  const attempts = new Map<string, Attempt>();

  function read(key: string): Attempt | null {
    const attempt = attempts.get(key);

    if (!attempt) {
      return null;
    }

    if (attempt.resetAt <= Date.now()) {
      attempts.delete(key);
      return null;
    }

    return attempt;
  }

  function prune(): void {
    if (attempts.size < PRUNE_THRESHOLD) {
      return;
    }

    const now = Date.now();

    for (const [key, attempt] of attempts) {
      if (attempt.resetAt <= now) {
        attempts.delete(key);
      }
    }
  }

  return {
    check(key) {
      const attempt = read(key);

      if (!attempt || attempt.failures < MAX_FAILURES) {
        return { allowed: true };
      }

      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((attempt.resetAt - Date.now()) / 1000),
      };
    },
    recordFailure(key) {
      prune();

      const attempt = read(key);

      if (!attempt) {
        attempts.set(key, {
          failures: 1,
          resetAt: Date.now() + WINDOW_MS,
        });
        return;
      }

      attempt.failures += 1;
    },
    clear(key) {
      attempts.delete(key);
    },
  };
}

// In-memory store: limits are per process and reset on deploy.
// Production should replace this with a shared store (for example Redis)
// so limits hold across instances and restarts.
export const loginLimiter = createLoginLimiter();
