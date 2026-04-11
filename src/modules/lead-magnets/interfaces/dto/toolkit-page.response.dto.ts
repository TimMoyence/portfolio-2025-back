import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ToolkitContent } from '../../domain/ToolkitContent';

/** DTO de reponse pour la page personnalisee du guide IA. */
export class ToolkitPageResponseDto {
  @ApiProperty()
  recap: {
    firstName: string;
    aiLevel: string | null;
    sector: string | null;
    budgetTier: string | null;
  };

  @ApiProperty()
  cheatsheet: Array<{
    tool: string;
    category: string;
    price: string;
    url: string;
    tip: string;
    decision: string;
    alreadyUsed: boolean;
  }>;

  @ApiProperty()
  prompts: Array<{
    category: string;
    title: string;
    level: string;
    prompt: string;
    tool: string;
  }>;

  @ApiProperty()
  workflows: Array<{
    title: string;
    description: string;
    setupTime: string;
    monthlyCost: number;
    steps: Array<{
      step: number;
      action: string;
      tool: string;
      detail: string;
    }>;
    tools: string[];
  }>;

  @ApiProperty()
  templates: Array<{
    name: string;
    platform: string;
    url: string;
    description: string;
    minBudget: number;
  }>;

  @ApiPropertyOptional()
  generatedPrompt: string | null;

  /** Mappe le contenu domaine vers le DTO de reponse. */
  static fromContent(content: ToolkitContent): ToolkitPageResponseDto {
    const dto = new ToolkitPageResponseDto();
    dto.recap = content.recap;
    dto.cheatsheet = content.cheatsheet;
    dto.prompts = content.prompts;
    dto.workflows = content.workflows;
    dto.templates = content.templates;
    dto.generatedPrompt = content.generatedPrompt;
    return dto;
  }
}
