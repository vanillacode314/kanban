import { cache } from '@solidjs/router';
import { and, eq } from 'drizzle-orm';
import { db } from '~/db';
import { type TBoard, type TTask, boards, tasks } from '~/db/schema';
import { getUser } from './users';

const getBoards = cache(async () => {
	'use server';
	const user = await getUser();
	if (!user) return new Error('Unauthorized');

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

const createBoard = async (board: Omit<TBoard, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
	'use server';
	const user = await getUser();
	if (!user) return new Error('Unauthorized');

	const $board = await db
		.insert(boards)
		.values({ ...board, userId: user.id })
		.returning();
	return $board;
};

const deleteBoard = async (boardId: TBoard['id']) => {
	'use server';
	const user = await getUser();
	if (!user) return new Error('Unauthorized');

	await db.delete(boards).where(and(eq(boards.id, boardId), eq(boards.userId, user.id)));
};

export { createBoard, deleteBoard, getBoards };
