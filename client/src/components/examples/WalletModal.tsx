import { useState } from 'react';
import WalletModal from '../WalletModal';
import { Button } from '@/components/ui/button';

export default function WalletModalExample() {
  const [isOpen, setIsOpen] = useState(true);

  const mockTransactions = [
    { id: '1', type: 'win' as const, amount: 5000, timestamp: '2 minutes ago' },
    { id: '2', type: 'loss' as const, amount: 500, timestamp: '5 minutes ago' },
    { id: '3', type: 'deposit' as const, amount: 1000, timestamp: '1 hour ago' },
    { id: '4', type: 'win' as const, amount: 2500, timestamp: '2 hours ago' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Button onClick={() => setIsOpen(true)}>Open Wallet</Button>
      <WalletModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        balance={10500}
        transactions={mockTransactions}
      />
    </div>
  );
}
