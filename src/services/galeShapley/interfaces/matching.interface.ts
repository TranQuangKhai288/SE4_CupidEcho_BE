export interface IMatchScore {
  userId: string;
  candidateId: string;
  score: number; // Điểm từ 0 đến 10
}

export interface IMatchingResult {
  userId: string;
  matchedUserId: string | null;
  score: number;
}
