'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, LayersIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { useParlay } from '@/contexts/parlay-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TeamLogo } from '@/components/ui/team-logo';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Floating Parlay Slip Component
 * Shows selected parlay legs and allows placing the combined bet
 */
export function ParlaySlip() {
  const { parlayLegs, removeLeg, clearParlay, isOpen, setIsOpen } = useParlay();
  const [wager, setWager] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate combined odds (American odds)
  const calculateCombinedOdds = (): number => {
    if (parlayLegs.length === 0) return 0;

    // Convert American odds to decimal
    const decimalOdds = parlayLegs.map((leg) => {
      if (leg.odds > 0) {
        return 1 + leg.odds / 100;
      } else {
        return 1 + 100 / Math.abs(leg.odds);
      }
    });

    // Multiply all decimal odds
    const combinedDecimal = decimalOdds.reduce((acc, odd) => acc * odd, 1);

    // Convert back to American odds
    if (combinedDecimal >= 2) {
      return Math.round((combinedDecimal - 1) * 100);
    } else {
      return Math.round(-100 / (combinedDecimal - 1));
    }
  };

  const calculatePayout = (): number => {
    const wagerNum = parseFloat(wager);
    if (isNaN(wagerNum) || wagerNum <= 0) return 0;

    const combinedOdds = calculateCombinedOdds();
    if (combinedOdds > 0) {
      return wagerNum + wagerNum * (combinedOdds / 100);
    } else {
      return wagerNum + wagerNum * (100 / Math.abs(combinedOdds));
    }
  };

  const handlePlaceParlay = async () => {
    if (parlayLegs.length < 2) {
      toast.error('Parlay requires at least 2 selections');
      return;
    }

    if (!wager || parseFloat(wager) <= 0) {
      toast.error('Please enter a valid wager amount');
      return;
    }

    setSubmitting(true);

    try {
      const payout = calculatePayout();

      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betType: 'PARLAY',
          wagerAmount: parseFloat(wager),
          potentialPayout: payout,
          legs: parlayLegs.map((leg) => ({
            gameId: leg.externalApiId,
            teamSelected: leg.teamName,
            betType: leg.betType,
            odds: leg.odds,
            lineValue: leg.lineValue,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place parlay');
      }

      toast.success(`Parlay placed successfully! Potential payout: $${payout.toFixed(2)}`);
      clearParlay();
      setWager('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error placing parlay:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place parlay');
    } finally {
      setSubmitting(false);
    }
  };

  if (parlayLegs.length === 0 && !isOpen) {
    return null;
  }

  const combinedOdds = calculateCombinedOdds();
  const payout = calculatePayout();

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {parlayLegs.length > 0 && !isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-purple-500 px-6 py-3 font-medium text-white shadow-lg shadow-purple-500/30 transition-all hover:bg-purple-600"
          >
            <LayersIcon size={20} />
            <span>Parlay ({parlayLegs.length})</span>
            {parlayLegs.length > 0 && (
              <Badge className="bg-white/20 text-white">
                {parlayLegs.length}
              </Badge>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Parlay Slip Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-white/10 bg-[#0a0a0a] shadow-2xl sm:w-[420px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2">
                <LayersIcon className="text-purple-400" size={24} />
                <h2 className="text-lg font-bold text-white">Parlay Slip</h2>
                <Badge className="bg-purple-500/20 text-purple-400">
                  {parlayLegs.length} {parlayLegs.length === 1 ? 'Leg' : 'Legs'}
                </Badge>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {parlayLegs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <LayersIcon className="mb-3 text-white/20" size={48} />
                  <p className="text-sm font-medium text-white/70">
                    No selections yet
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Add games to build your parlay
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Legs List */}
                  <div className="space-y-2">
                    {parlayLegs.map((leg, index) => (
                      <motion.div
                        key={leg.gameId}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        {/* Leg Number */}
                        <div className="absolute left-0 top-0 flex h-6 w-6 items-center justify-center rounded-br-lg bg-purple-500/20 text-[10px] font-bold text-purple-400">
                          {index + 1}
                        </div>

                        <div className="space-y-2 pl-7">
                          {/* Game Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TeamLogo
                                src={leg.teamLogo}
                                abbr={leg.teamAbbr}
                                size="sm"
                                league={leg.sportSlug}
                                showTeamColor
                              />
                              <div>
                                <p className="text-xs font-medium text-white">
                                  {leg.teamAbbr}
                                </p>
                                <p className="text-[10px] text-white/40">
                                  {leg.gameSummary}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeLeg(leg.gameId)}
                              className="rounded p-1 text-white/40 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          {/* Bet Details */}
                          <div className="flex items-center gap-2 text-[10px]">
                            <Badge
                              className={cn(
                                'text-[9px]',
                                leg.betType === 'MONEY_LINE'
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-blue-500/15 text-blue-400'
                              )}
                            >
                              {leg.betType === 'MONEY_LINE' ? 'ML' : 'Spread'}
                            </Badge>
                            {leg.lineValue && (
                              <span className="text-white/50">
                                {leg.lineValue > 0 ? '+' : ''}
                                {leg.lineValue}
                              </span>
                            )}
                            <span className="text-white/50">•</span>
                            <span className="font-medium text-white/70">
                              {leg.odds > 0 ? '+' : ''}
                              {leg.odds}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Combined Odds */}
                  <div className="rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/50">Combined Odds</span>
                      <span className="text-sm font-bold text-purple-400">
                        {combinedOdds > 0 ? '+' : ''}
                        {combinedOdds}
                      </span>
                    </div>
                  </div>

                  {/* Wager Input */}
                  <div>
                    <Label htmlFor="parlay-wager" className="mb-1.5 block text-xs text-white/50">
                      Wager Amount ($)
                    </Label>
                    <Input
                      id="parlay-wager"
                      type="number"
                      min="0"
                      step="0.01"
                      value={wager}
                      onChange={(e) => setWager(e.target.value)}
                      placeholder="100.00"
                      className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                    />
                  </div>

                  {/* Payout Preview */}
                  <AnimatePresence>
                    {payout > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden rounded-lg bg-emerald-500/10 p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/50">
                            Potential Payout
                          </span>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-400">
                              ${payout.toFixed(2)}
                            </p>
                            <p className="text-[10px] text-emerald-400/70">
                              Profit: ${(payout - parseFloat(wager)).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={clearParlay}
                      className="flex-1 border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                      disabled={submitting}
                    >
                      <Trash2 size={14} className="mr-1.5" />
                      Clear
                    </Button>
                    <Button
                      onClick={handlePlaceParlay}
                      disabled={
                        submitting ||
                        parlayLegs.length < 2 ||
                        !wager ||
                        parseFloat(wager) <= 0
                      }
                      className="flex-1 bg-purple-500 text-white hover:bg-purple-600"
                    >
                      {submitting ? 'Placing...' : 'Place Parlay'}
                    </Button>
                  </div>

                  {parlayLegs.length < 2 && (
                    <p className="text-center text-xs text-yellow-400/70">
                      Add at least one more selection to place a parlay
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
    </>
  );
}
