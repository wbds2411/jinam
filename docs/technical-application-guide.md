# 도메인 기술 적용 가이드 (Domain Technical Application Guide)

> 문서 버전: 0.1  
> 목적: 뇌과학·수면과학·한의학·체질·심리학·전통문화·운세·서양 점성학을 **코드로 구현할 때 필요한 계산 방법·보정 공식·매핑 규칙·신뢰 경계**를 정리한다.  
> 대상 독자: 개발자, 기획자, 도메인 검토자  
> 기준 문서: `research1.md`, `domain-sources.md`, `architecture.md`, `requirements.md`

---

## 1. 개요

### 목차

1. 개요
2. 공통 기술 기반
3. 심리학
4. 뇌과학
5. 수면과학
6. 한의학·체질
7. 전통문화·운세
8. 서양 점성학 (Natal Chart)
9. 통합 상태 엔진 및 안전 가드
10. 구현 우선순위 및 단계
11. 검증 및 테스트
12. 참고 문헌 및 데이터 출처
13. 결론

### 1.1 문서 위치

| 문서 | 역할 | 본 가이드와의 관계 |
|------|------|-------------------|
| `research1.md` | 학술/규제 근거 검증 | "왜 이 도구를 쓰는가" |
| `research1-verification.md` | 출처 검증 상태 보고 | "어떤 근거가 검증되었는가" |
| `domain-sources.md` | 도구별 신뢰 등급·라이브러리 후보 | "무엇을 쓸 것인가" |
| `architecture.md` | 시스템 아키텍처·인터페이스 | "어떻게 연결하는가" |
| `requirements.md` | 확정/미확정 요구사항 | "무엇을 만들어야 하는가" |
| `risk-register.md` | 리스크 식별 및 완화 전략 | "무엇이 위험한가" |
| **본 가이드** | 분야별 기술 적용 사양 | **"계산과 매핑의 구체적 방법"** |

### 1.2 핵심 원칙

1. **과학이 골격, 전통이 거울**
   - DCS, WHO-5, GAD-7, PHQ-9, 수면/스트레스 지표는 `verified` 계산으로 사용.
   - 사주·점성학·토정비결 등은 `conventional` 상징 프레임으로만 사용.
   - 모든 해석은 **미래 단정이 아닌 "오늘의 한 걸음"** 으로 종결.

2. **위험도 기반 가중치**
   - 저위험 결정(일상·성찰): 전통/상징 도구 가중 30~50%.
   - 고위험 결정(의료·법률·금융): 전통/상징 도구 가중 0~10%.
   - 위기 상황(자해·타해·의료·폭력): 점술 중단, 위기 자원 연결.

3. **오프라인 우선·민감정보 보호**
   - 생년월일시·출생지·건강데이터는 클라이언트 암호화.
   - 핵심 계산(사주·점성학)은 클라이언트 오프라인 동작 가능.

4. **의료/법률 경계 준수**
   - 진단·처방·약물·법률 자문 표현 금지.
   - 모든 건강 관련 출력은 "정보/교육/자기성찰용"으로 명시.

---

## 2. 공통 기술 기반

### 2.1 시간·지역 보정 파이프라인

출생 시각 기반 계산(사주·점성학)에서 공통으로 사용하는 보정 체계.

```
[출생지 로컬 시각]
    ↓ (타임존 오프셋, 서머타임/일광절약시간 예외)
[UTC]
    ↓ (선택: 균시차 equation of time)
[UT1 / 진태양시]
    ↓ (경도 차이: 1° = 4분)
[출생지 평균태양시 / 지역시]
```

| 보정 단계 | 설명 | 적용 도구 | 비고 |
|-----------|------|-----------|------|
| 타임존 변환 | `IANA timezone` → UTC 오프셋 | `Intl.DateTimeFormat`, `date-fns-tz` | 사용자가 출생지 선택 |
| 서머타임/일광절약시간 | 역사적 예외 테이블 | 자체 테이블 | 한국 1948~1988, 미국/유럽 역사적 규칙 |
| 균시차(equation of time) | 태양의 평균시와 진태양시 차이(±16분) | `astronomia` 또는 근사식 | 고정밀 사주/점성학에 선택 적용 |
| 경도 차이 | 본초 자오선(0°) 기준 1° = 4분 | 자체 계산 | 대구(약 128.6°E) → +514.4분. 한국 표준시(UTC+9, 540분)와 약 26분 차이. 사주/점성학 계산에서 중요 |
| 진태양시 | 평균태양시 + 균시차 | 자체 계산 | 절기/자시/점성학 house 계산에 사용 |

**의사코드 예시:**

```typescript
function toTrueSolarTime(local: Date, lng: number, timezone: string): Date {
  // 1. UTC로 변환
  const utc = toUTC(local, timezone);
  // 2. 균시차 보정 (선택)
  const equationOfTimeMinutes = getEquationOfTime(utc);
  // 3. 경도 차이 (동경은 +, 서경은 -)
  const longitudeOffsetMinutes = lng * 4;
  // 4. 진태양시
  const trueSolar = new Date(utc.getTime()
    + (equationOfTimeMinutes + longitudeOffsetMinutes) * 60_000);
  return trueSolar;
}
```

