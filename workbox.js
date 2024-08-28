import { generateSW } from 'workbox-build';

generateSW({
	globPatterns: ['**/*.{js,css,html}'],
	swDest: 'dist/public/sw.js',
	globDirectory: 'dist/public',
	skipWaiting: true,
	sourcemap: false
}).then(({ count, size, warnings }) => {
	if (warnings.length > 0) {
		console.warn('Warnings encountered while generating a service worker:', warnings.join('\n'));
	}
	console.log(
		`Generated a service worker, which will precache ${count} files, totaling ${size} bytes.`
	);
});
