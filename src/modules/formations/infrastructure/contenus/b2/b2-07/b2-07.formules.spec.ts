import { COURS_B2_07 } from './b2-07.cours';

interface BlocDeLecon {
  readonly formula?: string;
}

const formules = COURS_B2_07.ecrans.flatMap((ecran) => {
  const presentation = (
    ecran.proprietes as {
      presentation?: { renderer?: string; props?: { blocks?: BlocDeLecon[] } };
    }
  ).presentation;
  return presentation?.renderer === 'lesson'
    ? (presentation.props?.blocks ?? []).flatMap((bloc) =>
        bloc.formula === undefined ? [] : [[ecran.screenId, bloc.formula]],
      )
    : [];
});

describe('B2-07 — formules des traces écrites', () => {
  it('RET-04 · écrit chaque formule sur sa ligne, sans « · », dans les quatre traces écrites', () => {
    expect(new Set(formules.map(([screenId]) => screenId)).size).toBe(4);
    expect(formules.filter(([, formule]) => formule.includes('·'))).toEqual([]);
    expect(
      formules.find(
        ([screenId]) => screenId === 'B2-07-A3-04-COURS-VARIATIONS',
      ),
    ).toEqual(['B2-07-A3-04-COURS-VARIATIONS', 'f′ > 0 ⇒ f ↗\nf′ < 0 ⇒ f ↘']);
  });
});
