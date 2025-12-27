import { ContributionData, ContributionDay, GitHubUser } from '@/types/github';

// Generate realistic mock contribution data
// Based on AndrewSink's 2025 profile: 361 contributions
function generateMockContributions(): ContributionDay[] {
  const contributions: ContributionDay[] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(startDate.getFullYear() - 1);
  
  // AndrewSink pattern: moderate contributor, focused on specific projects
  // 361 contributions / 365 days ≈ 1 contribution per day on average
  const weekdayWeight = [0.3, 0.8, 0.9, 0.9, 0.8, 0.6, 0.3]; // Sun to Sat - less on weekends
  
  // Track total to aim for ~361
  let totalContributions = 0;
  const targetContributions = 361;
  
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const baseChance = weekdayWeight[dayOfWeek];
    
    // Monthly variation - busier in certain months (project bursts)
    const month = d.getMonth();
    // More active in Jan-Mar (project work), slower in summer, picks up in fall
    const monthModifier = [1.2, 1.3, 1.1, 0.9, 0.8, 0.6, 0.5, 0.6, 0.8, 1.0, 1.1, 0.9][month];
    
    // Random project bursts (simulate focused work periods)
    const dayOfYear = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const burstModifier = Math.sin(dayOfYear * 0.05) > 0.5 ? 1.5 : 0.8;
    
    const chance = baseChance * monthModifier * burstModifier * 0.7; // Scale down to hit target
    const hasContribution = Math.random() < chance;
    
    let count = 0;
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    
    if (hasContribution && totalContributions < targetContributions) {
      // AndrewSink style: occasional bursts but mostly 1-5 contributions
      const intensity = Math.random();
      if (intensity > 0.9) {
        count = Math.floor(8 + Math.random() * 10); // Rare big days
      } else if (intensity > 0.7) {
        count = Math.floor(4 + Math.random() * 4); // Medium days
      } else {
        count = Math.floor(1 + Math.random() * 3); // Normal days
      }
      
      totalContributions += count;
      
      // Map to levels
      if (count >= 10) level = 4;
      else if (count >= 6) level = 3;
      else if (count >= 3) level = 2;
      else level = 1;
    }
    
    contributions.push({
      date: d.toISOString().split('T')[0],
      count,
      level,
    });
  }
  
  return contributions;
}

// Convert flat contribution array to weeks
function groupIntoWeeks(contributions: ContributionDay[]) {
  const weeks = [];
  for (let i = 0; i < contributions.length; i += 7) {
    weeks.push({
      contributionDays: contributions.slice(i, i + 7),
    });
  }
  return weeks;
}

// Calculate streak
function calculateStreaks(contributions: ContributionDay[]) {
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  // Reverse to start from most recent
  const reversed = [...contributions].reverse();
  
  // Calculate current streak
  for (const day of reversed) {
    if (day.count > 0) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Calculate longest streak
  for (const day of contributions) {
    if (day.count > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  return { currentStreak, longestStreak };
}

// Calculate monthly totals
function calculateMonthlyTotals(contributions: ContributionDay[]) {
  const monthlyMap = new Map<string, number>();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  for (const day of contributions) {
    const date = new Date(day.date);
    const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + day.count);
  }
  
  return Array.from(monthlyMap.entries()).map(([month, count]) => ({ month, count }));
}

// Mock user data
export const mockUser: GitHubUser = {
  login: 'AndrewSink',
  name: 'Andrew Sink',
  avatarUrl: 'https://avatars.githubusercontent.com/u/46334898?v=4',
  bio: '🤖 beep beep - 3D printing, JavaScript, creative coding',
  followers: 72,
  following: 42,
  publicRepos: 38,
};

// Generate complete mock data
export function generateMockData(): ContributionData {
  const contributions = generateMockContributions();
  const weeks = groupIntoWeeks(contributions);
  const { currentStreak, longestStreak } = calculateStreaks(contributions);
  const totalContributions = contributions.reduce((sum, day) => sum + day.count, 0);
  
  // Find most active day
  const maxDay = contributions.reduce((max, day) => day.count > max.count ? day : max, contributions[0]);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const mostActiveDate = new Date(maxDay.date);
  
  return {
    totalContributions,
    weeks,
    longestStreak,
    currentStreak,
    averagePerDay: Math.round((totalContributions / contributions.length) * 10) / 10,
    mostActiveDay: dayNames[mostActiveDate.getDay()],
    mostContributionsInDay: maxDay.count,
    contributionsByMonth: calculateMonthlyTotals(contributions),
  };
}

// AndrewSink specific data for 2025
export function generateAndrewSinkData(): ContributionData {
  const data = generateMockData();
  // Ensure we show approximately 361 contributions as per his profile
  return {
    ...data,
    totalContributions: 361,
  };
}

// Simulated API fetch function (ready for real implementation)
export async function fetchUserContribData(_username: string): Promise<ContributionData> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // In production, this would be:
  // const response = await fetch(`/api/github/contributions/${username}`);
  // return response.json();
  
  return generateMockData();
}

export async function fetchUserProfile(_username: string): Promise<GitHubUser> {
  await new Promise(resolve => setTimeout(resolve, 800));
  return mockUser;
}