### 2.2 민감정보 처리

| 정보 유형 | 민감 등급 | 처리 방식 | 비고 |
|-----------|-----------|-----------|------|
| 생년월일시 | 높음 | 클라이언트 AES-GCM 암호화, 클라우드 전송 최소화 | `UserProfile.birthDate`, `birthTime` |
| 출생지 위도/경도/이름 | 높음 | 동일 | `UserProfile.birthLocation` |
| 건강/수면/심리 검사 점수 | 높음(Art.9 특수범주) | 동일, GDPR Art.35 DPIA 대상 | `UserProfile.healthContexts` |
| MBTI/혈액형 | 중간 | 마스킹 옵션, 익명 통계에만 사용 | 상표/과학적 한계 명시 |
| 점술 결과 | 중간 | 로컬 저장, 사용자 요청 시 삭제 | "맞춤형 조언"으로 읽히지 않도록 가드 |

### 2.3 오프라인 계산 원칙

- `kor-lunar`(KASI 기반) + `astronomia`(MIT)로 음력·양력·천문 계산 가능.
- Swiss Ephemeris는 라이선스(AGPL/상업) 문제로 기본 후보에서 제외.
- 점성학 행성 위치는 VSOP87 계열(퍼블릭 도메인) 또는 `astronomia`로 충분.

### 2.4 신뢰 등급 및 표현 규칙

`domain-sources.md`의 등급을 그대로 사용하되, **UI 텍스트**와 **LLM 프롬프트**에 반영.

| 등급 | 의미 | UI 배지 | 문장 종결 | 예시 |
|------|------|---------|-----------|------|
| `verified` | 공개 데이터·재현 가능한 계산·검증된 알고리즘 | "계산 기반" | 단정형 가능(단 의료·법률 단정 제외) | "수면 시간이 5시간 이하입니다." |
| `conventional` | 전통/문화적 상징 체계 | "전통/상징적 관점" | 서술형·은유적 | "사주에서 목(木) 기운이 강하게 드러나는군요." |
| `caution` | 과학적 근거 약함·개인차 큼·자기투사 | "참고용 관점" | 조건문·주의 | "MBTI는 성향의 한 단면만 보여줄 수 있습니다." |

#### 2.4.1 모든 출력에 공통으로 포함할 문구

- `verified`: "이 정보는 교육·자기성찰용이며 전문 상담을 대체하지 않습니다."
- `conventional`: "이 해석은 전통/상징적 관점으로, 미래를 단정하지 않습니다."
- `caution`: "과학적 근거는 제한적이며, 재미·자기성찰용으로 참고해 주세요."

#### 2.4.2 금지 표현 목록 (Safety Guard Regex/Keyword)

| 금지 표현 | 이유 | 대체 예 |
|-----------|------|---------|
| "~입니다" (의료 맥락) | 진단으로 읽힘 | "~ 가능성이 있습니다" |
| "~병이다", "~장애다" | 의료 진단 | "전문의 상담을 권장합니다" |
| "~약을 드세요" | 처방 | "의사와 상담하세요" |
| "운탙이다", "반드시 ~한다" | 미래 단정 | "~할 수 있는 경향이 보입니다" |
| "떠나야 한다", "투자해야 한다" | 구체적 행동 강요 | "판단에 참고해 보세요" |

---

## 3. 심리학 (Psychology)

### 3.1 적용 지식

- 인지행동치료(CBT): 생각-감정-행동 연결, 인지 왜곡 재구성
- 수용전념치료(ACT): 심리적 유연성, 가치 기반 행동
- 행동활성화(Behavioral Activation): 우울/위축 시 작은 활동 재개
- 접지(Grounding): 공황/과각성 시 현재 순간으로 회귀
- 의사결정 과학: Ottawa Decision Support Framework, Decisional Conflict Scale

### 3.2 검증 도구 및 점수화

#### Decisional Conflict Scale (DCS)

| 항목 | 내용 |
|------|------|
| 문항 수 | 16항 (또는 10항 축약판) |
| 척도 | 1~5 Likert (강하게 동의~강하게 반대) |
| 점수 변환 | (점수 합 - 문항 수) / (문항 수 × 4) × 100 → 0~100 |
| 하위 척도 | 정보 부족, 가치 갈등, 지지 불확실, 효능감(역으로 변환) |
| 임계치 | 0~25 낮음 / 26~37.5 중간 / >37.5 높음 |
| 적용 | DCS ≥ 25 → 의사결정 지원 활성화 |

#### WHO-5 Well-Being Index

| 항목 | 내용 |
|------|------|
| 문항 수 | 5항 |
| 척도 | 0~5 (전혀~항상) |
| 총점 | 0~25 → ×4 하여 0~100 |
| 임계치 | ≤50 웰빙 저하 가능성 / ≤28 임상적 우울 선별 |
| 적용 | WHO-5 ≤ 28 → 심리 건강 가드 강화 |

#### GAD-7 (Generalized Anxiety Disorder-7)

