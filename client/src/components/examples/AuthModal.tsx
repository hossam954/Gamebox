import { useState } from 'react';
import AuthModal from '../AuthModal';
import { Button } from '@/components/ui/button';

export default function AuthModalExample() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Button onClick={() => setIsOpen(true)}>Open Auth Modal</Button>
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onLogin={(usernameOrEmail, password) => {
          console.log('Login:', usernameOrEmail, password);
          setIsOpen(false);
        }}
        onRegister={(username, email, password) => {
          console.log('Register:', username, email, password);
          setIsOpen(false);
        }}
      />
    </div>
  );
}
