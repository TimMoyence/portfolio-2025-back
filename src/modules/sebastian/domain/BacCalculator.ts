import { DRINK_TYPE_DEFAULTS, type SebastianEntry } from './SebastianEntry';
import type { SebastianProfile } from './SebastianProfile';

/** Point de donnee pour la courbe BAC. */
export interface BacDataPoint {
  time: Date;
  bac: number;
}

/** Resultat du calcul de taux d'alcoolemie (BAC). */
export interface BacResult {
  currentBac: number;
  curve: BacDataPoint[];
  estimatedSoberAt: Date | null;
}

/** Taux de metabolisation de l'alcool en g/L par heure. */
const METABOLISM_RATE = 0.15;

/** Intervalle entre chaque point de la courbe BAC, en minutes. */
const CURVE_INTERVAL_MINUTES = 15;

/**
 * Calcule les grammes d'alcool pur a partir du volume (cL) et du degre.
 * Formule : volumeCl × 10 (conversion en mL) × (degre / 100) × 0.789 (densite ethanol).
 * Simplifie en : volumeCl × alcoholDegree × 0.0789
 */
function computeAlcoholGrams(volumeCl: number, alcoholDegree: number): number {
  return volumeCl * alcoholDegree * 0.0789;
}

/**
 * Determine les parametres d'alcool pour une entree donnee.
 * Utilise le drinkType si present, sinon les defauts biere pour les anciennes entrees.
 */
function getEntryAlcoholParams(
  entry: SebastianEntry,
): { alcoholDegree: number; volumeCl: number } | null {
  if (entry.category !== 'alcohol') return null;

  if (entry.drinkType) {
    const defaults = DRINK_TYPE_DEFAULTS[entry.drinkType];
    return {
      alcoholDegree: entry.alcoholDegree ?? defaults.alcoholDegree,
      volumeCl: entry.volumeCl ?? defaults.volumeCl,
    };
  }

  /* Entrees legacy sans drinkType : on assume une biere standard par standard_drink. */
  const beerDefaults = DRINK_TYPE_DEFAULTS['beer'];
  return {
    alcoholDegree: entry.alcoholDegree ?? beerDefaults.alcoholDegree,
    volumeCl: entry.volumeCl ?? beerDefaults.volumeCl,
  };
}

/**
 * Calcule la contribution BAC d'une seule boisson a un instant donne.
 * BAC (g/L) = (grammes_alcool / (widmarkR × poidsKg)) - metabolisme × heures_ecoulees
 * Le resultat est plafonne a 0 minimum.
 */
function computeDrinkContribution(
  grams: number,
  widmarkR: number,
  weightKg: number,
  hoursElapsed: number,
): number {
  const peak = grams / (widmarkR * weightKg);
  return Math.max(0, peak - METABOLISM_RATE * hoursElapsed);
}

/**
 * Service de domaine pur pour le calcul du taux d'alcoolemie (BAC)
 * selon la formule de Widmark.
 */
export class BacCalculator {
  /**
   * Calcule la courbe BAC a partir des entrees de consommation du jour.
   * Filtre les entrees alcool possedant un consumedAt le meme jour que `now`.
   * Genere des points toutes les 15 minutes, du premier verre jusqu'au retour a 0.
   */
  static calculateBacCurve(
    entries: SebastianEntry[],
    profile: SebastianProfile,
    now: Date,
  ): BacResult {
    /* Filtrer : uniquement les entrees alcool du jour avec consumedAt. */
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const alcoholEntries = entries.filter((e) => {
      if (e.category !== 'alcohol') return false;
      if (!e.consumedAt) return false;
      const t = e.consumedAt.getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    });

    if (alcoholEntries.length === 0) {
      return { currentBac: 0, curve: [], estimatedSoberAt: null };
    }

    /* Preparer les donnees de chaque boisson. */
    const drinks = alcoholEntries
      .map((entry) => {
        const params = getEntryAlcoholParams(entry);
        if (!params) return null;
        const grams =
          computeAlcoholGrams(params.volumeCl, params.alcoholDegree) *
          entry.quantity;
        return { consumedAt: entry.consumedAt!, grams };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null && d.grams > 0);

    if (drinks.length === 0) {
      return { currentBac: 0, curve: [], estimatedSoberAt: null };
    }

    /* Trouver le premier verre pour demarrer la courbe. */
    const firstDrinkTime = new Date(
      Math.min(...drinks.map((d) => d.consumedAt.getTime())),
    );

    /** Calcule le BAC total a un instant t. */
    const computeBacAt = (t: Date): number => {
      let total = 0;
      for (const drink of drinks) {
        const hoursElapsed =
          (t.getTime() - drink.consumedAt.getTime()) / (1000 * 60 * 60);
        if (hoursElapsed < 0) continue;
        total += computeDrinkContribution(
          drink.grams,
          profile.widmarkR,
          profile.weightKg,
          hoursElapsed,
        );
      }
      return Math.round(total * 1000) / 1000;
    };

    /* Generer la courbe par intervalles de 15 min. */
    const curve: BacDataPoint[] = [];
    let cursor = new Date(firstDrinkTime);
    let estimatedSoberAt: Date | null = null;

    /* On genere la courbe jusqu'a ce que le BAC revienne a 0 apres now,
       ou jusqu'a 24h max pour eviter une boucle infinie. */
    const maxTime = new Date(firstDrinkTime.getTime() + 24 * 60 * 60 * 1000);

    while (cursor.getTime() <= maxTime.getTime()) {
      const bac = computeBacAt(cursor);
      curve.push({ time: new Date(cursor), bac });

      /* Si le BAC est a 0 et qu'on est passe le pic (au moins un point > 0 avant),
         on a trouve le moment de sobriete. */
      if (
        bac === 0 &&
        curve.length > 1 &&
        cursor.getTime() > firstDrinkTime.getTime()
      ) {
        estimatedSoberAt = new Date(cursor);
        break;
      }

      cursor = new Date(cursor.getTime() + CURVE_INTERVAL_MINUTES * 60 * 1000);
    }

    const currentBac = computeBacAt(now);

    return { currentBac, curve, estimatedSoberAt };
  }
}
