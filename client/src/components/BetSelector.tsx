import { soundManager } from "@/lib/sounds";

interface BetSelectorProps {
  selectedBet: number | null;
  onSelectBet: (amount: number) => void;
  disabled?: boolean;
}

const BET_AMOUNTS = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000];

export default function BetSelector({ selectedBet, onSelectBet, disabled = false }: BetSelectorProps) {
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
            £{selectedBet.toLocaleString()}
          </span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {BET_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => {
              soundManager.playClick();
              onSelectBet(amount);
            }}
            disabled={disabled}
            data-testid={`bet-chip-${amount}`}
            className={`group relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md border-2 font-display transition-all ${
              selectedBet === amount
                ? "scale-110 border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/50"
                : "border-card-border bg-card hover-elevate active-elevate-2"
            } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <span className="text-2xl font-bold">£{formatBetAmount(amount)}</span>
          </button>
        ))}
      </div>

      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}