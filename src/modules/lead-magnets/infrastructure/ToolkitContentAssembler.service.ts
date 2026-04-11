import { Injectable } from '@nestjs/common';
import type { InteractionProfile } from '../domain/InteractionProfile';
import type { IToolkitContentAssembler } from '../domain/IToolkitContentAssembler';
import type {
  CheatsheetEntry,
  PromptEntry,
  TemplateEntry,
  ToolkitContent,
  WorkflowEntry,
} from '../domain/ToolkitContent';
import {
  CHEATSHEET_DATA,
  PROMPTS_DATA,
  TEMPLATES_DATA,
  WORKFLOWS_DATA,
} from './data/toolkit-content.data';

/**
 * Assemble le contenu personnalise de la boite a outils
 * en fonction du profil d'interaction de l'utilisateur.
 */
@Injectable()
export class ToolkitContentAssemblerService implements IToolkitContentAssembler {
  /**
   * Assemble le contenu personnalise du guide IA.
   *
   * @param firstName - Prenom de l'utilisateur
   * @param profile - Profil d'interaction (null si aucune interaction)
   * @returns Contenu complet personnalise pour la generation PDF
   */
  assemble(
    firstName: string,
    profile: InteractionProfile | null,
  ): ToolkitContent {
    return {
      recap: {
        firstName,
        aiLevel: profile?.aiLevel ?? null,
        sector: profile?.sector ?? null,
        budgetTier: profile?.budgetTier ?? null,
      },
      cheatsheet: this.buildCheatsheet(profile),
      prompts: this.buildPrompts(profile),
      workflows: this.buildWorkflows(profile),
      templates: this.buildTemplates(profile),
      generatedPrompt: profile?.generatedPrompt ?? null,
    };
  }

  /**
   * Construit la cheatsheet en marquant les outils deja utilises.
   * Tous les outils sont inclus, avec le flag `alreadyUsed`.
   */
  private buildCheatsheet(
    profile: InteractionProfile | null,
  ): CheatsheetEntry[] {
    const usedIds = new Set(
      (profile?.toolsAlreadyUsed ?? []).map((t) => t.toLowerCase()),
    );
    return CHEATSHEET_DATA.map((tool) => ({
      tool: tool.id,
      category: tool.category,
      price: tool.price,
      url: tool.url,
      tip: tool.tip,
      decision: tool.decision,
      alreadyUsed: usedIds.has(tool.id.toLowerCase()),
    }));
  }

  /**
   * Filtre les prompts selon le niveau IA de l'utilisateur.
   * - debutant : uniquement les prompts debutant
   * - intermediaire : debutant + intermediaire
   * - avance : intermediaire + avance
   * - null : tous les prompts
   */
  private buildPrompts(profile: InteractionProfile | null): PromptEntry[] {
    const level = profile?.aiLevel ?? null;
    const allowedLevels = this.getAllowedLevels(level);

    return PROMPTS_DATA.filter((p) => allowedLevels.has(p.level)).map((p) => ({
      category: p.category,
      title: p.title,
      level: p.level,
      prompt: p.prompt,
      tool: p.tool,
    }));
  }

  /**
   * Trie les workflows par cout mensuel si le budget est 0.
   * Sinon, retourne dans l'ordre par defaut.
   */
  private buildWorkflows(profile: InteractionProfile | null): WorkflowEntry[] {
    const workflows: WorkflowEntry[] = WORKFLOWS_DATA.map((w) => ({
      title: w.title,
      description: w.description,
      setupTime: w.setupTime,
      monthlyCost: w.monthlyCost,
      steps: w.steps.map((s) => ({
        step: s.step,
        action: s.action,
        tool: s.tool,
        detail: s.detail,
      })),
      tools: [...w.tools],
    }));

    if (profile?.budgetTier === '0') {
      workflows.sort((a, b) => a.monthlyCost - b.monthlyCost);
    }

    return workflows;
  }

  /**
   * Filtre les templates dont le budget minimum est inferieur ou egal au
   * budget de l'utilisateur. Si le budget est null, retourne tous les templates.
   */
  private buildTemplates(profile: InteractionProfile | null): TemplateEntry[] {
    const budgetTier = profile?.budgetTier ?? null;

    if (budgetTier === null) {
      return TEMPLATES_DATA.map((t) => ({ ...t }));
    }

    const maxBudget = Number(budgetTier);
    return TEMPLATES_DATA.filter((t) => t.minBudget <= maxBudget).map((t) => ({
      ...t,
    }));
  }

  /** Determine les niveaux de prompts autorises selon le niveau IA. */
  private getAllowedLevels(
    level: 'debutant' | 'intermediaire' | 'avance' | null,
  ): Set<string> {
    switch (level) {
      case 'debutant':
        return new Set(['debutant']);
      case 'intermediaire':
        return new Set(['debutant', 'intermediaire']);
      case 'avance':
        return new Set(['intermediaire', 'avance']);
      default:
        return new Set(['debutant', 'intermediaire', 'avance']);
    }
  }
}
