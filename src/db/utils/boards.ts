import { action, cache } from '@solidjs/router';
import { and, eq } from 'drizzle-orm';
import { db } from '~/db';
import { type TBoard, type TTask, boards, tasks } from '~/db/schema';
import { getUser } from './users';

const getBoards = cache(async () => {
	'use server';
	const user = await getUser();
	if (!user) throw new Error('Unauthorized');

	const rows = await db
		.select()
		.from(boards)
		.where(eq(boards.userId, user.id))
		.leftJoin(tasks, and(eq(boards.id, tasks.boardId)));

	const $boards: (TBoard & { tasks: TTask[] })[] = [];

	for (const row of rows) {
		const board = $boards.find((board) => board.id === row.boards.id);
		if (board) {
			if (row.tasks) board.tasks.push(row.tasks);
		} else {
			$boards.push({ ...row.boards, tasks: row.tasks ? [row.tasks] : [] });
		}
	}

	return $boards;
}, 'boards');

const createBoard = action(async (formData: FormData) => {
	'use server';

	const user = await getUser();
	if (!user) return new Error('Unauthorized');

	const title = String(formData.get('title'));
	const $board = await db.insert(boards).values({ title: title, userId: user.id }).returning();

	return $board;
}, 'create-board');

const updateBoard = action(async (formData: FormData) => {
	'use server';

	const user = await getUser();
	if (!user) return new Error('Unauthorized');

	const id = Number(formData.get('id'));
	const title = String(formData.get('title'));
	const $board = await db
		.update(boards)
		.set({ title: title })
		.where(and(eq(boards.id, id), eq(boards.userId, user.id)))
		.returning();

	return $board;
}, 'update-board');

const deleteBoard = action(async (formData: FormData) => {
	'use server';

	const boardId = Number(formData.get('id'));
	const user = await getUser();
	if (!user) return new Error('Unauthorized');

	await db.delete(boards).where(and(eq(boards.id, boardId), eq(boards.userId, user.id)));
}, 'delete-board');

export { createBoard, deleteBoard, getBoards, updateBoard };
