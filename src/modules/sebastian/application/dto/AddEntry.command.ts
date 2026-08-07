export interface AddEntryCommand {
  userId: string;
  category: string;
  quantity: number;
  date: string;
  notes?: string | null;
  drinkType?: string;
  alcoholDegree?: number | null;
  volumeCl?: number | null;
  consumedAt?: string;
}
