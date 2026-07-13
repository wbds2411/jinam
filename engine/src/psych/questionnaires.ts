/**
 * 심리 선별 도구 한국어 문항 (비상업 연구·선별용 표준 문항의 요지 번안)
 * - 선별 도구이며 임상 진단을 대체하지 않는다는 안내를 UI에 항상 표시할 것.
 */

export interface QuestionnaireDef {
  id: 'dcs' | 'who5' | 'gad7' | 'phq9';
  title: string;
  description: string;
  scaleLabels: string[]; // index = 응답값 (DCS는 값-1)
  minValue: number;
  questions: string[];
}

export const DCS_10: QuestionnaireDef = {
  id: 'dcs',
  title: '의사결정 갈등 (DCS 축약판)',
  description: '지금 고민 중인 선택에 대해 얼마나 동의하는지 답해주세요.',
  scaleLabels: ['강하게 동의', '동의', '중립', '반대', '강하게 반대'],
  minValue: 1,
  questions: [
    '어떤 선택지가 있는지 알고 있다',
    '각 선택지의 장점을 알고 있다',
    '각 선택지의 단점(위험)을 알고 있다',
    '어떤 장점이 나에게 가장 중요한지 분명하다',
    '어떤 단점이 나에게 가장 중요한지 분명하다',
    '선택하기에 충분한 지지를 받고 있다',
    '타인의 압박 없이 선택하고 있다',
    '선택을 위한 조언을 충분히 받았다',
    '무엇이 최선의 선택인지 분명하다',
    '이 결정을 내리는 것이 쉽게 느껴진다',
  ],
};

export const WHO5: QuestionnaireDef = {
  id: 'who5',
  title: '웰빙 지수 (WHO-5)',
  description: '지난 2주 동안 어떻게 느꼈는지 답해주세요.',
  scaleLabels: ['전혀 없었다', '가끔', '절반 이하', '절반 이상', '대부분', '항상'],
  minValue: 0,
  questions: [
    '나는 즐겁고 좋은 기분이었다',
    '나는 차분하고 편안했다',
    '나는 활동적이고 활기찼다',
    '나는 상쾌하게 잘 쉬었다는 느낌으로 일어났다',
    '나의 일상은 흥미로운 일들로 채워져 있었다',
  ],
};

export const GAD7: QuestionnaireDef = {
  id: 'gad7',
  title: '불안 선별 (GAD-7)',
  description: '지난 2주 동안 다음 문제들로 얼마나 자주 불편했는지 답해주세요.',
  scaleLabels: ['전혀 없음', '며칠', '절반 이상', '거의 매일'],
  minValue: 0,
  questions: [
    '초조하거나 불안하거나 조마조마함을 느낌',
    '걱정을 멈추거나 조절할 수 없음',
    '여러 가지 일에 대해 지나치게 걱정함',
    '편하게 있기가 어려움',
    '너무 안절부절못해서 가만히 있기 힘듦',
    '쉽게 짜증이 나거나 화가 남',
    '끔찍한 일이 일어날 것처럼 두려움을 느낌',
  ],
};

export const PHQ9: QuestionnaireDef = {
  id: 'phq9',
  title: '기분 선별 (PHQ-9)',
  description: '지난 2주 동안 다음 문제들로 얼마나 자주 불편했는지 답해주세요.',
  scaleLabels: ['전혀 없음', '며칠', '절반 이상', '거의 매일'],
  minValue: 0,
  questions: [
    '일에 대한 흥미나 즐거움이 거의 없음',
    '기분이 가라앉거나 우울하거나 희망이 없음',
    '잠들기 어렵거나 자주 깸, 혹은 너무 많이 잠',
    '피곤하거나 기운이 거의 없음',
    '입맛이 없거나 과식함',
    '자신이 실패자라고 느끼거나 자신과 가족을 실망시켰다고 느낌',
    '신문이나 TV 보기 같은 일에 집중하기 어려움',
    '다른 사람이 알아챌 정도로 느리게 움직이거나, 반대로 안절부절못함',
    '차라리 죽는 것이 낫겠다고 생각하거나 자해를 생각함',
  ],
};

export const QUESTIONNAIRES: QuestionnaireDef[] = [DCS_10, WHO5, GAD7, PHQ9];