| 항목 | 내용 |
|------|------|
| 문항 수 | 7항 |
| 척도 | 0~3 (전혀 없음~거의 매일) |
| 총점 | 0~21 |
| 구간 | 0~4 최소 / 5~9 경도 / 10~14 중등도 / 15~21 중증 |
| 적용 | ≥10 → 불안 관련 grounding/ACT 기법 제안 |

#### PHQ-9 (Patient Health Questionnaire-9)

| 항목 | 내용 |
|------|------|
| 문항 수 | 9항 |
| 척도 | 0~3 (전혀 없음~거의 매일) |
| 총점 | 0~27 |
| 구간 | 0~4 최소 / 5~9 경도 / 10~14 중등도 / 15~19 중등중증 / 20~27 중증 |
| 9번 문항 | 자해/자살 충동 관련 |
| 적용 | 9번 문항 ≥ 1 → 즉시 위기 프로토콜, 점술 중단 |

### 3.3 상태 → 기법 매핑

| 상태 조합 | 우선 기법 | 행동 제안 |
|-----------|-----------|-----------|
| DCS 높음 + GAD-7 ≥ 10 | 정보 정리 + Grounding | 선택지 3개 이하로 축소, 5-4-3-2-1 grounding |
| DCS 높음 + WHO-5 ≤ 50 | 행동활성화 + 가치 정렬 | "오늘 10분 걷기" 등 작은 활동 |
| DCS 높음 + PHQ-9 ≥ 15 | 위기 자원 연결 | 점술 중단, 전문가 연계 안내 |
| DCS 낮음 + WHO-5 정상 | 강화(Reinforce) | 긍정적 행동 유지, 작은 목표 설정 |

### 3.4 구현 인터페이스 예시

```typescript
interface PsychologicalAssessment {
  dcs?: { total: number; information: number; values: number; support: number; efficacy: number };
  who5?: number;
  gad7?: number;
  phq9?: number;
}

function deriveAdviceMode(assessment: PsychologicalAssessment): AdviceMode {
  if (assessment.phq9 && assessment.phq9 >= 15) return 'crisis';
  if (assessment.gad7 && assessment.gad7 >= 10) return 'panic';
  if (assessment.who5 && assessment.who5 <= 50) return 'withdrawn';
  if (assessment.dcs && assessment.dcs.total >= 25) return 'indecisive';
  return 'reinforce';
}
```

### 3.5 안전 가드

- GAD-7/PHQ-9/WHO-5은 **선별 도구(screening)**이며 임상 진단을 대체할 수 없음.
- PHQ-9 9번 문항(자해) 응답 시 즉시 위기 자원 연결.
- 모든 심리 기법은 "전문 치료자와 상담" 문구를 포함.

---

## 4. 뇌과학 (Brain Science)

### 4.1 적용 지식

| 메커니즘 | 의사결정/행동 영향 | 앱 적용 |
|----------|---------------------|---------|
| HPA 축 과활성 | 만성 스트레스, 충동성, 집중 저하 | 스트레스 점수 → 휴식 권고 |
| 편도체 과활성 | 공황, 위협 과민 반응 | 공황 모드 → grounding + 호흡 |
| 전전두엽(Prefrontal Cortex) 피로 | 결정 피로, 충동적 선택 | 선택지 축소 + 충분성(satisficing) |
| 알로스태틱 부하(Allostatic Load) | 장기적 스트레스 누적 | 수면·욕착·활동 종합 지표 |
| 도파민/보상 회로 | 동기 부여, 보상 기대 | 작은 목표 달성 피드백 |

### 4.2 입력 지표

- 사용자 자가 평가: 피로도(1~5), 스트레스(1~5), 집중력(1~5), 결정 어려움(1~5)
- 수면 데이터: 수면 시간, 효율성, 깊은 수면 비율
- 활동 데이터: 일일 걸음 수, 운동 시간
- 심리 검사: GAD-7, PHQ-9, WHO-5

### 4.3 상태 매핑 규칙

| 상태 | 뇌과학적 해석 | 앱 출력(오늘의 한 걸음) |
|------|---------------|-------------------------|
| 공황/과각성 | 교감신경 과활성, 편도체 반응 | 5-4-3-2-1 grounding, 복식호흡 3분 |
| 위축/무기력 | 도파민 보상 회로 저하, 행동 회피 | 5분 미만의 작은 활동 하나 |
| 결정 피로 | 전전두엽 자원 소모 | 선택지 2~3개로 제한, "충분히 좋은" 선택 허용 |
| 스트레스 누적 | HPA 축·알로스태틱 부하 | 10분 휴식, 야외 햇빛, 수면 우선 |

### 4.4 신뢰 경계

- 개인의 뇌 상태를 직접 측정하지 않음. 사용자 입력과 행동 지표를 바탕으로 한 **추정/교육적 설명**.
- fMRI·EEG 수준의 진단 표현 금지.

---

## 5. 수면과학 (Sleep Science)

### 5.1 적용 지식

