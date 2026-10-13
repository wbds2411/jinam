import { chromium } from 'playwright';
import assert from 'node:assert/strict';
(async () => {
 const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined});
 const page = await browser.newPage({viewport:{width:390,height:844}});
 page.setDefaultTimeout(10000);
 const labelA='브라우저 검증 A '+Date.now(); const labelB='브라우저 검증 B '+Date.now();
 try {
 const errors=[]; page.on('pageerror', e=>errors.push(e.message));
 await page.goto(process.env.JINAM_E2E_URL || 'http://127.0.0.1:3000');
 await page.getByLabel('새 PIN (숫자 4~6자리)').fill('2580');
 await page.getByRole('button',{name:'PIN 설정하고 시작'}).click();
 await page.waitForURL('**/onboarding');
 await page.getByLabel('이름/별칭 (선택)').waitFor();
 await page.getByLabel('이름/별칭 (선택)').fill('검증 계정');
 await page.getByRole('button',{name:'남',exact:true}).click();
 await page.getByRole('button',{name:'다음',exact:true}).click();
 await page.getByLabel('생년월일 (선택)').fill('1980-03-19');
 await page.getByLabel('출생 시각을 모름').check();
 await page.getByRole('button',{name:'정보 입력 건너뛰고 기록 시작'}).click();
 await page.getByRole('heading',{name:'운세·꿈해몽·인생 상담'}).waitFor();
 await page.getByRole('button',{name:'설정 열기'}).click();
 await page.getByText('가족 추가·수정',{exact:true}).click();
 await page.getByLabel('이름 또는 별칭',{exact:true}).fill('검증 가족');
 await page.getByLabel('나와의 관계',{exact:true}).fill('배우자');
 await page.getByLabel('생년월일 (모르면 비워두세요)').fill('1982-04-10');
 await page.getByLabel('사주 계산용 성별',{exact:true}).selectOption('female');
 await page.getByRole('button',{name:'가족 정보 저장',exact:true}).click();
 await page.getByText('공간 추가·수정',{exact:true}).click();
 await page.getByLabel('공간 이름',{exact:true}).fill('검증 집');
 await page.getByLabel('입구에서 밖을 바라보는 방향',{exact:true}).selectOption('남');
 await page.getByLabel('배치·채광·주변 환경',{exact:true}).fill('밝은 창문, 정리된 입구');
 await page.getByRole('button',{name:'공간 정보 저장',exact:true}).click();
 await page.getByText('생활 맥락 확인·수정',{exact:true}).click();
 await page.getByLabel('가족과 공간에 관한 상황',{exact:true}).fill('가족과 공동 지출 계획');
 await page.getByRole('button',{name:'생활 맥락 저장',exact:true}).click();
 // Register via the settings UI; no external API key is used.
 await page.getByText('연결 추가·수정',{exact:true}).click();
 await page.getByLabel('연결 이름',{exact:true}).fill(labelA);
 await page.getByLabel('모델',{exact:true}).fill('igorls/gemma-4-E4B-it-heretic-GGUF:latest');
 await page.getByRole('button',{name:'연결 저장',exact:true}).click();
 await page.getByText('서버에 연결 설정을 저장했어요.',{exact:true}).waitFor();
 await page.getByLabel('연결 이름',{exact:true}).fill(labelB);
 await page.getByLabel('모델',{exact:true}).fill('test-failure-model');
 await page.getByRole('button',{name:'연결 저장',exact:true}).click();
 await page.waitForTimeout(250);
 await page.getByRole('button',{name:'기록으로 돌아가기'}).click();
 await page.getByRole('button',{name:'꿈해몽·번호 추천',exact:true}).click();
 await page.getByLabel('기억나는 꿈과 감정',{exact:true}).fill('가족과 집에서 돼지를 보았고 편안했다');
 await page.getByText('함께 해석할 저장 자료 선택',{exact:true}).click();
 await page.getByLabel(/가족 관계·사주/).check();
 await page.getByLabel(/집·사무실 방향·배치/).check();
 await page.getByLabel(/저장된 생활 맥락/).check();
 for (const checkbox of await page.getByRole('group',{name:'사용할 AI 연결',exact:true}).getByRole('checkbox').all()) {
   const text=await checkbox.locator('..').innerText();
   if(!text.includes(labelA) && !text.includes(labelB)) await checkbox.uncheck();
   else await checkbox.check();
 }
 let callsB=0; let sentFacts;
 await page.route('**/api/reading',async route=>{
  const request=route.request().postDataJSON(); sentFacts=request.facts;
  const name=await page.evaluate(async id=>{const r=await fetch('/api/connections');return (await r.json()).connections.find(c=>c.id===id).label;},request.id);
  const fails=name===labelB && ++callsB===1;
  const result={summary:'브라우저 검증 종합 해석',sections:[{title:'꿈·가족·공간',text:'실제 입력 자료를 연결한 상징 해석입니다.',evidenceIds:['question','personal-saju','family-0','space-0']}],numberCandidates:[{number:12,reason:'돼지의 임의 상징 수',evidenceIds:['question']}],followUp:'돼지는 어떤 행동을 했나요?'};
  await route.fulfill({status:200,contentType:'application/x-ndjson',body:JSON.stringify(fails?{type:'error',message:'검증용 연결 실패'}:{type:'done',result})+'\n'});
 });
 await page.getByRole('button',{name:'AI로 종합 해석',exact:true}).click();
 await page.getByText('검증용 연결 실패',{exact:true}).waitFor();
 assert(sentFacts.some(f=>f.id==='family-0'));
 assert(sentFacts.some(f=>f.id==='space-0'));
 assert(sentFacts.some(f=>f.id==='personal-saju'));
 assert(sentFacts.some(f=>f.id==='life-context'));
 assert.equal(await page.getByRole('button',{name:'결과를 기록에 남기기',exact:true}).count(),1);
 await page.getByRole('button',{name:'이 연결만 다시 시도',exact:true}).click();
 await page.getByRole('button',{name:'결과를 기록에 남기기',exact:true}).nth(1).waitFor();
 assert.equal(await page.getByRole('button',{name:'결과를 기록에 남기기',exact:true}).count(),2);
 await page.getByRole('button',{name:'결과를 기록에 남기기',exact:true}).first().click();
 await page.getByRole('button',{name:'이 질문에 이어서 답하기',exact:true}).first().click();
 assert((await page.getByLabel('기억나는 꿈과 감정',{exact:true}).inputValue()).includes('내 답변:'));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
 if(process.env.JINAM_E2E_SCREENSHOT) await page.screenshot({path:process.env.JINAM_E2E_SCREENSHOT,fullPage:true});
 await page.reload();
 await page.getByLabel('PIN',{exact:true}).fill('2580');
 await page.getByRole('button',{name:'잠금 해제',exact:true}).click();
 await page.getByRole('heading',{name:'이어서 보는 기록'}).waitFor();
 assert((await page.getByRole('log').innerText()).includes('브라우저 검증 종합 해석'));
 await page.getByRole('button',{name:'설정 열기'}).click();
 await page.getByText('검증 가족 · 배우자 · 1982-04-10',{exact:true}).waitFor();
 await page.getByText('검증 집 · 집',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);
 console.log('PASS: PIN, profile, family/space storage, AI connection registration, multiple results, partial failure/retry, source selection, follow-up, encrypted result reload, mobile layout');
 } finally {
   try {
     const response=await page.request.get(new URL('/api/connections',page.url()).href);
     if(response.ok()) {
       for(const connection of (await response.json()).connections.filter(c=>c.label===labelA || c.label===labelB))
         await page.request.post(new URL('/api/connections/delete',page.url()).href,{data:{id:connection.id}});
     }
   } finally { await browser.close(); }
 }
})().catch(e=>{console.error(e);process.exit(1)});
