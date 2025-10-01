import { useState } from 'react';
import BetSelector from '../BetSelector';

export default function BetSelectorExample() {
  const [selectedBet, setSelectedBet] = useState<number | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-2xl">
        <BetSelector
          selectedBet={selectedBet}
          onSelectBet={(amount) => {
            console.log('Selected bet:', amount);
            setSelectedBet(amount);
          }}
        />
      </div>
    </div>
  );
}
