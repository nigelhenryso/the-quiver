/**
 * Helpers shared by the Selenium (END-TO-END) tests. This file has no tests of its own.
 *
 * The app has NO /login page: "Log In" is a modal that opens on the home page "/".
 * The helpers below know how to find the things on screen (button names, placeholders, titles)
 * as they are written in the source code, so the test files can read like the sheet.
 */
import { Builder, By, until, type WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

export const BASE_URL = (process.env.E2E_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export const WAIT_MS = 15_000;

/** The browser tab titles of the two home pages (from the page metadata in src/app). */
export const STUDENT_HOME_TITLE = 'Home | The Quiver';
export const ORG_HOME_TITLE = 'Dashboard | The Quiver Seller Hub';

/** Test accounts come from .env.test.local (TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD, ...). */
export function testAccount(kind: 'STUDENT' | 'ORG') {
  const email = process.env[`TEST_${kind}_EMAIL`];
  const password = process.env[`TEST_${kind}_PASSWORD`];
  if (!email || !password) {
    throw new Error(`Missing TEST_${kind}_EMAIL / TEST_${kind}_PASSWORD. Add them to .env.test.local (see the setup steps).`);
  }
  return { email, password };
}

/** Starts a fresh Chrome. Set E2E_HEADED=true in .env.test.local to WATCH the browser. */
export async function startBrowser(): Promise<WebDriver> {
  const options = new chrome.Options();
  if (process.env.E2E_HEADED !== 'true') options.addArguments('--headless=new');
  options.addArguments('--window-size=1440,900', '--no-sandbox', '--disable-dev-shm-usage');
  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

// ---------- reading the page ----------------------------------------------------------------
export async function currentPath(driver: WebDriver): Promise<string> {
  return new URL(await driver.getCurrentUrl()).pathname;
}

export async function waitForPath(driver: WebDriver, path: string) {
  await driver.wait(async () => (await currentPath(driver)) === path, WAIT_MS, `The page never reached ${path}`);
}

export async function waitForTitle(driver: WebDriver, title: string) {
  await driver.wait(until.titleIs(title), WAIT_MS);
}

/** The Supabase session cookies (sb-<project>-auth-token, possibly split into .0 / .1 pieces). */
export async function authCookies(driver: WebDriver) {
  const all = await driver.manage().getCookies();
  return all.filter((cookie) => /^sb-.+-auth-token(\.\d+)?$/.test(cookie.name));
}

/** Selenium may return a cookie expiry as seconds or as a Date. This always gives seconds. */
export function expirySeconds(expiry: unknown): number | undefined {
  if (expiry === undefined || expiry === null) return undefined;
  return expiry instanceof Date ? expiry.getTime() / 1000 : Number(expiry);
}

// ---------- the login modal --------------------------------------------------------------------
const EMAIL_INPUT = "[role='dialog'] input[placeholder='e.g. juan_dela_cruz@dlsu.edu.ph']";
const PASSWORD_INPUT = "[role='dialog'] input[placeholder='Enter your password']";
const MODAL_LOG_IN_BUTTON = "//*[@role='dialog']//button[normalize-space(.)='Log In']";
const REMEMBER_ME = "//*[@role='dialog']//label[.//span[normalize-space(.)='Remember me']]";
export const MODAL_ERROR = "//*[@role='dialog']//p[@role='alert']";

export async function openHome(driver: WebDriver) {
  await driver.get(`${BASE_URL}/`);
}

/** Clicks the "Log In" button of the page header, which opens the modal. */
export async function openLoginModal(driver: WebDriver) {
  const headerButton = await driver.wait(
    until.elementLocated(By.xpath("(//header//button[normalize-space(.)='Log In'])[1]")),
    WAIT_MS
  );
  await headerButton.click();
  await driver.wait(until.elementLocated(By.css("[role='dialog']")), WAIT_MS);
}

/** Types the email and password into the open modal and presses its Log In button. */
export async function submitLoginForm(
  driver: WebDriver,
  email: string,
  password: string,
  options: { rememberMe?: boolean } = {}
) {
  await driver.findElement(By.css(EMAIL_INPUT)).sendKeys(email);
  await driver.findElement(By.css(PASSWORD_INPUT)).sendKeys(password);
  if (options.rememberMe) await driver.findElement(By.xpath(REMEMBER_ME)).click();
  await driver.findElement(By.xpath(MODAL_LOG_IN_BUTTON)).click();
}

/** Opens the home page, opens the modal and submits it. Does NOT wait for the redirect. */
export async function logIn(
  driver: WebDriver,
  email: string,
  password: string,
  options: { rememberMe?: boolean } = {}
) {
  await openHome(driver);
  await openLoginModal(driver);
  await submitLoginForm(driver, email, password, options);
}

/**
 * Logs out through the user menu. The menu button has no text, so it is found as the LAST button
 * of the header (tip: adding aria-label="Account menu" to it in Header.tsx would make this safer).
 */
export async function logOut(driver: WebDriver) {
  const userMenuButton = await driver.wait(until.elementLocated(By.xpath('(//header//button)[last()]')), WAIT_MS);
  await userMenuButton.click();
  const logOutItem = await driver.wait(
    until.elementLocated(By.xpath("//button[@role='menuitem'][normalize-space(.)='Log out']")),
    WAIT_MS
  );
  await logOutItem.click();
  await waitForPath(driver, '/');
}