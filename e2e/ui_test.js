const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  try {
    // Read issued certificate id from e2e_issue.json produced earlier
    const issuePath = path.resolve(__dirname, '..', 'e2e_issue.json');
    if (!fs.existsSync(issuePath)) {
      console.error('e2e_issue.json not found at', issuePath);
      process.exit(2);
    }

    const issue = JSON.parse(fs.readFileSync(issuePath, 'utf8'));
    const certId = issue.certificate && (issue.certificate.id || issue.certificate._id);
    if (!certId) {
      console.error('Certificate id not found in e2e_issue.json');
      process.exit(3);
    }

    console.log('Using cert id:', certId);

    // Try to use system Chromium/Chrome if Playwright's browser install failed
    const chromePath = '/usr/bin/google-chrome-stable';
    const launchOptions = { headless: true };
    if (require('fs').existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
      // useful flags for CI / container environments
      launchOptions.args = ['--no-sandbox', '--disable-dev-shm-usage'];
      console.log('Launching system Chrome at', chromePath);
    }
    const browser = await chromium.launch(launchOptions);
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', msg => console.log('PAGE:', msg.type(), msg.text()));

    // Go to Verify page on local dev server
    const root = 'http://localhost:8080/';
    console.log('Navigating to', root);
    await page.goto(root, { waitUntil: 'networkidle' });

    // Prevent anchor clicks from causing a full page request to '/verify'
    await page.evaluate(() => {
      document.querySelectorAll('a[href^="/"]').forEach(a => {
        try {
          const h = a.getAttribute('href');
          a.setAttribute('data-href', h);
          a.setAttribute('href', '#' + h);
        } catch (e) {}
      });
    });

    // Try to find and click a Verify link (now modified to avoid full GET)
    const verifyLink = page.locator('a', { hasText: 'Verify' });
    if (await verifyLink.count() > 0) {
      await verifyLink.first().click();
      await page.waitForLoadState('networkidle');
    } else {
      // If no link, try using history.pushState directly to change route
      await page.evaluate(() => {
        window.history.pushState({}, '', '/verify');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForLoadState('networkidle');
    }

    // Inspect available input elements for debugging
    const inputs = await page.$$eval('input', els => els.map(e => ({ outer: e.outerHTML, placeholder: e.getAttribute('placeholder') })));
    console.log('Found inputs:', inputs.slice(0, 20));

    // Try to pick an input that looks like the verify input
    let chosen = null;
    for (const i of inputs) {
      const p = (i.placeholder || '').toLowerCase();
      if (p.includes('certificate') || p.includes('hash') || p.includes('id')) {
        chosen = i;
        break;
      }
    }

    if (!chosen) {
      console.error('Could not locate verify input on page');
      const htmlPath = require('path').resolve(__dirname, '..', 'e2e_page.html');
      const content = await page.content();
      require('fs').writeFileSync(htmlPath, content, 'utf8');
      console.error('Saved page HTML to', htmlPath);
      throw new Error('verify input not found');
    }

    // Use the first matching input selector by placeholder text
    const placeholder = chosen.placeholder;
    const inputSelector = placeholder ? `input[placeholder="${placeholder}"]` : 'input';
    await page.fill(inputSelector, certId);

    // Click Verify button (match text)
    const button = await page.locator('button', { hasText: 'Verify' }).first();
    await button.click();

    // Wait for result (either verified card or not-found)
    await page.waitForTimeout(1500);

    // Attempt to detect verified state
    const verified = await page.locator('text=Certificate Verified').count();
    const notFound = await page.locator('text=Certificate Not Found').count();

    const screenshotPath = path.resolve(__dirname, '..', 'e2e_verify_result.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log('Verified count:', verified, 'NotFound count:', notFound);
    console.log('Screenshot saved to', screenshotPath);

    await browser.close();

    if (verified > 0) process.exit(0);
    if (notFound > 0) process.exit(4);
    process.exit(5);
  } catch (err) {
    console.error('E2E error:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();