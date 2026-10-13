import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { Button } from '../components/Button.js';
import { Card } from '../components/Card.js';
import { Readings } from '../components/Readings.js';
import { Settings, Compass } from 'lucide-react';

const PROMPTS = ['내 인생에서 이루고 싶은 것은…', '로또 당첨을 기대하는 이유와 지출 한도는…', '가족·집·사무실이 내 선택에 미치는 영향은…', '지금 고민하는 선택은…'];
export default function MainPage() {
  const navigate = useNavigate();
  const { profile, settings } = useUserStore();
  const { messages, addMessage } = useChatStore();
  const [input, setInput] = useState('');
  if (!settings.onboardingDone) return <Navigate to="/onboarding" replace />;
  function handleSend() {
    if (!input.trim()) return;
    addMessage({ role: 'user', content: input.trim() });
    setInput('');
  }
  return <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col">
    <header className="flex items-center justify-between gap-3 border-b border-line p-4 sm:p-6">
      <div className="flex items-center gap-2"><Compass className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" /><h1 className="text-xl font-bold">결정의 나침반</h1></div>
      <Button variant="ghost" onClick={() => navigate('/settings')} aria-label="설정 열기"><Settings className="h-5 w-5" aria-hidden="true" /></Button>
    </header>
    <main className="flex-1 space-y-6 p-4 sm:p-6">
      <Card className="space-y-3">
        <p className="text-sm font-medium text-success">{profile.nickname ? `${profile.nickname}님의 생각 정리` : '나의 생각 정리'}</p>
        <h2 className="text-2xl font-bold">지금 할 수 있는 한 걸음부터</h2>
        <p>오늘의 고민부터 인생 전반의 질문까지, 나에게 중요한 기준을 적어 보세요. 지난 기록을 돌아보며 다음 행동을 정할 수 있어요.</p>
        <p className="text-sm text-muted">기간별 사주 참고 해석과 꿈 상징 해석을 이용할 수 있어요. AI 종합 해석은 설정에서 연결한 모델을 선택해 이용하세요. 아래 생각 기록은 AI로 전송하지 않아요.</p>
      </Card>
      <Readings />
      <section aria-labelledby="prompt-title" className="space-y-3">
        <h2 id="prompt-title" className="text-lg font-semibold">어디서 시작할지 막막하다면</h2>
        <p className="text-sm text-muted">문장을 선택한 뒤 내 상황에 맞게 고쳐 보세요.</p>
        <div className="flex flex-wrap gap-2">{PROMPTS.map(prompt => <Button key={prompt} variant="secondary" onClick={() => { setInput(current => current ? `${current}\n${prompt}` : prompt); document.getElementById('thought-input')?.focus(); }}>{prompt}</Button>)}</div>
      </section>
      <section aria-labelledby="records-title" className="space-y-3">
        <h2 id="records-title" className="text-lg font-semibold">이어서 보는 기록</h2>
        {messages.length === 0 && <p className="rounded-xl border border-dashed border-control p-4 text-muted">아직 기록이 없어요. 아래에 고민이나 다음 행동을 한 문장으로 남겨 보세요.</p>}
        <div role="log" aria-label="생각 기록" aria-live="polite" aria-relevant="additions" className="space-y-3">
          {messages.map(msg => <article key={msg.id} className="rounded-2xl border border-line bg-surface p-4">
            <p className="mb-2 text-sm text-muted">{msg.role === 'user' ? '내 기록' : '해석 기록'} · <time dateTime={new Date(msg.createdAt).toISOString()}>{new Date(msg.createdAt).toLocaleString('ko-KR')}</time></p>
            <p className="whitespace-pre-wrap">{msg.content}</p>
          </article>)}
        </div>
      </section>
    </main>
    <footer className="border-t border-line p-4 sm:p-6">
      <form onSubmit={event => { event.preventDefault(); handleSend(); }} className="space-y-3">
        <label htmlFor="thought-input" className="block font-medium">자유로운 고민·인생 질문·다음 행동</label>
        <textarea id="thought-input" rows={3} value={input} onChange={event => setInput(event.target.value)} placeholder="예: 두 선택지의 장단점을 하나씩 적어볼 거예요." className="field w-full resize-y" aria-describedby="record-hint" />
        <div className="flex flex-wrap items-center justify-between gap-3"><p id="record-hint" className="text-sm text-muted">줄바꿈은 Enter · 저장은 아래 버튼</p><Button type="submit" disabled={!input.trim()}>기록 저장</Button></div>
      </form>
    </footer>
  </div>;
}
