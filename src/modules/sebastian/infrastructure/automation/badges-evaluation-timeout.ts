import type { EvaluateBadgesUseCase } from '../../application/services/EvaluateBadges.useCase';

export async function evaluateBadgesWithTimeout(
  evaluateBadges: EvaluateBadgesUseCase,
  userId: string,
  timeoutMs: number,
): Promise<void> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Badges evaluation timeout after ${timeoutMs}ms (userId=${userId})`,
        ),
      );
    }, timeoutMs);
  });

  try {
    await Promise.race([evaluateBadges.execute(userId), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
