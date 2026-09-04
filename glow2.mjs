import { chromium } from '/Users/shinmingyu/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
const OUT = '/private/tmp/claude-501/-Users-shinmingyu-Project-flux/3782c5e3-bcea-4380-95bd-52c2fad56bfa/scratchpad';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.setItem('flux.playerCount', '2'));
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const btn = page.getByRole('button', { name: '랜덤 뽑기' });
for (let n = 1; n <= 3; n++) {
  await btn.nth(0).click();
  await btn.nth(1).click();
  await page.waitForTimeout(800);
  if (n === 1) await page.screenshot({ path: `${OUT}/h-spin.png` });
  // 1700ms 착지 + 글로우 피크(약 35% = 245ms)
  await page.waitForTimeout(1150);
  await page.screenshot({ path: `${OUT}/h-land-${n}.png` });
  const info = await page.locator('.slot-window').evaluateAll((els) =>
    els.map((el) => ({
      glow: getComputedStyle(el).getPropertyValue('--glow-rgb').trim(),
      name: el.parentElement.querySelector('.slot-name').textContent.trim(),
      cell: (() => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const hit = [...el.querySelectorAll('.slot-cell')].find((c) => {
          const b = c.getBoundingClientRect();
          return cx >= b.left && cx <= b.right && cy >= b.top && cy <= b.bottom;
        });
        const t = hit?.querySelector('img, [role="img"]');
        return t?.getAttribute('alt') ?? t?.getAttribute('aria-label') ?? null;
      })(),
    })),
  );
  console.log(`draw ${n}:`, JSON.stringify(info));
  await page.waitForTimeout(700);
}
await browser.close();
