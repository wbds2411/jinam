import { useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { Button } from './Button.js';
import { Card } from './Card.js';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { pinHash, authenticated, setPin, authenticate } = useAuthStore();
  const [pin, setPinInput] = useState('');

  if (!pinHash) {
    // 최초 실행: PIN 설정
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-4 dark:bg-ink">
        <Card className="w-full max-w-sm space-y-4">
          <h1 className="font-display text-xl font-bold">결정의 나침반</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            생년월일·건강 등 민감 정보를 보호할 PIN을 설정하세요.
          </p>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="6자리 숫자"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest focus:border-fire focus:outline-none dark:border-gray-600 dark:bg-gray-800"
          />
          <Button onClick={() => pin.length >= 4 && setPin(pin)} className="w-full">
            PIN 설정
          </Button>
        </Card>
      </div>
    );
  }

  if (!authenticated) {
    // 잠금 해제
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-4 dark:bg-ink">
        <Card className="w-full max-w-sm space-y-4">
          <h1 className="font-display text-xl font-bold">잠금 해제</h1>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && authenticate(pin)}
            placeholder="PIN 입력"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-2xl tracking-widest focus:border-fire focus:outline-none dark:border-gray-600 dark:bg-gray-800"
          />
          <Button onClick={() => authenticate(pin)} className="w-full">
            해제
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