- 수면 단계: N1(졸림), N2(경수면), N3(깊은 수면·완수면), REM(램수면)
- 수면 효율: (실제 수면 시간 / 침대 시간) × 100
- 수면 위생(Sleep Hygiene): 일정한 취침/기상, 어두운 환경, 카페인 제한 등
- 수면 부족의 영향: 주의력 저하, 충동성, 정서 조절 약화, 결정 품질 저하

### 5.2 입력 방식

#### 자가 입력 (기본)

| 항목 | 입력 | 산출 |
|------|------|------|
| 취침 시간 | 시각 | 수면 지연(latency), 수면 기간 |
| 기상 시간 | 시각 | 수면 기간 |
| 중간 깸 횟수 | 횟수 | 수면 연속성 |
| 수면 질 | 1~5 | 주관적 지표 |
| 피로도 | 1~5 | 주관적 지표 |

#### 웨어러블 연동 (확장)

| 플랫폼 | 데이터 | 권한/주기 |
|--------|--------|-----------|
| Apple HealthKit | SleepAnalysis, HKCategoryValueSleepAnalysis | iOS 권한, 백그라운드 동기화 |
| Google Health Connect | SleepSessionRecord, SleepStageRecord | Android 9(API 28)+, 런타임 권한(Android 14+ 기기 내장) |
| Fitbit Web API | Sleep logs, stages | OAuth, 일일 동기화 |

Health Connect 수면 단계:

- `STAGE_TYPE_AWAKE`
- `STAGE_TYPE_AWAKE_IN_BED`
- `STAGE_TYPE_LIGHT`
- `STAGE_TYPE_DEEP`
- `STAGE_TYPE_REM`
- `STAGE_TYPE_SLEEPING` (단일 단계)
- `STAGE_TYPE_OUT_OF_BED`
- `STAGE_TYPE_UNKNOWN`

### 5.3 수면 점수 모델

#### 참고: Pittsburgh Sleep Quality Index (PSQI)

- 19문항, 7개 구성요소, 각 0~3점 → 총점 0~21
- 7개 구성요소: 주관적 수면 질, 수면 지연, 수면 기간, 수면 효율, 수면 방해, 수면 약물 사용, 낮 기능 장애
- **>5점: 수면 질 나쁨(poor sleep quality)**

#### 앱 내 간이 수면 점수 (0~100, 높을수록 좋음)

| 구성 요소 | 가중치 | 계산 |
|-----------|--------|------|
| 수면 기간 | 25% | 7~9시간 = 100점, <5시간 = 0점, 선형 보간 |
| 수면 효율 | 25% | >85% = 100점, <65% = 0점 |
| 수면 지연 | 15% | <15분 = 100점, >60분 = 0점 |
| 주관적 질 | 20% | 5점 척도 역산 |
| 중간 깸 | 10% | 0회 = 100점, ≥5회 = 0점 |
| 깊은 수면 비율(웨어러블) | 5% | 15~20% = 100점 |

```typescript
function sleepScore(input: SleepInput): number {
  const duration = clamp((input.hours - 5) / 4, 0, 1) * 25;
  const efficiency = clamp((input.efficiency - 65) / 20, 0, 1) * 25;
  const latency = clamp(1 - (input.latencyMin - 15) / 45, 0, 1) * 15;
  const quality = (input.quality / 5) * 20;
  const awakenings = clamp(1 - input.awakenings / 5, 0, 1) * 10;
  const deep = input.deepPct ? clamp(1 - Math.abs(input.deepPct - 17.5) / 7.5, 0, 1) * 5 : 2.5;
  return Math.round(duration + efficiency + latency + quality + awakenings + deep);
}
```

### 5.4 상태 판별 및 행동 제안

| 수면 상태 | 의사결정 영향 | 오늘의 한 걸음 |
|-----------|---------------|----------------|
| 점수 ≥ 80 | 정상 | 현재 수면 루틴 유지 |
| 점수 60~79 | 경도 저하 | 취침 15분 앞당기기, 디카페인 전환 |
| 점수 40~59 | 중등도 저하 | 중요 결정 연기 권고, CBT-I 원칙 안내 |
| 점수 < 40 | 중증 | 전문의 상담 권장, 점술 중 아닌 위생 교육 |

### 5.5 안전 가드

- 수면 약물 처방/권유 금지.
- 수면 무호흡증 등 의심 증상(코골이, 낮 졸음) 시 전문의 상담 안내.
- PSQI는 선별 도구이며 진단 아님.

---

## 6. 한의학·체질 (TCM & Sasang Constitution)

### 6.1 적용 지식

- 사상체질의학(Sasang Constitutional Medicine): 태양인(太陽人), 태음인(太陰人), 소양인(少陽人), 소음인(少陰人)
- 음양오행: 목(木)·화(火)·토(土)·금(金)·수(水)
- 사주 오행 분포와의 상관: 전통적 상징 매핑

### 6.2 사상체질 간이 설문

#### 참고: QSCC II (Questionnaire for Sasang Constitution Classification II)

