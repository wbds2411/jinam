import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function setPinAndOnboard(page: Page) {
  await page.goto('/');
  await page.getByLabel('새 PIN').fill('1234');
  await page.getByRole('button', { name: 'PIN 설정' }).click();

  await expect(page.getByRole('heading', { name: '결정의 나침반' })).toBeVisible();
  await page.getByLabel('이름/별칭').fill('테스터');
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('생년월일').fill('1990-01-01');
  await page.getByLabel('출생 시각을 모름').check();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByRole('checkbox', { name: /만 14세 이상/ }).check();
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByText('오늘의 컨디션')).toBeVisible();
  await expect(page.getByText(/의 일주는/)).toBeVisible();
  await expect(page.getByRole('button', { name: '타로 한 장' })).toHaveCount(0);
}

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test('PIN → 온보딩 → 상담 → 설정 흐름과 암호화 저장', async ({ page }) => {
  await setPinAndOnboard(page);

  const storage = await page.evaluate(() => ({
    auth: localStorage.getItem('jinam-auth'),
    user: localStorage.getItem('jinam-user'),
  }));
  expect(storage.auth).toContain('credential');
  expect(storage.auth).not.toContain('1234');
  expect(storage.user).toContain('ciphertext');
  expect(storage.user).not.toContain('1990-01-01');

  await page.getByPlaceholder('오늘 뭐가 안 풀려요? 편하게 말해보세요.').fill('결정이 어려워요');
  await page.getByRole('button', { name: '보내기' }).click();
  await expect(page.getByText('결정이 어려워요')).toBeVisible();
  await expect(page.getByText(/오늘의 한 걸음/)).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: '설정' }).click();
  await expect(page.getByRole('heading', { name: '설정' })).toBeVisible();
  await expect(page.getByText(/클라우드 LLM 전송에 동의합니다/)).toBeVisible();
});

test('PHQ-9 위험 응답은 위기 지원 연락처를 표시한다', async ({ page }) => {
  await setPinAndOnboard(page);
  await page.getByRole('button', { name: '마음 체크' }).click();
  await page.getByText('PHQ-9', { exact: false }).locator('..').locator('..').getByRole('button', { name: '시작' }).click();

  const questionCards = page.locator('p').filter({ hasText: /^\d+\./ }).locator('..');
  const count = await questionCards.count();
  for (let index = 0; index < count; index++) {
    await questionCards.nth(index).getByRole('button', { name: '거의 매일' }).click();
  }
  await page.getByRole('button', { name: '결과 보기' }).click();
  await expect(page.getByText('자살예방상담전화')).toBeVisible();
  await expect(page.getByRole('link', { name: '109' })).toHaveAttribute('href', 'tel:109');
});

test('PIN 화면과 온보딩에는 심각한 접근성 위반이 없다', async ({ page }) => {
  await page.goto('/');
  let results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => item.impact === 'critical' || item.impact === 'serious')).toEqual([]);

  await page.getByLabel('새 PIN').fill('1234');
  await page.getByRole('button', { name: 'PIN 설정' }).click();
  results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => item.impact === 'critical' || item.impact === 'serious')).toEqual([]);
});
