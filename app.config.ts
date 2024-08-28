import { defineConfig } from '@solidjs/start/config';
import { presetIcons, presetWebFonts } from 'unocss';
import Unocss from 'unocss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import manifestJson from './manifest';

export default defineConfig({
	server: {
		output: {
			dir: 'dist',
			serverDir: 'dist/server',
			publicDir: 'dist/public'
		},
		prerender: {
			routes: ['/public/offline']
		}
	},
	vite: {
		plugins: [
			VitePWA({
				includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'maskable-icon-512x512.png'],
				registerType: 'autoUpdate',
				workbox: {
					clientsClaim: true,
					skipWaiting: true,
					globPatterns: ['**/*.{js,css,html,ico,png,svg}']
				},
				manifest: manifestJson
			}),
			Unocss({
				presets: [
					presetIcons({
						extraProperties: {
							display: 'inline-block',
							color: 'auto',
							'vertical-align': 'middle'
						}
					}),
					presetWebFonts({
						fonts: {
							sans: 'Inter:400,500,600,700,800,900'
						}
					})
				]
			})
		]
	}
});
