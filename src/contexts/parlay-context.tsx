'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';

export interface ParlayLeg {
  gameId: string;
  externalApiId: string;
  teamSelected: 'home' | 'away';
  teamName: string;
  teamAbbr: string;
  teamLogo: string;
  betType: 'MONEY_LINE' | 'POINT_SPREAD';
  odds: number;
  lineValue?: number;
  gameSummary: string; // "PHI @ KC"
  gameDate: string;
  sportName: string;
  sportSlug: string;
}

interface ParlayContextType {
  parlayLegs: ParlayLeg[];
  addLeg: (leg: ParlayLeg) => void;
  removeLeg: (gameId: string) => void;
  clearParlay: () => void;
  hasLeg: (gameId: string) => boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ParlayContext = createContext<ParlayContextType | undefined>(undefined);

export function ParlayProvider({ children }: { children: ReactNode }) {
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addLeg = useCallback((leg: ParlayLeg) => {
    setParlayLegs((current) => {
      // Check if leg for this game already exists
      const existingIndex = current.findIndex((l) => l.gameId === leg.gameId);

      if (existingIndex >= 0) {
        // Replace existing leg with new selection
        const updated = [...current];
        updated[existingIndex] = leg;
        toast.success(`Updated ${leg.gameSummary} in parlay slip`);
        return updated;
      }

      // Add new leg
      toast.success(`Added ${leg.gameSummary} to parlay slip`);
      return [...current, leg];
    });
  }, []);

  const removeLeg = useCallback((gameId: string) => {
    setParlayLegs((current) => {
      const leg = current.find((l) => l.gameId === gameId);
      if (leg) {
        toast.info(`Removed ${leg.gameSummary} from parlay slip`);
      }
      return current.filter((l) => l.gameId !== gameId);
    });
  }, []);

  const clearParlay = useCallback(() => {
    setParlayLegs([]);
    toast.info('Parlay slip cleared');
  }, []);

  const hasLeg = useCallback(
    (gameId: string) => {
      return parlayLegs.some((l) => l.gameId === gameId);
    },
    [parlayLegs]
  );

  return (
    <ParlayContext.Provider
      value={{
        parlayLegs,
        addLeg,
        removeLeg,
        clearParlay,
        hasLeg,
        isOpen,
        setIsOpen,
      }}
    >
      {children}
    </ParlayContext.Provider>
  );
}

export function useParlay() {
  const context = useContext(ParlayContext);
  if (context === undefined) {
    throw new Error('useParlay must be used within a ParlayProvider');
  }
  return context;
}
