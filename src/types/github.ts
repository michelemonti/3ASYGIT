// Types for GitHub contribution data

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // GitHub's intensity levels
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionData {
  username?: string;
  totalContributions: number;
  weeks: ContributionWeek[];
  longestStreak: number;
  currentStreak: number;
  averagePerDay?: number;
  mostActiveDay?: string;
  mostContributionsInDay?: number;
  contributionsByMonth?: { month: string; count: number }[];
  // Additional user info from GitHub
  followers?: number;
  publicRepos?: number;
  avatarUrl?: string;
  bio?: string;
}

export interface GitHubUser {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string;
  followers: number;
  following: number;
  publicRepos: number;
}

// Visualization mode types
export interface VisualizationMode {
  id: string;
  title: string;
  description: string;
  narrative: string;
  color: string;
}

export const VISUALIZATION_MODES: VisualizationMode[] = [
  {
    id: 'galaxy',
    title: 'Contribution Galaxy',
    description: 'Your commits as stars in an infinite universe',
    narrative: 'Each star is a day you chose to build. The brighter the light, the deeper your impact.',
    color: '#00FFFF',
  },
  {
    id: 'mountain',
    title: 'Commit Mountain Range',
    description: 'A timeline carved into digital peaks',
    narrative: 'Your code forms mountains. Every peak is a story of persistence.',
    color: '#39FF14',
  },
  {
    id: 'tunnel',
    title: 'Dev Timeline Tunnel',
    description: 'Journey through your coding timeline',
    narrative: 'Travel through the tunnel of time. Each ring marks a week of creation.',
    color: '#BF00FF',
  },
  {
    id: 'city',
    title: 'Calendar City',
    description: 'Days become skyscrapers in your dev metropolis',
    narrative: 'A city built from pure intention. The skyline of a builder.',
    color: '#FF10F0',
  },
  {
    id: 'heartbeat',
    title: 'Streak Pulse',
    description: 'The rhythm of your development heartbeat',
    narrative: 'This is your pulse. The rhythm of a creator who never stops.',
    color: '#1E90FF',
  },
];
