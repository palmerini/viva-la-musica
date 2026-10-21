import { redirect, error } from '@sveltejs/kit';
import { isAdmin } from '#lib/server/admin';

// Protegge tutto /admin (pagine e azioni dei form): le `load` dei layout non girano sulle POST.
export const handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !(await isAdmin(event.cookies))) {
		if (event.request.method === 'GET') redirect(303, '/admin/login');
		error(403, 'Accesso negato');
	}
	return resolve(event);
};
