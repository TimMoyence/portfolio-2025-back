import { HttpStatus } from '@nestjs/common';
import type { HttpException } from '@nestjs/common';
import { CodeScanProtectionService } from '../CodeScanProtection.service';

const IP_SALLE = 'sortie-nat-salle-b204';
const AUTRE_IP = 'sortie-nat-salle-b205';
const MAX_ECHECS = 20;
const T0 = 1_757_600_000_000;

describe('CodeScanProtectionService', () => {
  let sut: CodeScanProtectionService;

  const echouer = (fois: number, adresse = IP_SALLE, maintenant = T0): void => {
    for (let i = 0; i < fois; i += 1) {
      sut.enregistrerEchec(adresse, maintenant);
    }
  };

  beforeEach(() => {
    sut = new CodeScanProtectionService();
  });

  it('laisse passer une classe entiere qui saisit le bon code', () => {
    expect(() => sut.assertPasDeBalayage(IP_SALLE, T0)).not.toThrow();
  });

  it('tolere les fautes de frappe d une classe sous le seuil', () => {
    echouer(MAX_ECHECS - 1);
    expect(() => sut.assertPasDeBalayage(IP_SALLE, T0)).not.toThrow();
  });

  it('arrete le balayage au seuil et repond 429', () => {
    echouer(MAX_ECHECS);
    let statut = 0;
    try {
      sut.assertPasDeBalayage(IP_SALLE, T0);
    } catch (error) {
      statut = (error as HttpException).getStatus();
    }
    expect(statut).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });

  it('ne penalise que l adresse qui balaye', () => {
    echouer(MAX_ECHECS);
    expect(() => sut.assertPasDeBalayage(AUTRE_IP, T0)).not.toThrow();
  });

  it('rouvre l acces a la fenetre suivante', () => {
    echouer(MAX_ECHECS);
    expect(() => sut.assertPasDeBalayage(IP_SALLE, T0 + 60_001)).not.toThrow();
  });

  it('ne compte pas deux fenetres comme une seule', () => {
    echouer(MAX_ECHECS - 1);
    echouer(1, IP_SALLE, T0 + 60_001);
    expect(() => sut.assertPasDeBalayage(IP_SALLE, T0 + 60_002)).not.toThrow();
  });

  it('purge les compteurs expires plutot que de croitre sans fin', () => {
    for (let i = 0; i < 1_200; i += 1) {
      sut.enregistrerEchec(`sortie-nat-${i}`, T0);
    }
    sut.enregistrerEchec(IP_SALLE, T0 + 60_001);
    expect(() => sut.assertPasDeBalayage(IP_SALLE, T0 + 60_002)).not.toThrow();
  });
});
