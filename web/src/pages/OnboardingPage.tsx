import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore.js';
import { Button } from '../components/Button.js';
import { Input } from '../components/Input.js';
import { Card } from '../components/Card.js';
import { SajuBoard } from '../components/SajuBoard.js';
import { computeSajuFromProfile } from '../services/engineService.js';

const STEPS = ['기본 정보', '운명학 정보', '선택 정보', '확인'];

const BIRTH_LOCATIONS = [
  { name: '서울', lat: 37.5665, lng: 126.9780, timeZoneOffsetMinutes: 540 },
  { name: '부산', lat: 35.1796, lng: 129.0756, timeZoneOffsetMinutes: 540 },
  { name: '대구', lat: 35.8714, lng: 128.6014, timeZoneOffsetMinutes: 540 },
  { name: '인천', lat: 37.4563, lng: 126.7052, timeZoneOffsetMinutes: 540 },
  { name: '광주', lat: 35.1595, lng: 126.8526, timeZoneOffsetMinutes: 540 },
  { name: '대전', lat: 36.3504, lng: 127.3845, timeZoneOffsetMinutes: 540 },
  { name: '울산', lat: 35.5384, lng: 129.3114, timeZoneOffsetMinutes: 540 },
  { name: '제주', lat: 33.4996, lng: 126.5312, timeZoneOffsetMinutes: 540 },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, setProfile, completeOnboarding } = useUserStore();
  const [step, setStep] = useState(0);
  const [legalAccepted, setLegalAccepted] = useState(false);

  const saju = computeSajuFromProfile(profile);

  function handleComplete() {
    if (!legalAccepted) return;
    useUserStore.getState().setSettings({
      legalAcceptedAt: new Date().toISOString(),
      legalVersion: '1.0',
    });
    completeOnboarding();
    navigate('/');
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-paper p-4 dark:bg-ink">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold">결정의 나침반</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">더 정확한 근거를 위해 운명학 정보를 받아요. 건너뛰기 가능합니다.</p>
      </header>

      <div className="mb-4 flex gap-2 text-sm">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`rounded-full px-2 py-1 ${i === step ? 'bg-ink text-paper dark:bg-paper dark:text-ink' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}
          >
            {i + 1}
          </span>
        ))}
      </div>

      {step === 0 && (
        <Card className="space-y-4">
          <Input
            label="이름/별칭"
            value={profile.nickname}
            onChange={(e) => setProfile({ nickname: e.target.value })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">성별</label>
            <div className="flex gap-2">
              {(['male', 'female'] as const).map((g) => (
                <Button
                  key={g}
                  variant={profile.gender === g ? 'primary' : 'secondary'}
                  onClick={() => setProfile({ gender: g })}
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
            label="생년월일"
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
              className="h-4 w-4"
            />
            <label htmlFor="time-unknown" className="text-sm">출생 시각을 모름</label>
          </div>
          {!profile.birthTimeUnknown && (
            <Input
              label="출생 시각"
              type="time"
              value={profile.birthTime}
              onChange={(e) => setProfile({ birthTime: e.target.value })}
            />
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">달력</label>
            <div className="flex gap-2">
              {(['solar', 'lunar'] as const).map((c) => (
                <Button
                  key={c}
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
                className="h-4 w-4"
              />
              <label htmlFor="leap" className="text-sm">윤달</label>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="birth-location" className="text-sm font-medium">출생 지역</label>
            <select
              id="birth-location"
              value={profile.birthLocation?.name ?? ''}
              onChange={(event) => {
                const location = BIRTH_LOCATIONS.find(item => item.name === event.target.value) ?? null;
                setProfile({ birthLocation: location });
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
            >
              <option value="">미선택</option>
              {BIRTH_LOCATIONS.map(location => <option key={location.name} value={location.name}>{location.name}</option>)}
            </select>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={profile.useTrueSolarTime}
              disabled={!profile.birthLocation}
              onChange={(event) => setProfile({ useTrueSolarTime: event.target.checked })}
              className="mt-0.5 h-4 w-4"
            />
            <span>선택한 도시의 경도로 출생 시각을 보정합니다.</span>
          </label>
          <p className="text-xs text-gray-500">경도 기준 보정이며 균시차는 포함하지 않습니다. 지역을 선택하지 않으면 보정하지 않아요.</p>
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4">
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">건강 관심사 (선택, 민감)</label>
            <p className="text-xs text-gray-500">의료 자문이 아니라 컨디션 해석의 보조 맥락으로만 쓰입니다. 로컬 암호화 보관.</p>
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
              placeholder="예: 수면, 소화"
              value={profile.healthContexts.join(', ')}
              onChange={(e) => setProfile({ healthContexts: e.target.value.split(',').map(s => s.trim()) })}
            />
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="space-y-4">
          <h2 className="font-display text-lg font-bold">프리뷰 사주판</h2>
          <SajuBoard chart={saju} />
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
            이 해석은 "자기이해 언어"이며 미래를 단정하지 않습니다. 모든 분석은 "오늘의 한 걸음"으로 끝납니다.
          </div>
          <label className="flex items-start gap-2 rounded-lg border border-gray-300 p-3 text-sm dark:border-gray-700">
            <input
              type="checkbox"
              checked={legalAccepted}
              onChange={(event) => setLegalAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4"
            />
            <span>만 14세 이상이거나 보호자 동의를 받았으며, 개인정보 처리방침과 이용약관에 동의합니다.</span>
          </label>
          <button type="button" onClick={() => navigate('/legal')} className="text-left text-xs text-fire underline">
            개인정보 처리방침 및 이용약관 보기
          </button>
        </Card>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          이전
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)}>다음</Button>
        ) : (
          <Button onClick={handleComplete} disabled={!legalAccepted}>시작하기</Button>
        )}
      </div>
    </div>
  );
}
