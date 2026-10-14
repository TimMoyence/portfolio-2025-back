import type { Cours } from './contrats/cours';
import { pilotageEnDirect } from './cours/PilotageEcrans';
import type { LiveSessionState } from './ISessionStateCache.port';
import type { EtatDeSeanceRecord } from './ISessions.repository';

export function etatEnDirect(
  seance: EtatDeSeanceRecord,
  participants: number,
  cours: Cours,
): LiveSessionState {
  return {
    etat: seance.etat,
    modeRythme: seance.modeRythme,
    ecranCourant: seance.ecranCourant,
    intervalleLibre: seance.intervalleLibre,
    participants,
    revision: seance.revision,
    pilotage: pilotageEnDirect(seance.pilotageEcrans, cours),
    majLe: seance.majLe,
  };
}
