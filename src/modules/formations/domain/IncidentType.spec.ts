import {
  MAX_INCIDENTS_PAR_ENVOI,
  envoiDansLaLimite,
  estTypeIncidentConnu,
  filtrerIncidentsConnus,
} from './IncidentType';

describe('estTypeIncidentConnu', () => {
  it('accepte un type de la liste blanche', () => {
    expect(estTypeIncidentConnu('tab_hidden')).toBe(true);
  });

  it('refuse un type hors de la liste blanche', () => {
    expect(estTypeIncidentConnu('type_jamais_vu')).toBe(false);
  });
});

describe('filtrerIncidentsConnus', () => {
  it('retire les incidents de type inconnu sans faire echouer le lot', () => {
    const lot = [{ type: 'window_blur' }, { type: 'type_jamais_vu' }];
    expect(filtrerIncidentsConnus(lot)).toEqual([{ type: 'window_blur' }]);
  });

  it('conserve tous les incidents quand tous les types sont connus', () => {
    const lot = [{ type: 'tab_hidden' }, { type: 'copy_attempt' }];
    expect(filtrerIncidentsConnus(lot)).toEqual(lot);
  });
});

describe('envoiDansLaLimite', () => {
  it('accepte un lot a la limite exacte', () => {
    expect(envoiDansLaLimite(MAX_INCIDENTS_PAR_ENVOI)).toBe(true);
  });

  it('refuse un lot qui depasse la limite d un seul incident', () => {
    expect(envoiDansLaLimite(MAX_INCIDENTS_PAR_ENVOI + 1)).toBe(false);
  });
});
