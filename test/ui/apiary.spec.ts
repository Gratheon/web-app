import { test, expect } from '@playwright/test';
import { BASE_URL, login, register } from './common';

test('create apiary', async ({ page, context }) => {
	// await login(context);
	const currentTimestamp = new Date().getTime();
	const LOGIN = `test+${currentTimestamp}@gratheon.com`
	await register(page, LOGIN, 'pass')
	await expect(page.getByText('No apiaries here yet')).toBeVisible();
	await page.goto(BASE_URL + '/apiaries/');

	// create
	await expect(page.getByText('No apiaries here yet')).toBeVisible();
	await page.getByRole('link', { name: 'Setup new apiary' }).click();
	await page.getByLabel('Name').click();
	await page.getByLabel('Name').fill('my-apiary');
	await page.getByRole('button', { name: 'Create' }).click();
	await expect(page.getByText('No hives here yet')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Add hive' })).toBeVisible();

	// update
	await page.getByRole('button', { name: 'Edit' }).click();
	await page.getByLabel('Name').click();
	await page.getByLabel('Name').fill('my-apiary 234');
	await page.getByRole('button', { name: 'Save' }).click();
	await page.getByRole('link', { name: 'Hives' }).click();
	await expect(page.getByRole('heading', { name: 'my-apiary' })).toBeVisible();

	// delete
	await page.getByRole('button', { name: 'Edit' }).click();
	page.once('dialog', dialog => {
		console.log(`Dialog message: ${dialog.message()}`);
		dialog.accept().catch(() => { });
	});
	await page.getByRole('button', { name: 'Delete' }).click();
	await expect(page.getByText('No apiaries here yet')).toBeVisible();
});