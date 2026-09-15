export interface OpenSessionCommand {
  courseSlug: string;
  teacherId: string;
}

export interface OpenSessionResult {
  sessionId: string;
  code: string;
}
