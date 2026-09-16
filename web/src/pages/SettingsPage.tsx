import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore.js';
import { Button } from '../components/Button.js';
import { Card } from '../components/Card.js';

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
  const { profile, settings, setSettings, toggleModule, setModuleWeight, completeOnboarding } = useUserStore();

  function exportData() {
    const data = { profile, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jinam-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function deleteAllData() {
    if (confirm('모든 데이터를 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
      localStorage.removeItem('jinam-user');
      localStorage.removeItem('jinam-chat');
      completeOnboarding(); // 상태 리셋용 재초기화
      window.location.href = '/';
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-paper p-4 dark:bg-ink">
      <header className="mb-6 flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate('/')} className="px-2">
          ←
        </Button>
        <h1 className="font-display text-xl font-bold">설정</h1>
      </header>

      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 font-bold">도구 on/off</h2>
          <div className="space-y-2">
            {ALL_MODULES.map((m) => (
              <label key={m.id} className="flex items-center justify-between">
                <span className="text-sm">{m.label}</span>
                <input
                  type="checkbox"
                  checked={settings.activeModules.includes(m.id)}
                  onChange={() => toggleModule(m.id)}
                  className="h-5 w-5"
                />
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">근거 가중치</h2>
          <div className="space-y-4">
            {(['saju', 'psych', 'astro'] as const).map((id) => (
              <div key={id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>
                    {id === 'saju' ? '사주' : id === 'psych' ? '심리학' : '별자리'}
                  </span>
                  <span>{settings.moduleWeights[id] ?? 0}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={settings.moduleWeights[id] ?? 0}
                  onChange={(e) => setModuleWeight(id, Number(e.target.value))}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">LLM & 프라이버시</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm">프라이버시 모드</span>
              <input
                type="checkbox"
                checked={settings.privacyMode}
                onChange={(e) => setSettings({ privacyMode: e.target.checked })}
                className="h-5 w-5"
              />
            </label>
            <div className="flex flex-col gap-1">
              <label className="text-sm">LLM 경로</label>
              <select
                value={settings.preferredLLM}
                onChange={(e) => setSettings({ preferredLLM: e.target.value })}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="ollama">로컬 (Ollama)</option>
                <option value="openai-user">OpenAI (사용자 키)</option>
                <option value="anthropic-user">Claude (사용자 키)</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">테마</h2>
          <div className="flex gap-2">
            {(['light', 'dark', 'night-soothing'] as const).map((t) => (
              <Button
                key={t}
                variant={settings.theme === t ? 'primary' : 'secondary'}
                onClick={() => setSettings({ theme: t })}
                className="flex-1 text-xs"
              >
                {t === 'light' ? '라이트' : t === 'dark' ? '다크' : '야간'}
              </Button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">데이터</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportData} className="flex-1">
              날짜 낭출력기
            </Button>
            <Button variant="secondary" onClick={deleteAllData} className="flex-1 text-fire-dark">
              전체 삭제
            </Button>
          </div>
        </Card>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          <strong>면책:</strong> 본 앱은 의료·점술 단정을 제공하지 않습니다. 건강·법률·금융 등 중대 결정은 반드시 전문가와 상담하세요.
        </div>
      </div>
    </div>
  );
}
