export async function runAuditPipelineWithTimeout(
  pipeline: { run: (auditId: string) => Promise<void> },
  auditId: string,
  timeoutMs: number,
): Promise<void> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `Audit pipeline timeout after ${timeoutMs}ms (auditId=${auditId})`,
        ),
      );
    }, timeoutMs);
  });

  try {
    await Promise.race([pipeline.run(auditId), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
