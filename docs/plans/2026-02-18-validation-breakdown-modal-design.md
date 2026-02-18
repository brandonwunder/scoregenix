# Validation Breakdown Modal Design

## Overview

Add a "Validation Breakdown" help modal to the admin validation page that explains the entire validation process in an easy-to-understand way. The admin needs to understand the complex validation pipeline before going live, and this modal will serve as both a learning tool and a reference guide.

## User Goals

1. **Understand the validation pipeline** - Know what happens from upload to betting history
2. **Learn status meanings** - Understand CORRECT, FLAGGED, UNCERTAIN, CORRECTED badges
3. **Cross-reference before launch** - Verify the system works as expected
4. **Quick reference** - Look up specific information during daily use

## Design Decisions

### Content Approach
- **Linear storytelling flow** - Walk through the journey of a spreadsheet from upload → normalization → validation → import → betting history
- **Progressive disclosure** - High-level overview by default, with "Show details" links that expand to reveal technical depth
- **Visual-first** - Flow diagram at top + icons/badges throughout for consistency with existing UI

### Placement
- Help icon button in the page header next to "Data Validation" title
- Always visible, doesn't interfere with workflow
- Opens large modal (`sm:max-w-4xl`) with scrollable content

### Status Explanation Strategy
- Inline mentions during the flow narrative
- Dedicated status reference table at the end for quick lookup

## Component Architecture

### File Structure
```
src/components/admin/
  └── ValidationBreakdownModal.tsx  (new)

src/app/admin/validate/
  └── page.tsx  (modified - add button + modal)
```

### Component API
```typescript
interface ValidationBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ValidationBreakdownModal({
  open,
  onOpenChange
}: ValidationBreakdownModalProps)
```

### State Management
```typescript
const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

function toggleSection(sectionId: string) {
  setExpandedSections(prev => {
    const next = new Set(prev);
    if (next.has(sectionId)) {
      next.delete(sectionId);
    } else {
      next.add(sectionId);
    }
    return next;
  });
}
```

## Modal Structure

### Header (Fixed)
- Title: "How Validation Works"
- Subtitle: "Understanding the validation pipeline from upload to betting history"
- Close button (X icon)

### Content (Scrollable)

#### 1. Visual Flow Diagram
A horizontal flow showing the pipeline stages:

```
[Upload] → [Normalize] → [Validate] → [Review] → [Import] → [Betting History]
            (4 passes)
```

Visual representation:
- Arrows with icons between each stage
- Color-coded: Upload (blue) → Normalize (purple) → Validate (emerald) → Review (amber) → Import (blue) → History (emerald)
- Icons: UploadIcon, RefreshCwIcon, ShieldCheckIcon, PenLineIcon, ImportIcon, CheckCircle2Icon

#### 2. Main Content Sections

##### **Section 1: Upload & File Processing**

**High-level (always visible):**
> When you upload a spreadsheet (.xlsx, .csv, .xls), we parse the file and extract your betting data. We accept any spreadsheet format - column names don't need to be exact.

**Details (expandable):**
- File size limit: 10MB
- Row limit: 5,000 rows per file
- Supported formats: Excel (.xlsx, .xls), CSV (.csv)
- We extract: date, sport, teams, bet type, selected team, line, odds, outcome, wager, payout
- Excel serial dates are automatically converted to readable dates
- Numbers with $, commas, or parentheses are cleaned automatically

---

##### **Section 2: Normalization**

**High-level:**
> Before validation, we normalize your data to handle different spreadsheet formats. For example, "ML", "moneyline", and "money line" all become "Money Line". This ensures consistency.

**Details:**
- **Bet Types**: "spread", "ATS", "pts" → Point Spread | "ML", "moneyline" → Money Line | "O/U", "total" → Over/Under
- **Outcomes**: "W", "Won", "Win" → WON | "L", "Lost", "Lose" → LOST | "Push", "Tie", "Draw" → PUSH | "Void", "Cancelled" → VOID
- **Odds Formats**: Detects American (-110, +150) vs Decimal (1.91, 2.50) and converts to American
- **Sports**: Maps 25+ sport variants to canonical names (NFL, NBA, MLB, NHL, MLS, NCAAF, NCAAB)
- **Column Detection**: Uses header names + value patterns to auto-detect columns
- If normalization finds issues, they're logged as warnings

---

##### **Section 3: Validation (4 Passes)**

