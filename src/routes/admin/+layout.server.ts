import { redirect } from '@sveltejs/kit';
import { isAdmin } from '#lib/server/admin';

export const load = async ({ cookies, url }) => {
	const admin = await isAdmin(cookies);
	if (!admin && url.pathname !== '/admin/login') redirect(303, '/admin/login');
	return { admin };
};
