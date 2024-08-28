import { generateSW } from 'workbox-build';

generateSW({
	globPatterns: ['**/*.{js,css,html}'],
	swDest: 'dist/sw.js',
	globDirectory: 'dist',
	globIgnores: ['_server/**'],
	skipWaiting: true,
	sourcemap: false,
	inlineWorkboxRuntime: true,
	navigationPreload: true,
	runtimeCaching: [
		{
			urlPattern: ({ request }) => request.mode === 'navigate',
			handler: 'NetworkOnly',
			options: {
				precacheFallback: {
					fallbackURL: '/offline'
				}
			}
		}
	]
}).then(({ count, size, warnings }) => {
	if (warnings.length > 0) {
		console.warn('Warnings encountered while generating a service worker:', warnings.join('\n'));
	}
	console.log(
		`Generated a service worker, which will precache ${count} files, totaling ${size} bytes.`
	);
});
