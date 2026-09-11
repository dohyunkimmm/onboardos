import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const productionUrl = process.env.DEMO_URL || 'https://onboardos-rho.vercel.app/';
const evidenceUrl = process.env.EVIDENCE_URL || 'https://github.com/dohyunkimmm/onboardos/actions/runs/34608554610';
const outputDir = path.resolve('demo-output');
const rawDir = path.join(outputDir, 'raw');
const webmPath = path.join(outputDir, 'ONBOARD_OS_v1.7.0_P6_production_demo.webm');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

await fs.mkdir(rawDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: rawDir, size: { width: 1280, height: 720 } }
});
const page = await context.newPage();
const video = page.video();
let recordingError;

await page.route('**/vitals.vercel-analytics.com/**', route => route.fulfill({ status: 204, body: '' }));
await page.route('**/_vercel/insights/event**', route => route.fulfill({ status: 204, body: '' }));
await page.route('**/_vercel/speed-insights/vitals**', route => route.fulfill({ status: 204, body: '' }));

try {
  const response = await page.goto(productionUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  if (!response || response.status() !== 200) throw new Error(`Production returned ${response?.status()}`);
  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).waitFor({ state: 'visible' });
  await wait(4_000);

  await page.getByRole('button', { name: 'Google SSO로 시작하기' }).click();
  await page.locator('#loginScreen').waitFor({ state: 'hidden' });
  const card = page.locator('#roleGrid .card').filter({ hasText: 'Microsoft Office' });
  await card.scrollIntoViewIfNeeded();
  await wait(4_000);

  await card.getByRole('button', { name: '신청하기' }).click();
  await page.locator('#requestNote').fill('포트폴리오 Production 데모 녹화');
  await wait(2_500);
  await page.getByRole('button', { name: '신청 완료' }).click();
  await wait(3_000);

  await page.locator('#statusBtn').click();
  await page.locator('.request-item').filter({ hasText: 'Microsoft Office' }).waitFor({ state: 'visible' });
  await wait(4_500);
  await page.getByRole('button', { name: '닫기' }).click();
  await wait(1_500);

  await page.locator('#adminBtn').click();
  const request = page.locator('.request-item').filter({ hasText: 'Microsoft Office' });
  await request.waitFor({ state: 'visible' });
  await wait(3_500);
  await request.getByRole('button', { name: 'IT 검토 완료' }).click();
  await wait(3_000);
  await page.getByRole('button', { name: '지급 완료 처리' }).click();
  await request.waitFor({ state: 'visible' });
  await wait(4_000);

  await page.getByRole('button', { name: '닫기' }).click();
  await page.locator('#statusBtn').click();
  await page.locator('.request-item').filter({ hasText: 'Microsoft Office' }).waitFor({ state: 'visible' });
  await wait(4_000);
  await page.getByRole('button', { name: '닫기' }).click();
  await wait(1_000);

  await page.goto(evidenceUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await wait(8_000);
} catch (error) {
  recordingError = error;
} finally {
  // Playwright finalizes the video when the page closes. Keep the context/browser
  // alive until saveAs has copied the finalized recording to the stable output path.
  if (!page.isClosed()) await page.close();
  if (video) await video.saveAs(webmPath);
  await context.close();
  await browser.close();
}

if (recordingError) throw recordingError;
if (!video) throw new Error('Playwright video recording was not initialized.');
const stat = await fs.stat(webmPath);
if (stat.size < 100_000) throw new Error(`Recorded video is unexpectedly small: ${stat.size} bytes`);
console.log(`Recorded ${webmPath} (${stat.size} bytes)`);
