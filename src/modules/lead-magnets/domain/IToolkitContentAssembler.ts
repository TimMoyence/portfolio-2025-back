import type { InteractionProfile } from './InteractionProfile';
import type { ToolkitContent } from './ToolkitContent';

export interface IToolkitContentAssembler {
  assemble(
    firstName: string,
    profile: InteractionProfile | null,
  ): ToolkitContent;
}
