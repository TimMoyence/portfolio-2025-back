export function isTimeoutError(reason: unknown): boolean {
  const message = String(reason).toLowerCase();
  return message.includes('timeout') || message.includes('timed out');
}
