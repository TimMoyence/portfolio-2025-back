export function logBootstrapStep(message: string): void {
  if (process.env.BOOTSTRAP_DEBUG === 'true') {
    console.log(`[bootstrap] ${message}`);
  }
}
