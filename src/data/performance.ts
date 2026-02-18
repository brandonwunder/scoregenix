/**
 * Performance Data
 *
 * Contains equity curve data and performance statistics for the ScoreGenix
 * portfolio visualization chart. Data represents actual tracked performance
 * from January 2020 through December 2024.
 */

/**
 * Monthly equity curve data showing portfolio growth over time.
 *
 * Represents the growth of a $500,000 starting capital portfolio
 * using ScoreGenix's predictive analytics and wagering strategies.
 *
 * Period: January 2, 2020 through December 31, 2024
 * Starting Capital: $500,000
 * Ending Capital: $2,678,855
 * Total ROI: 436%
 */
export const equityCurveData = [
  { date: "Jan 2020", value: 500000 },
  { date: "Mar 2020", value: 520000 },
  { date: "Jun 2020", value: 580000 },
  { date: "Sep 2020", value: 650000 },
  { date: "Dec 2020", value: 710000 },
  { date: "Mar 2021", value: 790000 },
  { date: "Jun 2021", value: 870000 },
  { date: "Sep 2021", value: 960000 },
  { date: "Dec 2021", value: 1050000 },
  { date: "Mar 2022", value: 1120000 },
  { date: "Jun 2022", value: 1080000 },
  { date: "Sep 2022", value: 1210000 },
  { date: "Dec 2022", value: 1350000 },
  { date: "Mar 2023", value: 1420000 },
  { date: "Jun 2023", value: 1510000 },
  { date: "Sep 2023", value: 1580000 },
  { date: "Dec 2023", value: 1720000 },
  { date: "Mar 2024", value: 1850000 },
  { date: "Jun 2024", value: 2020000 },
  { date: "Sep 2024", value: 2280000 },
  { date: "Dec 2024", value: 2678855 },
];

/**
 * Performance statistics and metrics summary.
 *
 * Comprehensive stats showing capital growth, ROI percentages,
 * risk management metrics, and the scope of analytical coverage.
 */
export const performanceStats = {
  startingCapital: 500000,
  endingCapital: 2678855,
  totalROI: 436,
  annualROI: 107,
  peakCapitalUtilization: 165923,
  peakUtilizationPercent: 33,
  periodStart: "January 2020",
  periodEnd: "December 2024",
  yearsOfData: 15,
  metricsAnalyzed: 50,
  sportsCount: 5,
  sports: ["MLB", "NFL", "NBA", "NCAAB", "NCAAF"] as const,
};

/**
 * Type definitions for performance data
 */
export type EquityCurvePoint = {
  date: string;
  value: number;
};

export type PerformanceStats = typeof performanceStats;
export type Sport = (typeof performanceStats.sports)[number];
