import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { Button } from '../components/Button.js';
import { Card } from '../components/Card.js';
import { buildDailyGuidance } from '../services/dailyGuidance.js';
import { sendChatMessage } from '../services/chatService.js';
import { deriveModeFromRecords, getTodayCheckIn, todayString } from '../services/assessmentService.js';
import { Settings, Sparkles, Wind, Compass, HeartPulse, Loader2 } from 'lucide-react';

const QUICK_CHIPS = [
  { label: '숨이 막혀요', mode: 'panic' },
  { label: '위축됐어요', mode: 'withdrawn' },
  { label: '결정 못 하겠어요', mode: 'indecisive' },
  { label: '오늘 운세', mode: 'reinforce' },
  { label: '그냥 얘기', mode: 'reinforce' },
];

function CheckInCard() {
  const { checkIns, addCheckIn } = useUserStore();
  const today = getTodayCheckIn(checkIns);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState({ energy: today?.energy ?? 5, mood: today?.mood ?? 5, focus: today?.focus ?? 5 });

  const labels = [
    { key: 'energy' as const, label: '에너지' },
    { key: 'mood' as const, label: '감정' },
    { key: 'focus' as const, label: '집중' },
  ];

  if (!editing) {
    return (
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Wind className="h-4 w-4" />
            오늘의 컨디션
          </div>
          <button onClick={() => setEditing(true)} className="text-xs text-fire underline">
            {today ? '수정' : '기록하기'}
          </button>
        </div>
        {today ? (
          <div className="flex gap-2">
            {labels.map(({ key, label }) => (
              <div key={key} className="flex-1 rounded-lg bg-gray-50 p-2 text-center text-xs dark:bg-gray-900">
                <div className="mb-1 text-gray-500">{label}</div>
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-2 rounded-full bg-fire" style={{ width: `${today[key] * 10}%` }} />
                </div>
                <div className="mt-1 font-bold">{today[key]}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">아직 오늘 기록이 없어요. 30초면 충분해요.</p>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Wind className="h-4 w-4" />
        오늘의 컨디션 (0~10)
      </div>
      <div className="space-y-3">
        {labels.map(({ key, label }) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{label}</span>
              <span className="font-bold">{values[key]}</span>
            </div>
            <input
              type="range" min={0} max={10} value={values[key]}
              onChange={(e) => setValues({ ...values, [key]: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        ))}
        <Button
          className="w-full text-sm"
          onClick={() => {
            addCheckIn({ date: todayString(), ...values, sleepHours: null });
            setEditing(false);
          }}
        >
          저장
        </Button>
      </div>
    </Card>
  );
}

export default function MainPage() {
  const navigate = useNavigate();
  const { profile, settings, assessments } = useUserStore();
  const { messages, addMessage } = useChatStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settings.onboardingDone) {
      navigate('/onboarding');
    }
  }, [settings.onboardingDone, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: settings.reducedMotion ? 'auto' : 'smooth' });
  }, [messages.length, settings.reducedMotion]);

  const todayLine = buildDailyGuidance();

  async function handleSend(text = input) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    addMessage({ role: 'user', content: trimmed });
    setInput('');
    setSending(true);
    try {
      const history = messages
        .filter((m): m is typeof m & { role: 'user' | 'assistant' } => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }));
      const assessmentMode = deriveModeFromRecords(assessments);
      const result = await sendChatMessage({
        userMessage: trimmed,
        profile,
        settings,
        apiKeys: settings.apiKeys,
        history,
        assessmentMode,
      });
      addMessage({
        role: result.crisis?.crisis ? 'safety' : 'assistant',
        content: result.text,
        mode: result.mode,
      });
    } catch (err) {
      addMessage({
        role: 'assistant',
        content: '응답을 만드는 중에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.\n\n오늘의 한 걸음: 잠시 앉아 숨을 고르고, 지금 가장 먼저 할 수 있는 작은 일 하나를 적어보세요.',
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-paper dark:bg-ink">
      <header className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-fire" aria-hidden="true" />
          <h1 className="font-display text-lg font-bold">결정의 나침반</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/assessment')}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="마음 체크"
          >
            <HeartPulse className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="설정"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <Card className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Sparkles className="h-4 w-4" />
            오늘의 한 줄
          </div>
          <p className="mt-2 text-sm leading-relaxed">{todayLine}</p>
        </Card>

        <CheckInCard />

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
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'ml-auto bg-ink text-paper dark:bg-paper dark:text-ink'
                  : msg.role === 'safety'
                    ? 'border border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100'
                    : 'bg-white text-ink shadow-sm dark:bg-gray-800 dark:text-paper'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-gray-500 shadow-sm dark:bg-gray-800">
              <Loader2 className="h-4 w-4 animate-spin" />
              생각을 고르고 있어요…
            </div>
          )}
          <div ref={bottomRef} />
        </section>
      </main>

      <footer className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="오늘 뭐가 안 풀려요? 편하게 말해보세요."
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-fire focus:outline-none focus:ring-1 focus:ring-fire dark:border-gray-600 dark:bg-gray-800"
          />
          <Button onClick={() => handleSend()} className="px-4" disabled={sending}>
            보내기
          </Button>
        </div>
      </footer>
    </div>
  );
}
