import { BadRequestException } from '@nestjs/common';
import { validateBody } from '../../../../../test/helpers/validation-pipe';
import { ReportIncidentsRequestDto } from './report-incidents.request.dto';

const HORODATAGE = '2026-09-11T10:00:00.000Z';

function lot(contexte: unknown): Record<string, unknown> {
  return {
    incidents: [{ type: 'tab_hidden', horodatage: HORODATAGE, contexte }],
  };
}

describe('POST sessions/:id/incidents — S6 · contexte borne', () => {
  it('accepte un incident sans contexte', async () => {
    const dto = await validateBody(
      { incidents: [{ type: 'tab_hidden', horodatage: HORODATAGE }] },
      ReportIncidentsRequestDto,
    );

    expect(dto.incidents).toHaveLength(1);
  });

  it('accepte un contexte plat de valeurs scalaires courtes', async () => {
    const contexte = { duree: 1200, touche: 'F12', repetee: false };

    const dto = await validateBody(lot(contexte), ReportIncidentsRequestDto);

    expect(dto.incidents[0].contexte).toEqual(contexte);
  });

  it.each([
    ['un objet imbrique', { detail: { profondeur: 1 } }],
    ['un tableau en valeur', { touches: ['F12'] }],
    ['un texte de plus de 200 caracteres', { note: 'x'.repeat(201) }],
    ['une cle de plus de 40 caracteres', { ['k'.repeat(41)]: 1 }],
    [
      'plus de 10 entrees',
      Object.fromEntries(
        Array.from({ length: 11 }, (_, rang) => [`c${rang}`, rang]),
      ),
    ],
    ['un nombre non fini', { duree: null }],
    ['un tableau en guise de contexte', ['tab_hidden']],
  ])('refuse %s', async (_cas, contexte) => {
    await expect(
      validateBody(lot(contexte), ReportIncidentsRequestDto),
    ).rejects.toThrow(BadRequestException);
  });
});
