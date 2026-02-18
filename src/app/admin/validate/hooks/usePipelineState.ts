import { useMemo } from 'react';

interface UploadRow {
  validationReceipt?: Array<{
    pass: string;
    result: string;
  }> | null;
}

interface PassState {
  passName: string;
  passKey: string;
  progress: number;
  passed: number;
  failed: number;
  warnings: number;
  total: number;
}

export function usePipelineState(rows: UploadRow[]): PassState[] {
  return useMemo(() => {
    const passes = [
      { passKey: 'game_matching', passName: 'Game Matching' },
      { passKey: 'outcome_validation', passName: 'Outcome Validation' },
      { passKey: 'financial_validation', passName: 'Financial Check' },
      { passKey: 'cross_row_validation', passName: 'Cross-Row Analysis' },
    ];

    return passes.map(({ passKey, passName }) => {
      const total = rows.length;
      let passed = 0;
      let failed = 0;
      let warnings = 0;

      rows.forEach((row) => {
        if (!row.validationReceipt) return;

        const passResult = row.validationReceipt.find((r) => r.pass === passKey);
        if (!passResult) return;

        if (passResult.result === 'pass') passed++;
        else if (passResult.result === 'fail') failed++;
        else if (passResult.result === 'warning') warnings++;
      });

      const progress = total > 0 ? ((passed + warnings) / total) * 100 : 0;

      return {
        passName,
        passKey,
        progress,
        passed,
        failed,
        warnings,
        total,
      };
    });
  }, [rows]);
}
