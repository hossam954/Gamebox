import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BetSelectorProps {
  selectedBet: number | null;
  onSelectBet: (amount: number) => void;
  disabled?: boolean;
}

const BET_AMOUNTS = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000];

export default function BetSelector({ selectedBet, onSelectBet, disabled = false }: BetSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const formatBetAmount = (amount: number) => {
    if (amount >= 1000) {
      return `${amount / 1000}K`;
    }
    return amount.toString();
  };

  return (
    <div className="w-full" data-testid="bet-selector">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Select Bet Amount
        </h3>
        {selectedBet && (
          <span className="font-mono text-sm font-semibold text-foreground" data-testid="selected-bet">
            ${selectedBet.toLocaleString()}
          </span>
        )}
      </div>

      <div className="relative">
        {canScrollLeft && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-0 top-1/2 z-10 h-20 w-8 -translate-y-1/2 rounded-r-md bg-card/95 backdrop-blur"
            onClick={() => scroll('left')}
            data-testid="button-scroll-left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        <div
          ref={scrollRef}
          className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth py-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {BET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => !disabled && onSelectBet(amount)}
              disabled={disabled}
              data-testid={`bet-chip-${amount}`}
              className={`group relative flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-md border-2 font-display transition-all ${
                selectedBet === amount
                  ? "scale-110 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/50"
                  : "border-card-border bg-card hover-elevate active-elevate-2"
              } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              <span className="text-xs font-medium">BET</span>
              <span className="text-lg font-bold">${formatBetAmount(amount)}</span>
            </button>
          ))}
        </div>

        {canScrollRight && (
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0 top-1/2 z-10 h-20 w-8 -translate-y-1/2 rounded-l-md bg-card/95 backdrop-blur"
            onClick={() => scroll('right')}
            data-testid="button-scroll-right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
