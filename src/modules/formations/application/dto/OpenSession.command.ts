export interface OpenSessionCommand {
  capacite?: number;
  courseSlug: string;
  teacherId: string;
}

export interface OpenSessionResult {
  sessionId: string;
  code: string;
}
