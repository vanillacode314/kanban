import { action } from '@solidjs/router';
import { and, eq, gt, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getRequestEvent } from 'solid-js/web';
import { db } from '~/db';
import { type TBoard, type TTask, tasks } from '~/db/schema';

const moveTask = async (taskId: TTask['id'], toBoardId: TBoard['id'], index?: TTask['index']) => {
	'use server';
	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) throw new Error('Unauthorized');

	const [task] = await db
		.select()
		.from(tasks)
		.where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));
	if (!task) throw new Error('Task not found');

	if (task.boardId === toBoardId) {
		if (!index) throw new Error('Need index to move inside same board');
	}

	{
		const [task] = await db
			.select({ maxIndex: sql<number>`max(${tasks.index})` })
			.from(tasks)
			.where(and(eq(tasks.boardId, toBoardId), eq(tasks.userId, user.id)));
		if (!task) index = 0;
		else index = task.maxIndex + 1;
	}

	await db
		.update(tasks)
		.set({ boardId: toBoardId, index })
		.where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));
	return task;
};

const createTask = action(async (formData: FormData) => {
	'use server';

	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) return new Error('Unauthorized');

	const title = String(formData.get('title'));
	const boardId = String(formData.get('boardId'));
	const id = String(formData.get('id') ?? nanoid());

	let index;
	{
		const [task] = await db
			.select({ maxIndex: sql<number>`max(${tasks.index})` })
			.from(tasks)
			.where(and(eq(tasks.boardId, boardId), eq(tasks.userId, user.id)));
		if (!task) index = 0;
		else index = task.maxIndex + 1;
	}
	const task = await db
		.insert(tasks)
		.values({ id, index, title, boardId, userId: user.id })
		.returning();
	return task;
}, 'create-task');

const updateTask = action(async (formData: FormData) => {
	'use server';

	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) return new Error('Unauthorized');

	const id = String(formData.get('id'));
	const title = String(formData.get('title'));

	const $task = await db
		.update(tasks)
		.set({ title })
		.where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
		.returning();
	return $task;
}, 'update-task');

const deleteTask = action(async (formData: FormData) => {
	'use server';

	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) return new Error('Unauthorized');

	const taskId = String(formData.get('id'));
	await db.transaction(async (tx) => {
		const [task] = await tx
			.delete(tasks)
			.where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)))
			.returning();
		if (!task) return;
		await tx
			.update(tasks)
			.set({ index: sql`${tasks.index} - 1` })
			.where(
				and(eq(tasks.boardId, task.boardId), eq(tasks.userId, user.id), gt(tasks.index, task.index))
			);
	});
}, 'delete-task');

export { createTask, deleteTask, moveTask, updateTask };