**High-level:**
> Every row goes through 4 validation passes. If all passes succeed, the row is marked CORRECT ✅. If checks fail, it's FLAGGED ⚠️. If we can't verify due to missing data, it's UNCERTAIN ❓.

**Details:**

**Pass 1: Game Matching**
- Resolves team names using fuzzy matching (handles "Lakers", "LA Lakers", "Los Angeles Lakers")
- Confidence scoring: Must be >0.7 to proceed (1.0 = exact match, 0.7 = good fuzzy match, <0.7 = too uncertain)
- Looks up game in our database by teams + date (using Eastern timezone)
- If game not found, syncs from ESPN API in real-time
- Verifies your selected team is actually one of the two teams in the game
- Creates a frozen snapshot of ESPN data at validation time
- **Uncertain reasons**: NO_GAME_MATCH, GAME_NOT_FINAL, LOW_CONFIDENCE_TEAM, ESPN_FETCH_FAILED, MULTIPLE_GAME_MATCHES, TEAM_NOT_IN_GAME

**Pass 2: Outcome Validation**
- Only runs if game is FINAL with scores
- Uses the same outcome logic as the betting system (handles ties, spreads, pushes correctly)
- **Money Line**: Compares your team's score to opponent's score
- **Point Spread**: Applies the spread to determine winner (e.g., Lakers -5.5 needs to win by 6+)
- **Over/Under**: Adds both scores and compares to the line
- Compares calculated outcome to your reported outcome
- If mismatch: row is FLAGGED with error-level validation flag
- **Records the math** in validation receipt so you can see the calculation

**Pass 3: Financial Validation**
- Calculates expected payout from wager + odds using betting formulas
- Compares to your reported payout (allows 2% tolerance for rounding)
- Cross-checks your odds against game's locked odds from Odds API
- Flags negative wagers, payouts on losing bets, unreasonable odds ranges
- **Severity levels**: Error (outcome wrong), Warning (payout mismatch), Info (odds differ from market)

**Pass 4: Cross-Row Checks**
- **Duplicate detection**: Same date + teams + selected team + bet type + wager = likely duplicate
- **Score consistency**: If multiple rows reference the same game, checks they don't imply conflicting scores
- Returns warnings, doesn't fail validation

---

##### **Section 4: Manual Review & Corrections**

**High-level:**
> After validation, you can review rows and manually correct any flagged issues. Your corrections are saved separately - we never overwrite the original uploaded data.

**Details:**
- **FLAGGED rows**: Click to expand, see what's wrong, manually correct the values
- **UNCERTAIN rows**: Wait for games to finish, then hit "Re-validate" to check again
- **Corrections**: Saved to `correctedValue` field (original data stays in `originalValue`)
- **Validation Receipt**: Every row shows a proof chain with timestamps and pass results
- **Field Confidence**: See confidence scores (0-1) for team matching, sport detection, etc.
- Once corrected, row becomes CORRECTED (blue badge) and is ready to import

---

##### **Section 5: Import to Betting History**

**High-level:**
> When validation is complete, click "Import" to create Bet records in your betting history. These become your personal bets in the dashboard. Only CORRECT and CORRECTED rows are imported.

**Details:**
- Pre-import validation checks which rows are ready (must have matched game, valid outcome)
- Shows summary: ready count, total wager, outcome breakdown (W/L/P)
- Creates `Bet` + `BetLeg` records for each row
- Uses corrected data if available, otherwise normalized data, otherwise original data
- Sets bet status from validated outcome (WON/LOST/PUSH)
- Sets `placedAt` and `settledAt` to game date (historical bets)
- Auto-assigns to your admin user account
- Adds note: "Imported from upload {fileName}, row {N}"
- All-or-nothing transaction: if any row fails, entire import is rolled back
- After import, upload status changes to IMPORTED
- **Rollback**: You can rollback an import to delete all created bets and reset the upload

#### 3. Status Reference Table

A table showing all status badges with meanings and actions:

| Status | Badge Color | Meaning | What To Do |
|--------|-------------|---------|------------|
| CORRECT | Green (emerald) | All validation passes succeeded, outcome matches ESPN data | Ready to import |
| FLAGGED | Amber/Orange | Validation found errors (wrong outcome, data mismatch) | Review and manually correct |
| UNCERTAIN | Gray/White | Can't verify yet (game in progress, low confidence match, missing data) | Wait and re-validate, or manually correct |
| CORRECTED | Blue | You manually corrected this row | Ready to import |

