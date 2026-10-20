// Requires Playwright and installed Chrome; serves the app locally for the check.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const server = http.createServer((request, response) => {
    const files = { '/': ['index.html', 'text/html'], '/styles.css': ['styles.css', 'text/css'], '/script.js': ['script.js', 'text/javascript'] };
    const file = files[new URL(request.url, 'http://localhost').pathname];
    if (!Array.isArray(file)) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', file[1] + '; charset=utf-8');
    fs.createReadStream(path.join(__dirname, '..', file[0])).pipe(response);
  });
  const screenshotDir = process.argv[2];
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
    for (const width of [1280, 900, 360]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.locator('#calendar-grid .day-cell').first().waitFor();
      const converter = page.locator('#converter-section');
      assert.equal(await converter.getAttribute('open') !== null, width > 900);
      const initial = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        summary: document.querySelector('#selected-summary').getBoundingClientRect().toJSON(),
        calendar: document.querySelector('#calendar-grid').getBoundingClientRect().toJSON(),
        lunarSize: parseFloat(getComputedStyle(document.querySelector('.chinese-date')).fontSize)
      }));
      assert.equal(initial.overflow, false, `overflow at ${width}px`);
      assert(initial.lunarSize >= 13, `unreadable lunar text at ${width}px`);
      if (width <= 900) assert(initial.summary.bottom <= initial.calendar.top, 'mobile summary must precede calendar');
      if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, `calendar-${width}.png`), fullPage: true });
      if (width <= 900) await converter.locator('summary').click();

      await page.locator('#solar-date-input').fill('2026-05-21');
      await page.locator('#convert-to-lunar').click();
      assert.match(await page.locator('#summary-lunar').innerText(), /四月.*初五/);
      assert.match(await page.locator('#calendar-header').innerText(), /2026年5月/);
      const selected = () => page.locator('.day-cell[aria-pressed="true"]').getAttribute('data-date');
      assert.equal(await selected(), '2026-05-21');

      await page.locator('#tab-lunar2solar').click();
      await page.locator('#lunar-year-input').fill('2025');
      await page.locator('#lunar-month-input').selectOption('6');
      await page.locator('#lunar-day-input').selectOption('1');
      await page.locator('#lunar-leap-input').check();
      await page.locator('#convert-to-solar').click();
      assert.equal(await selected(), '2025-07-25');
      assert.match(await page.locator('#summary-lunar').innerText(), /[闰閏]六月.*初一/);
      const summaryBeforeError = await page.locator('#selected-summary').innerText();
      await page.locator('#lunar-year-input').fill('1800');
      await page.locator('#lunar-year-input').press('Tab');
      assert.equal(await page.locator('.checkbox-label').isVisible(), false);
      assert.equal(await page.locator('#lunar-leap-input').isEnabled(), false);
      await page.locator('#convert-to-solar').click();
      assert.equal(await page.locator('#selected-summary').innerText(), summaryBeforeError);
      await page.locator('#lunar-year-input').fill('2025');
      await page.locator('#lunar-year-input').press('Tab');
      await page.locator('#lunar-leap-input').check();

      // A stale lunar draft must not replace a newer calendar selection on a language change.
      await page.locator('#tab-solar2lunar').click();
      await page.locator('#solar-date-input').fill('2026-05-21');
      await page.locator('#convert-to-lunar').click();
      await page.locator('#next-month').click();
      const browsedMonth = await page.locator('#calendar-header').innerText();
      await page.locator('#script-toggle').click();
      assert.equal(await page.locator('#solar-date-input').inputValue(), '2026-05-21');
      assert.equal(await page.locator('#calendar-header').innerText(), browsedMonth);
      assert.match(await page.locator('#summary-solar').innerText(), /2026.*5.*21/);

      await page.locator('#result-solar2lunar [data-jump-year]').click();
      assert.match(await page.locator('#calendar-header').innerText(), /2026年5月/);
      assert(await page.locator('.calendar-nav').evaluate(el => el.getBoundingClientRect().bottom > 0), 'jump must reveal calendar');
      await page.locator('.day-cell[data-date="2026-05-21"]').press('ArrowRight');
      assert.equal(await selected(), '2026-05-22');
      assert.equal(await page.locator('.day-cell[data-date="2026-05-22"]').evaluate(el => document.activeElement === el), true);

      await page.locator('#solar-date-input').fill('1900-01-31');
      await page.locator('#convert-to-lunar').click();
      assert.equal(await page.locator('#prev-month').isEnabled(), false);
      await page.locator('#solar-date-input').fill('2100-12-31');
      await page.locator('#convert-to-lunar').click();
      assert.equal(await page.locator('#next-month').isEnabled(), false);
      await page.locator('#today-btn').click();
      assert.equal(await page.locator('.day-cell.today').getAttribute('aria-pressed'), 'true');
      assert.deepEqual(errors, [], `runtime errors at ${width}px`);
      console.log(`PASS ${width}px: layout, conversion, leap month, language, keyboard, boundaries`);
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
