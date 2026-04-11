import type { InteractionProfile } from './InteractionProfile';
import type { ToolkitContent } from './ToolkitContent';

/** Port d'assemblage du contenu personnalise de la boite a outils. */
export interface IToolkitContentAssembler {
  assemble(
    firstName: string,
    profile: InteractionProfile | null,
  ): ToolkitContent;
}
