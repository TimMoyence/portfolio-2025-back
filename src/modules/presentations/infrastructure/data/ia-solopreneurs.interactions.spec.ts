import { IA_SOLOPRENEURS_INTERACTIONS } from './ia-solopreneurs.interactions';

describe('IA_SOLOPRENEURS_INTERACTIONS', () => {
  const allInteractions = Object.values(IA_SOLOPRENEURS_INTERACTIONS).flatMap(
    (slide) => [...(slide.present ?? []), ...(slide.scroll ?? [])],
  );

  it('devrait servir 15 interactions reparties sur 13 slides', () => {
    expect(Object.keys(IA_SOLOPRENEURS_INTERACTIONS)).toHaveLength(13);
    expect(allInteractions).toHaveLength(15);
  });

  it('ne devrait exposer que des types rendus par le front', () => {
    const countByType = allInteractions.reduce<Record<string, number>>(
      (acc, interaction) => {
        acc[interaction.type] = (acc[interaction.type] ?? 0) + 1;
        return acc;
      },
      {},
    );

    expect(countByType).toEqual({ poll: 8, reflection: 7 });
  });

  it('ne devrait declarer ni slide ni collection vide', () => {
    const emptyCollections = Object.entries(IA_SOLOPRENEURS_INTERACTIONS)
      .filter(
        ([, slide]) =>
          slide.present?.length === 0 ||
          slide.scroll?.length === 0 ||
          (slide.present ?? slide.scroll) === undefined,
      )
      .map(([slideId]) => slideId);

    expect(emptyCollections).toEqual([]);
  });
});
