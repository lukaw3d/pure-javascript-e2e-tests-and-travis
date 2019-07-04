/*
    To use:
        npm install --no-package-lock
        npm run test

    Puppeteer api:
        https://github.com/GoogleChrome/puppeteer/blob/v1.12.2/docs/api.md
    Instructions to look at what is happening on page:
        https://github.com/GoogleChrome/puppeteer/blob/v1.12.2/README.md#debugging-tips
        const DEBUG = true;
    Jest api:
        https://jestjs.io/docs/en/api
*/

const puppeteer = require('puppeteer');
const fs = require('fs');

const DEBUG = false;
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

let browser;
let page;
let pageErrors;
let reemitPageConsole;

beforeAll(async () => {
    browser = await puppeteer.launch({
        ...(!DEBUG ? {
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

    page.on('console', (msg) => {
        if (msg.type() === 'error') pageErrors.push(msg.text());
        if (reemitPageConsole) console.log('browser console:', msg.text());
    });
    page.on('pageerror', (err) => {
        pageErrors.push(err.toString());
        if (reemitPageConsole) console.log('page error:', err.toString());
    });
    page.on('error', (err) => {
        pageErrors.push(err.toString());
        if (reemitPageConsole) console.log('page error:', err.toString());
    });
});

beforeEach(() => {
    pageErrors = [];
    reemitPageConsole = true;
});


describe('Content-Security-Policy', () => {
    it('Opening local file with strict CSP should log violations', async () => {
        const originalContent = String(await fs.promises.readFile('./a.html'));
        expect(originalContent).toContain('<head>');

        const content = originalContent.replace('<head>', `<head>
            <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'report-sample';">
        `);

        expect(pageErrors).toEqual([]);
        reemitPageConsole = false;
        await page.reload();
        await page.setContent(content);
        reemitPageConsole = true;
        expect(pageErrors[0]).toContain('violates the following Content Security Policy');
    });

    it('Opening local file with whitelisted CSP hashes should work', async () => {
        const originalContent = String(await fs.promises.readFile('./a.html'));
        const cspHeader = String(await fs.promises.readFile('./csp_header.txt'));
        const cleanCspHeader = cspHeader.replace(/#.*/g, '').replace(/[\n\r]/g, ' ');

        const content = originalContent.replace('<head>', `<head>
            <meta http-equiv="Content-Security-Policy" content="${cleanCspHeader}">
        `);

        expect(pageErrors).toEqual([]);
        await page.reload();
        await page.setContent(content);
        expect(pageErrors).toEqual([]);

        const x = await page.evaluate(() => window.x);
        expect(x).toBe(3);
    });
});


afterAll(async () => {
    await page.close();
    await browser.close();
});
