import { self as sw } from '$app/service-worker';
import { version } from '$app/env';
import { immutable, assets } from '$app/manifest';

const CACHE = `app-${version}`;
// Campioni audio (~2 MB) e documentazione (~9 MB) non si precaricano: restano nella cache dopo il primo uso.
const SHELL: string[] = [...immutable, ...assets].map((a) => a.path).filter((p) => !p.startsWith('/soundfonts/') && !p.startsWith('/docs/'));

sw.addEventListener('install', (e: ExtendableEvent) => {
	e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => sw.skipWaiting()));
});

sw.addEventListener('activate', (e: ExtendableEvent) => {
	e.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

// Guscio dell'app: cache-first. Brani e dati: network-first con fallback sulla cache.
sw.addEventListener('fetch', (e: FetchEvent) => {
	const req = e.request;
	if (req.method !== 'GET') return;
	const url = new URL(req.url);
	if (url.origin !== location.origin) return;

	if (SHELL.includes(url.pathname) || url.pathname.startsWith('/soundfonts/')) {
		e.respondWith(caches.match(req).then((r) => r ?? fetch(req)));
		return;
	}
	e.respondWith(
		fetch(req)
			.then((res) => {
				const copy = res.clone();
				caches.open(CACHE).then((c) => c.put(req, copy));
				return res;
			})
			.catch(() => caches.match(req).then((r) => r ?? Response.error()))
	);
});
