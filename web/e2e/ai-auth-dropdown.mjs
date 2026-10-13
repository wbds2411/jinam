import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined});
const page = await browser.newPage({viewport:{width:390,height:844}});
let rows=[{id:'saved',provider:'codex-cli',model:'saved-model',baseUrl:'',label:'내 Codex',enabled:true,consent:true,hasKey:false}];
let failSave=false; let failModels=false;
const original=JSON.stringify(rows);
await page.route('**/api/**',async route=>{
 const path=new URL(route.request().url()).pathname;
 const data=route.request().postDataJSON();
 let result={ok:true};
 if(path==='/api/connections') result={connections:rows,catalog:{groups:{cli:'구독'},providers:{'codex-cli':{label:'Codex CLI',transport:'cli',group:'cli',key:'none'},'claude-cli':{label:'Claude Code',transport:'cli',group:'cli',key:'none'}}}};
 if(path.endsWith('/status')) result={state:'connected',auth_method:data.provider==='claude-cli'?'claude.ai':'chatgpt'};
 if(path.endsWith('/models')) {
  if(failModels)return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'합성 목록 오류'})});
  result={configured_model:'cli-default',model_source:'synthetic',model_note:'합성 목록',access_verified:false,models:['saved-model','cli-default','chosen-model'],model_choices:['saved-model','cli-default','chosen-model'].map(id=>({id,label:id,is_default:id==='cli-default'}))};
 }
 if(path==='/api/connections/save') {
  if(failSave)return route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'합성 저장 오류'})});
  result={...data,id:data.id || 'new'};rows=rows.filter(row=>row.id!==result.id).concat(result);
 }
 if(path==='/api/connections/default') rows=rows.map(row=>({...row,isDefault:row.id===data.id}));
 await route.fulfill({contentType:'application/json',body:JSON.stringify(result)});
});
async function open() {
 await page.goto('http://127.0.0.1:5175');
 await page.evaluate(async()=>{
  const React=await import('/node_modules/.vite/deps/react.js');
  const ReactDOM=await import('/node_modules/.vite/deps/react-dom_client.js');
  const {AIConnections}=await import('/src/components/AIConnections.tsx');
  const target=document.createElement('div');document.body.replaceChildren(target);target.className='page';
  ReactDOM.default.createRoot(target).render(React.default.createElement(AIConnections));
 });
}
try {
 await open();
 const saved=page.getByRole('region',{name:'내 Codex 인증과 모델'});
 const fresh=page.getByRole('region',{name:'Claude Code 인증과 모델'});
 await saved.getByText(/ChatGPT 구독 로그인/).waitFor();
 await fresh.getByText(/Claude 구독 로그인/).waitFor();
 await page.waitForFunction(()=>[...document.querySelectorAll('select')].filter(select=>select.labels?.[0]?.textContent.endsWith(' 모델')).every(select=>!select.disabled));
 assert.equal(await saved.getByLabel('내 Codex 모델',{exact:true}).inputValue(),'saved-model');
 assert.equal(await fresh.getByLabel('Claude Code 모델',{exact:true}).inputValue(),'cli-default');
 assert.equal(JSON.stringify(rows),original);
 await saved.getByLabel('내 Codex 모델',{exact:true}).selectOption('chosen-model');
 assert.equal(rows[0].model,'saved-model');
 failSave=true;
 await saved.getByRole('button',{name:'모델 저장',exact:true}).click();
 await saved.getByText('합성 저장 오류',{exact:true}).waitFor();
 assert.equal(rows[0].model,'saved-model');
 assert.equal(await saved.getByLabel('내 Codex 모델',{exact:true}).inputValue(),'chosen-model');
 failSave=false;
 await saved.getByRole('button',{name:'모델 저장',exact:true}).click();
 await saved.getByText('모델 저장됨',{exact:true}).waitFor();
 assert.equal(rows[0].model,'chosen-model');
 await saved.getByRole('button',{name:'이 AI를 기본으로 사용'}).click();
 await saved.getByRole('heading',{name:'내 Codex · 기본 AI'}).waitFor();
 assert.equal(rows[0].isDefault,true);
 await fresh.getByRole('checkbox').check();
 await fresh.getByRole('button',{name:'이 인증으로 연결 저장'}).click();
 await fresh.getByRole('button',{name:'모델 저장',exact:true}).waitFor();
 assert.equal(rows.length,2);
 await open();
 await page.waitForFunction(()=>[...document.querySelectorAll('select')].filter(select=>select.labels?.[0]?.textContent.endsWith(' 모델')).every(select=>!select.disabled));
 assert.equal(await page.getByLabel('내 Codex 모델',{exact:true}).inputValue(),'chosen-model');
 failModels=true;
 const reopened=page.getByRole('region',{name:'내 Codex 인증과 모델'});
 await reopened.getByRole('button',{name:'인증·모델 다시 확인'}).click();
 await reopened.getByText(/합성 목록 오류/).waitFor();
 assert.equal(await reopened.getByLabel('내 Codex 모델',{exact:true}).inputValue(),'chosen-model');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'/tmp/jinam-auth-dropdown-synthetic.png',fullPage:true});
 console.log('PASS auth 자동 표시/모델 dropdown/기존 저장 모델 보존/미저장 기본 표시/저장 실패 보존/명시 저장/기본 AI/동의 후 추가/재접속/조회 실패 보존');
} finally {await browser.close();}
