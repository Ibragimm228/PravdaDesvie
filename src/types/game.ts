export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameTask {
  text: string;
  difficulty: Difficulty;
  points: number;
  timeLimit?: number; 
  followUpId?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: {
    type: 'tasksCompleted' | 'pointsEarned' | 'streakReached' | 'truthsAnswered' | 'daresCompleted';
    value: number;
  };
}

export interface PlayerStats {
  points: number;
  tasksCompleted: number;
  truthsAnswered: number;
  daresCompleted: number;
  achievements: string[];
  currentStreak: number;
  maxStreak: number;
}

export interface GameState {
  difficulty: Difficulty;
  playerStats: PlayerStats;
  lastTaskTimestamp: number | null;
} 