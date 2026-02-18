/**
 * Sport configuration including logos, colors, and metadata
 */

export type SportSlug = 'nfl' | 'nba' | 'mlb' | 'nhl' | 'mls' | 'college-football' | 'mens-college-basketball';

export const SPORT_LOGOS: Record<SportSlug, string> = {
  'nfl': 'https://a.espncdn.com/i/teamlogos/leagues/500/nfl.png',
  'nba': 'https://a.espncdn.com/i/teamlogos/leagues/500/nba.png',
  'mlb': 'https://a.espncdn.com/i/teamlogos/leagues/500/mlb.png',
  'nhl': 'https://a.espncdn.com/i/teamlogos/leagues/500/nhl.png',
  'mls': 'https://a.espncdn.com/i/teamlogos/leagues/500/mls.png',
  'college-football': 'https://a.espncdn.com/i/teamlogos/leagues/500/college-football.png',
  'mens-college-basketball': 'https://a.espncdn.com/i/teamlogos/leagues/500/mens-college-basketball.png',
};

export const SPORT_COLORS: Record<SportSlug, string> = {
  'nfl': '#663399',
  'nba': '#C8102E',
  'mlb': '#041E42',
  'nhl': '#111111',
  'mls': '#C4122E',
  'college-football': '#FF8200',
  'mens-college-basketball': '#0033A0',
};

export const SPORT_NAMES: Record<SportSlug, string> = {
  'nfl': 'NFL',
  'nba': 'NBA',
  'mlb': 'MLB',
  'nhl': 'NHL',
  'mls': 'MLS',
  'college-football': 'NCAAF',
  'mens-college-basketball': 'NCAAB',
};

export interface SportConfig {
  slug: SportSlug;
  name: string;
  displayName: string;
  color: string;
  logoUrl: string;
  category: 'professional' | 'college';
}

export const SPORT_CONFIGS: Record<SportSlug, SportConfig> = {
  'nfl': { slug: 'nfl', name: 'NFL', displayName: 'NFL', color: SPORT_COLORS.nfl, logoUrl: SPORT_LOGOS.nfl, category: 'professional' },
  'nba': { slug: 'nba', name: 'NBA', displayName: 'NBA', color: SPORT_COLORS.nba, logoUrl: SPORT_LOGOS.nba, category: 'professional' },
  'mlb': { slug: 'mlb', name: 'MLB', displayName: 'MLB', color: SPORT_COLORS.mlb, logoUrl: SPORT_LOGOS.mlb, category: 'professional' },
  'nhl': { slug: 'nhl', name: 'NHL', displayName: 'NHL', color: SPORT_COLORS.nhl, logoUrl: SPORT_LOGOS.nhl, category: 'professional' },
  'mls': { slug: 'mls', name: 'MLS', displayName: 'MLS', color: SPORT_COLORS.mls, logoUrl: SPORT_LOGOS.mls, category: 'professional' },
  'college-football': { slug: 'college-football', name: 'College Football', displayName: 'NCAAF', color: SPORT_COLORS['college-football'], logoUrl: SPORT_LOGOS['college-football'], category: 'college' },
  'mens-college-basketball': { slug: 'mens-college-basketball', name: "Men's College Basketball", displayName: 'NCAAB', color: SPORT_COLORS['mens-college-basketball'], logoUrl: SPORT_LOGOS['mens-college-basketball'], category: 'college' },
};

export function getSportConfig(slug: string): SportConfig | undefined {
  return SPORT_CONFIGS[slug as SportSlug];
}

export function getSportLogo(slug: string): string {
  return SPORT_LOGOS[slug as SportSlug] || '';
}

export function getSportColor(slug: string): string {
  return SPORT_COLORS[slug as SportSlug] || '#34D399';
}

export function getSportDisplayName(slug: string): string {
  return SPORT_NAMES[slug as SportSlug] || slug;
}
