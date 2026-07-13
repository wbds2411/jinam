import type { AdviceMode, CrisisDetectionResult, CrisisType, Hotline } from './types.js';

const HOTLINES: Hotline[] = [
  { country: 'KR', name: '자살예방상담전화', number: '109' },
  { country: 'KR', name: '정신건강위기상담전화', number: '1577-0199' },
  { country: 'KR', name: '긴급 도움', number: '112 또는 119' },
  { country: 'US', name: '988 Suicide & Crisis Lifeline', number: '988' },
  { country: 'US', name: 'Emergency', number: '911' },
  { country: 'GB', name: 'Samaritans', number: '116 123' },
  { country: 'GB', name: 'Emergency', number: '999 또는 112' },
];

const NEGATED_CRISIS_PATTERNS = [
  /죽고\s*싶지\s*않/,
  /자살(?:할)?\s*(?:생각|의도)(?:은|가)?\s*없/,
  /자해(?:할)?\s*(?:생각|의도)(?:은|가)?\s*없/,
  /(?:나|남을|누구를)?\s*해치고\s*싶지\s*않/,
  /(?:do not|don't)\s+want\s+to\s+(?:die|hurt)/i,
];

export function getCrisisResources(country = 'KR'): Hotline[] {
  const resources = HOTLINES.filter(hotline => hotline.country === country);
  return resources.length > 0 ? resources : [
    { country, name: '지역 응급 서비스', number: '현지 응급번호' },
    { country, name: '국가별 위기 지원 검색', number: 'findahelpline.com' },
  ];
}

const CRISIS_PATTERNS: { type: CrisisType; keywords: string[] }[] = [
  {
    type: 'suicide',
    keywords: [
      '죽고 싶', '죽을래', '죽어야', '자살', '목매', '투신', '끝내고 싶',
      '살기 싫', '더 이상 살', '생을 끊', '사라지고 싶', '없어지고 싶',
      '깨어나지 않았으면', '깨지 않았으면', '모든 걸 끝내', '살 이유가 없', '내가 없어도',
      'end my life', 'suicide', 'kill myself', 'not wake up', 'no reason to live', 'disappear',
    ],
  },
  {
    type: 'self-harm',
    keywords: [
      '자해', '자를래', '피를 보', '상처내', '손목', '베고 싶', '때리고 싶',
      'self-harm', 'cut myself', 'hurt myself',
    ],
  },
  {
    type: 'harm-others',
    keywords: [
      '죽이고 싶', '때려 죽', '복수', '죽여버릴', '다 죽', 'kill them', 'hurt someone',
    ],
  },
];

// crisis는 키워드 분류가 아니라 detectCrisis/심리 평가로만 진입한다.
type KeywordMode = Exclude<AdviceMode, 'crisis'>;
const MODE_PATTERNS: Record<KeywordMode, string[]> = {
  panic: [
    '숨이 막혀', '심장이 뛰어', '공황', '패닉', '겁나', '무서워', '떨려', '호흡',
    'panic', 'can\'t breathe', 'heart racing',
  ],
  withdrawn: [
    '의욕 없어', '나아질 수 없', '무기력', '누워만', '아무것도 하기 싫', '위축',
    '자신감 없', 'depresse', 'no energy', 'can\'t get up',
  ],
  indecisive: [
    '결정 못 하', '선택 못 하', '뭐가 맞는지', '고민', '망설여', '결정장애',
    'decide', 'can\'t choose', 'stuck between',
  ],
  reinforce: [
    '운세', '타로', '오늘 운세', '잘될까', '힘이 돼', '확신', '용기',
    'horoscope', 'tarot', 'will it work',
  ],
};

export function detectCrisis(userMessage: string, country = 'KR'): CrisisDetectionResult {
  const lower = userMessage.toLowerCase();
  const hasExplicitNegation = NEGATED_CRISIS_PATTERNS.some(pattern => pattern.test(lower));
  const hasConflictingRisk = /그런데|하지만|자꾸|계속|충동|계획|방법|도구/.test(lower);
  if (hasExplicitNegation && !hasConflictingRisk) {
    return { crisis: false, hotline: getCrisisResources(country)[0].number, message: '' };
  }

  for (const { type, keywords } of CRISIS_PATTERNS) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        const resources = getCrisisResources(country);
        const resourceText = resources.map(resource => `${resource.name} ${resource.number}`).join(', ');
        return {
          crisis: true,
          type,
          hotline: resources[0].number,
          message: `지금 힘든 마음이 느껴져요. 당신의 안전이 가장 중요합니다. 전문 지원과 연결해 보세요: ${resourceText}. 즉각적인 위험이 있다면 현지 응급 서비스에 연락하세요. 우리는 점술로 이 상황을 넘기려 하지 않을게요.`,
        };
      }
    }
  }
  return { crisis: false, hotline: getCrisisResources(country)[0].number, message: '' };
}

export function classifyState(userMessage: string): AdviceMode {
  const lower = userMessage.toLowerCase();
  let bestMode: KeywordMode = 'reinforce';
  let maxScore = 0;

  for (const [mode, keywords] of Object.entries(MODE_PATTERNS) as [KeywordMode, string[]][]) {
    const score = keywords.reduce((acc, kw) => {
      const regex = new RegExp(kw, 'i');
      return acc + (regex.test(lower) ? 1 : 0);
    }, 0);
    if (score > maxScore) {
      maxScore = score;
      bestMode = mode;
    }
  }

  return bestMode;
}
