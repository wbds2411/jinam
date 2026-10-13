import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined});
const page = await browser.newPage({viewport:{width:390,height:844}});
page.setDefaultTimeout(30000);
try {
 await page.goto(process.env.JINAM_E2E_URL || 'http://127.0.0.1:5175');
 await page.getByLabel('새 PIN (숫자 4~6자리)').fill('2580');
 await page.getByRole('button',{name:'PIN 설정하고 시작'}).click();
 await page.waitForURL('**/onboarding');
 await page.getByRole('button',{name:'남',exact:true}).click();
 await page.getByRole('button',{name:'다음',exact:true}).click();
 await page.getByRole('button',{name:'정보 입력 건너뛰고 기록 시작'}).click();
 await page.getByRole('button',{name:'설정 열기'}).click();

 await page.getByText(/연결됨.*모델/).waitFor();
 await page.getByText('연결 추가·수정',{exact:true}).click();
 for (const [provider, model] of [['codex-cli','gpt-6.1-sol'],['claude-cli','opus']]) {
  await page.getByLabel('공급자',{exact:true}).selectOption(provider);
  await page.getByText(/CLI 설정 모델:/).waitFor();
  await page.getByText(/연결됨.*인증:/).waitFor();
  await page.getByRole('button',{name:'기본 모델을 입력에 가져오기'}).click();
  assert.equal(await page.getByLabel('모델',{exact:true}).inputValue(),model);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
  await page.screenshot({path:`/tmp/jinam-${provider}-live.png`,fullPage:true});
  console.log(`PASS actual browser: ${provider} 로그인/목록/설정 기본 모델 ${model}; 저장 없음`);
 }
} finally {await browser.close();}
