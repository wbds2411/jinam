import type { TojeongResult } from '../types.js';

// 토정비결 144괘 인덱스 산출
// 전승에 따라 알고리즘이 다양함. 여기서는 결정적이고 재현 가능한 공식을 사용.
// [CONFIRM] 실제 사용 시 출처 확정 및 라이선스 검증 필요.
export function calculateTojeong(lunarYear: number, lunarMonth: number, lunarDay: number, currentYear: number): TojeongResult {
  const index = Math.abs(
    (lunarYear + lunarMonth + lunarDay + currentYear) % 144
  );

  const names = [
    '천덕', '월덕', '천의', '지덕', '인덕', '복덕',
    '경덕', '수덕', '명덕', '신덕', '가덕', '효덕',
  ];
  const keywords = [
    '때를 기다리면 뜻이 이루어집니다',
    '작은 성취로 시작해 큰 흐름을 만듭니다',
    '남을 돕는 것이 곧 나를 돕는 길입니다',
    '고요 속에서 본질이 보입니다',
    '먼저 나서기보다 맥락을 읽으세요',
    '오늘의 작은 실천이 내일을 바꿉니다',
  ];

  return {
    index,
    name: names[index % names.length] ?? '미정',
    keyword: keywords[index % keywords.length] ?? '오늘의 한 걸음을 떼세요',
  };
}
