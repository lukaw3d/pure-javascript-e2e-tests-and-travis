const puppeteer = require('puppeteer');

jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

let page;
let browser;

beforeAll(async () => {
    const debug = false;
    browser = await puppeteer.launch({
        ...(!debug ? {
            headless: true,
        } : {
            headless: false,
            devtools: true,
            slowMo: 1000,
        }),
        args: ['--no-sandbox'], // Needed on TravisCI
        defaultViewport: { width: 1280, height: 720 },
    });
    page = await browser.newPage();
    page.on('console', (msg) => console.log('browser console:', msg.text()));
    page.on('pageerror', (err) => console.log('page pageerror:', err.toString()));
    page.on('error', (err) => console.log('page error:', err.toString()));
});


/*
    To use:
    npm install --no-package-lock
    npm run test

    Instructions to look at what is happening on page:
        https://github.com/GoogleChrome/puppeteer/blob/v1.12.2/README.md#debugging-tips
    Puppeteer api:
        https://github.com/GoogleChrome/puppeteer/blob/v1.12.2/docs/api.md
*/

describe('Test in browser', () => {
    it('Open local file', async () => {
        await page.goto(__dirname + '/a.html');
        await page.click('[data-target="#demo-wgs-description"]');

        expect(await page.$('[href="http://trace.ncbi.nlm.nih.gov/Traces/sra/?study=SRP001534"]')).toBeTruthy();

        const b = await page.evaluate(async () => await document.body.innerHTML);
        console.log(b);

        const x = await page.evaluate(async () => await window.x);
        console.log(x);
        expect(x).toBe(3);

        /*
        And if inline CSP sha exception doesn't match the script it would print:
            console.log browser-test.js:21
                browser console Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'". Either the 'unsafe-inline' keyword, a hash ('sha256-hVqSdzYGZPpjolc+CHBmrtFq2PjX56dsP8btshGEqt8='), or a nonce ('nonce-...') is required to enable inline execution.
        */
    });
});


afterAll(async () => {
    await page.close();
    await browser.close();
});
