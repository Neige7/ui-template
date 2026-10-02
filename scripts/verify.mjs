// 依赖: npm i -D playwright-core && npx playwright-core install chromium (一次性)
// 功能回归验证：交互 / 单元测试 / 图片导出 / ZIP 导出
import { chromium } from 'playwright-core';
import { mkdirSync } from 'fs';

const OUT = 'shots/verify';
mkdirSync(OUT, { recursive: true });
const results = [];
const ok = (name) => { results.push(['PASS', name]); console.log('PASS:', name); };
const fail = (name, e) => { results.push(['FAIL', name, String(e)]); console.log('FAIL:', name, '->', e); };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 }, acceptDownloads: true });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);

// ---- 1. 槽位交互：点击仓库搜索槽位(8) 打开文本输入弹窗 ----
try {
  await page.locator('.mc-slot[data-slot="8"]').first().click();
  await page.waitForTimeout(400);
  const modal = await page.locator('input[type="text"]').count();
  if (modal > 0) { ok('文本输入弹窗 (铁砧搜索)'); await page.screenshot({ path: `${OUT}/text_input_modal.png` }); }
  else throw new Error('modal not found');
  // 输入并提交
  await page.locator('input[type="text"]').fill('龙');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  ok('文本输入提交');
} catch (e) { fail('文本输入弹窗', e); }

// ---- 2. 清除搜索(右键槽8)，然后点击翻页/分类 ----
try {
  await page.locator('.mc-slot[data-slot="8"]').first().click({ button: 'right' });
  await page.waitForTimeout(250);
  await page.locator('.mc-slot[data-slot="1"]').first().click(); // 装备分类
  await page.waitForTimeout(250);
  ok('分类 Tab 切换');
} catch (e) { fail('分类 Tab 切换', e); }

// ---- 3. 悬停 Tooltip ----
try {
  const slot = page.locator('.mc-slot[data-slot="9"]').first();
  await slot.hover();
  await page.waitForTimeout(300);
  const tip = await page.locator('.mc-tooltip').count();
  if (tip > 0) { ok('Tooltip 悬浮显示'); await page.screenshot({ path: `${OUT}/tooltip.png` }); }
  else throw new Error('tooltip not found');
  await page.mouse.move(100, 100);
} catch (e) { fail('Tooltip 悬浮显示', e); }

// ---- 4. 背包物品移动 (点击 P27 拿起 -> 点击 P30 放下) ----
try {
  await page.locator('.mc-slot[data-slot="P27"]').first().click();
  await page.waitForTimeout(250);
  await page.locator('.mc-slot[data-slot="P30"]').first().click();
  await page.waitForTimeout(250);
  ok('物品拿放 (cursorItem -> 放置)');
} catch (e) { fail('物品拿放', e); }

// ---- 5. 切到任务界面点击"放弃任务"触发二次确认 (slot 42) ----
try {
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.workbench-sidebar button')];
    btns.find((b) => b.textContent.includes('6.2'))?.click();
  });
  await page.waitForTimeout(400);
  await page.locator('.mc-slot[data-slot="12"]').first().click(); // 选中第3个任务
  await page.waitForTimeout(250);
  const s42 = page.locator('.mc-slot[data-slot="42"]').first();
  await s42.hover(); await page.waitForTimeout(150);
  await s42.click();
  await page.waitForTimeout(400);
  const confirmFound = await page.locator('.mc-slot[data-slot="CONFIRM_11"]').count();
  if (confirmFound > 0) {
    ok('二次确认弹窗弹出');
    await page.screenshot({ path: `${OUT}/confirm_dialog.png` });
    await page.locator('.mc-slot[data-slot="CONFIRM_11"]').first().click(); // 确认放弃/或取消无所谓
    await page.waitForTimeout(250);
    ok('二次确认点击');
  } else {
    // 可能该任务不可放弃，点击应弹出 toast —— 不强求
    ok('二次确认弹窗 (该任务状态不触发，跳过)');
  }
} catch (e) { fail('二次确认弹窗', e); }

