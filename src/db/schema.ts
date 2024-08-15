import { InferSelectModel, sql } from 'drizzle-orm';
import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-valibot';
import { nanoid } from 'nanoid';

const refreshTokens = sqliteTable('refreshTokens', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => nanoid()),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull()
});

const verificationTokens = sqliteTable('verificationTokens', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => nanoid()),
	userId: text('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	token: text('token').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date(Date.now() + 600000))
});

const users = sqliteTable('users', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => nanoid()),
	email: text('email').notNull().unique(),
	passwordHash: text('passwordHash').notNull(),
	emailVerified: integer('emailVerified', { mode: 'boolean' }).default(false),
	createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch('now'))`),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
		.default(sql`(unixepoch('now'))`)
		.$onUpdateFn(() => new Date())
});

const boards = sqliteTable(
	'boards',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => nanoid()),
		title: text('title').notNull(),
		index: integer('index').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch('now'))`),
		updatedAt: integer('updatedAt', { mode: 'timestamp' })
			.default(sql`(unixepoch('now'))`)
			.$onUpdateFn(() => new Date()),
		userId: text('userId')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull()
	},
	(table) => {
		return {
			unq: unique().on(table.index, table.userId)
		};
	}
);

const tasks = sqliteTable(
	'tasks',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => nanoid()),
		title: text('title').notNull(),
		index: integer('index').notNull(),
		createdAt: integer('createdAt', { mode: 'timestamp' }).default(sql`(unixepoch('now'))`),
		updatedAt: integer('updatedAt', { mode: 'timestamp' })
			.default(sql`(unixepoch('now'))`)
			.$onUpdateFn(() => new Date()),
		boardId: text('boardId')
			.references(() => boards.id, { onDelete: 'cascade' })
			.notNull(),
		userId: text('userId')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull()
	},
	(table) => {
		return {
			unq: unique().on(table.index, table.boardId)
		};
	}
);

const boardSchema = createSelectSchema(boards);
const taskSchema = createSelectSchema(tasks);
const usersSchema = createSelectSchema(users);

type TBoard = InferSelectModel<typeof boards>;
type TTask = InferSelectModel<typeof tasks>;
type TUser = InferSelectModel<typeof users>;

export {
	boards,
	boardSchema,
	refreshTokens,
	tasks,
	taskSchema,
	users,
	usersSchema,
	verificationTokens
};
export type { TBoard, TTask, TUser };
