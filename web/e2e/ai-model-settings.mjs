import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined});
const page = await browser.newPage({viewport:{width:390,height:844}});
const rows = [{id:'cli',provider:'codex-cli',model:'old-model',baseUrl:'',label:'합성 Codex',enabled:true,consent:true,hasKey:false,isDefault:false}];
let fail = false;
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.route('**/api/**', async route => {
 const path = new URL(route.request().url()).pathname;
 const body = route.request().postDataJSON();
 let result = {ok:true};
 if(path.endsWith('/status')) result={state:'connected',auth_method:'chatgpt',version:'synthetic-cli'};
 if(path === '/api/connections') result={connections:rows,defaultConnectionId:rows[0].isDefault?'cli':'',catalog:{groups:{cli:'구독 로그인'},providers:{'codex-cli':{label:'Codex CLI',group:'cli',transport:'cli',key:'none',login:'codex login'}}}};
 if(path.endsWith('/models')) {
  if(fail) return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'합성 조회 실패'})});
  result={models:['old-model','new-model'],model_choices:[{id:'old-model',label:'기존 모델',is_default:true},{id:'new-model',label:'다른 모델',is_default:false}],model_source:'codex_app_server',model_note:'공개 합성 목록',access_verified:false,configured_model:rows[0].model};
 }
 if(path === '/api/connections/save') {Object.assign(rows[0],body);result=rows[0];}
 if(path === '/api/connections/default') rows[0].isDefault=true;
 await route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
});
try {
 await page.goto(process.env.JINAM_E2E_URL || 'http://127.0.0.1:5175');
 await page.getByLabel('새 PIN (숫자 4~6자리)').fill('2580');
 await page.getByRole('button',{name:'PIN 설정하고 시작'}).click();
 await page.waitForURL('**/onboarding');
 await page.getByRole('button',{name:'남',exact:true}).click();
 await page.getByRole('button',{name:'다음',exact:true}).click();
 await page.getByRole('button',{name:'정보 입력 건너뛰고 기록 시작'}).click();
 await page.getByRole('button',{name:'설정 열기'}).click();
 await page.getByText(/연결됨 · synthetic-cli/).first().waitFor();
 await page.getByRole('button',{name:'모델 설정·수정'}).click();
 await page.getByRole('button',{name:'기본 모델을 입력에 가져오기'}).click();
 assert.equal(await page.getByLabel('모델',{exact:true}).inputValue(),'old-model');
 await page.getByLabel('모델 목록에서 선택',{exact:true}).selectOption('new-model');
 assert.equal(rows[0].model,'old-model');
 await page.getByRole('button',{name:'연결 저장',exact:true}).click();
 await page.getByText('서버에 연결 설정을 저장했어요.',{exact:true}).waitFor();
 assert.equal(rows[0].model,'new-model');
 await page.getByLabel('사용할 AI (기본 연결)').selectOption('cli');
 await page.getByRole('button',{name:'모델 설정·수정'}).click();
 await page.getByLabel('모델 목록에서 선택',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('모델',{exact:true}).inputValue(),'new-model');
 fail=true;
 await page.getByRole('button',{name:'모델 목록 다시 불러오기'}).click();
 await page.getByText(/합성 조회 실패/).last().waitFor();
 assert.equal(await page.getByLabel('모델',{exact:true}).inputValue(),'new-model');
 await page.getByRole('button',{name:'기록으로 돌아가기'}).click();
 assert.equal(await page.getByRole('group',{name:'사용할 AI 연결',exact:true}).getByRole('checkbox').isChecked(),false);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
 await page.getByRole('group',{name:'사용할 AI 연결',exact:true}).getByRole('checkbox').check();
 await page.screenshot({path:'/tmp/jinam-ai-models-mobile.png',fullPage:true});
 await page.setViewportSize({width:1280,height:900});
 await page.getByRole('button',{name:'설정 열기'}).click();
 await page.screenshot({path:'/tmp/jinam-ai-models-desktop.png',fullPage:true});
 assert.deepEqual(errors,[]);
 console.log('PASS: 모델 조회→편집→명시 저장→기본 선택→재방문→조회 실패 보존; 모바일 리플로우/PC 캡처 (합성 API)');
} finally {await browser.close();}
