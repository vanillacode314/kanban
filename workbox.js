// Inside of build.js:
import { generateSW } from 'workbox-build';

// These are some common options, and not all are required.
// Consult the docs for more info.
generateSW({
	globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
	swDest: 'dist/sw.js',
	globDirectory: 'dist',
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
