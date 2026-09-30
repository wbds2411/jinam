import { useState, type FormEvent, type ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { useUserStore } from '../stores/userStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { Button } from './Button.js';
import { Input } from './Input.js';
import { Card } from './Card.js';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { pinHash, authenticated, setPin, authenticate, lock } = useAuthStore();
  const [pin, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!/^\d{4,6}$/.test(pin)) { setError('PIN은 숫자 4~6자리로 입력해 주세요.'); return; }
    setBusy(true);
    setError('');
    try {
      if (pinHash) {
        if (!await authenticate(pin)) { setError('PIN이 일치하지 않아요. 다시 입력해 주세요.'); return; }
      } else {
        await setPin(pin);
      }
      await Promise.all([useUserStore.persist.rehydrate(), useChatStore.persist.rehydrate()]);
      if (!useUserStore.persist.hasHydrated() || !useChatStore.persist.hasHydrated()) {
        throw new Error('Could not load saved data');
      }
      setReady(true);
      setPinInput('');
    } catch {
      lock();
      setError('저장된 정보를 열지 못했어요. PIN과 브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.');
    } finally { setBusy(false); }
  }
  if (authenticated && ready) return <>{children}</>;
  return <main className="flex min-h-screen items-center justify-center p-4">
    <Card className="w-full max-w-md space-y-4">
      <p className="text-sm font-medium text-success">결정의 나침반</p>
      <h1 className="text-2xl font-bold">{pinHash ? '내 기록 열기' : '생각을 정리하고, 다음 한 걸음 찾기'}</h1>
      <p className="text-muted">{pinHash ? '설정한 PIN으로 이 브라우저의 기록을 열어 주세요.' : '고민을 적고 선택지를 정리하는 공간이에요. 먼저 기록을 암호화할 PIN을 설정해 주세요.'}</p>
      {!pinHash && <p className="text-sm text-muted">숫자 4~6자리로 설정해요. PIN 복구 기능은 없으니 잊지 않도록 보관해 주세요. 기록은 이 브라우저에 저장되며 다른 기기와 동기화되지 않아요.</p>}
      <form onSubmit={handleSubmit} className="space-y-4" aria-busy={busy}>
        <Input label={pinHash ? 'PIN' : '새 PIN (숫자 4~6자리)'} type="password" inputMode="numeric" autoComplete={pinHash ? 'current-password' : 'new-password'} maxLength={6} value={pin} onChange={e => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }} error={error} disabled={busy} />
        <Button type="submit" disabled={busy} className="w-full">{busy ? '기록을 여는 중…' : pinHash ? '잠금 해제' : 'PIN 설정하고 시작'}</Button>
      </form>
    </Card>
  </main>;
}
