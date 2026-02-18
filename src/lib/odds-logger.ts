// src/lib/odds-logger.ts

interface OddsLogEntry {
  timestamp: string;
  sport: string;
  action: string;
  success: boolean;
  gamesUpdated?: number;
  gamesTotal?: number;
  error?: string;
}

class OddsLogger {
  private logs: OddsLogEntry[] = [];
  private readonly MAX_LOGS = 100;

  log(entry: Omit<OddsLogEntry, "timestamp">) {
    const logEntry: OddsLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(0, this.MAX_LOGS);
    }

    // Console output with emoji
    const emoji = entry.success ? "✅" : "❌";
    const msg = entry.success
      ? `${emoji} [${entry.sport}] ${entry.action}: ${entry.gamesUpdated || 0}/${entry.gamesTotal || 0} games`
      : `${emoji} [${entry.sport}] ${entry.action} failed: ${entry.error}`;

    console.log(msg);
  }

  getRecentLogs(count: number = 20): OddsLogEntry[] {
    return this.logs.slice(0, count);
  }

  getFailures(): OddsLogEntry[] {
    return this.logs.filter((log) => !log.success);
  }
}

export const oddsLogger = new OddsLogger();
