import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.js';
import { Card } from '../components/Card.js';

export default function LegalPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto min-h-screen max-w-md space-y-4 bg-paper p-4 dark:bg-ink">
      <header className="flex items-center gap-2">
        <Button variant="ghost" onClick={() => navigate(-1)} className="px-2">←</Button>
        <h1 className="font-display text-xl font-bold">개인정보와 이용약관</h1>
      </header>
      <Card className="space-y-2 text-sm">
        <h2 className="font-bold">개인정보 처리 요약</h2>
        <p>프로필·검사·대화는 기본적으로 이 기기에 PIN 기반 암호화로 저장됩니다. PIN 분실 시 복구할 수 없습니다.</p>
        <p>클라우드 LLM은 프라이버시 모드를 끄고 별도 동의한 경우에만 후보가 되며, 민감 문맥은 로컬 또는 오프라인 응답으로 전환합니다.</p>
        <p>설정에서 데이터를 내보내거나 전체 삭제할 수 있으며 API 키는 내보내지 않습니다.</p>
      </Card>
      <Card className="space-y-2 text-sm">
        <h2 className="font-bold">이용 조건 요약</h2>
        <p>전통 상징과 심리 도구는 자기이해를 위한 참고이며 미래, 진단, 치료, 법률·금융 결과를 보장하지 않습니다.</p>
        <p>자해·자살·타해 또는 즉각적인 위험이 있다면 앱을 기다리지 말고 현지 응급 서비스와 위기 지원 기관에 연락하세요.</p>
        <p>만 14세 미만 사용자는 보호자 동의 없이 개인정보를 입력하면 안 됩니다.</p>
      </Card>
      <p className="text-xs text-gray-500">정책 버전 1.0 · 시행일 2026-07-13. 저장소의 docs/privacy-policy.md와 docs/terms-of-use.md에 전체 정책이 있습니다.</p>
    </div>
  );
}
