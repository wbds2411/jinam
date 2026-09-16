import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { Button } from '../components/Button.js';
import { Card } from '../components/Card.js';
import { computeSajuFromProfile } from '../services/engineService.js';
import { Settings, Sparkles, Wind, Compass } from 'lucide-react';

const QUICK_CHIPS = [
  { label: '숨이 막혀요', mode: 'panic' },
  { label: '위축됐어요', mode: 'withdrawn' },
  { label: '결정 못 하겠어요', mode: 'indecisive' },
  { label: '오늘 운세', mode: 'reinforce' },
  { label: '타로 한 장', mode: 'reinforce' },
  { label: '그냥 얘기', mode: 'reinforce' },
];

export default function MainPage() {
  const navigate = useNavigate();
  const { profile, settings } = useUserStore();
  const { messages, addMessage } = useChatStore();
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!settings.onboardingDone) {
      navigate('/onboarding');
    }
  }, [settings.onboardingDone, navigate]);

  const saju = computeSajuFromProfile(profile);
  const todayLine = saju
    ? `오늘은 ${saju.dayMaster} 일간, ${saju.yongsin}운이 돋보이는 날이에요. 작은 결정에도 몸의 신호를 먼저 들어보세요.`
    : '오늘은 어떤가요? 편하게 말필보세요.';

  function handleSend(text = input) {
    if (!text.trim()) return;
    addMessage({ role: 'user', content: text });
    setInput('');
    // TODO: LLM 연동 (단계 4 인터페이스 기반)
    addMessage({
      role: 'assistant',
      content: '지금 메시지를 받았어요. LLM 연동 후 차분한 멘토 응답이 여기에 표시됩니다.\n\n오늘의 한 걸음: 잠시 앉아 숨을 고르고, 지금 가장 먼저 할 수 있는 작은 일 하나를 적어보세요.',
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-paper dark:bg-ink">
      <header className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-fire" aria-hidden="true" />
          <h1 className="font-display text-lg font-bold">결정의 나침반</h1>
        </div>
        <button
          onClick={() => navigate('/settings')}
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="설정"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Sparkles className="h-4 w-4" />
            오늘의 한 줄
          </div>
          <p className="mt-2 text-sm leading-relaxed">{todayLine}</p>
        </Card>

        <Card>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Wind className="h-4 w-4" />
            오늘의 컨디션
          </div>
          <div className="flex gap-2">
            {['에너지', '감정', '집중'].map((label) => (
              <div key={label} className="flex-1 rounded-lg bg-gray-50 p-2 text-center text-xs dark:bg-gray-900">
                <div className="mb-1 text-gray-500">{label}</div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 w-2/3 rounded-full bg-fire" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => handleSend(chip.label)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <section className="space-y-3" aria-label="대화">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'ml-auto bg-ink text-paper dark:bg-paper dark:text-ink'
                  : 'bg-white text-ink shadow-sm dark:bg-gray-800 dark:text-paper'
              }`}
            >
              {msg.content}
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="오늘 뭐가 안 풀려요? 편하게 말필보세요."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fire focus:outline-none focus:ring-1 focus:ring-fire dark:border-gray-600 dark:bg-gray-800"
          />
          <Button onClick={() => handleSend()} className="px-4">
            별내
          </Button>
        </div>
      </footer>
    </div>
  );
}
