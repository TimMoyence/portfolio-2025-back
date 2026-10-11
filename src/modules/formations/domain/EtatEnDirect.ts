import type { LiveSessionState } from './ISessionStateCache.port';
import type { EtatDeSeanceRecord } from './ISessions.repository';

export function etatEnDirect(
  seance: EtatDeSeanceRecord,
  participants: number,
): LiveSessionState {
  return {
    etat: seance.etat,
    modeRythme: seance.modeRythme,
    ecranCourant: seance.ecranCourant,
    intervalleLibre: seance.intervalleLibre,
    participants,
    revision: seance.revision,
    pilotage: seance.pilotageEcrans,
    majLe: seance.majLe,
  };
}
