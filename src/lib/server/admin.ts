import { env } from 'cloudflare:workers';
import type { Cookies } from '@sveltejs/kit';

const COOKIE = 'admin';
const MAX_AGE = 60 * 60 * 24 * 30;
const enc = new TextEncoder();

async function hmac(message: string): Promise<string> {
	const key = await crypto.subtle.importKey('raw', enc.encode(env.ADMIN_PASSWORD), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
	return [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

export async function checkPassword(candidate: string): Promise<boolean> {
	if (!env.ADMIN_PASSWORD) return false;
	// Si confrontano gli hash per non dipendere dalla lunghezza della password.
	return safeEqual(await hmac(`pw:${candidate}`), await hmac(`pw:${env.ADMIN_PASSWORD}`));
}

export async function startSession(cookies: Cookies) {
	const exp = String(Date.now() + MAX_AGE * 1000);
	cookies.set(COOKIE, `${exp}.${await hmac(`session:${exp}`)}`, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: MAX_AGE
	});
}

export function endSession(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/' });
}

export async function isAdmin(cookies: Cookies): Promise<boolean> {
	if (!env.ADMIN_PASSWORD) return false;
	const [exp, sig] = (cookies.get(COOKIE) ?? '').split('.');
	if (!exp || !sig || Number(exp) < Date.now()) return false;
	return safeEqual(sig, await hmac(`session:${exp}`));
}
