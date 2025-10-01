import { useState } from 'react';
import MysteryBox from '../MysteryBox';
import { Button } from '@/components/ui/button';

export default function MysteryBoxExample() {
  const [state, setState] = useState<'closed' | 'opening' | 'won' | 'lost'>('closed');
  const [prize, setPrize] = useState<number | null>(null);

  const handleOpen = () => {
    setState('opening');
    setTimeout(() => {
      const randomPrize = Math.random() > 0.3 ? Math.floor(Math.random() * 5000) + 1 : null;
      setPrize(randomPrize);
      setState(randomPrize ? 'won' : 'lost');
    }, 3000);
  };

  const handleReset = () => {
    setState('closed');
    setPrize(null);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-8">
      <MysteryBox
        isOpening={state === 'opening'}
        isOpen={state === 'won' || state === 'lost'}
        prize={prize}
      />
      <div className="flex gap-4">
        <Button onClick={handleOpen} disabled={state !== 'closed'}>
          Open Box
        </Button>
        <Button onClick={handleReset} variant="outline">
          Reset
        </Button>
      </div>
    </div>
  );
}
