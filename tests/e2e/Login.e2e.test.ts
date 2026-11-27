/**
 * ============================================================================================
 *  LAYER:  END-TO-END     (sheet "02 - Login", every row whose Layer is "E2E")
 *  TOOL:   Selenium WebDriver (Chrome) run through Jest   ->   pnpm test:e2e
 *  Needs: the app running (pnpm dev or pnpm build + pnpm start), a Supabase TEST project and the
 *         test accounts from .env.test.local. See the setup steps.
 * ============================================================================================
 *
 * Order of the test cases in this file (ascending, same as the sheet):
 *   LOGIN-01  student logs in and lands on /landing
 *   LOGIN-06  wrong credentials: error, stays on the home page
 *   LOGIN-11  organization logs in and lands on /dashboard
 *   LOGIN-14  unknown organization email cannot log in
 *   LOGIN-20  [MANUAL] real Google login, student
 *   LOGIN-21  [MANUAL] real Google login, organization
 *   LOGIN-22  session survives a page refresh
 *   LOGIN-23  logout ends the session, Back / typing a protected URL does not reveal pages
 *   LOGIN-26  student cannot open organization pages, organization cannot open student pages
 *   LOGIN-27  auth cookie flags (the sheet lists this row as Backend, but only a real browser can
 *             read the cookie the app creates, so it lives here)
 *   LOGIN-28  (TENTATIVE) return to the page the visitor first asked for  -> skipped, not built yet
 *
 * Differences between the sheet and the real app (the tests follow the REAL app):
 *   - There is no /login page. Login is a modal on "/", so "stays on /login" means "stays on /".
 *   - The student header shows no name, so LOGIN-01 checks the page title and the student menu.
 *   - /wishlist does not exist, so LOGIN-26 uses /cart (a student page).
 */
import { By, until, type WebDriver } from 'selenium-webdriver';
import {
  MODAL_ERROR,
  ORG_HOME_TITLE,
  STUDENT_HOME_TITLE,
  WAIT_MS,
  BASE_URL,
  authCookies,
  currentPath,
  expirySeconds,
  logIn,
  logOut,
  startBrowser,
  testAccount,
  waitForPath,
  waitForRoleHome,
} from '../helpers/browser';

let driver: WebDriver;

// Every test gets its own brand-new browser, so cookies never leak from one test to the next.
beforeEach(async () => {
  driver = await startBrowser();
});

afterEach(async () => {
  await driver?.quit();
});

const studentNavButton = (label: string) => By.xpath(`//header//button[normalize-space(.)='${label}']`);

// ===========================================================================================
//  LOGIN-01
// ===========================================================================================
describe('LOGIN-01 [E2E] student login', () => {
  it('logs in with valid credentials and lands on /landing', async () => {
    const student = testAccount('STUDENT');
    await logIn(driver, student.email, student.password);
    await waitForRoleHome(driver, 'STUDENT');
  });
});

// ===========================================================================================
//  LOGIN-06
// ===========================================================================================
describe('LOGIN-06 [E2E] wrong credentials', () => {
  it('shows an error, stays on the home page and creates no session', async () => {
    const student = testAccount('STUDENT');

    await logIn(driver, student.email, 'this-is-not-the-password');

    const error = await driver.wait(until.elementLocated(By.xpath(MODAL_ERROR)), WAIT_MS);
    expect(await error.getText()).toBe('Incorrect email or password.');
    expect(await currentPath(driver)).toBe('/');
    expect(await authCookies(driver)).toHaveLength(0);
  });
});

// ===========================================================================================
//  LOGIN-11
// ===========================================================================================
describe('LOGIN-11 [E2E] organization login', () => {
  it('logs in with the admin-provided credentials and lands on /dashboard', async () => {
    const org = testAccount('ORG');
    await logIn(driver, org.email, org.password);
    await waitForRoleHome(driver, 'ORG');
  });
});

// ===========================================================================================
//  LOGIN-14
// ===========================================================================================
describe('LOGIN-14 [E2E] unknown organization email', () => {
  // The app has no organization "whitelist" screen: an email that was never provisioned simply
  // fails like any other wrong login.
  it('cannot log in and no session is created', async () => {
    await logIn(driver, `unknown_org_${Date.now()}@dlsu.edu.ph`, 'any-password-123');

    const error = await driver.wait(until.elementLocated(By.xpath(MODAL_ERROR)), WAIT_MS);
    expect(await error.getText()).toBe('Incorrect email or password.');
    expect(await currentPath(driver)).toBe('/');
    expect(await authCookies(driver)).toHaveLength(0);
  });
});

// ===========================================================================================
//  LOGIN-20 and LOGIN-21  (MANUAL: Google blocks automated logins)
// ===========================================================================================
describe('LOGIN-20 / LOGIN-21 [E2E · MANUAL] real Google login', () => {
  it.todo('LOGIN-20 [MANUAL] a registered student logs in through the real Google screen and lands on /landing');
  it.todo('LOGIN-21 [MANUAL] an organization logs in with its own Google account and lands on /dashboard');
});