- 총 121문항: 심리 54, 행동 36, 신체 11, 건강/질병 20
- KIOM(한국한의학연구원)에서 개발, Win QSCC II로 계산
- 앱에서는 **간이 버전**만 제공(8~16문항)

#### 앱 내 간이 설문 예시

| 영역 | 문항 예시 | 응답 |
|------|-----------|------|
| 체형 | "어깨와 가슴이 발달한 편인가?" | 예/아니오/중간 |
| 추위/더위 | "겨울에 손발이 차가운가?" | 예/아니오/중간 |
| 소화 | "식후 소화가 잘 되지 않는가?" | 예/아니오/중간 |
| 대변 | "대변 상태는?" | 딱딱/보통/무른 |
| 성격 | "성격이 급하고 외향적인가?" | 예/아니오/중간 |
| 피로 | "피로를 쉽게 느끼는가?" | 예/아니오/중간 |

#### 점수화

- 각 문항을 4체질 축으로 매핑.
- 가중합 후 백분율로 변환.
- 최고 점수 체질을 "경향"으로 표시, 2순위도 함께 제시.

```typescript
interface SasangScores {
  taeyang: number; // 太陽
  taeeum: number;  // 太陰
  soyang: number;  // 少陽
  soeum: number;   // 少陰
}

function dominantConstitution(scores: SasangScores): {
  primary: keyof SasangScores;
  secondary: keyof SasangScores;
  percentages: SasangScores;
} {
  const total = scores.taeyang + scores.taeeum + scores.soyang + scores.soeum;
  const pct = {
    taeyang: round(scores.taeyang / total * 100),
    taeeum: round(scores.taeeum / total * 100),
    soyang: round(scores.soyang / total * 100),
    soeum: round(scores.soeum / total * 100),
  };
  const sorted = Object.entries(pct).sort((a, b) => b[1] - a[1]);
  return { primary: sorted[0][0] as keyof SasangScores, secondary: sorted[1][0] as keyof SasangScores, percentages: pct };
}
```

### 6.3 사주 오행과의 매핑

| 사주 오행 | 한의학적 상징 | 생활 습관 키워드 |
|-----------|---------------|------------------|
| 목(木) 과다 | 간(肝) 기운, 스트레스 민감 | 스트레스 해소, 자연 산책 |
| 목(木) 부족 | 동기/계획 약화 | 아침 루틴, 작은 목표 |
| 화(火) 과다 | 심(心) 화, 흥분·불면 | 저녁 자극 줄이기 |
| 화(火) 부족 | 동기·열정 저하 | 사회적 연결, 즐거운 활동 |
| 토(土) 과다 | 비위(脾胃) 부담 | 규칙적 식사, 소화에 좋은 식품 |
| 토(土) 부족 | 안정감·지구력 부족 | 일정한 일과, 규칙적 수면 |
| 금(金) 과다 | 폐(肺)·대장 긴장 | 호흡 운동, 정리정돈 |
| 금(金) 부족 | 경계·판단력 흐림 | 명확한 기준 설정 |
| 수(水) 과다 | 신(腎)·방광, 두려움 | 신체 활동, 따뜻한 음식 |
| 수(水) 부족 | 회복력·지구력 저하 | 충분한 휴식, 수분 섭취 |

### 6.4 출력 및 안전

- 출력: "생활 습관 수준의 일반 정보"로 제한.
- 금지: 처방·약재·진단·특정 질병 언급.
- 문구: "이 내용은 전통적 상징 관점의 참고용이며, 건강 문제는 한의사·의사와 상담하세요."

---

## 7. 전통문화·운세 (Traditional Oracles)

### 7.1 사주(만세력)

#### 입력

- 양력 또는 음력 생년월일
- 시각(선택, "unknown" 가능)
- 출생지 경도(진태양시 보정용)
- 성별(대운 방향 계산용, 일부 학파)

#### 계산 파이프라인

```
[생년월일시 + 출생지]
    ↓
[양력↔음력 변환] ── kor-lunar (KASI 데이터)
    ↓
[절기 기준 월주 산정] ── 입춘(立春)을 연초로
    ↓
[자시 처리] ── 조자시(23:00 시작) 또는 야자시(00:00 시작) 옵션
    ↓
[진태양시 보정] ── 경도 차이 + 균시차(선택)
    ↓
[서머타임 예외 처리] ── 1948~1988 한국 서머타임 테이블
    ↓
[천간지지 4주 산출]
    ↓
[십성, 지장간, 12운성, 12신살, 오행 백분율, 신강/신약, 용신]
```

#### 핵심 계산 규칙

| 항목 | 규칙 | 비고 |
|------|------|------|
| 연주 | 년도의 천간지지 (60갑자 순환) | 1980년 = 경신(庚申) |
| 월주 | 입춘을 기준으로 절기에 따라 월주 결정 | 입춘 전 출생은 전년 해월(亥月) |
| 일주 | 일간(日干)은 양력 기준 만세력 표 참조 | 골든 케이스: 1980-03-19 = 신미(辛未) |
| 시주 | 출생 시각 → 12지시로 변환 | 01:45 = 축시(丑時) |
| 지장간 | 각 지지에 내재된 천간 | 예: 자(子) = 임(壬) |
| 십성 | 일간 기준 다른 천간의 관계 | 비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인 |
| 오행 백분율 | 천간지지의 오행 분포 합산 | 목/화/토/금/수 비율 |
| 신강/신약 | 계절·지지 지원 정도 | 봄 목(木) 일간 = 신강 경향 |
| 용신 | 일간을 돕는 오행 | 골든 케이스: 신(金) 일간, 용신 목(木) |

