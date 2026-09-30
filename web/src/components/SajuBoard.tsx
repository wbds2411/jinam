import type { SajuChart } from '@jinam/engine';

interface SajuBoardProps {
  chart: SajuChart | null;
}

const ELEMENT_COLOR: Record<string, string> = {
  木: 'text-content border-t-4 border-wood',
  火: 'text-content border-t-4 border-fire',
  土: 'text-content border-t-4 border-earth',
  金: 'text-content border-t-4 border-metal',
  水: 'text-content border-t-4 border-water',
};

function PillarCell({ label, stem, branch, dayMaster }: { label: string; stem: string; branch: string; dayMaster?: string }) {
  const isDay = label === '일주';
  return (
    <div className={`flex flex-col items-center rounded-lg border p-3 ${isDay ? 'border-fire bg-fire/10' : 'border-line'}`}>
      <span className="text-xs text-muted">{label}</span>
      <div className="flex gap-2 text-lg font-display">
        <span className="font-bold">{stem}</span>
        <span>{branch}</span>
      </div>
      {isDay && <span className="text-xs text-content">일간 {dayMaster}</span>}
    </div>
  );
}

export function SajuBoard({ chart }: SajuBoardProps) {
  if (!chart) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <PillarCell label="연주" stem={chart.year.stem} branch={chart.year.branch} />
        <PillarCell label="월주" stem={chart.month.stem} branch={chart.month.branch} />
        <PillarCell label="일주" stem={chart.day.stem} branch={chart.day.branch} dayMaster={chart.dayMaster} />
        {chart.hour ? (
          <PillarCell label="시주" stem={chart.hour.stem} branch={chart.hour.branch} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-control p-3 text-sm text-muted">
            시주
            <span className="text-xs">(시각 모름)</span>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-canvas p-3">
        <h3 className="mb-2 text-sm font-medium">오행 분포</h3>
        <p className="mb-3 text-sm text-muted">입력한 출생 정보에 따른 사주 구성 비율이에요. 건강이나 오늘의 컨디션 측정값이 아니에요.</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-sm">
          {(['木', '火', '土', '金', '水'] as const).map((el) => (
            <div key={el} className={`rounded py-1 ${ELEMENT_COLOR[el]}`}>
              <div className="font-bold">{el}</div>
              <div>{chart.fiveElements[el]}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-sm text-muted">
        용신: <span className="font-bold text-content">{chart.yongsin}</span> · 대운: {chart.daeun.startAge}세부터 {chart.daeun.direction === 'forward' ? '순행' : '역행'}
      </div>
    </div>
  );
}
