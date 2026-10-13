import { useState } from 'react';
import { useUserStore, type FamilyMember, type SpaceContext } from '../stores/userStore.js';
import { computeSajuFromProfile } from '../services/engineService.js';
import { Button } from './Button.js';
import { Card } from './Card.js';
import { Select } from './Select.js';
import { Input } from './Input.js';
const DIRECTIONS = ['', '북', '북동', '동', '남동', '남', '남서', '서', '북서'];
const emptyFamily = (): FamilyMember => ({ id: crypto.randomUUID(), name: '', relation: '', birthDate: '', birthTime: '', birthTimeUnknown: true, gender: '', calendarType: 'solar', isLeapMonth: false, context: '' });
const emptySpace = (): SpaceContext => ({ id: crypto.randomUUID(), kind: 'home', name: '', entranceDirection: '', deskDirection: '', description: '' });
export function LifeSettings() {
  const { profile, setProfile } = useUserStore();
  const [family, setFamily] = useState(emptyFamily);
  const [space, setSpace] = useState(emptySpace);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [context, setContext] = useState(profile.lifeContext ?? '');
  return <Card className="space-y-3">
    <h2 className="text-lg font-semibold">가족·집·사무실</h2>
    <p className="text-sm text-muted">필요한 정보만 선택적으로 저장하세요. 가족 생년월일은 본인의 동의를 받고 입력해 주세요. PIN으로 암호화해 이 브라우저에 보관하며, AI 해석에서 선택한 자료만 전송합니다.</p>
    {error && <p role="alert" className="text-danger">{error}</p>}{notice && <p role="status">{notice} 실제 저장 상태는 상단에서 확인해 주세요.</p>}
    <details><summary className="min-h-11 cursor-pointer py-2">생활 맥락 확인·수정</summary><label className="block">가족과 공간에 관한 상황<textarea className="field w-full" rows={3} value={context} onChange={event => setContext(event.target.value)} /></label><Button variant="secondary" disabled={context === (profile.lifeContext ?? '')} onClick={() => { setProfile({ lifeContext: context }); setNotice('생활 맥락을 저장 요청했어요.'); }}>생활 맥락 저장</Button></details>
    {(profile.familyMembers ?? []).map(member => <div key={member.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2"><p>{member.name} · {member.relation} · {member.birthDate || '생일 모름'}</p><div><Button variant="ghost" onClick={() => setFamily(member)}>수정</Button><Button variant="ghost" onClick={() => setProfile({ familyMembers: profile.familyMembers?.filter(item => item.id !== member.id) })}>삭제</Button></div></div>)}
    <details open={Boolean(family.name)}><summary className="min-h-11 cursor-pointer py-2">가족 추가·수정</summary>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); setError(''); if (family.birthDate && !family.gender) { setError('사주 계산을 하려면 성별을 선택해 주세요. 생일을 비우면 관계 정보만 저장할 수 있어요.'); return; } try { computeSajuFromProfile(family); } catch { setError('가족 사주를 계산하지 못했어요. 생년월일·달력·윤달을 확인해 주세요. 입력은 유지됩니다.'); return; } setProfile({ familyMembers: [...(profile.familyMembers ?? []).filter(member => member.id !== family.id), family] }); setFamily(emptyFamily()); setNotice('가족 정보를 저장 요청했어요.'); }}>
        <Input label="이름 또는 별칭" required value={family.name} onChange={event => setFamily(current => ({ ...current, name: event.target.value }))} />
        <Input label="나와의 관계" required value={family.relation} onChange={event => setFamily(current => ({ ...current, relation: event.target.value }))} />
        <Input label="생년월일 (모르면 비워두세요)" type="date" min="1900-01-01" max="2100-12-31" value={family.birthDate} onChange={event => setFamily(current => ({ ...current, birthDate: event.target.value }))} />
        <Select label="달력" value={family.calendarType} onChange={event => setFamily(current => ({ ...current, calendarType: event.target.value as 'solar' | 'lunar' }))}><option value="solar">양력</option><option value="lunar">음력</option></Select>
        {family.calendarType === 'lunar' && <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={family.isLeapMonth} onChange={event => setFamily(current => ({ ...current, isLeapMonth: event.target.checked }))} />윤달</label>}
        <Select label="사주 계산용 성별" value={family.gender} onChange={event => setFamily(current => ({ ...current, gender: event.target.value as FamilyMember['gender'] }))}><option value="">선택하지 않음</option><option value="male">남성</option><option value="female">여성</option></Select>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={family.birthTimeUnknown} onChange={event => setFamily(current => ({ ...current, birthTimeUnknown: event.target.checked }))} />태어난 시간 모름</label>
        {!family.birthTimeUnknown && <Input label="태어난 시간" type="time" required value={family.birthTime} onChange={event => setFamily(current => ({ ...current, birthTime: event.target.value }))} />}
        <Input label="함께 고려할 관계·상황 (선택)" value={family.context} onChange={event => setFamily(current => ({ ...current, context: event.target.value }))} />
        <p className="text-sm text-muted">편집 중인 내용은 아직 저장되지 않았어요.</p><Button variant="secondary" type="submit">가족 정보 저장</Button>
      </form>
    </details>
    {(profile.spaces ?? []).map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2"><p>{item.name} · {item.kind === 'home' ? '집' : '사무실'}</p><div><Button variant="ghost" onClick={() => setSpace(item)}>수정</Button><Button variant="ghost" onClick={() => setProfile({ spaces: profile.spaces?.filter(space => space.id !== item.id) })}>삭제</Button></div></div>)}
    <details open={Boolean(space.name)}><summary className="min-h-11 cursor-pointer py-2">공간 추가·수정</summary>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); setProfile({ spaces: [...(profile.spaces ?? []).filter(item => item.id !== space.id), space] }); setSpace(emptySpace()); setNotice('공간 정보를 저장 요청했어요.'); }}>
        <Input label="공간 이름" required value={space.name} onChange={event => setSpace(current => ({ ...current, name: event.target.value }))} />
        <Select label="공간 종류" value={space.kind} onChange={event => setSpace(current => ({ ...current, kind: event.target.value as SpaceContext['kind'] }))}><option value="home">집</option><option value="office">사무실</option></Select>
        {(['entranceDirection', 'deskDirection'] as const).map(key => <Select key={key} label={key === 'entranceDirection' ? '입구에서 밖을 바라보는 방향' : '책상에 앉아 바라보는 방향'} value={space[key]} onChange={event => setSpace(current => ({ ...current, [key]: event.target.value }))}>{DIRECTIONS.map(direction => <option key={direction} value={direction}>{direction || '모름'}</option>)}</Select>)}
        <label className="block">배치·채광·주변 환경<textarea className="field w-full" rows={3} value={space.description} onChange={event => setSpace(current => ({ ...current, description: event.target.value }))} placeholder="예: 책상 뒤에 창문이 있고 입구 옆에 물건이 쌓여 있어요." /></label>
        <p className="text-sm text-muted">편집 중인 내용은 아직 저장되지 않았어요. 주소와 현장 측정 없이 설명에 따른 풍수 상징 해석을 제공합니다.</p><Button variant="secondary" type="submit">공간 정보 저장</Button>
      </form>
    </details>
  </Card>;
}