#### 골든 케이스

- 입력: 1980-03-19 01:45 대구 남
- 기대 출력: 辛金 일간, 토37.5 / 금37.5 / 목25 / 화0 / 수0, 용신 목, 대운수 6
- 이 값은 단위/골든 테스트의 정답으로 사용.

### 7.2 토정비결

- 입력: 음력 생년월일 + 당핀년(현재 연도)
- 계산: (년, 월, 일) → 144(=12×12) 인덱스
- 주의: 상용 토정비결 해설은 저작권 보호 대상 → 인덱스 산출만 자체 구현, 해설은 자체 작성.

### 7.3 띠(12지)

- 입력: 생년
- 계산: (년도 - 4) % 12 → 12지 동물
- 설정: 입춘 또는 음력설 기준 선택

```typescript
const zodiacAnimals = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
function getZodiac(year: number, standard: 'lichun' | 'lunarNewYear' = 'lichun'): string {
  const base = standard === 'lichun' ? (isBeforeLichun(year) ? year - 1 : year) : year;
  return zodiacAnimals[(base - 4) % 12];
}
```

### 7.4 주역(I Ching)

- 64괘, 각 괘는 6효(爻)로 구성.
- 점괘: 사용자 질문 맥락 + 의도적 난수(의식적 선택)로 6효 생성.
- 변효(變爻) 처리:老陰/老陽에서 변화 발생.
- 해석: "상징적 거울"로만 사용, 미래 단정 금지.

### 7.5 타로

- 78장(대아르카나 22장 + 소아르카나 56장)
- 스프레드: 1장(오늘의 카드), 3장(과거-현재-미래 또는 상황-행동-결과)
- 난수: 의도적 섞기(virtual shuffle) + 사용자 클릭 타이밍 시드
- 역위치(reversed): 50% 확률 또는 사용자가 선택

### 7.6 Ifá

- 16 주인오루(Odu Ifá) + 256 오두(16×16)
- 난수: 전통적으로는 토양/콩나무(opele) 또는 손가락 점법.
- 디지털: 사용자 의식적 선택 + 시드 기반 난수.
- 문화적 존중: Ifá는 종교·철학적 전통이므로 "상징적 프레임"으로만 제시.

### 7.7 기타 날짜 기반 상징 도구

- **나인 스타 키(九星気学)**: 연성=(11-((년-4)%9)), 월성=입춘 기준 표, 일성=180일 주기 표
- **켈틱 나무 점성학**: 월일 → 21개 나무 기 구간 매핑
- **베다 점성학(Jyotish)**: Lahiri 아야남사 + 사이드리얼 황도

---

## 8. 서양 점성학 (Western Astrology — Natal Chart)

### 8.1 적용 범위

- 출생 별도(Natal Chart) 수준.
- 시각 모름 시: 태양궁 + 달 궁 위치만, 하우스/ASC/MC 제외.

### 8.2 입력

```typescript
interface NatalInput {
  date: string;        // "1990-07-15"
  time?: string;       // "14:30:00" 또는 undefined
  lat: number;         // 위도 (-90 ~ 90)
  lng: number;         // 경도 (-180 ~ 180)
  timezone: string;    // "Asia/Seoul"
}
```

### 8.3 시간 보정 파이프라인

```
[출생지 로컬 시각]
    ↓ 타임존 오프셋 + 서머타임/일광절약시간 예외 테이블
[UTC]
    ↓ 선택: 균시차(equation of time) 보정
[UT1]
    ↓ 경도 차이 (1° = 4분)
[진태양시 / Local Apparent Time]
    ↓ 항성시(Sidereal Time) 계산
[Local Sidereal Time]
```

### 8.4 행성 위치 계산

- **태양/달**: `astronomia`의 태양/달 황경, 또는 VSOP87 + ELP2000-82B
- **태양·달·수성·금성·화성·목성·토성(고전 7행성)**: VSOP87A/B/D 계열
- **추천 라이브러리**:
  - `astronomia`(npm, MIT): 태양·달·주요 행성 경량 계산
  - `vsop87-multilang`(GitHub, MIT): 다양한 언어의 VSOP87 구현
  - `astronomy-engine`(npm, MIT): Sun/Moon/Planet 위치
- **금지/주의**: Swiss Ephemeris(`swisseph`)는 AGPL/상업 라이선스 → 기본 후보 제외

### 8.5 하우스 시스템

