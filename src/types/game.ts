export type Difficulty = "easy" | "medium" | "hard";

export interface PlayerStats {
  points: number;
  tasksCompleted: number;
  truthsAnswered: number;
  daresCompleted: number;
  achievements: string[];
  currentStreak: number;
  maxStreak: number;
  level: number;
  xp: number;
  skipTokens?: number;
  xpBoostEndTime?: number;
}

export interface GameState {
  difficulty: Difficulty;
  playerStats: PlayerStats;
  lastTaskTimestamp: number | null;
  selectedCategory: string;
  activeChallenge: Challenge | null;
  surpriseMessage?: string;
}

export interface Challenge {
  id: string;
  fromPlayer: string;
  toPlayer: string;
  task: string;
  type: "TRUTH" | "DARE";
  status: "PENDING" | "ACCEPTED" | "COMPLETED" | "FAILED";
  expiresAt: number;
} 