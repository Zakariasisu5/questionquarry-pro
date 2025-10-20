import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'qq:authPromptDismissed';

export default function AuthPrompt() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (user) {
      // If the user signs in, hide the prompt permanently for this session
      setDismissed(true);
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
    }
  }, [user]);

  if (loading || user || dismissed) return null;

  return (
    <div className="fixed right-4 bottom-6 z-50">
      <Card className="p-4 w-80 shadow-lg">
        <p className="text-sm font-medium">Welcome to UDS Study Hub.</p>
        <p className="text-xs text-muted-foreground mt-1 mb-3">Sign in to upload, download, and bookmark resources.</p>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => navigate('/auth')}>Sign in / Sign up</Button>
          <Button variant="ghost" onClick={() => { setDismissed(true); try { localStorage.setItem(STORAGE_KEY, '1'); } catch {} }}>Dismiss</Button>
        </div>
      </Card>
    </div>
  );
}
