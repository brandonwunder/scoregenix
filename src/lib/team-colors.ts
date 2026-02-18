/**
 * Team color mappings for visual accents
 * Maps team abbreviations to their primary brand colors
 */

export const TEAM_COLORS: Record<string, string> = {
  // NFL Teams
  'PHI': '#004C54', // Eagles
  'KC': '#E31837', // Chiefs
  'SF': '#AA0000', // 49ers
  'DAL': '#003594', // Cowboys
  // Add more teams as needed
};

// League default colors
export const LEAGUE_COLORS: Record<string, string> = {
  'nfl': '#663399',
  'nba': '#C8102E',
  'mlb': '#041E42',
  'nhl': '#111111',
  'mls': '#C4122E',
  'college-football': '#FF8200',
  'mens-college-basketball': '#0033A0',
};

export function getTeamColor(abbr: string, league: string): string {
  return TEAM_COLORS[abbr] || LEAGUE_COLORS[league] || '#34D399';
}

export function getTeamColorWithOpacity(color: string, opacity: number): string {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
