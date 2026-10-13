import { useEffect, useRef, useState } from 'react';
import { api, type Catalog, type Connection, type ModelCatalog } from '../services/aiService.js';
import { Button } from './Button.js';
import { Card } from './Card.js';
import { Select } from './Select.js';
import { CLIAuthConnections } from './CLIAuthConnections.js';
import { Input } from './Input.js';
export function AIConnections() {
  const [catalog, setCatalog] = useState<Catalog>();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draft, setDraft] = useState({ id: '', provider: 'ollama', model: '', baseUrl: '', label: '', apiKey: '', enabled: true, consent: false });
  const modelRequest = useRef(0);
  const [models, setModels] = useState<ModelCatalog>();
  const [modelError, setModelError] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  const [draftStatus, setDraftStatus] = useState('');
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  async function refresh() {
    try { const data = await api<{ catalog: Catalog; connections: Connection[] }>('connections'); setCatalog(data.catalog); setConnections(data.connections); setError(''); data.connections.forEach(connection => { void checkStatus(connection.id); }); }
    catch (error) { setError(error instanceof Error ? error.message : 'AI 서버에 연결하지 못했어요.'); }
  }
  useEffect(() => { void refresh(); }, []);
  const provider = catalog?.providers[draft.provider];
  useEffect(() => {
    if (draft.id || provider?.transport !== 'cli') return;
    let active = true;
    void fetchModels();
    setDraftStatus('연결 확인 중…');
    void api<Parameters<typeof statusText>[0]>('connections/preview/status', draft).then(result => { if (active) setDraftStatus(statusText(result)); }).catch(error => { if (active) setDraftStatus(error instanceof Error ? error.message : '연결 확인 실패'); });
    return () => { active = false; };
  }, [draft.provider, draft.id, provider?.transport]);
  function statusText(result: { state: string; version?: string; auth_method?: string; message?: string; login_command?: string; note?: string; models?: number }) {
    const state = ({ connected: '연결됨', login_required: '로그인 필요', not_installed: '설치 안 됨', unverified: '로그인 확인 필요', error: '연결 오류', unreachable: '연결할 수 없음' } as Record<string, string>)[result.state] || result.state;
    return [state, result.version, result.auth_method ? `인증: ${result.auth_method}` : '', result.models !== undefined ? `모델 ${result.models}개` : '', result.message, result.note, result.state !== 'connected' ? result.login_command : ''].filter(Boolean).join(' · ');
  }
  async function checkStatus(id: string) {
    setStatuses(current => ({ ...current, [id]: '연결 확인 중…' }));
    try { const result = await api<Parameters<typeof statusText>[0]>('connections/status', { id }); setStatuses(current => ({ ...current, [id]: statusText(result) })); }
    catch (error) { setStatuses(current => ({ ...current, [id]: error instanceof Error ? error.message : '상태 조회 실패 · 다시 확인하세요.' })); }
  }
  async function fetchModels(id = '') {
    const request = ++modelRequest.current;
    setLoadingModels(true); setModelError('');
    try { const result = await api<ModelCatalog>(id ? 'connections/models' : 'connections/preview/models', id ? { id } : draft); if (request === modelRequest.current) setModels(result); }
    catch (error) { if (request === modelRequest.current) setModelError(`${error instanceof Error ? error.message : '모델 목록을 불러오지 못했어요.'} 저장된 모델은 유지됩니다. 모델 ID를 직접 입력하거나 다시 불러오세요.`); }
    finally { if (request === modelRequest.current) setLoadingModels(false); }
  }
  function edit(connection: Connection) {
    setDraft({ ...connection, apiKey: '' }); setModels(undefined); setModelError('');
    setDraftStatus(''); setNotice('모델 변경은 연결 저장을 눌러야 적용됩니다. 기존 키는 빈칸으로 두면 유지합니다.');
    void fetchModels(connection.id);
  }
  async function action(operation: () => Promise<unknown>) {
    setBusy(true); setError(''); setNotice('');
    try { await operation(); await refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : '연결 설정을 저장하지 못했어요.'); }
    finally { setBusy(false); }
  }
  return <Card className="space-y-3">
    <h2 className="text-lg font-semibold">AI 연결</h2>
    <p className="text-sm text-muted">연결을 여러 개 등록하고 함께 사용할 수 있어요. API 키는 이 브라우저가 아닌 개인 AI 서버에 저장합니다. 등록된 연결은 이 서버를 사용하는 브라우저들이 공유합니다.</p>
    {error && <div role="alert"><p className="text-danger">{error}</p><Button variant="ghost" onClick={() => void refresh()}>서버 다시 연결</Button></div>}
    {notice && <p role="status">{notice}</p>}
    <Select label="사용할 AI (기본 연결)" disabled={busy} value={connections.find(connection => connection.isDefault && connection.enabled)?.id || ''} onChange={event => void action(() => api('connections/default', { id: event.target.value }))}>
      <option value="" disabled>기본 AI를 선택하세요</option>
      {connections.filter(connection => connection.enabled).map(connection => <option key={connection.id} value={connection.id}>{connection.label} · {connection.model || 'CLI 기본 모델'}</option>)}
    </Select>
    <p className="text-sm text-muted">해석 화면에서 이 연결을 먼저 선택합니다. 다른 AI는 비교할 때 직접 추가 선택할 수 있어요.</p>
    {catalog && <CLIAuthConnections catalog={catalog} connections={connections} onSaved={refresh} />}
    {[...connections].sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault))).map(connection => <div key={connection.id} className="space-y-2 rounded-xl border border-line p-3">
      <p className="font-medium">{connection.label} · {connection.model || '기본 모델'}</p>
      <p className="text-sm text-muted">{catalog?.providers[connection.provider]?.label} · {catalog?.providers[connection.provider]?.transport === 'cli' ? '서버 CLI 로그인 사용' : connection.hasKey ? '키 저장됨 (숨김)' : '저장된 키 없음'} · {statuses[connection.id] || '연결 상태 미확인'}</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" disabled={busy} checked={connection.enabled} onChange={event => void action(() => api('connections/save', { ...connection, enabled: event.target.checked }))} />사용</label>
        <Button variant="ghost" disabled={busy} onClick={() => void checkStatus(connection.id)}>연결 다시 확인</Button>
        <Button variant="ghost" disabled={busy} onClick={() => edit(connection)}>모델 설정·수정</Button>
        <Button variant="ghost" disabled={busy} onClick={() => void action(() => api('connections/delete', { id: connection.id }))}>삭제</Button>
      </div>
    </div>)}
    {catalog && <details open={connections.length === 0 || Boolean(draft.id)}>
      <summary className="min-h-11 cursor-pointer py-2">연결 추가·수정</summary>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); void action(async () => { await api('connections/save', draft); modelRequest.current++; setLoadingModels(false); setModels(undefined); setModelError(''); setDraft({ id: '', provider: 'ollama', model: '', baseUrl: '', label: '', apiKey: '', enabled: true, consent: false }); setNotice('서버에 연결 설정을 저장했어요.'); }); }}>
        <fieldset disabled={busy} className="space-y-3">
          <Select label="공급자" value={draft.provider} onChange={event => { modelRequest.current++; setModels(undefined); setModelError(''); setLoadingModels(false); setDraftStatus(''); setDraft(current => ({ ...current, id: '', provider: event.target.value, baseUrl: '', model: '', apiKey: '', consent: false })); }}>{Object.entries(catalog.groups).map(([group, label]) => <optgroup key={group} label={label}>{Object.entries(catalog.providers).filter(([, spec]) => spec.group === group).map(([id, spec]) => <option key={id} value={id}>{spec.label}</option>)}</optgroup>)}</Select>
          <Input label="연결 이름" value={draft.label} onChange={event => setDraft(current => ({ ...current, label: event.target.value }))} placeholder="예: 집의 로컬 모델" />
          {<div className="space-y-2">
            {!draft.id && <Button variant="ghost" onClick={async () => { setDraftStatus('연결 확인 중…'); try { setDraftStatus(statusText(await api<Parameters<typeof statusText>[0]>('connections/preview/status', draft))); } catch (error) { setDraftStatus(error instanceof Error ? error.message : '연결 확인 실패'); } }}>저장 전 연결 확인</Button>}
            {draftStatus && <p role="status">{draftStatus}</p>}
            <Button variant="ghost" disabled={loadingModels} onClick={() => void fetchModels(draft.id)}>{loadingModels ? '모델 목록 조회 중…' : models ? '모델 목록 다시 불러오기' : '모델 목록 불러오기'}</Button>
            {modelError && <p role="alert" className="text-danger">{modelError}</p>}
            {models && <>
              <p className="text-sm">현재 저장 모델: {draft.id ? connections.find(connection => connection.id === draft.id)?.model || '미지정 (CLI 기본 사용)' : '아직 연결을 저장하지 않았어요'}</p>
              <p className="text-sm">CLI 설정 모델: {models.configured_model || '설정 파일에 지정되지 않음'} · 목록의 기본 모델: {models.model_choices.filter(choice => choice.is_default).map(choice => choice.label).join(', ') || '공급자가 기본값을 알려주지 않음'}</p>
              {(models.configured_model || models.model_choices.some(choice => choice.is_default)) && <Button variant="ghost" onClick={() => setDraft(current => ({ ...current, model: models.configured_model || models.model_choices.find(choice => choice.is_default)?.id || current.model }))}>기본 모델을 입력에 가져오기</Button>}
              {!models.model_choices.length && <p className="text-warning">선택 가능한 모델 목록을 받지 못했어요. 모델 ID를 직접 입력하거나 다시 불러오세요.</p>}
              <p className="text-sm text-muted">모델 {models.model_choices.length}개 · 출처: {models.model_source}. {models.model_note} 목록 조회는 사용 권한이나 무료 사용을 보장하지 않습니다.</p>
              <Select label="모델 목록에서 선택" value={draft.model} onChange={event => setDraft(current => ({ ...current, model: event.target.value }))}>
                <option value="">모델을 선택하세요</option>
                {draft.model && !models.model_choices.some(choice => choice.id === draft.model) && <option value={draft.model}>{draft.model} (현재 설정)</option>}
                {models.model_choices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}{choice.is_default ? ' · 기본' : ''}</option>)}
              </Select>
            </>}
          </div>}
          <Input label="모델" required={provider?.transport !== 'cli'} value={draft.model} onChange={event => setDraft(current => ({ ...current, model: event.target.value }))} placeholder={provider?.transport === 'cli' ? '비우면 CLI 기본 모델' : '서버에 설치된 모델 또는 API 모델 ID'} />
          {provider?.transport !== 'cli' && !provider?.fixed_base && <Input label="서버 주소" value={draft.baseUrl} onChange={event => setDraft(current => ({ ...current, baseUrl: event.target.value }))} placeholder={provider?.base_url || 'https://서버/v1'} />}
          {provider?.key !== 'none' && <Input label={`API 키${draft.id ? ' (빈칸이면 기존 키 유지)' : ''}`} type="password" autoComplete="off" value={draft.apiKey} onChange={event => setDraft(current => ({ ...current, apiKey: event.target.value }))} />}
          {provider?.transport === 'cli' && <p className="text-sm">AI 서버의 터미널에서 로그인하세요: <code>{provider.login}</code>. 앱은 로그인하거나 로그아웃하지 않습니다.</p>}
          {provider?.group !== 'local' && <label className="flex min-h-11 gap-2"><input type="checkbox" checked={draft.consent} onChange={event => setDraft(current => ({ ...current, consent: event.target.checked }))} /><span className="text-sm">선택한 {provider?.label}에 질문·꿈 내용, 본인·가족 사주 계산값, 선택한 생활 맥락과 공간 정보를 보내는 데 동의합니다. CLI도 해당 서비스로 전송하며 사용량 제한과 추가 요금이 발생할 수 있어요. Fable 등 모델별 추가 사용료를 확인하세요.</span></label>}
          <Button type="submit">{busy ? '서버에 저장 중…' : '연결 저장'}</Button>
          <p className="text-sm text-muted">입력 중인 설정은 아직 저장되지 않았어요. 저장 후 키 입력은 지웁니다.</p>
        </fieldset>
      </form>
    </details>}
  </Card>;
}
