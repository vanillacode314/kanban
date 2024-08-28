export function GET() {
	return {
		id: 'com.raqueeb.kanban',
		short_name: 'justkanban',
		name: 'justkanban',
		start_url: '/',
		background_color: '#000000',
		display: 'standalone',
		scope: '/',
		theme_color: '#000000',
		handle_links: 'preferred',
		orientation: 'natural',
		edge_side_panel: {
			preferred_width: 400
		},
		categories: ['productivity', 'utility', 'tasks'],
		dir: 'ltr',
		prefer_related_applications: false,
		lang: 'en-US',
		icons: [
			{
				src: 'pwa-192x192.png',
				sizes: '192x192',
				type: 'image/png'
			},
			{
				src: 'pwa-512x512.png',
				sizes: '512x512',
				type: 'image/png'
			}
		],
		description: 'Manage projects using kanban boards'
	};
}
