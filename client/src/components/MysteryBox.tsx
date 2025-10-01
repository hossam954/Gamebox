import { useState } from "react";
import { Gift, Sparkles } from "lucide-react";

interface MysteryBoxProps {
  isOpening: boolean;
  isOpen: boolean;
  prize?: number | null;
}

export default function MysteryBox({ isOpening, isOpen, prize }: MysteryBoxProps) {
  return (
    <div className="relative flex flex-col items-center justify-center" data-testid="mystery-box">
      <div className="relative">
        {!isOpen && (
          <div
            className={`relative flex h-64 w-64 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-8 ${
              isOpening ? "animate-shake" : "animate-float"
            } ${!isOpening ? "animate-glow" : ""}`}
          >
            <div className="absolute inset-0 rounded-lg border-2 border-primary/30" />
            <Gift className="h-32 w-32 text-primary" strokeWidth={1.5} />
            {!isOpening && (
              <Sparkles className="absolute -right-4 -top-4 h-8 w-8 animate-pulse text-warning" />
            )}
          </div>
        )}

        {isOpening && !isOpen && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-48 w-48 animate-spin-slow rounded-full border-4 border-primary/20 border-t-primary" />
          </div>
        )}

        {isOpen && prize !== undefined && (
          <div className="flex h-64 w-64 animate-scale-in flex-col items-center justify-center rounded-lg bg-gradient-to-br from-card to-card/50 p-8">
            {prize === null || prize === 0 ? (
              <div className="text-center">
                <div className="mb-4 text-6xl">😢</div>
                <p className="text-xl font-semibold text-muted-foreground">Better luck next time!</p>
              </div>
            ) : (
              <div className="text-center">
                <div className="mb-2 font-display text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  You Won
                </div>
                <div
                  className={`mb-4 font-display text-7xl font-bold ${
                    prize >= 1000
                      ? "text-warning"
                      : prize >= 100
                      ? "text-success"
                      : "text-primary"
                  }`}
                  data-testid="prize-multiplier"
                >
                  {prize}x
                </div>
                <div className="flex gap-2">
                  <Sparkles className="h-6 w-6 animate-pulse text-warning" />
                  <Sparkles className="h-6 w-6 animate-pulse text-warning delay-100" />
                  <Sparkles className="h-6 w-6 animate-pulse text-warning delay-200" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isOpening && (
        <p className="mt-6 animate-pulse font-display text-lg font-medium text-primary">
          Opening your mystery box...
        </p>
      )}
    </div>
  );
}
