import { useEffect, useState, useSyncExternalStore } from 'react';
import { useUserStore } from '../stores/userStore.js';
import { getStorageStatus, subscribeStorage, retryStorage } from '../services/secureStorage.js';
import { Button } from './Button.js';

export function AppStatus() {
  const { theme, reducedMotion } = useUserStore(state => state.settings);
  const status = useSyncExternalStore(subscribeStorage, getStorageStatus);
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme !== 'light');
    document.documentElement.dataset.reducedMotion = String(reducedMotion);
  }, [theme, reducedMotion]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (['saving', 'error'].includes(getStorageStatus())) event.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); window.removeEventListener('beforeunload', beforeUnload); };
  }, []);
  return <div className="mx-auto max-w-2xl px-4 pt-3 text-sm sm:px-6">
    {!online && <p role="status" className="text-warning">오프라인이에요. 현재 열린 화면에서 기록을 작성할 수 있어요.</p>}
    {status === 'error' ? <div role="alert" className="text-danger"><p>이 브라우저에 저장하지 못했어요. 화면의 입력은 남아 있어요. 창을 닫기 전에 재시도하거나 설정에서 내보내 주세요.</p><Button variant="secondary" onClick={() => void retryStorage()}>저장 다시 시도</Button></div> : <p role="status" className="text-muted">{status === 'saving' ? '이 브라우저에 저장 중…' : status === 'saved' ? '이 브라우저에 저장했어요 · 기기 간 동기화 없음' : '이 브라우저의 기록 · 기기 간 동기화 없음'}</p>}
  </div>;
}
