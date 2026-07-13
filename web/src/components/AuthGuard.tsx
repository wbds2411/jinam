import { useEffect, useState, type FormEvent } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { Button } from './Button.js';
import { Card } from './Card.js';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { pinHash, credential, authenticated, lockedUntil, setPin, authenticate, lock } = useAuthStore();
  const [pin, setPinInput] = useState('');
  const [error, setError] = useState('');
  const hasPin = Boolean(credential || pinHash);

  useEffect(() => {
    if (!authenticated) return;
    let idleTimer = window.setTimeout(lock, 15 * 60_000);
    const resetIdleTimer = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(lock, 15 * 60_000);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') lock();
    };
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetIdleTimer, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearTimeout(idleTimer);
      events.forEach(event => window.removeEventListener(event, resetIdleTimer));
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [authenticated, lock]);

  const submitNewPin = async (event: FormEvent) => {
    event.preventDefault();
    if (pin.length < 4) {
      setError('PIN을 4자리 이상 입력하세요.');
      return;
    }
    setError('');
    await setPin(pin);
  };

  const submitUnlock = async (event: FormEvent) => {
    event.preventDefault();
    const remainingSeconds = Math.ceil((lockedUntil - Date.now()) / 1000);
    if (remainingSeconds > 0) {
      setError(`${remainingSeconds}초 후 다시 시도하세요.`);
      return;
    }
    const valid = await authenticate(pin);
    if (!valid) {
      const seconds = Math.ceil((useAuthStore.getState().lockedUntil - Date.now()) / 1000);
      setError(seconds > 0 ? `${seconds}초 후 다시 시도하세요.` : 'PIN이 올바르지 않습니다.');
      setPinInput('');
    }
  };

  if (!hasPin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-4 dark:bg-ink">
        <Card className="w-full max-w-sm space-y-4">
          <h1 className="font-display text-xl font-bold">결정의 나침반</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            생년월일·건강 등 민감 정보를 보호할 PIN을 설정하세요.
          </p>
          <form className="space-y-4" onSubmit={submitNewPin}>
            <label className="sr-only" htmlFor="new-pin">새 PIN</label>
            <input
              id="new-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={pin}
              onChange={(event) => setPinInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="4~6자리 숫자"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest focus:border-fire focus:outline-none dark:border-gray-600 dark:bg-gray-800"
            />
            <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-700">{error}</p>
            <Button type="submit" className="w-full">PIN 설정</Button>
          </form>
        </Card>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-4 dark:bg-ink">
        <Card className="w-full max-w-sm space-y-4">
          <h1 className="font-display text-xl font-bold">잠금 해제</h1>
          <form className="space-y-4" onSubmit={submitUnlock}>
            <label className="sr-only" htmlFor="unlock-pin">PIN</label>
            <input
              id="unlock-pin"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              maxLength={6}
              value={pin}
              onChange={(event) => setPinInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="PIN 입력"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest focus:border-fire focus:outline-none dark:border-gray-600 dark:bg-gray-800"
            />
            <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-700">{error}</p>
            <Button type="submit" className="w-full">해제</Button>
          </form>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
