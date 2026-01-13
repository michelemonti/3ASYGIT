/**
 * GitHub Service for git.3asy.app
 * Handles OAuth authentication and data fetching from GitHub API
 */

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || '';
const GITHUB_REDIRECT_URI = import.meta.env.VITE_GITHUB_REDIRECT_URI || window.location.origin;

// Types
export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  html_url: string;
}

export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
  days: ContributionDay[];
}

export interface GitHubContributions {
  totalContributions: number;
  weeks: ContributionWeek[];
}

export interface GitHubStats {
  user: GitHubUser;
  contributions: GitHubContributions;
  currentStreak: number;
  longestStreak: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  topLanguages: { name: string; percentage: number }[];
}

// OAuth flow
export function initiateGitHubOAuth(): void {
  const scope = 'read:user';
  const state = generateRandomState();
  
  // Save state for verification
  sessionStorage.setItem('github_oauth_state', state);
  
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GITHUB_REDIRECT_URI);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('state', state);
  
  window.location.href = authUrl.toString();
}

function generateRandomState(): string {
  const array = new Uint32Array(4);
  crypto.getRandomValues(array);
  return Array.from(array, x => x.toString(16)).join('');
}

// Handle OAuth callback
export function handleOAuthCallback(): { code: string; state: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const savedState = sessionStorage.getItem('github_oauth_state');
  
  if (code && state && state === savedState) {
    // Clear the state
    sessionStorage.removeItem('github_oauth_state');
    
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    return { code, state };
  }
  
  return null;
}

// Fetch user data (without auth - public data only)
export async function fetchPublicGitHubUser(username: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found');
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub user:', error);
    return null;
  }
}

// Fetch contribution data using GitHub's GraphQL API (for authenticated users)
// For public access, we'll scrape the contribution graph or use an alternative approach
export async function fetchContributions(username: string, token?: string): Promise<GitHubContributions | null> {
  // If we have a token, use the GraphQL API
  if (token) {
    return fetchContributionsGraphQL(username, token);
  }
  
  // Otherwise, try the public endpoint (may be rate limited)
  return fetchContributionsPublic(username);
}

async function fetchContributionsGraphQL(username: string, token: string): Promise<GitHubContributions | null> {
  const query = `
    query($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;
  
  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
    });
    
    if (!response.ok) {
      throw new Error(`GraphQL error: ${response.status}`);
    }
    
    const data = await response.json();
    const calendar = data.data?.user?.contributionsCollection?.contributionCalendar;
    
    if (!calendar) {
      return null;
    }
    
    return {
      totalContributions: calendar.totalContributions,
      weeks: calendar.weeks.map((week: any) => ({
        days: week.contributionDays.map((day: any) => ({
          date: day.date,
          count: day.contributionCount,
          level: levelStringToNumber(day.contributionLevel),
        })),
      })),
    };
  } catch (error) {
    console.error('Error fetching contributions via GraphQL:', error);
    return null;
  }
}

function levelStringToNumber(level: string): 0 | 1 | 2 | 3 | 4 {
  switch (level) {
    case 'NONE': return 0;
    case 'FIRST_QUARTILE': return 1;
    case 'SECOND_QUARTILE': return 2;
    case 'THIRD_QUARTILE': return 3;
    case 'FOURTH_QUARTILE': return 4;
    default: return 0;
  }
}

// Public contribution fetch (scraping GitHub's contribution endpoint)
async function fetchContributionsPublic(username: string): Promise<GitHubContributions | null> {
  try {
    // GitHub provides a public endpoint for contribution data (used by the profile page)
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
    
    if (!response.ok) {
      // Fallback to estimating from events
      return estimateContributionsFromEvents(username);
    }
    
    const data = await response.json();
    
    // Transform the data to our format
    const contributions: ContributionDay[] = data.contributions.map((c: any) => ({
      date: c.date,
      count: c.count,
      level: c.level as 0 | 1 | 2 | 3 | 4,
    }));
    
    // Group into weeks
    const weeks: ContributionWeek[] = [];
    for (let i = 0; i < contributions.length; i += 7) {
      weeks.push({
        days: contributions.slice(i, i + 7),
      });
    }
    
    return {
      totalContributions: data.total?.lastYear || contributions.reduce((sum, c) => sum + c.count, 0),
      weeks,
    };
  } catch (error) {
    console.error('Error fetching public contributions:', error);
    return estimateContributionsFromEvents(username);
  }
}

// Fallback: estimate contributions from public events
async function estimateContributionsFromEvents(username: string): Promise<GitHubContributions | null> {
  try {
    const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`);
    
    if (!response.ok) {
      return null;
    }
    
    const events = await response.json();
    
    // Count events by date
    const countsByDate: Record<string, number> = {};
    events.forEach((event: any) => {
      const date = event.created_at.split('T')[0];
      countsByDate[date] = (countsByDate[date] || 0) + 1;
    });
    
    // Generate last 365 days
    const now = new Date();
    const contributions: ContributionDay[] = [];
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = countsByDate[dateStr] || 0;
      
      contributions.push({
        date: dateStr,
        count,
        level: countToLevel(count),
      });
    }
    
    // Group into weeks
    const weeks: ContributionWeek[] = [];
    for (let i = 0; i < contributions.length; i += 7) {
      weeks.push({
        days: contributions.slice(i, i + 7),
      });
    }
    
    return {
      totalContributions: contributions.reduce((sum, c) => sum + c.count, 0),
      weeks,
    };
  } catch (error) {
    console.error('Error estimating contributions:', error);
    return null;
  }
}

function countToLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 3) return 1;
  if (count <= 6) return 2;
  if (count <= 9) return 3;
  return 4;
}

// Calculate streaks - properly handles contribution data
export function calculateStreaks(contributions: GitHubContributions): { current: number; longest: number } {
  const allDays = contributions.weeks.flatMap(w => w.days);
  
  // Sort by date ascending (oldest first)
  allDays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Get today's date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  
  for (const day of allDays) {
    if (day.count > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }
  
  // Calculate current streak (going backwards from today or most recent day)
  let currentStreak = 0;
  
  // Find the index of today or the most recent day with data
  let startIndex = allDays.length - 1;
  
  // If the most recent day in data is today, start from there
  // If not, check if the most recent day is yesterday (streak might still be active)
  const mostRecentDay = allDays[startIndex];
  const mostRecentDate = new Date(mostRecentDay.date);
  mostRecentDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // If no data for more than 1 day, current streak is 0
  if (daysDiff > 1) {
    return { current: 0, longest: longestStreak };
  }
  
  // If today has no contributions but yesterday did, still count from yesterday
  if (mostRecentDay.count === 0 && daysDiff === 0) {
    // Today exists but has 0 - check if we had contributions yesterday
    startIndex--;
    if (startIndex < 0 || allDays[startIndex].count === 0) {
      return { current: 0, longest: longestStreak };
    }
  }
  
  // Count backwards from start index
  for (let i = startIndex; i >= 0; i--) {
    const day = allDays[i];
    
    if (day.count > 0) {
      currentStreak++;
      
      // Check if the previous day is consecutive
      if (i > 0) {
        const prevDay = allDays[i - 1];
        const currentDate = new Date(day.date);
        const prevDate = new Date(prevDay.date);
        const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // If there's a gap of more than 1 day, stop
        if (diff > 1) {
          break;
        }
      }
    } else {
      // No contribution this day - streak broken
      break;
    }
  }
  
  return { current: currentStreak, longest: longestStreak };
}

// Fetch complete stats
export async function fetchGitHubStats(username: string, token?: string): Promise<GitHubStats | null> {
  const [user, contributions] = await Promise.all([
    fetchPublicGitHubUser(username),
    fetchContributions(username, token),
  ]);
  
  if (!user || !contributions) {
    return null;
  }
  
  const streaks = calculateStreaks(contributions);
  
  // Fetch additional stats (repos for languages)
  const topLanguages = await fetchTopLanguages(username, token);
  
  return {
    user,
    contributions,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    totalCommits: contributions.totalContributions,
    totalPRs: 0, // Would need additional API calls
    totalIssues: 0,
    topLanguages,
  };
}

async function fetchTopLanguages(username: string, token?: string): Promise<{ name: string; percentage: number }[]> {
  try {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, {
      headers,
    });
    
    if (!response.ok) {
      return [];
    }
    
    const repos = await response.json();
    
    // Count languages
    const languageCounts: Record<string, number> = {};
    repos.forEach((repo: any) => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      }
    });
    
    // Sort and calculate percentages
    const total = Object.values(languageCounts).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        percentage: Math.round((count / total) * 100),
      }));
    
    return sorted;
  } catch (error) {
    console.error('Error fetching languages:', error);
    return [];
  }
}

// Storage helpers
const STORAGE_KEY = 'github_user_data';
const TOKEN_KEY = 'github_access_token';

export function saveUserData(data: GitHubStats): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadUserData(): GitHubStats | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function clearUserData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Check if OAuth is configured
export function isOAuthConfigured(): boolean {
  return !!GITHUB_CLIENT_ID;
}
