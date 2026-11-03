export function instantEnNs(): bigint {
  return process.hrtime.bigint();
}

export function dureeEnMsDepuis(debutNs: bigint): number {
  return Number(instantEnNs() - debutNs) / 1e6;
}
