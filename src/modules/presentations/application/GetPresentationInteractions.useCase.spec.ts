import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { IPresentationsRepository } from '../domain/IPresentations.repository';
import type { PresentationInteractions } from '../domain/SlideInteraction';
import { PRESENTATIONS_REPOSITORY } from '../domain/token';
import { GetPresentationInteractionsUseCase } from './GetPresentationInteractions.useCase';

describe('GetPresentationInteractionsUseCase', () => {
  let useCase: GetPresentationInteractionsUseCase;
  let repo: jest.Mocked<IPresentationsRepository>;

  const mockInteractions: PresentationInteractions = {
    slug: 'ia-solopreneurs',
    interactions: {
      accroche: {
        present: [
          {
            type: 'poll',
            question: "Qui utilise l'IA ?",
            options: ['Oui', 'Non'],
          },
        ],
        scroll: [
          {
            type: 'reflection',
            question: 'Comment utilisez-vous l\u2019IA ?',
            placeholder: 'Decrivez...',
          },
        ],
      },
    },
  };

  beforeEach(async () => {
    repo = {
      findBySlug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPresentationInteractionsUseCase,
        { provide: PRESENTATIONS_REPOSITORY, useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetPresentationInteractionsUseCase);
  });

  it('devrait retourner les interactions pour un slug existant', async () => {
    repo.findBySlug.mockResolvedValue(mockInteractions);

    const result = await useCase.execute('ia-solopreneurs');

    expect(result.slug).toBe('ia-solopreneurs');
    expect(result.interactions['accroche']).toBeDefined();
    expect(result.interactions['accroche'].present).toHaveLength(1);
    expect(result.interactions['accroche'].scroll).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(repo.findBySlug).toHaveBeenCalledWith('ia-solopreneurs');
  });

  it('devrait lever NotFoundException pour un slug inconnu', async () => {
    repo.findBySlug.mockResolvedValue(null);

    await expect(useCase.execute('inexistant')).rejects.toThrow(
      NotFoundException,
    );
  });
});
