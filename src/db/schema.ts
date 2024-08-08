import { InferSelectModel, sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Auth tables
const refreshTokens = sqliteTable('refreshTokens', {
	id: integer('id').notNull().primaryKey(),
	userId: integer('userId')
		.notNull()
		.references(() => users.id),
	refreshToken: text('refreshToken').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull()
});

const verificationTokens = sqliteTable('verificationTokens', {
	id: integer('id').notNull().primaryKey(),
	userId: integer('userId')
		.notNull()
		.references(() => users.id),
	verificationToken: text('verificationToken').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull()
});

const users = sqliteTable('users', {
	id: integer('id').notNull().primaryKey(),
	email: text('email').notNull(),
	passwordHash: text('passwordHash').notNull(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).default(false),
	createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch('now'))`),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
		.default(sql`(unixepoch('now'))`)
		.$onUpdateFn(() => new Date())
});

const boards = sqliteTable('boards', {
	id: integer('id').notNull().primaryKey(),
	title: text('title').notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch('now'))`),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
		.default(sql`(unixepoch('now'))`)
		.$onUpdateFn(() => new Date()),
	userId: integer('userId')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull()
});

const tasks = sqliteTable('tasks', {
	id: integer('id').notNull().primaryKey(),
	title: text('title').notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch('now'))`),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
		.default(sql`(unixepoch('now'))`)
		.$onUpdateFn(() => new Date()),
	boardId: integer('boardId')
		.references(() => boards.id, { onDelete: 'cascade' })
		.notNull(),
	userId: integer('userId')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull()
});

type TBoard = InferSelectModel<typeof boards>;
type TTask = InferSelectModel<typeof tasks>;

export { boards, refreshTokens, tasks, users, verificationTokens };
export type { TBoard, TTask };
