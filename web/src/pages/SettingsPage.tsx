import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { Button } from '../components/Button.js';
import { Card } from '../components/Card.js';

type TrustTier = 'verified' | 'conventional' | 'caution';

// domain-sources.md 기준 도구별 신뢰 등급
const ALL_MODULES: { id: string; label: string; tier: TrustTier }[] = [
  { id: 'saju', label: '사주', tier: 'conventional' },
  { id: 'astro', label: '별자리', tier: 'conventional' },
  { id: 'vedic', label: '베다 점성학', tier: 'conventional' },
  { id: 'ninestar', label: '나인 스타 키', tier: 'conventional' },
  { id: 'celtic', label: '켈틱 나무', tier: 'conventional' },
  { id: 'tojeong', label: '토정비결', tier: 'conventional' },
  { id: 'zodiac', label: '띠', tier: 'conventional' },
  { id: 'mbti', label: 'MBTI', tier: 'caution' },
  { id: 'bigfive', label: '빅파이브', tier: 'verified' },
  { id: 'attachment', label: '애착 유형', tier: 'verified' },
  { id: 'enneagram', label: '에니어그램', tier: 'caution' },
  { id: 'blood', label: '혈액형', tier: 'caution' },
  { id: 'psych', label: '심리체크', tier: 'verified' },
];

const TIER_BADGE: Record<TrustTier, { label: string; className: string }> = {
  verified: { label: '계산 기반', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  conventional: { label: '전통/상징', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  caution: { label: '참고용', className: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, settings, checkIns, assessments, setSettings, toggleModule, setModuleWeight } = useUserStore();
  const { clearMessages } = useChatStore();

  function exportData() {
    const { apiKeys: _omit, ...settingsWithoutKeys } = settings;
    const data = { profile, settings: settingsWithoutKeys, checkIns, assessments, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jinam-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function deleteAllData() {
    if (confirm('모든 데이터(프로필·대화·체크 기록·PIN)를 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
      clearMessages();
      localStorage.removeItem('jinam-user');
      localStorage.removeItem('jinam-chat');
      localStorage.removeItem('jinam-auth');
      sessionStorage.clear();
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
                <span className="flex items-center gap-2 text-sm">
                  {m.label}
                  <span className={`rounded-full px-2 py-0.5 text-[10px] ${TIER_BADGE[m.tier].className}`}>
                    {TIER_BADGE[m.tier].label}
                  </span>
                </span>
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
            <p className="text-xs text-gray-500">
              켜면 민감 정보가 기기 밖으로 나가지 않아요. 로컬 LLM(Ollama)이 없으면 기본 안내로 응답해요.
            </p>
            <label className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
              <input
                type="checkbox"
                checked={settings.cloudConsent}
                onChange={(event) => setSettings({ cloudConsent: event.target.checked })}
                className="mt-0.5 h-5 w-5"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">
                클라우드 LLM 전송에 동의합니다. 동의해도 생년월일·건강·사주 등 민감한 내용은 로컬 또는 오프라인 응답으로 자동 전환됩니다.
              </span>
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
            {settings.preferredLLM === 'openai-user' && (
              <div className="flex flex-col gap-1">
                <label className="text-sm">OpenAI API 키</label>
                <input
                  type="password"
                  value={settings.apiKeys.openai ?? ''}
                  onChange={(e) => setSettings({ apiKeys: { ...settings.apiKeys, openai: e.target.value } })}
                  placeholder="sk-..."
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500">키는 이 기기에만 암호화 저장돼요.</p>
              </div>
            )}
            {settings.preferredLLM === 'anthropic-user' && (
              <div className="flex flex-col gap-1">
                <label className="text-sm">Anthropic API 키</label>
                <input
                  type="password"
                  value={settings.apiKeys.anthropic ?? ''}
                  onChange={(e) => setSettings({ apiKeys: { ...settings.apiKeys, anthropic: e.target.value } })}
                  placeholder="sk-ant-..."
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500">키는 이 기기에만 암호화 저장돼요.</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="crisis-region" className="text-sm">위기 지원 지역</label>
            <select
              id="crisis-region"
              value={settings.crisisRegion}
              onChange={(event) => setSettings({ crisisRegion: event.target.value })}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="KR">대한민국</option>
              <option value="US">미국</option>
              <option value="GB">영국</option>
              <option value="OTHER">기타 지역</option>
            </select>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-bold">테마 & 접근성</h2>
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
          <label className="mt-3 flex items-center justify-between">
            <span className="text-sm">모션 줄이기</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => setSettings({ reducedMotion: e.target.checked })}
              className="h-5 w-5"
            />
          </label>
        </Card>
          <button type="button" onClick={() => navigate('/legal')} className="mt-3 text-xs text-fire underline">
            개인정보 처리방침 및 이용약관
          </button>

        <Card>
          <h2 className="mb-3 font-bold">데이터</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={exportData} className="flex-1">
              데이터 내보내기
            </Button>
            <Button variant="secondary" onClick={deleteAllData} className="flex-1 text-fire-dark">
              전체 삭제
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">내보내기에는 API 키가 포함되지 않아요.</p>
        </Card>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          <strong>면책:</strong> 본 앱은 의료·점술 단정을 제공하지 않습니다. 건강·법률·금융 등 중대 결정은 반드시 전문가와 상담하세요.
        </div>
      </div>
    </div>
  );
}
