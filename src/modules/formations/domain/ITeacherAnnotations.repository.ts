export interface TeacherAnnotationRecord {
  id: string;
  sessionId: string;
  teacherId: string;
  screenId: string;
  note: string;
  updatedAt: Date;
}

export interface SaveTeacherAnnotationInput {
  sessionId: string;
  teacherId: string;
  screenId: string;
  note: string;
}

export interface ITeacherAnnotationsRepository {
  save(input: SaveTeacherAnnotationInput): Promise<TeacherAnnotationRecord>;
  listBySession(
    sessionId: string,
    teacherId: string,
  ): Promise<readonly TeacherAnnotationRecord[]>;
}
