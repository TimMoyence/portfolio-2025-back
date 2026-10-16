import { ImprimeriePdf } from './ImprimeriePdf';

class Imprimerie extends ImprimeriePdf {}

describe('ImprimeriePdf', () => {
  it('ne garde le navigateur dans aucune propriete accessible', () => {
    expect(Reflect.ownKeys(new Imprimerie())).toEqual(['logger']);
    expect(new Set(Reflect.ownKeys(ImprimeriePdf.prototype))).toEqual(
      new Set(['constructor', 'imprimer', 'onModuleDestroy']),
    );
  });
});
