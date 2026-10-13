import { useEffect, useRef, useState } from 'react';
import { useUserStore } from '../stores/userStore.js';
import { useChatStore } from '../stores/chatStore.js';
import { computeSajuFromProfile } from '../services/engineService.js';
import { dreamReading, fortuneReading, localDate, lottoNumbers, type Period } from '../services/readingService.js';
import { api, buildFacts, explainedNumbers, formatReading, streamReading, type Catalog, type Connection, type Fact } from '../services/aiService.js';
import { Button } from './Button.js';
import { Card } from './Card.js';
import { Select } from './Select.js';
import { Input } from './Input.js';
const PERIODS: [Period, string][] = [['today', '오늘'], ['tomorrow', '내일'], ['date', '특정 날짜'], ['month', '이번 달'], ['year', '올해']];
interface Job { connection: Connection; facts: Fact[]; mode: string; status: string; result?: string; error?: string; saved?: boolean; followUp?: string }
export function Readings() {
  const { profile, settings } = useUserStore();
  const { addMessage } = useChatStore();
  const [mode, setMode] = useState<'fortune' | 'dream' | 'question'>('fortune');
  const [period, setPeriod] = useState<Period>('today');
  const [date, setDate] = useState(localDate(new Date()));
  const [question, setQuestion] = useState('');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [serverError, setServerError] = useState('');
  const [includeFamily, setIncludeFamily] = useState(false);
  const [includeSpaces, setIncludeSpaces] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [facts, setFacts] = useState<Fact[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [localResult, setLocalResult] = useState('');
  const [localSaved, setLocalSaved] = useState(false);
  const [error, setError] = useState('');
  const controllers = useRef(new Map<string, AbortController>());
  const busy = jobs.some(job => !job.result && !job.error);
  async function refresh() {
    try {
      const data = await api<{ connections: Connection[]; catalog: Catalog; defaultConnectionId?: string }>('connections');
      setConnections(data.connections.filter(item => item.enabled));
      setSelected(current => current.length ? current.filter(id => data.connections.some(item => item.id === id && item.enabled)) : data.connections.filter(item => item.enabled && item.id === data.defaultConnectionId && (!settings.privacyMode || data.catalog.providers[item.provider].group === 'local')).map(item => item.id));
      setServerError('');
    } catch (error) { setServerError(error instanceof Error ? error.message : 'AI 서버에 연결하지 못했어요.'); }
  }
  useEffect(() => { void refresh(); return () => { controllers.current.forEach(controller => controller.abort()); }; }, []);
  function updateJob(id: string, update: Partial<Job>) { setJobs(current => current.map(job => job.connection.id === id ? { ...job, ...update } : job)); }
  async function run(job: Job) {
    const controller = new AbortController();
    controllers.current.set(job.connection.id, controller);
    updateJob(job.connection.id, { status: '모델에 해석을 요청하고 있어요.', error: undefined });
    try {
      const reading = await streamReading(job.connection.id, job.mode, job.facts, controller.signal, message => updateJob(job.connection.id, { status: message }));
      const numbers = job.mode === 'dream' || /로또|복권|번호/.test(String(job.facts.find(fact => fact.id === 'question')?.value)) ? explainedNumbers(reading, lottoNumbers()) : undefined;
      updateJob(job.connection.id, { result: formatReading(reading, job.facts, numbers), status: '해석 완료', followUp: reading.followUp });
    } catch (error) { updateJob(job.connection.id, { error: error instanceof Error ? error.message : '해석에 실패했어요.', status: '이 연결의 해석 실패' }); }
    finally { controllers.current.delete(job.connection.id); }
  }
  function generate() {
    setError('');
    try {
      if (mode !== 'fortune' && !question.trim()) throw new Error(mode === 'dream' ? '기억나는 꿈과 감정을 적어 주세요.' : '궁금한 질문을 적어 주세요.');
      const selectedConnections = connections.filter(connection => selected.includes(connection.id));
      if (!selectedConnections.length) throw new Error('사용할 AI 연결을 선택해 주세요. 연결이 없으면 설정에서 추가하거나 기기 해석을 이용할 수 있어요.');
      const chosenProfile = { ...profile, familyMembers: includeFamily ? profile.familyMembers : [], spaces: includeSpaces ? profile.spaces : [] };
      const materials = buildFacts(chosenProfile, mode, period, date, question.trim(), includeContext ? profile.lifeContext ?? '' : '');
      setFacts(materials);
      const next = selectedConnections.map(connection => ({ connection, facts: materials, mode, status: '요청 준비 중' }));
      setJobs(next);
      next.forEach(job => { void run(job); });
    } catch (error) { setError(error instanceof Error ? error.message : '입력 자료를 확인해 주세요.'); }
  }
  function local() {
    setError(''); setLocalSaved(false);
    try {
      if (mode === 'question') throw new Error('자유 질문 상담은 AI 연결이 필요해요. 고민은 아래 기록에 저장할 수 있어요.');
      setLocalResult(mode === 'fortune' ? fortuneReading(period, date, computeSajuFromProfile(profile)) :  `꿈 기록: ${question.trim()}\n\n${dreamReading(question, profile.birthDate).text}\n무작위 재미용 번호: ${lottoNumbers().join(', ')}\n번호는 당첨 예측이 아니며 모든 조합은 같은 확률이에요.`);
    } catch (error) { setError(error instanceof Error ? error.message : '입력을 확인해 주세요.'); }
  }
  return <section aria-labelledby="readings-title" className="space-y-3">
    <h2 id="readings-title" className="text-lg font-semibold">운세·꿈해몽·인생 상담</h2>
    <p className="text-sm text-muted">사주·꿈·풍수는 전통적 상징 해석입니다. 실제 미래나 로또 당첨을 예측하지 않으며, 번호 추천은 재미용입니다.</p>
    <Card className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <legend className="sr-only">이번 해석의 입력</legend>
        <div className="flex flex-wrap gap-2">{([['fortune', '운세'], ['dream', '꿈해몽·번호 추천'], ['question', '자유 질문']] as const).map(([value, label]) => <Button key={value} variant={mode === value ? 'primary' : 'secondary'} aria-pressed={mode === value} onClick={() => { setMode(value); setQuestion(''); setError(''); setLocalResult(''); }}>{label}</Button>)}</div>
        <Select label="살펴볼 기간" value={period} onChange={event => setPeriod(event.target.value as Period)}>{PERIODS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        {period === 'date' && <Input label="보고 싶은 날짜 (양력)" type="date" min="1900-01-01" max="2100-12-31" value={date} onChange={event => setDate(event.target.value)} />}
        <div className="space-y-1"><label htmlFor="reading-question" className="block">{mode === 'dream' ? '기억나는 꿈과 감정' : mode === 'question' ? '인생 전반에서 궁금한 질문' : '특히 궁금한 주제 (선택)'}</label><textarea id="reading-question" className="field w-full" rows={3} value={question} onChange={event => setQuestion(event.target.value)} placeholder={mode === 'dream' ? '예: 가족과 집에서 돼지를 보았고 기분이 편안했어요.' : '예: 내 삶의 재물운과 가족의 영향은 어떻게 해석할 수 있을까?'} /></div>
        <p className="text-sm text-muted">{profile.birthDate ? '저장된 본인 사주 계산값을 참고합니다.' : '본인 생년월일이 없어 사주 해석은 생략합니다.'} · <a href="/settings">내 정보·가족·공간 수정</a></p>
        <details><summary className="min-h-11 cursor-pointer py-2">함께 해석할 저장 자료 선택</summary>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={includeFamily} onChange={event => setIncludeFamily(event.target.checked)} />가족 관계·사주 {profile.familyMembers?.length ?? 0}명</label>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={includeSpaces} onChange={event => setIncludeSpaces(event.target.checked)} />집·사무실 방향·배치 {profile.spaces?.length ?? 0}곳</label>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={includeContext} onChange={event => setIncludeContext(event.target.checked)} />저장된 생활 맥락 {profile.lifeContext ? '있음' : '없음'}</label>
        </details>
        <div role="group" aria-label="사용할 AI 연결" className="space-y-2"><p className="font-medium">사용할 AI (복수 선택)</p>{settings.privacyMode && <p className="text-sm text-muted">개인정보 보호 모드에서는 외부 AI를 자동 선택하지 않아요. 전송할 자료를 확인한 뒤 직접 선택하세요.</p>}
          {connections.map(connection => <label key={connection.id} className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={selected.includes(connection.id)} onChange={event => setSelected(current => event.target.checked ? [...current, connection.id] : current.filter(id => id !== connection.id))} />{connection.label} · {connection.model || '기본 모델'}</label>)}
          {!connections.length && <p className="text-sm text-muted">활성화된 AI 연결이 없어요. <a href="/settings">설정에서 연결 추가</a></p>}
          {serverError && <p className="text-sm text-warning">{serverError}</p>}
          <Button variant="ghost" onClick={() => void refresh()}>연결 목록 새로고침</Button>
        </div>
        <p className="text-sm text-muted">입력은 해석 결과를 기록하기 전까지 저장되지 않아요. 선택한 AI에 질문과 체크한 자료를 전송합니다. 각 AI의 결과는 따로 표시하며 실패한 연결을 자동으로 바꾸지 않아요.</p>
        <div className="flex flex-wrap gap-2"><Button onClick={generate}>AI로 종합 해석</Button>{mode !== 'question' && <Button variant="ghost" onClick={local}>기기에서 간단히 해석</Button>}</div>
      </fieldset>
      {busy && <Button variant="secondary" onClick={() => controllers.current.forEach(controller => controller.abort())}>진행 중인 해석 중지</Button>}
      {error && <p role="alert" className="text-danger">{error}</p>}
      {facts.length > 0 && <details><summary className="min-h-11 cursor-pointer py-2">이번 요청에 보낸 자료와 계산값</summary>{facts.map(fact => <div key={fact.id} className="mb-3"><p className="font-medium">{fact.label}</p><pre className="whitespace-pre-wrap break-all text-sm">{typeof fact.value === 'string' ? fact.value : JSON.stringify(fact.value, null, 2)}</pre></div>)}</details>}
      {jobs.map(job => <article key={job.connection.id} className="space-y-3 rounded-xl border border-line p-3">
        <h3 className="font-semibold">{job.connection.label} · {job.connection.model || '기본 모델'}</h3>
        <p role="status" className="text-sm text-muted">{job.status}</p>
        {job.error && <div role="alert"><p className="text-danger">{job.error}</p><Button variant="secondary" disabled={busy} onClick={() => void run(job)}>이 연결만 다시 시도</Button></div>}
        {job.result && <>{job.followUp && <Button variant="ghost" disabled={busy} onClick={() => { setMode(job.mode as typeof mode); setQuestion(`${String(job.facts.find(fact => fact.id === 'question')?.value ?? '')}\n추가 질문: ${job.followUp}\n내 답변: `); document.getElementById('reading-question')?.focus(); }}>이 질문에 이어서 답하기</Button>}<p className="whitespace-pre-wrap">{job.result}</p><p className="text-sm text-muted">{job.saved ? '기록에 추가했어요. 실제 저장 상태는 상단에서 확인해 주세요.' : '아직 기록에 저장하지 않았어요.'}</p><Button variant="secondary" disabled={job.saved} onClick={() => { addMessage({ role: 'assistant', mode: job.mode, content: `${job.connection.label} (${job.connection.model || '기본 모델'})\n\n${job.result}\n\n사용한 자료\n${JSON.stringify(job.facts, null, 2)}` }); updateJob(job.connection.id, { saved: true }); }}>결과를 기록에 남기기</Button></>}
      </article>)}
      {localResult && <div className="space-y-3"><h3 className="font-semibold">기기 상징 해석 (AI 아님)</h3><p className="whitespace-pre-wrap">{localResult}</p><p className="text-sm text-muted">{localSaved ? '기록에 추가했어요. 실제 저장 상태는 상단에서 확인해 주세요.' : '아직 기록에 저장하지 않았어요.'}</p><Button variant="secondary" disabled={localSaved} onClick={() => { addMessage({ role: 'assistant', mode, content: localResult }); setLocalSaved(true); }}>결과를 기록에 남기기</Button></div>}
    </Card>
  </section>;
}
