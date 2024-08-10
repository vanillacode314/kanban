import { action } from '@solidjs/router';
import { and, eq } from 'drizzle-orm';
import { getRequestEvent } from 'solid-js/web';
import { db } from '~/db';
import { type TBoard, type TTask, tasks } from '~/db/schema';

const moveTask = async (taskId: TTask['id'], toBoardId: TBoard['id']) => {
	'use server';
	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) return new Error('Unauthorized');

	await db
		.update(tasks)
		.set({ boardId: toBoardId })
		.where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));
};

const createTask = action(async (formData: FormData) => {
	'use server';

	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) return new Error('Unauthorized');

	const title = String(formData.get('title'));
	const boardId = Number(formData.get('boardId'));

	const $task = await db.insert(tasks).values({ title, boardId, userId: user.id }).returning();
	return $task;
}, 'create-task');

const updateTask = action(async (formData: FormData) => {
	'use server';

	const event = getRequestEvent()!;
	const user = event.locals.user;
	if (!user) return new Error('Unauthorized');

	const id = Number(formData.get('id'));
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

	const taskId = Number(formData.get('id'));
	await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));
}, 'delete-task');

export { createTask, deleteTask, moveTask, updateTask };