| 시스템 | 특징 | 적용 |
|--------|------|------|
| **Placidus** | 시간 기반 반원 삼분할, 가장 대중적 | 기본값. 고위도(>60°)에서 왜곡 |
| **Whole Sign** | ASC 별자리를 1궁, 각 별자리 30° | 고대/단순, 극지방 안전 |
| **Equal House** | ASC 정확도로부터 30° 간격 | 극지방 안전, 구현 단순 |
| **Koch** | MC 반원 삼분할, 유럽 일부 인기 | Placidus와 유사한 고위도 문제 |

**Placidus 알고리즘 개요:**

1. 황도(ecliptic) 상의 점이 지평선에서 상천(meridian)까지 가는 시간(반원)을 측정.
2. 이 반원을 3등분.
3. 각 분할 시점에 황도가 어디에 있는지 역산(iterative).
4. 10궁 = MC, 1궁 = ASC, 중간 쿠스프는 반원 삼분점.
5. 66.5° 이상 극지방에서는 circumpolar 문제로 실패 → Whole Sign 폴백.

```typescript
function computeHouses(
  lst: number,      // Local Sidereal Time (degrees)
  lat: number,      // latitude
  obliquity: number // obliquity of ecliptic (degrees)
): HouseCusps {
  // Placidus: iterative solution
  // Whole Sign fallback if lat > 60 or lat < -60
  if (Math.abs(lat) > 60) {
    return computeWholeSignHouses(lst, lat, obliquity);
  }
  return computePlacidusHouses(lst, lat, obliquity);
}
```

### 8.6 주요 천문 지점

| 지점 | 의미 | 계산 |
|------|------|------|
| ASC (Ascendant) | 동쪽 지평선과 황도 교점 | 태양/행성이 뜨는 지점 |
| MC (Midheaven) | 상천(남중)과 황도 교점 | 사회적·직업적 상징 |
| DESC | ASC의 정반대 | 관계 상징 |
| IC | MC의 정반대 | 가정·내면 상징 |

### 8.7 Aspect (행성 각도)

| 각도 | 이름 | 허용 오차(Orb) |
|------|------|----------------|
| 0°   | 합(Conjunction) | ±8° |
| 60°  | 육합(Sextile) | ±6° |
| 90°  | 사각(Square) | ±8° |
| 120° | 삼각(Trine) | ±8° |
| 180° | 대립(Opposition) | ±8° |

### 8.8 출력 및 해석 프레임

- "성향의 거울"로만 제시.
- 예: "태양은 의식적 정체성, 달은 감정 패턴, 상승은 대외적 태도를 상징합니다."
- 모든 해석은 "오늘의 한 걸음" 행동 제안으로 종결.

### 8.9 샘플 케이스

- 입력: 1990-07-15 14:30, 서울(37.5665°N, 126.9780°E)
- 기대: 태양궁 = 게자리 초반, ASC는 천문 계산으로 산출
- 이 값은 단위/골든 테스트의 정답으로 사용.

---

## 9. 통합 상태 엔진 및 안전 가드

### 9.1 상태 엔진

```typescript
interface StateVector {
  sleepScore: number;      // 0~100
  stressLevel: number;     // 0~100
  activityLevel: number;   // 0~100 (steps/exercise)
  decisionConflict: number; // DCS total 0~100
  anxiety: number;         // GAD-7 0~21
  depression: number;      // PHQ-9 0~27
  wellBeing: number;       // WHO-5 0~100
}

type AdviceMode = 'reinforce' | 'indecisive' | 'withdrawn' | 'panic' | 'crisis';

function determineAdviceMode(state: StateVector): AdviceMode {
  if (state.depression >= 15) return 'crisis';
  if (state.anxiety >= 10) return 'panic';
  if (state.wellBeing <= 50 || state.sleepScore < 40) return 'withdrawn';
  if (state.decisionConflict >= 25) return 'indecisive';
  return 'reinforce';
}
```

### 9.2 에비던스 엔진

- `verified` 도구(DCS, WHO-5, GAD-7, PHQ-9, 수면)가 기본 골격.
- `conventional`/`caution` 도구는 가중치를 낮게(0~50%) 적용.
- 위험도 기반 가중치:
  - 일상/성찰: 50%
  - 대인관계/직업: 30%
  - 건강/재정/법률: 10%
  - 위기: 0%

### 9.3 위기 감지 및 안전 가드

| 위기 유형 | 키워드/조건 | 조치 |
|-----------|-------------|------|
| 자해/자살 | "죽고 싶다", "끝내고 싶다", PHQ-9 9번 ≥1 | 점술 중단, 위기 핫라인 연결 |
| 타해/폭력 | "누군가를 해치고 싶다" | 점술 중단, 경찰/상담 연결 |
| 의료 응급 | "가슴 통증", "호흡 곤란", "의식 손실" | 119/911 안내, 의료 면책 문구 |
| 폭력/학대 | "누군가가 나를 때린다" | 상담소/핫라인 연결 |
| 의료 단정 | "~병이다", "~약을 드세요" | LLM 출력 후처리 필터 차단 |

#### 1단계 위기 자원 표 (한국)

> 사용자가 위기 신호를 보이면 점술 응답을 중단하고 아래 번호/기관 중 적절한 곳으로 연결 안내한다. 2단계에서 ISO 국가코드 기반 표로 확장한다.

