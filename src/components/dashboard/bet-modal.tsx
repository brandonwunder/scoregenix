"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { LayersIcon, AlertCircle, RefreshCwIcon, LoaderIcon } from "lucide-react";
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
import { useParlay } from "@/contexts/parlay-context";
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

function formatSpread(spread: number | null | undefined): string {
  if (spread == null) return "\u2014";
  return spread > 0 ? `+${spread}` : `${spread}`;
}

function formatLockedTime(timestamp: string | null | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function BetModal({ game, open, onOpenChange }: BetModalProps) {
  const [betType, setBetType] = useState<BetType>("MONEY_LINE");
  const [selectedTeam, setSelectedTeam] = useState<"home" | "away" | null>(
    null
  );
  const [wager, setWager] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isRefreshingOdds, setIsRefreshingOdds] = useState(false);
  const { addLeg, hasLeg } = useParlay();

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

  const handleRefreshOdds = async () => {
    setIsRefreshingOdds(true);
    try {
      const res = await fetch("/api/odds/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: game.id }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.game?.oddsLockedAt) {
          toast.success("Odds updated successfully!", {
            description: data.message || "Odds are now available for betting",
          });
          // Trigger parent refresh to update game data
          onOpenChange(false);
          window.location.reload();
        } else {
          toast.warning("Odds still not available", {
            description:
              data.message ||
              "The odds provider hasn't posted odds for this game yet. Try again closer to game time.",
          });
        }
      } else {
        toast.error("Failed to refresh odds", {
          description:
            data.error ||
            data.details ||
            "Please check your API key configuration",
        });
      }
    } catch (error) {
      toast.error("Network error while refreshing odds", {
        description: "Please check your connection and try again",
      });
      console.error("Refresh odds error:", error);
    } finally {
      setIsRefreshingOdds(false);
    }
  };

  const handleAddToParlay = () => {
    if (!selectedTeam || !hasOdds || lockedOdds == null) {
      toast.error("Please select a team with valid odds");
      return;
    }

    // Only MONEY_LINE and POINT_SPREAD can be parlay legs
    if (betType === "PARLAY") {
      toast.error("Cannot add parlay to parlay");
      return;
    }

    const teamName = selectedTeam === "home" ? game.homeTeam : game.awayTeam;
    const teamAbbr = selectedTeam === "home" ? game.homeTeamAbbr : game.awayTeamAbbr;
    const teamLogo = selectedTeam === "home" ? game.homeTeamLogo : game.awayTeamLogo;

    addLeg({
      gameId: game.id || game.externalApiId,
      externalApiId: game.externalApiId,
      teamSelected: selectedTeam,
      teamName,
      teamAbbr,
      teamLogo,
      betType: betType as "MONEY_LINE" | "POINT_SPREAD", // Safe because we checked !== PARLAY above
      odds: lockedOdds,
      lineValue: betType === "POINT_SPREAD" ? game.spreadValue ?? undefined : undefined,
      gameSummary: `${game.awayTeamAbbr} @ ${game.homeTeamAbbr}`,
      gameDate: game.gameDate,
      sportName: game.sportName,
      sportSlug: game.sportSlug,
    });

    toast.success(`Added ${teamName} to parlay`);
    resetForm();
    onOpenChange(false);
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

        {/* Vegas Odds Reference Section */}
        {hasOdds && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-white/50">Vegas Line</Label>
              <Badge className="bg-white/10 text-white/70 text-[10px]">
                Locked {formatLockedTime(game.oddsLockedAt)}
              </Badge>
            </div>

            {/* Money Line Display */}
            <div>
              <div className="mb-1.5 text-[10px] uppercase tracking-wider text-white/40">
                Money Line
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-xs font-medium text-white/90">
                    {game.awayTeamAbbr}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {formatOdds(game.awayMoneyLine)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
                  <span className="text-xs font-medium text-white/90">
                    {game.homeTeamAbbr}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {formatOdds(game.homeMoneyLine)}
                  </span>
                </div>
              </div>
            </div>

            {/* Point Spread Display */}
            {game.spreadValue != null && (
              <div>
                <div className="mb-1.5 text-[10px] uppercase tracking-wider text-white/40">
                  Point Spread
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-xs font-medium text-white/90">
                      {game.awayTeamAbbr}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {formatSpread(-Number(game.spreadValue))} ({formatOdds(game.awaySpreadOdds)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <span className="text-xs font-medium text-white/90">
                      {game.homeTeamAbbr}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {formatSpread(game.spreadValue)} ({formatOdds(game.homeSpreadOdds)})
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
          <div className="space-y-3">
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3">
              <div className="flex items-start gap-2 text-sm text-yellow-200/90">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium mb-1">Odds Not Available Yet</p>
                  <p className="text-xs text-yellow-200/70">
                    Vegas typically posts odds 1-3 days before game time. Click below
                    to check if odds are available now.
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleRefreshOdds}
              disabled={isRefreshingOdds}
            >
              {isRefreshingOdds ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Checking for odds...
                </>
              ) : (
                <>
                  <RefreshCwIcon className="mr-2 h-4 w-4" />
                  Check for Odds Now
                </>
              )}
            </Button>
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

        {/* Action Buttons */}
        {betType !== "PARLAY" && (
          <div className="flex gap-2">
            <Button
              onClick={handleAddToParlay}
              disabled={
                !selectedTeam ||
                !hasOdds ||
                lockedOdds == null
              }
              variant="outline"
              className="flex-1 border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300"
            >
              <LayersIcon size={16} className="mr-1.5" />
              Add to Parlay
            </Button>
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
              className="flex-1 bg-emerald-500 font-semibold text-black hover:bg-emerald-400 disabled:opacity-40"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                  Placing...
                </span>
              ) : (
                "Place Bet"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
