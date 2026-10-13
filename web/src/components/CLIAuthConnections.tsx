import { useEffect, useRef, useState } from 'react';
import { api, type Catalog, type Connection, type ModelCatalog } from '../services/aiService.js';
import { Select } from './Select.js';
import { Button } from './Button.js';
import { Input } from './Input.js';
interface AuthStatus { state: string; auth_method?: string; version?: string; login_command?: string; message?: string; note?: string }
function CLIConnection({ provider, label, connection, onSaved }: { provider: string; label: string; connection?: Connection; onSaved: () => Promise<void> }) {
  const [auth, setAuth] = useState<AuthStatus>();
  const [metadata, setMetadata] = useState<ModelCatalog>();
  const [model, setModel] = useState(connection?.model || '');
  const [consent, setConsent] = useState(Boolean(connection?.consent));
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modelError, setModelError] = useState('');
  const [notice, setNotice] = useState('');
  const request = useRef(0);
  async function inspect() {
    const token = ++request.current;
    setLoading(true); setError(''); setModelError('');
    const payload = connection ? { id: connection.id } : { provider };
    const prefix = connection ? 'connections' : 'connections/preview';
    const results = await Promise.allSettled([api<AuthStatus>(`${prefix}/status`, payload).then(value => { if (request.current === token) setAuth(value); return value; }), api<ModelCatalog>(`${prefix}/models`, payload)]);
    if (request.current !== token) return;
    const [status, models] = results;
    if (status.status === 'fulfilled') setAuth(status.value);
    else { setAuth(undefined); setError(status.reason instanceof Error ? status.reason.message : '인증 상태 확인에 실패했어요. 다시 확인하세요.'); }
    if (models.status === 'fulfilled') {
      setMetadata(models.value);
      // Only prefill an unsaved, untouched new connection. Never change a saved model.
      if (!connection) setModel(current => current || models.value.configured_model || models.value.model_choices.find(item => item.is_default)?.id || '');
    } else { setMetadata(undefined); setModelError(models.reason instanceof Error ? models.reason.message : '모델 조회에 실패했어요. 직접 입력하거나 다시 확인하세요.'); }
    setLoading(false);
  }
  useEffect(() => { setModel(connection?.model || ''); setConsent(Boolean(connection?.consent)); void inspect(); return () => { request.current++; }; }, [provider, connection?.id, connection?.model]);
  async function save() {
    setBusy(true); setError(''); setNotice('');
    try {
      await api('connections/save', { ...connection, provider, model, label: connection?.label || label, baseUrl: '', enabled: connection?.enabled ?? true, consent });
      await onSaved(); setNotice('모델 저장됨');
    } catch (error) { setError(error instanceof Error ? error.message : '저장 실패. 선택한 모델을 유지했어요. 다시 저장하세요.'); }
    finally { setBusy(false); }
  }
  const statusLabel = auth?.state === 'connected' ? `인증 연결됨 · ${auth.auth_method === 'chatgpt' ? 'ChatGPT 구독 로그인' : auth.auth_method === 'claude.ai' ? 'Claude 구독 로그인' : auth.auth_method === 'api_key' ? 'API 키 인증 (구독 아님)' : auth.auth_method || '인증 방식 미확인'}` : auth?.state === 'not_installed' ? 'CLI 설치 안 됨' : auth?.state === 'login_required' ? '로그인 필요' : auth?.state === 'unverified' ? '인증 상태 확인 필요' : '인증 확인 중…';
  const choices = metadata?.model_choices || [];
  return <section aria-label={`${connection?.label || label} 인증과 모델`} className="space-y-3 rounded-xl border border-line p-3">
    <h3 className="font-semibold">{connection?.label || label}{connection?.isDefault ? ' · 기본 AI' : ''}</h3>
    <p role="status" className={auth?.state === 'connected' ? 'text-success' : 'text-muted'}>{statusLabel}{auth?.version ? ` · ${auth.version}` : ''}</p>
    {auth?.message && <p>{auth.message}</p>}
    {auth?.state !== 'connected' && auth?.login_command && <p className="text-sm">서버 터미널에서 <code>{auth.login_command}</code> 실행 후 다시 확인하세요.</p>}
    {error && <p role="alert" className="text-danger">{error}</p>}
    <Select label={`${connection?.label || label} 모델`} value={model} disabled={loading || busy} onChange={event => { setModel(event.target.value); setNotice(''); }}>
      <option value="">{loading ? '모델 불러오는 중…' : '모델 선택 또는 직접 입력'}</option>
      {model && !choices.some(choice => choice.id === model) && <option value={model}>{model} (현재 설정)</option>}
      {choices.map(choice => <option key={choice.id} value={choice.id}>{choice.label}{choice.is_default ? ' · 기본' : ''}{/fable/i.test(choice.id) ? ' · 추가 요금 가능' : ''}</option>)}
    </Select>
    <p className="text-sm text-muted">{loading ? '공식 CLI에서 모델 목록을 조회하고 있어요.' : `모델 ${choices.length}개 · CLI 설정: ${metadata?.configured_model || '미지정'}`} · {connection ? `저장 모델: ${connection.model || '미지정'}` : '앱에 아직 저장되지 않은 연결'}</p>
    {modelError && <p role="alert" className="text-danger">{modelError} 저장 모델은 유지합니다. 직접 입력하거나 다시 확인하세요.</p>}
    <details><summary className="min-h-11 cursor-pointer py-2">모델 ID 직접 입력·목록 출처</summary>
      <Input label={`${connection?.label || label} 모델 ID 직접 입력`} value={model} onChange={event => setModel(event.target.value)} />
      <p className="text-sm text-muted">{metadata?.model_source} · {metadata?.model_note} 목록은 계정의 실행 권한을 보장하지 않아요.</p>
    </details>
    {(!connection || !connection.consent) && <label className="flex min-h-11 gap-2"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} /><span className="text-sm">질문·선택한 개인 자료를 {label}에 전송하는 데 동의합니다. 구독 한도 및 모델별 추가 요금이 적용될 수 있어요.</span></label>}
    <div className="flex flex-wrap gap-2">
      <Button disabled={busy || loading || !model || !consent || auth?.state !== 'connected'} onClick={() => void save()}>{busy ? '저장 중…' : connection ? '모델 저장' : '이 인증으로 연결 저장'}</Button>
      <Button variant="ghost" disabled={loading} onClick={() => void inspect()}>인증·모델 다시 확인</Button>
      {connection && <Button variant="ghost" disabled={busy || !connection.enabled} onClick={async () => { setBusy(true); try { await api('connections/default', { id: connection.id }); await onSaved(); } catch (error) { setError(error instanceof Error ? error.message : '기본 AI 선택 실패'); } finally { setBusy(false); } }}>이 AI를 기본으로 사용</Button>}
    </div>
    <p role="status" className="text-sm">{notice || (connection && model !== connection.model ? '변경한 모델은 아직 저장되지 않았어요.' : connection ? '저장된 연결' : '인증 확인과 모델 선택만으로 연결을 저장하거나 사용하지 않아요.')}</p>
  </section>;
}
export function CLIAuthConnections({ catalog, connections, onSaved }: { catalog: Catalog; connections: Connection[]; onSaved: () => Promise<void> }) {
  return <div className="space-y-3">
    <h3 className="font-semibold">서버에서 로그인한 AI</h3>
    <p className="text-sm text-muted">기존 CLI 인증을 자동 확인합니다. 모델을 선택하고 저장하면 이 앱에서 사용할 수 있어요.</p>
    {Object.entries(catalog.providers).filter(([, provider]) => provider.transport === 'cli').flatMap(([provider, spec]) => {
      const saved = connections.filter(connection => connection.provider === provider);
      return saved.length ? saved.map(connection => <CLIConnection key={connection.id} provider={provider} label={spec.label} connection={connection} onSaved={onSaved} />) : [<CLIConnection key={provider} provider={provider} label={spec.label} onSaved={onSaved} />];
    })}
  </div>;
}