| 국가 | 위기 유형 | 번호 | 기관/설명 |
|------|-----------|------|-----------|
| 한국 | 자살/정서 위기 | **1393** | 보걵복지부 자살예방상담전화 (24시간) |
| 한국 | 정신건강 위기 | **1577-0199** | 정신건강위기상담전화 (24시간) |
| 한국 | 응급 의료 | **119** | 소방당국 (음성·영상통화 가능) |
| 한국 | 가정폭력·성폭력·학대 | **1366** | 여성가족부 통합지원센터 (24시간) |
| 한국 | 청소년 상담 | **1388** | 청소년상담센터 (24시간) |
| 한국 | 일반 복지/생활 상담 | **129** | 보걵복지상담센터 |
| 한국 | 범죄/신고 | **112** | 경찰청 |

### 9.4 출력 후처리 가드

```typescript
function safetyGuard(text: string): { safe: boolean; text: string; reason?: string } {
  const forbidden = [
    /\b(진단|처방|약을\s*드세요|~입니다)\b/,
    /\b(자살|자해|죽고\s*싶다)\b/,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(text)) {
      return { safe: false, text: '', reason: `Forbidden pattern matched: ${pattern}` };
    }
  }
  return { safe: true, text };
}
```

---

## 10. 구현 우선순위 및 단계

### 10.1 1단계 (MVP)

1. 사주 계산 엔진 (kor-lunar + 자체 만세력)
2. 서양 점성학 태양궁 + 달 궁 (시각 모름 대응)
3. DCS, WHO-5, GAD-7, PHQ-9 점수화
4. 기본 상태 엔진 (수면 자가 입력 + 심리 검사)
5. 위기 감지 및 안전 가드

### 10.2 2단계

1. 서양 점성학 Natal Chart (Placidus + Whole Sign 폴백)
2. 수면 웨어러블 연동 (HealthKit/Health Connect)
3. 사상체질 간이 설문
4. 토정비결/띠/주역/타로 모듈

### 10.3 3단계

1. 베다 점성학, 나인 스타 키, 켈틱 나무 등 글로벌 모듈
2. 고급 시간보정(균시차, UT1)
3. 사용자 피드백 기반 해석 개선

---

## 11. 검증 및 테스트

### 11.1 골든 케이스

| 도구 | 입력 | 기대 출력 |
|------|------|------------|
| 사주 | 1980-03-19 01:45 대구 남 | 辛金 일간, 토37.5/금37.5/목25/화0/수0, 용신목, 대운수 6 |
| 서양 점성학 | 1990-07-15 14:30 서울 | 태양궁 게자리, ASC/MC는 천문 계산 검증 |

### 11.2 단위 테스트 커버리지

- 시간 변환: UTC ↔ 로컬 ↔ 진태양시
- 음양력 변환: 1900~2100년 샘플
- 12궁 경계일: 매년 3월 20~21일, 9월 22~23일
- Placidus 쿠스프: 위도 0°~60° 샘플
- 심리 검사 점수화: 임계치 경계값

### 11.3 안전 시나리오

- PHQ-9 9번 문항 ≥1 → 위기 연결
- 의료 단정 표현 입력 → 면책 응답
- 고위험 결정(의료/법률) → 점술 가중 0%

---

## 12. 참고 문헌 및 데이터 출처

- Buysse, D. J., Reynolds, C. F., Monk, T. H., Berman, S. R., & Kupfer, D. J. (1989). The Pittsburgh Sleep Quality Index. *Psychiatry Research*, 28(2), 193-213.
- Spitzer, R. L., et al. (2006). A brief measure for assessing generalized anxiety disorder. *Annals of Internal Medicine*.
- Kroenke, K., et al. (2001). The PHQ-9. *Journal of General Internal Medicine*.
- Topp, C. W., et al. (2015). The WHO-5 Well-Being Index. *Psychotherapy and Psychosomatics*.
- O'Connor, A. M. (1995). Validation of a decisional conflict scale. *Medical Decision Making*.
- Kim, J. Y., et al. (2012). Development of an integrated Sasang constitution diagnosis method. *BMC Complementary and Alternative Medicine*.
- Meeus, J. (1998). *Astronomical Algorithms* (2nd ed.). Willmann-Bell.
- Bretagnon, P., & Francou, G. (1988). VSOP87 planetary theories.
- Korea Astronomy and Space Science Institute (KASI). 음양력 데이터.
- 한국천문연구원(KASI), `kor-lunar` 라이브러리.

---

## 13. 결론

본 가이드는 `research1.md`의 학술 근거와 `domain-sources.md`의 도구 후보를 **구현 가능한 기술 사양**으로 연결한다. 핵심은 "과학이 골격, 전통이 거울"이며, 모든 계산은 재현 가능하고, 모든 출력은 안전 가드를 통과해야 한다. 1단계 MVP부터 점진적으로 확장하면서, 각 분야의 검증된 방법을 우선 적용하고 과학적 근거가 약한 부분은 `caution` 등급으로 명확히 구분해야 한다.
