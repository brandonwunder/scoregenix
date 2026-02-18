"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { GameData } from "./game-card";

interface BetModalProps {
  game: GameData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type BetType = "MONEY_LINE" | "POINT_SPREAD" | "PARLAY";

function formatOdds(odds: number | null | undefined): string {
  if (odds == null) return "\u2014";
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function BetModal({ game, open, onOpenChange }: BetModalProps) {
  const [betType, setBetType] = useState<BetType>("MONEY_LINE");
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away" | null>(
    null
  );
  const [wager, setWager] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!game) return null;

  // Derive odds from game's locked data
  const getOddsForSelection = (): number | null => {
    if (!selectedTeam) return null;
    if (betType === "MONEY_LINE") {
      return selectedTeam === "home"
        ? (game.homeMoneyLine ?? null)
        : (game.awayMoneyLine ?? null);
    }
    if (betType === "POINT_SPREAD") {
      return selectedTeam === "home"
        ? (game.homeSpreadOdds ?? null)
        : (game.awaySpreadOdds ?? null);
    }
    return null;
  };

  const lockedOdds = getOddsForSelection();
  const hasOdds = game.oddsLockedAt != null;
  const displaySpread =
    game.spreadValue != null ? String(game.spreadValue) : "";

  const resetForm = () => {
    setSelectedTeam(null);
    setWager("");
    setBetType("MONEY_LINE");
  };

  const calculatePayout = (): number => {
    const wagerNum = parseFloat(wager);
    const oddsNum = lockedOdds;
    if (isNaN(wagerNum) || oddsNum == null || wagerNum <= 0) return 0;

    if (oddsNum > 0) {
      return wagerNum + wagerNum * (oddsNum / 100);
    } else {
      return wagerNum + wagerNum * (100 / Math.abs(oddsNum));
    }
  };