### Footer (Fixed)
- Primary button: "Got it" (closes modal)

## Visual Design

### Color Scheme (Dark Theme)
- Modal background: `bg-zinc-900`
- Border: `border-white/10`
- Text: `text-white` (headings), `text-white/70` (body), `text-white/40` (muted)
- Section backgrounds: `bg-white/[0.02]` for subtle separation
- Expandable sections: `border border-white/10` with `bg-white/5` on hover

### Icons (from lucide-react)
- Upload: `UploadIcon`
- Normalize: `RefreshCwIcon`
- Validate: `ShieldCheckIcon`
- Review: `PenLineIcon`
- Import: `ImportIcon`
- Success: `CheckCircle2Icon`
- Warning: `AlertTriangleIcon`
- Info: `HelpCircleIcon`
- Expand/Collapse: `ChevronDownIcon` / `ChevronUpIcon`

### Status Badge Styles
Match existing badge styles from validate page:
- CORRECT: `bg-emerald-500/15 text-emerald-400`
- FLAGGED: `bg-amber-500/15 text-amber-400`
- UNCERTAIN: `bg-white/10 text-white/50`
- CORRECTED: `bg-blue-500/15 text-blue-400`

### Typography
- Modal title: `text-xl font-semibold` with Space Grotesk font
- Section headers: `text-base font-medium`
- Body text: `text-sm`
- Details text: `text-xs text-white/60`

### Expandable Section Pattern
```tsx
<div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
  <button
    onClick={() => toggleSection('section-id')}
    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
  >
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-emerald-400" />
      <div>
        <h3 className="text-base font-medium text-white">Section Title</h3>
        <p className="text-sm text-white/60 mt-0.5">High-level description always visible</p>
      </div>
    </div>
    <ChevronDownIcon className={cn("h-4 w-4 text-white/40 transition-transform", expanded && "rotate-180")} />
  </button>

  {expanded && (
    <div className="px-4 pb-4 pt-2 space-y-3 border-t border-white/5">
      <p className="text-xs text-white/60">Detailed technical content...</p>
      <ul className="space-y-2 text-xs text-white/50">
        <li>• Bullet point details</li>
      </ul>
    </div>
  )}
</div>
```

## Integration with Validate Page

### Button Placement
Add to the header section (around line 1189-1198):

```tsx
<div className="mb-8 flex items-start justify-between">
  <div>
    <h1 className="text-3xl font-bold text-white sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      Data Validation
    </h1>
    <p className="mt-1 text-sm text-white/50">
      Upload, validate, and import your betting data spreadsheets
    </p>
  </div>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setBreakdownModalOpen(true)}
    className="text-white/60 hover:text-white/90 hover:bg-white/5"
  >
    <HelpCircleIcon className="h-4 w-4 mr-2" />
    How It Works
  </Button>
</div>
```

### State Management
Add to validate page state:
```tsx
const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
```

### Modal Usage
At the bottom of the validate page (before closing PageShell):
```tsx
<ValidationBreakdownModal
  open={breakdownModalOpen}
  onOpenChange={setBreakdownModalOpen}
/>
```

## Content Writing Principles

1. **Start with "why"** - Explain the purpose before the technical details
2. **Use examples** - "ML", "moneyline" → "Money Line" not just "bet types are normalized"
3. **Active voice** - "We check the outcome" not "The outcome is checked"
4. **Concrete numbers** - "10MB limit" not "reasonable file size"
5. **Visual hierarchy** - Icons, headings, spacing to break up text
6. **Avoid jargon** - "Fuzzy matching" → "handles similar team names"
7. **Show consequences** - "If X happens, then Y" (e.g., "If game is in progress → UNCERTAIN status")

## Success Metrics

This modal is successful if:
1. Admin can explain the validation process to someone else after reading it
2. Admin knows what each status badge means and what action to take
3. Admin feels confident about data accuracy before going live
4. Modal serves as a quick reference during daily use (e.g., "Why is this row UNCERTAIN?")

## Technical Notes

- No external dependencies beyond existing lucide-react, Dialog component
- All content is hardcoded (no markdown parsing, no data fetching)
- Fully responsive (flow diagram stacks vertically on mobile)
- Keyboard accessible (Esc to close, Tab navigation)
- Uses existing Dialog component from shadcn/ui
- Estimated component size: ~350-400 lines
