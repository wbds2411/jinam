import { saju } from '@jinam/engine';

const BRANCH_ACTIONS: Record<string, string> = {
  子: '새로 시작할 일 하나를 작게 정해 보세요.',
  丑: '서두르기보다 미뤄 둔 한 가지를 정리해 보세요.',
  寅: '망설이던 일의 첫 단계를 10분만 실행해 보세요.',
  卯: '혼자 결론 내리기 전에 믿을 만한 사람과 이야기해 보세요.',
  辰: '선택지의 장단점을 한 줄씩 적어 보세요.',
  巳: '집중할 한 가지를 정하고 방해 요소를 잠시 치워 보세요.',
  午: '에너지를 쓰기 전에 오늘의 우선순위를 확인해 보세요.',
  未: '완벽한 답보다 지금 가능한 현실적인 답을 골라 보세요.',
  申: '익숙한 방식 외에 대안 하나를 더 찾아보세요.',
  酉: '끝내야 할 일과 내려놓을 일을 구분해 보세요.',
  戌: '결정 기준을 다시 확인하고 약속할 수 있는 만큼만 선택하세요.',
  亥: '결론을 재촉하지 말고 몸과 마음을 먼저 쉬게 해주세요.',
};

export function buildDailyGuidance(date = new Date()): string {
  const pillar = saju.getDayPillar(date);
  const dateLabel = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(date);
  return `${dateLabel}의 일주는 ${pillar.stem}${pillar.branch}입니다. ${BRANCH_ACTIONS[pillar.branch]} 전통 상징을 활용한 참고이며 미래를 단정하지 않아요.`;
}
