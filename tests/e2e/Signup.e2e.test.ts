import assert from "node:assert";
import { describe, it, beforeEach, afterEach, expect, jest } from "@jest/globals";
import { Builder, By, until, WebDriver, WebElement } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";


jest.setTimeout(90000);
const URL = "http://localhost:3000";
const TIMEOUT = 90000;

class Webpage {
  emailField!: WebElement;
  passwordField!: WebElement;
  repeatPasswordField!: WebElement;
  signupButton!: WebElement;

  otpBoxes! : WebElement[];
  otpSubmitButton! : WebElement;

  firstNameField!: WebElement;
  lastNameField!: WebElement;
  idNumberField!: WebElement;
  collegeField!: WebElement;
  contactNumberField! : WebElement;
  birthdayField! : WebElement
  completeProfileButton!: WebElement;

  constructor(public driver: WebDriver) {}

  async openSignupModal(): Promise<void> {
    const navSignup = await this.driver.wait(
      until.elementLocated(By.xpath("//button[normalize-space()='Sign Up']")),
      TIMEOUT
    );
    await this.driver.wait(until.elementIsVisible(navSignup), TIMEOUT);
    await navSignup.click();
  }

  async getSignupModalElements(): Promise<void> {
    this.emailField = await this.driver.wait(
      until.elementLocated(By.css("input[placeholder='e.g. juan_dela_cruz@dlsu.edu.ph']")),
      TIMEOUT
    );
    this.passwordField = await this.driver.findElement(
      By.css("input[placeholder='Create a strong password']")
    );
    this.repeatPasswordField = await this.driver.findElement(
      By.css("input[placeholder='Retype Password']")
    );
    this.signupButton = await this.driver.findElement(
      By.xpath("//p[contains(., 'By signing up')]/following::button[normalize-space()='Sign Up'][1]")
    );
  }

  async getOTPElements() : Promise<void> {
    await this.driver.wait(
    until.elementLocated(
      By.xpath('//form[.//input[starts-with(@aria-label, "Digit")]]//*[self::button or @role="button"][contains(normalize-space(), "Submit")]')
    ), TIMEOUT)
    this.otpBoxes = await this.driver.findElements(By.css('input[aria-label^="Digit"]'));
    this.otpSubmitButton = await this.driver.findElement(
    By.xpath('//form[.//input[starts-with(@aria-label, "Digit")]]//*[self::button or @role="button"][contains(normalize-space(), "Submit")]')
  );
  }

  async getCompleteYourProfileModalElements(): Promise<void> {
    this.firstNameField = await this.driver.wait(
      until.elementLocated(By.css("input[placeholder='Enter First Name']")),
      TIMEOUT
    );
    await this.driver.wait(until.elementIsVisible(this.firstNameField), TIMEOUT);
    this.lastNameField = await this.driver.findElement(
      By.css("input[placeholder='Enter Last Name']")
    );
    this.idNumberField = await this.driver.findElement(
      By.css("input[placeholder='12******']")
    );
    this.collegeField = await this.driver.findElement(By.id("College"));
    this.completeProfileButton = await this.driver.findElement(
      By.xpath("//button[contains(., 'Complete Setup')]")
    );

    this.contactNumberField = await this.driver.findElement(
        By.xpath("//input[@placeholder='09XXXXXXXXX']")
    );

    this.birthdayField = await this.driver.findElement(
      By.xpath("//input[@placeholder='YYYY-MM-DD']")
    );
  }

  async simulateInputsSignupModal(
    email: string,
    password: string,
    repeatPassword?: string
  ): Promise<void> {
    await this.emailField.sendKeys(email);
    await this.passwordField.sendKeys(password);
    await this.repeatPasswordField.sendKeys(repeatPassword ?? password);
    await this.signupButton.click();
  }

  async simulateInputOTP(otp : string) {
      for (let i = 0; i < otp.length; i++) {
        await this.otpBoxes[i].sendKeys(otp[i]);
      }
      await this.otpSubmitButton.click();
  }

  async simulateInputsCompleteYourProfileModal(
    firstName: string,
    lastName: string,
    idNum: string,
    college: string,
    contactNumber : string = "",
    birthday : string = ""

  ): Promise<void> {
    await this.firstNameField.sendKeys(firstName);
    await this.lastNameField.sendKeys(lastName);
    await this.idNumberField.sendKeys(idNum);
    await this.collegeField
      .findElement(By.xpath(`.//option[normalize-space()='${college}']`))
      .click();

    if (contactNumber && birthday) {
      await this.contactNumberField.sendKeys(contactNumber);
      await this.birthdayField.sendKeys(birthday);
    }
    await this.completeProfileButton.click();
  }

   async hasText(text: string, timeout = TIMEOUT): Promise<boolean> {
    {    try {
          await this.driver.wait(async () => {
            const elements = await this.driver.findElements(
              By.xpath(`//*[text()[normalize-space(.)='${text}']]`)
            );
            for (const element of elements) {
              try {
                if (await element.isDisplayed()) return true;
              } catch {
                // element went stale between find and check; retry on next poll
              }
            }
            return false;
          }, timeout);
          return true;
        } catch {
          return false;
        }
      }
}  
}

 

async function initDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments(
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1920,1080"
  );
  const driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
  await driver.get(URL);
  return driver;
}

function generateEmail(domain: string): string {
  return `testacc_${Date.now()}_${Math.floor(Math.random() * 1e6)}${domain}`;
}

function generateIdNumber() : string {
  let id = "12";
  for (let i = 2; i < 8; i++) {
    id += Math.floor(Math.random() * 10);
  }
  return id;
}

