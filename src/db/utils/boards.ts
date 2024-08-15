import { action, cache } from '@solidjs/router';
import { and, asc, eq, gt, gte, lt, lte, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getRequestEvent } from 'solid-js/web';
import { db } from '~/db';
import { type TBoard, type TTask, boards, tasks } from '~/db/schema';

const getBoards = cache(async () => {
	'use server';

	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) throw new Error('Unauthorized');

	const rows = await db
		.select()
		.from(boards)
		.where(eq(boards.userId, user.id))
		.leftJoin(tasks, and(eq(boards.id, tasks.boardId)))
		.orderBy(asc(boards.index), asc(tasks.index));

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
}, 'get-boards');

const moveBoard = async (boardId: TBoard['id'], toIndex: TBoard['index']) => {
	'use server';

	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) throw new Error('Unauthorized');

	const board = await db
		.select()
		.from(boards)
		.where(and(eq(boards.id, boardId), eq(boards.userId, user.id)));

	const fromIndex = board[0].index;
	if (fromIndex === toIndex) throw new Error(`Can't move board to same index`);
	await db.transaction(async (tx) => {
		if (fromIndex > toIndex) {
			await tx
				.update(boards)
				.set({ index: sql`${boards.index} + 1` })
				.where(
					and(eq(boards.userId, user.id), lt(boards.index, fromIndex), gte(boards.index, toIndex))
				);
		} else {
			await tx
				.update(boards)
				.set({ index: sql`${boards.index} - 1` })
				.where(
					and(eq(boards.userId, user.id), gt(boards.index, fromIndex), lte(boards.index, toIndex))
				);
		}
		await tx
			.update(boards)
			.set({ index: toIndex })
			.where(and(eq(boards.userId, user.id), eq(boards.id, boardId)));
	});
};

const createBoard = action(async (formData: FormData) => {
	'use server';

	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) return new Error('Unauthorized');

	const title = String(formData.get('title'));
	const id = String(formData.get('id') ?? nanoid());

	let index;
	{
		const [board] = await db
			.select({ maxIndex: sql<number>`max(${boards.index})` })
			.from(boards)
			.where(eq(boards.userId, user.id));
		if (!board) index = 0;
		else index = board.maxIndex + 1;
	}
	const $board = await db
		.insert(boards)
		.values({ id, index, title: title, userId: user.id })
		.returning();

	return $board;
}, 'create-board');

const updateBoard = action(async (formData: FormData) => {
	'use server';

	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) return new Error('Unauthorized');

	const id = String(formData.get('id'));
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

	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) return new Error('Unauthorized');

	const boardId = String(formData.get('id'));

	await db.transaction(async (tx) => {
		const [board] = await tx
			.delete(boards)
			.where(and(eq(boards.id, boardId), eq(boards.userId, user.id)))
			.returning();
		if (!board) return;
		await tx
			.update(boards)
			.set({ index: sql`${boards.index} - 1` })
			.where(and(eq(boards.userId, user.id), gt(boards.index, board.index)));
	});
}, 'delete-board');

export { createBoard, deleteBoard, getBoards, moveBoard, updateBoard };
