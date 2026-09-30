import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { Card } from '../components/Card.js';
import { SajuBoard } from '../components/SajuBoard.js';
import { computeSajuFromProfile } from '../services/engineService.js';

const STEPS = ['기본 정보', '출생 정보', '선택 정보', '확인'];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, setProfile, completeOnboarding } = useUserStore();
  const [step, setStep] = useState(0);

  let saju = null;
  let chartError = '';
  if (step === 3) {
    try { saju = computeSajuFromProfile(profile); }
    catch { chartError = '사주 정보를 계산하지 못했어요. 이전 단계에서 날짜·달력 정보를 확인하거나 사주 없이 시작해 주세요.'; }
  }

  function handleComplete() {
    completeOnboarding();
    navigate('/');
  }

  return (
    <main className="page">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">결정의 나침반</h1>
        <p className="text-sm text-muted">별칭과 출생 정보는 모두 선택 사항이에요. 출생 정보는 사주 미리보기에만 사용하며, 입력 없이도 기록을 시작할 수 있어요.</p>
      </header>

      <p className="mb-2 font-medium" role="status">{step + 1} / {STEPS.length}단계 · {STEPS[step]}</p>
      <ol aria-label="시작 단계" className="mb-4 flex flex-wrap gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li
            aria-current={i === step ? 'step' : undefined}
            key={s}
            className={`rounded-full px-2 py-1 ${i === step ? 'bg-primary text-on-primary' : 'bg-canvas text-muted'}`}
          >
            {i + 1}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card className="space-y-4">
          <Input
            label="이름/별칭 (선택)" autoComplete="nickname"
            value={profile.nickname}
            onChange={(e) => setProfile({ nickname: e.target.value })}
          />
          <div className="flex flex-col gap-1">
            <p id="gender-label" className="text-sm font-medium">사주 계산에 사용할 성별 (선택)</p>
            <div role="group" aria-labelledby="gender-label" className="flex gap-2">
              {(['male', 'female'] as const).map((g) => (
                <Button
                  key={g}
                  aria-pressed={profile.gender === g}
                  variant={profile.gender === g ? 'primary' : 'secondary'}
                  onClick={() => setProfile({ gender: profile.gender === g ? '' : g })}
                  className="flex-1"
                >
                  {g === 'male' ? '남' : '여'}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card className="space-y-4">
          <Input
            label="생년월일 (선택)"
            type="date"
            value={profile.birthDate}
            onChange={(e) => setProfile({ birthDate: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              id="time-unknown"
              type="checkbox"
              checked={profile.birthTimeUnknown}
              onChange={(e) => setProfile({ birthTimeUnknown: e.target.checked })}
              className="h-6 w-6"
            />
            <label htmlFor="time-unknown" className="flex min-h-11 items-center text-sm">출생 시각을 모름</label>
          </div>
          {!profile.birthTimeUnknown && (
            <Input
              label="출생 시각 (선택)"
              type="time"
              value={profile.birthTime}
              onChange={(e) => setProfile({ birthTime: e.target.value })}
            />
          )}
          <div className="flex flex-col gap-1">
            <p id="calendar-label" className="text-sm font-medium">달력</p>
            <div role="group" aria-labelledby="calendar-label" className="flex gap-2">
              {(['solar', 'lunar'] as const).map((c) => (
                <Button
                  key={c}
                  aria-pressed={profile.calendarType === c}
                  variant={profile.calendarType === c ? 'primary' : 'secondary'}
                  onClick={() => setProfile({ calendarType: c })}
                  className="flex-1"
                >
                  {c === 'solar' ? '양력' : '음력'}
                </Button>
              ))}
            </div>
          </div>
          {profile.calendarType === 'lunar' && (
            <div className="flex items-center gap-2">
              <input
                id="leap"
                type="checkbox"
                checked={profile.isLeapMonth}
                onChange={(e) => setProfile({ isLeapMonth: e.target.checked })}
                className="h-6 w-6"
              />
              <label htmlFor="leap" className="flex min-h-11 items-center text-sm">윤달</label>
            </div>
          )}
          <p className="text-sm text-muted">현재 계산에는 출생 지역을 사용하지 않아 입력받지 않아요.</p>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4">
          <p className="text-sm text-muted">아래 정보는 프로필에만 보관하며 현재 기록이나 사주 계산에는 사용하지 않아요.</p>
          <Input
            label="MBTI (선택)"
            placeholder="예: INFJ"
            value={profile.mbti}
            onChange={(e) => setProfile({ mbti: e.target.value.toUpperCase() })}
          />
          <Input
            label="혈액형 (선택)"
            placeholder="예: A"
            value={profile.bloodType}
            onChange={(e) => setProfile({ bloodType: e.target.value })}
          />
          <p className="text-sm text-muted">현재 기록 기능에는 건강 정보가 필요하지 않아 수집하지 않아요. 기존에 입력한 정보는 설정의 내보내기·전체 삭제로 관리할 수 있어요.</p>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4">
          <h2 className="font-display text-lg font-bold">입력 정보로 보는 사주 미리보기</h2>
          {chartError && <p role="alert" className="text-danger">{chartError}</p>}
          {!saju && !chartError && <p className="text-muted">출생 정보가 없어 사주 미리보기를 표시하지 않아요. 기록은 바로 시작할 수 있어요.</p>}
          <SajuBoard chart={saju} />
          <div className="rounded-lg bg-canvas p-3 text-sm text-muted">
            사주는 전통적 해석을 참고하는 자료예요. 미래나 건강 상태를 예측하는 검증된 근거로 사용하지 않아요.
          </div>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap justify-between gap-2">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          이전
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>다음</Button>
        ) : (
          <Button onClick={handleComplete}>기록 시작하기</Button>
        )}
      </div>
      {step < 3 && <Button variant="ghost" onClick={handleComplete} className="mt-4 w-full">정보 입력 건너뛰고 기록 시작</Button>}
    </main>
  );
}