// Named check*, not test*, because they are helpers, not tests
async function checkSignupModalElementsLoaded(page: Webpage): Promise<void> {
  assert.ok(await page.emailField.isDisplayed(), "Email field not visible");
  assert.ok(await page.passwordField.isDisplayed(), "Password field not visible");
  assert.ok(await page.repeatPasswordField.isDisplayed(), "Repeat password field not visible");
  assert.ok(await page.signupButton.isDisplayed(), "Sign Up button not visible");
}

async function checkOtpModalElementsLoaded(page: Webpage): Promise<void> {
  assert.strictEqual(page.otpBoxes.length, 6, "Expected 6 OTP boxes");
  for (let i = 0; i < page.otpBoxes.length; i++) {
    assert.ok(await page.otpBoxes[i].isDisplayed(), `OTP box ${i + 1} not visible`);
  }
  assert.ok(await page.otpSubmitButton.isDisplayed(), "Submit button not visible");
}

async function checkCompleteProfileModalElementsLoaded(page: Webpage): Promise<void> {
  assert.ok(await page.firstNameField.isDisplayed(), "First name field not visible");
  assert.ok(await page.lastNameField.isDisplayed(), "Last name field not visible");
  assert.ok(await page.idNumberField.isDisplayed(), "ID number field not visible");
  assert.ok(await page.collegeField.isDisplayed(), "College field not visible");
  assert.ok(await page.completeProfileButton.isDisplayed(), "Complete profile button not visible");
}


describe("Sign up", () => {
  let driver: WebDriver;

  beforeEach(async () => {
    driver = await initDriver();
  });

  afterEach(async () => {
    await driver.quit();
  });

  it("User can sign up successfully without birthday and contact number", async () => {
    const email = generateEmail("@dlsu.edu.ph");
    const password = "password123";
    const firstName = "John";
    const lastName = "Doe";
    const idNum = generateIdNumber();
    const college = "BAGCED";

    const page = new Webpage(driver);
    await page.openSignupModal();
    await page.getSignupModalElements();
    await checkSignupModalElementsLoaded(page);
    await page.simulateInputsSignupModal(email, password);

    await page.getCompleteYourProfileModalElements();
    await checkCompleteProfileModalElementsLoaded(page);
    await page.simulateInputsCompleteYourProfileModal(firstName, lastName, idNum, college);

    await page.driver.wait(until.urlContains("landing"), TIMEOUT);
    await page.driver.get(`${URL}/studentProfile`);
    const containsNames = await page.hasText(firstName) && await page.hasText(lastName);
    expect(containsNames).toBe(true);

  });

  it("User can sign up successfully with birthday and contact number", async () => {
    const email = generateEmail("@dlsu.edu.ph");
    const password = "password123";
    const firstName = "John";
    const lastName = "Doe";
    const idNum = generateIdNumber();
    const college = "BAGCED";
    const contactNumber = "09951469437";
    const birthday = "11122001";
    
    const page = new Webpage(driver);
    await page.openSignupModal();
    await page.getSignupModalElements();
    await checkSignupModalElementsLoaded(page);
    await page.simulateInputsSignupModal(email, password);

    await page.getCompleteYourProfileModalElements();
    await checkCompleteProfileModalElementsLoaded(page);
    await page.simulateInputsCompleteYourProfileModal(firstName, lastName, idNum, college, contactNumber, birthday);

    await page.driver.wait(until.urlContains("landing"), TIMEOUT);

  });


  it("User stays in sign-up modal when used email is entered and appropriate error message is displayed", async () => {
      const usedEmail = "yuan_panlilio@dlsu.edu.ph"
      const password = "password123";
      const expectedErrorMessage = "An account with this email already exists. Log in instead."
      const page = new Webpage(driver);
      await page.openSignupModal();
      await page.getSignupModalElements();
      await checkSignupModalElementsLoaded(page);
      await page.simulateInputsSignupModal(usedEmail, password);
      await checkSignupModalElementsLoaded(page);

      expect(await page.hasText(expectedErrorMessage)).toBe(true);
      await checkSignupModalElementsLoaded(page);
      
  })

  it("User stays in complete profile modal when used id number is entered and appropriate error message is displayed", 
    async () => {
        const email = generateEmail("@dlsu.edu.ph");
        const password = "password123";
        const firstName = "John";
        const lastName = "Doe";
        const usedIdNum = "12413135";
        const college = "BAGCED";
        const expectedErrorMessage = "Please enter a valid ID number";


        const page = new Webpage(driver);
        await page.openSignupModal();
        await page.getSignupModalElements();
        await checkSignupModalElementsLoaded(page);
        await page.simulateInputsSignupModal(email, password);

        await page.getCompleteYourProfileModalElements();
        await checkCompleteProfileModalElementsLoaded(page);
        await page.simulateInputsCompleteYourProfileModal(firstName, lastName, usedIdNum, college);
        expect(await page.hasText(expectedErrorMessage)).toBe(true);

        await checkCompleteProfileModalElementsLoaded(page); 
          

  });

  it("User stays in OTP modal when and appropriate error message is displayed", 
    async () => {
        const email = "no_otpBypass@dlsu.edu.ph"
        const password = "password123";
        const otp = "000000";
        const expectedErrorMessage = "That code is incorrect or has expired. Check your latest email or resend a new code.";
        const pageHeader = "Verify It’s You"


        const page = new Webpage(driver);
        await page.openSignupModal();
        await page.getSignupModalElements();
        await checkSignupModalElementsLoaded(page);
        await page.simulateInputsSignupModal(email, password);

        await page.getOTPElements();
        await checkOtpModalElementsLoaded(page);
        await page.simulateInputOTP(otp);
        expect(await page.hasText("That code is incorrect or has expired. Check your latest email or resend a new code.")).toBe(true);
        expect(await page.hasText(pageHeader)).toBe(true);

    });
});