  const handlePlaceBet = async () => {
    if (!selectedTeam || !wager || parseFloat(wager) <= 0) {
      toast.error("Please select a team and enter a valid wager amount.");
      return;
    }

    if (!hasOdds || lockedOdds == null) {
      toast.error("Odds are not available for this game.");
      return;
    }

    setSubmitting(true);

    try {
      const teamName =
        selectedTeam === "home" ? game.homeTeam : game.awayTeam;
      const payout = calculatePayout();

      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          betType,
          wagerAmount: parseFloat(wager),
          potentialPayout: payout > 0 ? payout : undefined,
          legs: [
            {
              gameId: game.id || game.externalApiId,
              teamSelected: teamName,
              lineValue:
                betType === "POINT_SPREAD" && game.spreadValue != null
                  ? game.spreadValue
                  : undefined,
              odds: lockedOdds ?? undefined,
            },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to place bet");
      }

      toast.success("Bet placed successfully!", {
        description: `${betType.replace("_", " ")} on ${teamName} for $${parseFloat(wager).toFixed(2)}`,
      });

      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to place bet", {
        description: error.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const payout = calculatePayout();

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="border-white/10 bg-black/95 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className="text-lg text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Place a Bet
          </DialogTitle>
          <DialogDescription className="text-white/50">
            {game.sportName} &middot;{" "}
            {new Date(game.gameDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Game Summary */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {game.awayTeamLogo && (
                <Image
                  src={game.awayTeamLogo}
                  alt={game.awayTeam}
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                  unoptimized
                />
              )}
              <span className="text-sm font-medium text-white/90">
                {game.awayTeamAbbr}
              </span>
            </div>
            <span className="text-xs text-white/30">@</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white/90">
                {game.homeTeamAbbr}
              </span>
              {game.homeTeamLogo && (
                <Image
                  src={game.homeTeamLogo}
                  alt={game.homeTeam}
                  width={24}
                  height={24}
                  className="h-6 w-6 object-contain"
                  unoptimized
                />
              )}
            </div>
          </div>
        </div>

        {/* Bet Type Tabs */}
        <Tabs
          defaultValue="MONEY_LINE"
          value={betType}
          onValueChange={(v) => {
            setBetType(v as BetType);
            setSelectedTeam(null);
          }}
        >
          <TabsList className="w-full bg-white/5">
            <TabsTrigger
              value="MONEY_LINE"
              className="flex-1 text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              Money Line
            </TabsTrigger>
            <TabsTrigger
              value="POINT_SPREAD"
              className="flex-1 text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              Point Spread
            </TabsTrigger>
            <TabsTrigger
              value="PARLAY"
              className="flex-1 text-xs data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
            >
              Parlay
            </TabsTrigger>
          </TabsList>

          {/* Money Line */}
          <TabsContent value="MONEY_LINE" className="space-y-4">
            <div>
              <Label className="mb-2 block text-xs text-white/50">
                Select Winner
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeam("away")}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
                    selectedTeam === "away"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  {game.awayTeamLogo && (
                    <Image
                      src={game.awayTeamLogo}
                      alt={game.awayTeam}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                      unoptimized
                    />
                  )}
                  <span className="text-xs font-medium text-white">
                    {game.awayTeamAbbr}
                  </span>
                  {game.awayMoneyLine != null && (
                    <span className="text-[10px] text-white/40">
                      {formatOdds(game.awayMoneyLine)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTeam("home")}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
                    selectedTeam === "home"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  {game.homeTeamLogo && (
                    <Image
                      src={game.homeTeamLogo}
                      alt={game.homeTeam}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                      unoptimized
                    />
                  )}
                  <span className="text-xs font-medium text-white">
                    {game.homeTeamAbbr}
                  </span>
                  {game.homeMoneyLine != null && (
                    <span className="text-[10px] text-white/40">
                      {formatOdds(game.homeMoneyLine)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs text-white/50">
                  Odds
                </Label>
                <div className="flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-white/70">
                  {formatOdds(lockedOdds)}
                </div>
              </div>
              <div>
                <Label
                  htmlFor="ml-wager"
                  className="mb-1.5 block text-xs text-white/50"
                >
                  Wager ($)
                </Label>
                <Input
                  id="ml-wager"
                  type="number"
                  min="0"
                  step="0.01"
                  value={wager}
                  onChange={(e) => setWager(e.target.value)}
                  placeholder="100.00"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>
            </div>
          </TabsContent>

          {/* Point Spread */}
          <TabsContent value="POINT_SPREAD" className="space-y-4">
            <div>
              <Label className="mb-2 block text-xs text-white/50">
                Select Team
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeam("away")}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
                    selectedTeam === "away"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  {game.awayTeamLogo && (
                    <Image
                      src={game.awayTeamLogo}
                      alt={game.awayTeam}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                      unoptimized
                    />
                  )}
                  <span className="text-xs font-medium text-white">
                    {game.awayTeamAbbr}
                  </span>
                  {game.awaySpreadOdds != null && (
                    <span className="text-[10px] text-white/40">
                      {formatOdds(game.awaySpreadOdds)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTeam("home")}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
                    selectedTeam === "home"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  {game.homeTeamLogo && (
                    <Image
                      src={game.homeTeamLogo}
                      alt={game.homeTeam}
                      width={32}
                      height={32}
                      className="h-8 w-8 object-contain"
                      unoptimized
                    />
                  )}
                  <span className="text-xs font-medium text-white">
                    {game.homeTeamAbbr}
                  </span>
                  {game.homeSpreadOdds != null && (
                    <span className="text-[10px] text-white/40">
                      {formatOdds(game.homeSpreadOdds)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="mb-1.5 block text-xs text-white/50">
                  Spread
                </Label>
                <div className="flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-white/70">
                  {displaySpread || "\u2014"}
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-white/50">
                  Odds
                </Label>
                <div className="flex h-9 items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-white/70">
                  {formatOdds(lockedOdds)}
                </div>
              </div>
              <div>
                <Label
                  htmlFor="ps-wager"
                  className="mb-1.5 block text-xs text-white/50"
                >
                  Wager ($)
                </Label>
                <Input
                  id="ps-wager"
                  type="number"
                  min="0"
                  step="0.01"
                  value={wager}
                  onChange={(e) => setWager(e.target.value)}
                  placeholder="100.00"
                  className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
                />
              </div>
            </div>
          </TabsContent>

          {/* Parlay */}
          <TabsContent value="PARLAY">
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <div className="mb-2 text-2xl">&#128279;</div>
              <p className="text-sm font-medium text-white/70">
                Parlay Builder
              </p>
              <p className="mt-1 text-xs text-white/40">
                Add more games from the dashboard to create a parlay bet.
                Parlays require at least 2 selections.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Odds unavailable warning */}
        {!hasOdds && betType !== "PARLAY" && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
            <p className="text-xs text-yellow-400">
              Odds not yet available for this game. Bet placement is disabled.
            </p>
          </div>
        )}

        {/* Payout Preview */}
        {betType !== "PARLAY" && payout > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Potential Payout</span>
                <span className="text-lg font-bold text-emerald-400">
                  ${payout.toFixed(2)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-white/50">Profit</span>
                <span className="text-sm text-emerald-400/80">
                  +${(payout - parseFloat(wager || "0")).toFixed(2)}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Place Bet Button */}
        {betType !== "PARLAY" && (
          <Button
            onClick={handlePlaceBet}
            disabled={
              submitting ||
              !selectedTeam ||
              !wager ||
              parseFloat(wager) <= 0 ||
              !hasOdds ||
              lockedOdds == null
            }
            className="w-full bg-emerald-500 font-semibold text-black hover:bg-emerald-400 disabled:opacity-40"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                Placing Bet...
              </span>
            ) : (
              "Place Bet"
            )}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
