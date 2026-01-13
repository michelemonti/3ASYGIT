// Types for GitHub contribution data

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
  days: ContributionDay[];
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
