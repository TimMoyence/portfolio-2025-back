import { CONTENUS } from '..';
import { sansEspacesTypographiques } from '../../../../../common/domain/texte/nettoyage/sans-espaces-typographiques';

const NOTES_AUTOMATIQUES = [
  /^• Temps : réflexion \d+ min/mu,
  /faire décrire l’image/u,
  /30 s de vote anonyme/u,
  /90 s de lecture/u,
  /5 min individuelles, puis projeter la carte de maîtrise/u,
  /Tous reçoivent les douze questions de la banque/u,
  /Question 1 en vote individuel, puis question 2/u,
  /La révélation s’ouvre après la question 2/u,
  /Papier : vote à main levée sur chaque question/u,
  /Temps « réfléchir »/u,
  /votes? non notés?/u,
  /Pause de 15 minutes, hors durée programmée/u,
  /Chacun répond sous chaque étape, puis la correction se dévoile/u,
  /Papier : réponses sous chaque étape du livret/u,
  /1 min, avant la trace écrite : faire décrire l’image/u,
  /2 min après l’illustration/u,
  /Corriger question par question, en commençant par la moins réussie/u,
  /Transition : jalon \d, puis pause de 15 min/u,
  /La consigne écrite ici sert telle quelle à l’écran suivant/u,
  /Transition : « Votre IA au travail\. »/u,
] as const;

describe('Les notes du formateur, sans consigne automatique', () => {
  it.each(CONTENUS.map((contenu) => [contenu.slug, contenu] as const))(
    'RET-09 · %s ne porte aucune note écrite d’office par une brique',
    (_slug, contenu) => {
      expect(
        contenu.ecrans.flatMap(({ screenId, notes }) =>
          NOTES_AUTOMATIQUES.filter((motif) =>
            motif.test(sansEspacesTypographiques(notes)),
          ).map((motif) => `${screenId} : ${motif.source}`),
        ),
      ).toEqual([]);
    },
  );
});
