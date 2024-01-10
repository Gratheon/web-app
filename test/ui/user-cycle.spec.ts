import { test, expect } from '@playwright/test';

const PASS='password'

test('register', async ({ page }) => {
  const currentTimestamp = new Date().getTime();
  const LOGIN = `test+${currentTimestamp}@gratheon.com`

  // login failure - user should not exist
  await page.goto('http://0.0.0.0:8080/account/authenticate/');
  await page.getByPlaceholder('Email').click();
  await page.getByPlaceholder('Email').fill(LOGIN);
  await page.getByPlaceholder('Email').press('Tab');
  await page.getByPlaceholder('Password').fill(PASS);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.getByRole('heading', { name: '🐻 Invalid email or password' })).toBeVisible();

  // register
  await page.goto('http://0.0.0.0:8080/account/register/');
  await page.locator('div').filter({ hasText: 'EmailPasswordRegister' }).nth(1).click();
  await page.locator('input[type="email"]').click();
  await page.locator('input[type="email"]').fill(LOGIN);
  await page.locator('input[type="email"]').press('Enter');
  await page.locator('div').filter({ hasText: /^Password$/ }).getByRole('textbox').click();
  await page.locator('div').filter({ hasText: /^Password$/ }).getByRole('textbox').fill(PASS);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('link', { name: 'Setup new apiary' })).toBeVisible();
  await expect(page.getByText('No apiaries here yet')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hives' })).toBeVisible();

  // logout
  await page.getByRole('link', { name: 'Log out' }).click();

  // login
  await page.goto('http://0.0.0.0:8080/account/authenticate/');
  await page.getByPlaceholder('Email').click();
  await page.getByPlaceholder('Email').fill(LOGIN);
  await page.getByPlaceholder('Email').press('Tab');
  await page.getByPlaceholder('Password').fill(PASS);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.getByRole('link', { name: 'Hives' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Setup new apiary' })).toBeVisible();

  // delete account
  await page.getByRole('link', { name: 'Account' }).click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.accept().catch(() => {});
  });
  await page.getByRole('button', { name: 'Delete Account' }).click();

  // login failure - user should not exist as he is deleted
  await page.goto('http://0.0.0.0:8080/account/authenticate/');
  await page.getByPlaceholder('Email').click();
  await page.getByPlaceholder('Email').fill(LOGIN);
  await page.getByPlaceholder('Email').press('Tab');
  await page.getByPlaceholder('Password').fill(PASS);
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page.getByRole('heading', { name: '🐻 Invalid email or password' })).toBeVisible();
})