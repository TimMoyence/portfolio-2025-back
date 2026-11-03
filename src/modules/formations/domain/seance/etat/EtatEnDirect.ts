import type { Cours } from '../../contrats/cours';
import { pilotageEnDirect } from '../../cours/diffusion/PilotageEcrans';
import type { LiveSessionState } from './ISessionStateCache.port';
import type { EtatDeSeanceRecord } from '../acces/ISessions.repository';

export function etatEnDirect(
  seance: EtatDeSeanceRecord,
  cours: Cours,
): LiveSessionState {
  return {
    etat: seance.etat,
    modeRythme: seance.modeRythme,
    ecranCourant: seance.ecranCourant,
    intervalleLibre: seance.intervalleLibre,
    revision: seance.revision,
    pilotage: pilotageEnDirect(seance, cours),
    majLe: seance.majLe,
  };
}
