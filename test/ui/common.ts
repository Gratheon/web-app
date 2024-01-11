export const BASE_URL = 'http://0.0.0.0:8080';

export async function login(context) {
	const USER_TOKEN = '' // take it from headers
	await context.addCookies([
		{ name: 'token', value: USER_TOKEN, path: '/', domain: '0.0.0.0' }
	]);
}

export async function register(page, LOGIN, PASS) {
	await page.goto(BASE_URL + '/account/register/');
	await page.locator('div').filter({ hasText: 'EmailPasswordRegister' }).nth(1).click();
	await page.locator('input[type="email"]').click();
	await page.locator('input[type="email"]').fill(LOGIN);
	await page.locator('input[type="email"]').press('Enter');
	await page.locator('div').filter({ hasText: /^Password$/ }).getByRole('textbox').click();
	await page.locator('div').filter({ hasText: /^Password$/ }).getByRole('textbox').fill(PASS);
	await page.getByRole('button', { name: 'Register' }).click();
}