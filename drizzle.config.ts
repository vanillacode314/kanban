import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: 'src/db/schema.ts',
	dialect: 'sqlite',
	migrations: {
		prefix: 'supabase'
	},
	dbCredentials: {
		url: 'file:./src/db/sqlite.db'
	},
	verbose: true,
	strict: true
});
