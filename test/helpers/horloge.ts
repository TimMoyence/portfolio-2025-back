export async function sousUneDureeDe(
  dureeMs: number,
  action: () => Promise<unknown>,
): Promise<void> {
  const debut = 1_000_000n;
  const horloge = jest
    .spyOn(process.hrtime, 'bigint')
    .mockReturnValueOnce(debut)
    .mockReturnValueOnce(debut + BigInt(dureeMs * 1_000_000));
  try {
    await action();
  } finally {
    horloge.mockRestore();
  }
}
