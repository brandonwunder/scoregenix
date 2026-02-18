"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface GameData {
  id?: string;
  externalApiId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  gameDate: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "FINAL" | "POSTPONED" | "CANCELLED";
  homeScore: number | null;
  awayScore: number | null;
  sportName: string;
  sportSlug: string;
  sportCategory: string;
  homeMoneyLine?: number | null;
  awayMoneyLine?: number | null;
  spreadValue?: number | null;
  homeSpreadOdds?: number | null;
  awaySpreadOdds?: number | null;
  oddsLockedAt?: string | null;
}

interface GameCardProps {
  game: GameData;
  index: number;
  onClick: () => void;
}

function TeamLogo({
  src,
  abbr,
  alt,
}: {
  src: string;
  abbr: string;
  alt: string;
}) {
  return (
    <div className="relative h-10 w-10 shrink-0">
      <Image
        src={src}
        alt={alt}
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = "flex";
        }}
      />
      <div
        className="absolute inset-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white"
        style={{ display: "none" }}
      >
        {abbr}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: GameData["status"] }) {
  const config = {
    SCHEDULED: { label: "Scheduled", className: "bg-white/10 text-white/70" },
    IN_PROGRESS: {
      label: "Live",
      className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    FINAL: { label: "Final", className: "bg-white/5 text-white/50" },
    POSTPONED: {
      label: "Postponed",
      className: "bg-yellow-500/20 text-yellow-400",
    },
    CANCELLED: {
      label: "Cancelled",
      className: "bg-red-500/20 text-red-400",
    },
  };

  const { label, className } = config[status] || config.SCHEDULED;

  return (
    <Badge className={cn("text-[10px] uppercase tracking-wider", className)}>
      {status === "IN_PROGRESS" && (
        <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      )}
      {label}
    </Badge>
  );
}

export function GameCard({ game, index, onClick }: GameCardProps) {
  const gameTime = new Date(game.gameDate).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const showScore =
    game.status === "IN_PROGRESS" || game.status === "FINAL";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-emerald-500/30 hover:bg-white/[0.08]"
    >
      {/* Top row: sport badge + status + time */}
      <div className="mb-3 flex items-center justify-between">
        <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px] uppercase tracking-wider">
          {game.sportName}
        </Badge>
        <StatusBadge status={game.status} />
      </div>

      {/* Teams section */}
      <div className="space-y-3">
        {/* Away team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo
              src={game.awayTeamLogo}
              abbr={game.awayTeamAbbr}
              alt={game.awayTeam}
            />
            <div>
              <p className="text-sm font-medium text-white">
                {game.awayTeam}
              </p>
              <p className="text-[11px] text-white/40">{game.awayTeamAbbr}</p>
            </div>
          </div>
          {showScore && (
            <span
              className={cn(
                "text-xl font-bold tabular-nums",
                game.status === "FINAL" &&
                  game.awayScore !== null &&
                  game.homeScore !== null &&
                  game.awayScore > game.homeScore
                  ? "text-emerald-400"
                  : "text-white/80"
              )}
            >
              {game.awayScore ?? "-"}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-medium text-white/30">VS</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Home team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamLogo
              src={game.homeTeamLogo}
              abbr={game.homeTeamAbbr}
              alt={game.homeTeam}
            />
            <div>
              <p className="text-sm font-medium text-white">
                {game.homeTeam}
              </p>
              <p className="text-[11px] text-white/40">{game.homeTeamAbbr}</p>
            </div>
          </div>
          {showScore && (
            <span
              className={cn(
                "text-xl font-bold tabular-nums",
                game.status === "FINAL" &&
                  game.homeScore !== null &&
                  game.awayScore !== null &&
                  game.homeScore > game.awayScore
                  ? "text-emerald-400"
                  : "text-white/80"
              )}
            >
              {game.homeScore ?? "-"}
            </span>
          )}
        </div>
      </div>

      {/* Bottom row: game time */}
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-xs text-white/40">{gameTime}</span>
        <span className="text-xs text-emerald-400/70 opacity-0 transition-opacity group-hover:opacity-100">
          Place Bet &rarr;
        </span>
      </div>
    </motion.div>
  );
}
