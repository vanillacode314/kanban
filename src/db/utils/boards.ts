import { cache } from '@solidjs/router';
import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { type TBoard, type TTask, boards, tasks } from '~/db/schema';

const getBoards = cache(async () => {
	'use server';
	const rows = await db.select().from(boards).leftJoin(tasks, eq(boards.id, tasks.boardId));

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

	const $board = await db
		.insert(boards)
		.values({ ...board, userId: 1 })
		.returning();
	return $board;
};

const deleteBoard = async (boardId: TBoard['id']) => {
	'use server';

	await db.delete(boards).where(eq(boards.id, boardId));
};

export { createBoard, deleteBoard, getBoards };
