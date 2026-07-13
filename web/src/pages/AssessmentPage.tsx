import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questionnaires, assessment, counselor } from '@jinam/engine';
import { useUserStore } from '../stores/userStore.js';
import type { AssessmentRecord } from '../stores/userStore.js';
import { Button } from '../components/Button.js';
import { Card } from '../components/Card.js';

const { QUESTIONNAIRES } = questionnaires;

function CrisisNotice({ region }: { region: string }) {
  const resources = counselor.getCrisisResources(region);
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
      <p className="font-bold">지금 마음이 많이 힘든 상태로 보여요.</p>
      <p className="mt-1">운세보다 당신의 안전이 먼저예요. 전문 지원과 연결해 보세요:</p>
      <ul className="mt-1 list-inside list-disc">
        {resources.map(resource => (
          <li key={`${resource.name}-${resource.number}`}>
            {resource.name}{' '}
            {/^[\d -]+$/.test(resource.number)
              ? <a href={`tel:${resource.number.replace(/\D/g, '')}`} className="font-bold underline">{resource.number}</a>
              : <strong>{resource.number}</strong>}
          </li>
        ))}
      </ul>
      <p className="mt-1">즉각적인 위험이 있다면 현지 응급 서비스에 연락하세요.</p>
    </div>
  );
}

export default function AssessmentPage() {
  const navigate = useNavigate();
  const { settings, addAssessment } = useUserStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ title: string; total: number; label: string; crisis: boolean } | null>(null);

  const def = QUESTIONNAIRES.find(q => q.id === selectedId);

  function start(id: string) {
    setSelectedId(id);
    setAnswers({});
    setResult(null);
  }

  function submit() {
    if (!def) return;
    const values = def.questions.map((_, i) => answers[i]);
    if (values.some(v => v === undefined)) return;

    let record: AssessmentRecord;
    let label = '';
    let crisis = false;

    if (def.id === 'dcs') {
      const r = assessment.scoreDCS(values);
      label = r.level === 'high' ? '갈등 높음' : r.level === 'moderate' ? '갈등 중간' : '갈등 낮음';
      record = { id: 'dcs', total: r.total, flag: r.needsDecisionSupport, takenAt: Date.now() };
    } else if (def.id === 'who5') {
      const r = assessment.scoreWHO5(values);
      label = r.depressionScreen ? '웰빙 크게 저하' : r.lowWellBeing ? '웰빙 저하 가능성' : '양호';
      record = { id: 'who5', total: r.total, flag: r.lowWellBeing, takenAt: Date.now() };
    } else if (def.id === 'gad7') {
      const r = assessment.scoreGAD7(values);
      label = { minimal: '최소', mild: '경도', moderate: '중등도', severe: '중증' }[r.severity];
      record = { id: 'gad7', total: r.total, flag: r.needsGrounding, takenAt: Date.now() };
    } else {
      const r = assessment.scorePHQ9(values);
      label = { minimal: '최소', mild: '경도', moderate: '중등도', 'moderately-severe': '중등중증', severe: '중증' }[r.severity];
      crisis = r.suicidalityFlag || r.total >= 15;
      record = { id: 'phq9', total: r.total, flag: r.total >= 10, suicidalityFlag: r.suicidalityFlag, takenAt: Date.now() };
    }

    addAssessment(record);
    setResult({ title: def.title, total: record.total, label, crisis });
    setSelectedId(null);
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-paper p-4 dark:bg-ink">
      <header className="mb-6 flex items-center gap-2">
        <Button variant="ghost" onClick={() => (selectedId ? setSelectedId(null) : navigate('/'))} className="px-2">
          ←
        </Button>
        <h1 className="font-display text-xl font-bold">마음 체크</h1>
      </header>

      {!def && !result && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            검증된 선별 도구로 현재 상태를 확인해요. 결과는 기기에만 암호화 저장되며, 진단이 아닌 참고용이에요.
          </p>
          {QUESTIONNAIRES.map(q => (
            <Card key={q.id}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold">{q.title}</h2>
                  <p className="mt-1 text-xs text-gray-500">{q.questions.length}문항 · {q.description}</p>
                </div>
                <Button onClick={() => start(q.id)} className="shrink-0 px-3 text-sm">시작</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {def && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{def.description}</p>
          {def.questions.map((q, i) => (
            <Card key={i}>
              <p className="mb-2 text-sm font-medium">{i + 1}. {q}</p>
              <div className="flex flex-wrap gap-1">
                {def.scaleLabels.map((lb, j) => {
                  const value = def.minValue + j;
                  const active = answers[i] === value;
                  return (
                    <button
                      key={j}
                      onClick={() => setAnswers({ ...answers, [i]: value })}
                      className={`rounded-full border px-2 py-1 text-xs ${
                        active
                          ? 'border-fire bg-fire text-white'
                          : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {lb}
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
          <Button
            onClick={submit}
            className="w-full"
            disabled={def.questions.some((_, i) => answers[i] === undefined)}
          >
            결과 보기
          </Button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <Card>
            <h2 className="font-bold">{result.title} 결과</h2>
            <p className="mt-2 text-2xl font-bold">{result.total}점 <span className="text-base font-medium text-gray-500">({result.label})</span></p>
            <p className="mt-2 text-xs text-gray-500">
              이 결과는 선별용이며 임상 진단을 대체하지 않아요. 상태가 계속되면 전문가와 상담하세요.
            </p>
          </Card>
          {result.crisis && <CrisisNotice region={settings.crisisRegion} />}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setResult(null)} className="flex-1">다른 검사</Button>
            <Button onClick={() => navigate('/')} className="flex-1">홈으로</Button>
          </div>
        </div>
      )}
    </div>
  );
}
