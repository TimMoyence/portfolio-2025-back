export interface CreateRedirectCommand {
  slug: string;
  targetUrl: string;
  enabled?: boolean;
  clicks?: number;
}