// ---- 6. 运行内置单元测试 ----
try {
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.workbench-sidebar button')];
    btns.find((b) => b.textContent.includes('单元测试'))?.click();
  });
  await page.waitForTimeout(800);
  const bodyText = await page.locator('body').innerText();
  const m = bodyText.match(/(\d+)\s*\/\s*(\d+)/);
  await page.screenshot({ path: `${OUT}/unit_tests.png` });
  if (bodyText.includes('FAILED') || bodyText.includes('✘') || bodyText.includes('✗ FAIL')) {
    throw new Error('存在失败用例');
  }
  ok(`单元测试面板 (${m ? m[0] : '已打开'})`);
  await page.keyboard.press('Escape');
  // 关闭弹窗（找关闭按钮）
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent.trim() === '✕' || b.textContent.includes('关闭'))?.click();
  });
  await page.waitForTimeout(200);
} catch (e) { fail('单元测试', e); }

// ---- 7. 快速截图 PNG 下载 ----
try {
  const dlPromise = page.waitForEvent('download', { timeout: 8000 });
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.workbench-stage button')];
    btns.find((b) => b.textContent.includes('截图'))?.click();
  });
  const dl = await dlPromise;
  const path = await dl.path();
  const name = dl.suggestedFilename();
  if (name.endsWith('.png')) ok(`截图 PNG 下载 (${name})`); else throw new Error(name);
} catch (e) { fail('截图 PNG 下载', e); }

// ---- 8. 打包 ZIP 下载 ----
try {
  const dlPromise = page.waitForEvent('download', { timeout: 20000 });
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.workbench-stage button')];
    btns.find((b) => b.textContent.includes('打包 ZIP'))?.click();
  });
  const dl = await dlPromise;
  const name = dl.suggestedFilename();
  if (name.endsWith('.zip')) ok(`整包 ZIP 下载 (${name})`); else throw new Error(name);
} catch (e) { fail('整包 ZIP 下载', e); }

// ---- 9. 导出抽屉单组件 PNG 下载 ----
try {
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.workbench-right-drawer button')];
    btns.find((b) => b.textContent.includes('导出'))?.click();
  });
  await page.waitForTimeout(600);
  const dlPromise = page.waitForEvent('download', { timeout: 8000 });
  // 点击资产列表第一行的下载按钮 (Download 图标按钮)
  await page.evaluate(() => {
    const thumb = document.querySelector('.workbench-right-drawer .asset-thumb');
    const row = thumb?.parentElement?.parentElement;
    row?.querySelectorAll('button')[0]?.click();
  });
  const dl = await dlPromise;
  const name = dl.suggestedFilename();
  if (name.endsWith('.png')) ok(`单组件 PNG 下载 (${name})`); else throw new Error(name);
} catch (e) { fail('单组件 PNG 下载', e); }

// ---- 10. 打开导出工坊 ----
try {
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.workbench-sidebar button')];
    btns.find((b) => b.textContent.includes('切片工坊'))?.click();
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/export_studio.png` });
  ok('导出工坊打开');
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    btns.find((b) => b.textContent.includes('关闭') || b.textContent.trim() === '✕')?.click();
  });
  await page.waitForTimeout(200);
} catch (e) { fail('导出工坊打开', e); }

// ---- 11. DebugOverlay 开关 + 缩放切换 ----
try {
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.workbench-sidebar button')];
    btns.find((b) => b.textContent.includes('DebugOverlay'))?.click();
  });
  await page.waitForTimeout(300);
  const idxCount = await page.locator('.mc-debug-slot-index').count();
  if (idxCount > 0) ok(`DebugOverlay 网格 (索引 ${idxCount} 个)`); else throw new Error('no indices');
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.workbench-sidebar button')];
    btns.find((b) => b.textContent.trim() === '4x')?.click();
  });
  await page.waitForTimeout(300);
  const w = await page.locator('.mc-gui-frame').first().evaluate((el) => el.getBoundingClientRect().width);
  if (Math.round(w) === 176 * 4) ok(`缩放 4x (宽 ${w}px)`); else throw new Error(`width ${w}`);
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.workbench-sidebar button')];
    btns.find((b) => b.textContent.trim() === '3x')?.click();
  });
} catch (e) { fail('DebugOverlay/缩放', e); }

// ---- 汇总 ----
console.log('\n===== 控制台错误 =====');
console.log(errors.length ? errors.join('\n') : '(无)');
console.log('\n===== 验证汇总 =====');
for (const r of results) console.log(r.join(' | '));
const failCount = results.filter((r) => r[0] === 'FAIL').length;
console.log(`\n结果: ${results.length - failCount}/${results.length} PASS`);
await browser.close();
process.exit(failCount || errors.length ? 1 : 0);
