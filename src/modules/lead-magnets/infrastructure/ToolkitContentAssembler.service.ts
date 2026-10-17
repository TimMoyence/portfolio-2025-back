import { Injectable } from '@nestjs/common';
import type { IToolkitContentAssembler } from '../domain/IToolkitContentAssembler';
import type {
  CheatsheetEntry,
  PromptEntry,
  ToolkitContent,
  WorkflowEntry,
} from '../domain/ToolkitContent';
import {
  CHEATSHEET_DATA,
  PROMPTS_DATA,
  TEMPLATES_DATA,
  WORKFLOWS_DATA,
} from './data/toolkit-content.data';

@Injectable()
export class ToolkitContentAssemblerService implements IToolkitContentAssembler {
  assemble(firstName: string): ToolkitContent {
    return {
      recap: { firstName },
      cheatsheet: this.buildCheatsheet(),
      prompts: this.buildPrompts(),
      workflows: this.buildWorkflows(),
      templates: TEMPLATES_DATA.map((t) => ({ ...t })),
    };
  }

  private buildCheatsheet(): CheatsheetEntry[] {
    return CHEATSHEET_DATA.map((tool) => ({
      tool: tool.id,
      category: tool.category,
      price: tool.price,
      url: tool.url,
      tip: tool.tip,
      decision: tool.decision,
    }));
  }

  private buildPrompts(): PromptEntry[] {
    return PROMPTS_DATA.map((p) => ({
      category: p.category,
      title: p.title,
      level: p.level,
      prompt: p.prompt,
      tool: p.tool,
      description: p.description,
      example: p.example,
      tip: p.tip,
    }));
  }

  private buildWorkflows(): WorkflowEntry[] {
    return WORKFLOWS_DATA.map((w) => ({
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
  }
}
