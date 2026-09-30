import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { deleteStoredData } from '../services/secureStorage.js';
import { Button } from '../components/Button.js';
import { Card } from '../components/Card.js';
import { Input } from '../components/Input.js';

const ALL_MODULES = [
  { id: 'saju', label: '사주' },
  { id: 'astro', label: '별자리' },
  { id: 'vedic', label: '베다 점성학' },
  { id: 'ninestar', label: '나인 스타 키' },
  { id: 'celtic', label: '켈틱 나무' },
  { id: 'tojeong', label: '토정비결' },
  { id: 'zodiac', label: '띠' },
  { id: 'mbti', label: 'MBTI' },
  { id: 'bigfive', label: '빅파이브' },
  { id: 'attachment', label: '애착 유형' },
  { id: 'enneagram', label: '에니어그램' },
  { id: 'blood', label: '혈액형' },
  { id: 'psych', label: '심리체크' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, settings, setSettings, toggleModule, setModuleWeight } = useUserStore();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState(false);
  function exportData() {
    try {
      const data = { profile, settings, messages: useChatStore.getState().messages, exportedAt: new Date().toISOString() };
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `jinam-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice('내보내기 파일 다운로드를 요청했어요. 브라우저의 다운로드 목록을 확인해 주세요.');
      setError('');
    } catch { setError('파일을 만들지 못했어요. 이 화면을 유지하고 다시 시도해 주세요.'); }
  }
  async function deleteAllData() {
    if (!confirm('이 브라우저의 프로필·설정·기록·PIN을 모두 삭제할까요? 되돌릴 수 없어요. 필요한 기록은 먼저 내보내 주세요.')) return;
    setDeleting(true);
    try { await deleteStoredData(); window.location.href = '/'; }
    catch { setError('일부 정보를 삭제하지 못했어요. 브라우저 저장 공간 접근을 확인하고 다시 시도해 주세요.'); setDeleting(false); }
  }
  return <main className="page">
    <header className="mb-6 flex items-center gap-2">
      <Button variant="ghost" onClick={() => navigate('/')} aria-label="기록으로 돌아가기">←</Button>
      <h1 className="text-2xl font-bold">설정</h1>
    </header>
    {error && <p role="alert" className="mb-4 text-danger">{error}</p>}
    {notice && <p role="status" className="mb-4 text-success">{notice}</p>}
    <fieldset disabled={deleting} className="min-w-0 space-y-4">
      <legend className="sr-only">개인 설정</legend>
      <Card>
        <h2 className="mb-3 text-lg font-semibold">화면과 움직임</h2>
        <div role="group" aria-label="화면 테마" className="flex flex-wrap gap-2">
          {(['light', 'dark', 'night-soothing'] as const).map(theme => <Button key={theme} variant={settings.theme === theme ? 'primary' : 'secondary'} aria-pressed={settings.theme === theme} onClick={() => setSettings({ theme })}>{theme === 'light' ? '라이트' : theme === 'dark' ? '다크' : '야간'}</Button>)}
        </div>
        <p className="mt-2 text-sm text-muted">야간은 다크와 같은 색상을 사용해요. 기기의 모션 감소 설정도 존중해요.</p>
        <label className="mt-3 flex min-h-11 items-center justify-between gap-4"><span>움직임 줄이기</span><input type="checkbox" className="h-5 w-5" checked={settings.reducedMotion} onChange={e => setSettings({ reducedMotion: e.target.checked })} /></label>
      </Card>
      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">내 정보와 기록</h2>
        <p className="text-sm text-muted">PIN으로 암호화해 이 브라우저에 보관해요. 자동 동기화와 파일 가져오기는 아직 지원하지 않아요.</p>
        <Button variant="secondary" onClick={() => navigate('/onboarding')}>프로필 확인·수정</Button>
        <p className="text-sm text-muted">내보내기 파일에는 프로필·설정·전체 기록이 암호화되지 않은 상태로 포함돼요. 보관과 공유에 주의해 주세요.</p>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={exportData}>기록 내보내기</Button><Button variant="danger" onClick={() => void deleteAllData()}>{deleting ? '삭제 중…' : '전체 데이터 삭제'}</Button></div>
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-semibold">해석 도구 선호</h2>
        <p className="mb-3 text-sm text-muted">아래 항목은 선호 설정만 저장해요. 현재 자동 상담에는 반영되지 않아요. 사주·별자리 등은 전통적 해석이며 과학적 예측을 뜻하지 않아요.</p>
        <details><summary className="min-h-11 cursor-pointer py-2 font-medium">도구와 비중 설정</summary>
          <div className="space-y-2">{ALL_MODULES.map(m => <label key={m.id} className="flex min-h-11 items-center justify-between gap-4"><span>{m.label}</span><input type="checkbox" checked={settings.activeModules.includes(m.id)} onChange={() => toggleModule(m.id)} className="h-5 w-5" /></label>)}</div>
          <h3 className="my-3 font-semibold">해석 비중 선호</h3>
          <p className="mb-3 text-sm text-muted">각 도구의 상대적 선호예요. 정확도나 신뢰 확률이 아니에요.</p>
          <div className="space-y-4">{(['saju', 'psych', 'astro'] as const).map(id => {
            const label = id === 'saju' ? '사주' : id === 'psych' ? '심리' : '별자리';
            return <div key={id}>
              <Input id={`weight-${id}`} label={`${label} 비중 (0~100)`} type="number" min={0} max={100} step={1} value={settings.moduleWeights[id] ?? 0} onChange={e => { const value = Number(e.target.value); if (Number.isFinite(value)) setModuleWeight(id, Math.round(Math.max(0, Math.min(100, value)))); }} />
              <input type="range" aria-label={`${label} 비중`} min={0} max={100} value={settings.moduleWeights[id] ?? 0} onChange={e => setModuleWeight(id, Number(e.target.value))} className="min-h-11 w-full" />
            </div>;
          })}</div>
        </details>
      </Card>
      <Card>
        <h2 className="mb-2 text-lg font-semibold">AI 연결 선호</h2>
        <p id="ai-note" className="mb-3 text-sm text-muted">AI 연결은 준비 중이에요. 지금은 어떤 옵션을 선택해도 외부 AI로 내용을 전송하지 않아요.</p>
        <label className="flex min-h-11 items-center justify-between gap-4"><span>로컬 처리 우선</span><input type="checkbox" className="h-5 w-5" checked={settings.privacyMode} onChange={e => setSettings({ privacyMode: e.target.checked })} /></label>
        <label htmlFor="llm-route" className="mb-1 block text-sm">연결 방식 선호</label>
        <select id="llm-route" aria-describedby="ai-note" value={settings.preferredLLM} onChange={e => setSettings({ preferredLLM: e.target.value })} className="field w-full"><option value="ollama">로컬 (Ollama)</option><option value="openai-user">OpenAI (사용자 키)</option><option value="anthropic-user">Claude (사용자 키)</option></select>
      </Card>
    </fieldset>
  </main>;
}
