import type { AdviceMode, CrisisDetectionResult, CrisisType, Hotline } from './types.js';

// 1단계: 한국 기준. 2단계에서 국가별 확장.
const DEFAULT_HOTLINES: Hotline[] = [
  { country: 'KR', name: '자살예방상담전화', number: '109' },
  { country: 'KR', name: '정신건갡위기상담전화', number: '1577-0199' },
];

const CRISIS_PATTERNS: { type: CrisisType; keywords: string[] }[] = [
  {
    type: 'suicide',
    keywords: [
      '죽고 싶', '죽을래', '죽어야', '자살', '목매', '투신', '끝내고 싶',
      '살기 싫', '더 이상 살', '생을 끊', 'end my life', 'suicide', 'kill myself',
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

const MODE_PATTERNS: Record<AdviceMode, string[]> = {
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
  for (const { type, keywords } of CRISIS_PATTERNS) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        const hotlines = DEFAULT_HOTLINES.filter(h => h.country === country);
        const hotlineText = hotlines.map(h => `${h.name} ${h.number}`).join(', ');
        return {
          crisis: true,
          type,
          hotline: hotlines[0]?.number ?? DEFAULT_HOTLINES[0].number,
          message: `지금 힘든 마음이 느껴져요. 당신의 안전이 가장 중요합니다. 전문 상담사와 연결해 보세요: ${hotlineText}. 우리는 점술로 이 상황을 넘기려 하지 않을게요.`,
        };
      }
    }
  }
  return {
    crisis: false,
    hotline: DEFAULT_HOTLINES[0].number,
    message: '',
  };
}

export function classifyState(userMessage: string): AdviceMode {
  const lower = userMessage.toLowerCase();
  let bestMode: AdviceMode = 'reinforce';
  let maxScore = 0;

  for (const [mode, keywords] of Object.entries(MODE_PATTERNS) as [AdviceMode, string[]][]) {
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
