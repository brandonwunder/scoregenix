import { useMemo } from 'react';

interface UploadRow {
  validationStatus: 'CORRECT' | 'FLAGGED' | 'UNCERTAIN' | 'CORRECTED';
  fieldConfidence?: Array<{ field: string; confidence: number }>;
  uncertainReasons?: string[];
}

interface ValidationStats {
  total: number;
  correct: number;
  flagged: number;
  uncertain: number;
  corrected: number;
  successRate: number;
  avgConfidence: number;
  topUncertainReasons: Array<{ reason: string; count: number }>;
}

export function useValidationStats(rows: UploadRow[]): ValidationStats {
  return useMemo(() => {
    const total = rows.length;

    const counts = rows.reduce((acc, r) => {
      acc[r.validationStatus] = (acc[r.validationStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const correct = counts.CORRECT || 0;
    const flagged = counts.FLAGGED || 0;
    const uncertain = counts.UNCERTAIN || 0;
    const corrected = counts.CORRECTED || 0;

    const successRate = total > 0 ? ((correct + corrected) / total) * 100 : 0;

    // Calculate average confidence
    const confidenceScores = rows
      .flatMap((r) => r.fieldConfidence || [])
      .map((fc) => fc.confidence);
    const avgConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((sum, c) => sum + c, 0) / confidenceScores.length
        : 0;

    // Get top uncertain reasons
    const reasonCounts = new Map<string, number>();
    rows.forEach((r) => {
      if (r.uncertainReasons) {
        r.uncertainReasons.forEach((reason) => {
          reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
        });
      }
    });

    const topUncertainReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      total,
      correct,
      flagged,
      uncertain,
      corrected,
      successRate,
      avgConfidence: avgConfidence * 100,
      topUncertainReasons,
    };
  }, [rows]);
}