// ===========================================================================================
//  LOGIN-22
// ===========================================================================================
describe('LOGIN-22 [E2E] session persists', () => {
  it('stays logged in after the page is refreshed', async () => {
    const student = testAccount('STUDENT');
    await logIn(driver, student.email, student.password);
    await waitForRoleHome(driver, 'STUDENT');

    await driver.navigate().refresh();

    await waitForRoleHome(driver, 'STUDENT');
    expect((await authCookies(driver)).length).toBeGreaterThan(0);
  });
});

// ===========================================================================================
//  LOGIN-23
// ===========================================================================================
describe('LOGIN-23 [E2E] logout', () => {
  it('ends the session and the Back button does not reveal the protected page', async () => {
    const student = testAccount('STUDENT');
    await logIn(driver, student.email, student.password);
    await waitForPath(driver, '/landing');

    // Visit a second protected page, so there is a page to go "Back" to after logging out.
    await driver.get(`${BASE_URL}/cart`);
    await waitForPath(driver, '/cart');
    await logOut(driver);
    expect(await authCookies(driver)).toHaveLength(0);

    await driver.navigate().back();

    // The browser may show its cached copy for a moment. If it is still showing a protected page
    // after 8 seconds, a refresh makes the server decide, which is what really protects the page.
    const onHome = await driver.wait(async () => (await currentPath(driver)) === '/', 8_000).catch(() => false);
    if (!onHome) await driver.navigate().refresh();
    await waitForPath(driver, '/');
  });

  it('redirects to the home page when a protected URL is typed after logging out', async () => {
    const student = testAccount('STUDENT');
    await logIn(driver, student.email, student.password);
    await waitForPath(driver, '/landing');
    await logOut(driver);

    await driver.get(`${BASE_URL}/landing`);

    await waitForPath(driver, '/');
  });
});

// ===========================================================================================
//  LOGIN-26
// ===========================================================================================
describe('LOGIN-26 [E2E] role-based pages', () => {
  it('sends a student who opens an organization page (/dashboard) back to /landing', async () => {
    const student = testAccount('STUDENT');
    await logIn(driver, student.email, student.password);
    await waitForPath(driver, '/landing');

    await driver.get(`${BASE_URL}/dashboard`);

    await waitForPath(driver, '/landing');
  });

  it('sends an organization who opens a student page (/cart) back to /dashboard', async () => {
    const org = testAccount('ORG');
    await logIn(driver, org.email, org.password);
    await waitForPath(driver, '/dashboard');

    await driver.get(`${BASE_URL}/cart`);

    await waitForPath(driver, '/dashboard');
  });
});

// ===========================================================================================
//  LOGIN-27
// ===========================================================================================
describe('LOGIN-27 [E2E] auth cookie flags', () => {
  // NOTE: the sheet expects HttpOnly + Secure. That is impossible today: the Supabase cookie is
  // written by the BROWSER (document.cookie in src/lib/supabase/client.ts) and JavaScript can never
  // create an HttpOnly cookie. What the app controls (SameSite, Path, "Remember me" lifetime) is tested.
  it('is written with Path=/ and SameSite=Lax and, without "Remember me", is a session cookie', async () => {
    const student = testAccount('STUDENT');
    await logIn(driver, student.email, student.password);
    await waitForPath(driver, '/landing');

    const cookies = await authCookies(driver);

    expect(cookies.length).toBeGreaterThan(0);
    for (const cookie of cookies) {
      expect(cookie.path).toBe('/');
      expect(cookie.sameSite).toBe('Lax');
      expect(expirySeconds(cookie.expiry)).toBeUndefined(); // no expiry = deleted when the browser closes
    }
  });

  it('with "Remember me" ticked it expires in about 30 days', async () => {
    const student = testAccount('STUDENT');
    await logIn(driver, student.email, student.password, { rememberMe: true });
    await waitForPath(driver, '/landing');

    const cookies = await authCookies(driver);

    const thirtyDaysFromNow = Date.now() / 1000 + 30 * 24 * 60 * 60;
    expect(cookies.length).toBeGreaterThan(0);
    for (const cookie of cookies) {
      const expiry = expirySeconds(cookie.expiry);
      expect(expiry).toBeDefined();
      expect(Math.abs((expiry as number) - thirtyDaysFromNow)).toBeLessThan(10 * 60); // within 10 minutes
    }
  });

  it.todo('LOGIN-27 HttpOnly and Secure flags: needs a server-side login route, because the browser client cannot set them');
});

// ===========================================================================================
//  LOGIN-28
// ===========================================================================================
describe.skip('LOGIN-28 [E2E] (TENTATIVE) return to the requested page', () => {
  // SKIPPED ON PURPOSE (describe.skip): the app does not do this yet. The proxy always sends a
  // logged-out visitor to "/" and a successful login always goes to the home page of the account
  // type. Change describe.skip to describe when the feature is built.
  it('sends the visitor to the page they first asked for after logging in', async () => {
    const student = testAccount('STUDENT');
    await driver.get(`${BASE_URL}/cart`);
    await waitForPath(driver, '/');

    await logIn(driver, student.email, student.password);

    await waitForPath(driver, '/cart');
  });
});