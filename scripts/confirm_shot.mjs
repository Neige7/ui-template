// 依赖: npm i -D playwright-core && npx playwright-core install chromium (一次性)
import { chromium } from 'playwright-core';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('.workbench-sidebar button')];
  btns.find((b) => b.textContent.includes('6.3'))?.click();
});
await page.waitForTimeout(500);
await page.locator('.mc-slot[data-slot="44"]').first().click();
await page.waitForTimeout(400);
const found = await page.locator('.mc-slot[data-slot="CONFIRM_11"]').count();
console.log('confirm dialog slots found:', found);
await page.screenshot({ path: 'shots/verify/confirm_dialog.png' });
await page.locator('.mc-slot[data-slot="CONFIRM_15"]').first().click().catch(() => {});
await page.waitForTimeout(300);
const still = await page.locator('.mc-slot[data-slot="CONFIRM_11"]').count();
console.log('dialog closed:', still === 0);
await browser.close();
