import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined});
const page=await browser.newPage({viewport:{width:390,height:844}});
page.setDefaultTimeout(30000);
const address=process.env.JINAM_E2E_URL;
if(!address) throw new Error('JINAM_E2E_URL에 실제 접속 주소를 지정하세요.');
try {
 await page.goto(address);
 const response=await page.request.get(`${address}/api/session`);
 assert.equal(response.status(),200);
 // Isolate the real settings component because HTTP IP origins cannot use PIN WebCrypto.
 // No product authentication code or saved browser/user data is changed.
 await page.evaluate(async()=>{
  const React=await import('/node_modules/.vite/deps/react.js');
  const ReactDOM=await import('/node_modules/.vite/deps/react-dom_client.js');
  const {AIConnections}=await import('/src/components/AIConnections.tsx');
  const target=document.createElement('div'); document.body.replaceChildren(target);
  target.className='page';ReactDOM.default.createRoot(target).render(React.default.createElement(AIConnections));
 });
 await page.getByText(/연결됨.*모델/).waitFor();

 for(const [provider,label,model] of [['codex-cli','Codex CLI','gpt-6.1-sol'],['claude-cli','Claude Code','opus']]) {
  const card = page.getByRole('region',{name:`${label} 인증과 모델`});
  await card.getByText(/인증 연결됨/).waitFor();
  const dropdown = card.getByLabel(`${label} 모델`,{exact:true});
  await page.waitForFunction(label => { const select = [...document.querySelectorAll('select')].find(select => select.labels?.[0]?.textContent === label); return select && !select.disabled && select.options.length > 2; }, `${label} 모델`);
  assert.equal(await dropdown.inputValue(),model);
  assert.ok(await dropdown.locator('option').count() > 2);
  const other = await dropdown.locator('option').evaluateAll((options,current) => options.find(option => option.value && option.value !== current).value,model);
  await dropdown.selectOption(other);
  assert.equal(await dropdown.inputValue(),other);
  await dropdown.selectOption(model);
  await page.screenshot({path:`/tmp/jinam-auth-dropdown-${provider}.png`,fullPage:true});
  console.log(`PASS ${address}: 자동 auth ${provider}, dropdown 목록/기본 ${model}/다른 모델 선택 (저장/생성 없음)`);
 }

} finally {await browser.close();}
