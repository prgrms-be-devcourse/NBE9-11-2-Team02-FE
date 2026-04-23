export interface Achievement {
    code: string;
    name: string;
    description: string;
    reward: string;
    isAchieved: boolean;
    achievedAt: string | null;
  }