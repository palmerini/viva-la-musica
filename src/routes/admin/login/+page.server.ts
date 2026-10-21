import { fail, redirect } from '@sveltejs/kit';
import { checkPassword, startSession } from '#lib/server/admin';

export const actions = {
	default: async ({ request, cookies }) => {
		const password = String((await request.formData()).get('password') ?? '');
		if (!(await checkPassword(password))) return fail(401, { error: 'Password errata' });
		await startSession(cookies);
		redirect(303, '/admin');
	}
};
