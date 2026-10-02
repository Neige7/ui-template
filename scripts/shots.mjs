// 依赖: npm i -D playwright-core && npx playwright-core install chromium (一次性)
// 截图脚本：捕获 9 个界面的当前视觉状态
// 用法: node scripts/shots.mjs [outdir] [onlyScreen]
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const OUT = process.argv[2] || 'shots/before';
const ONLY = process.argv[3] || null;
mkdirSync(OUT, { recursive: true });

const SCREENS = ['warehouse', 'inventory', 'quest', 'pet', 'mount', 'mail', 'guild', 'shop_edit', 'shop_buy'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error') console.log('[console.error]', m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500); // 等字体加载

// 关闭 debug 网格，看纯净渲染效果（点击 DebugOverlay 开关）
// 保持默认即可（默认开启 debug）。这里先各截一份 debug 默认态。

for (const s of SCREENS) {
  if (ONLY && s !== ONLY) continue;
  await page.evaluate((sid) => {
    const btns = [...document.querySelectorAll('.workbench-sidebar button')];
    const map = {
      warehouse: '6.7', inventory: '6.1', quest: '6.2', pet: '6.3', mount: '6.4',
      mail: '6.6', guild: '6.5', shop_edit: '6.8', shop_buy: '6.9',
    };
    const btn = btns.find((b) => b.textContent.includes(map[sid]));
    btn?.click();
  }, s);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${s}.png` });
  console.log('shot:', s);
}

// 截一张舞台放大视图（仅 GUI 容器区域）
const frame = page.locator('.mc-gui-frame');
if (await frame.count()) {
  await frame.first().screenshot({ path: `${OUT}/_frame_detail.png` });
  console.log('shot: frame detail');
}

await browser.close();
console.log('done ->', OUT);
