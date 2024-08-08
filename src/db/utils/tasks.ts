import { and, eq } from 'drizzle-orm';
import { db } from '~/db';
import { type TBoard, type TTask, tasks } from '~/db/schema';
import { getUser } from './users';

const moveTask = async (
	taskId: TTask['id'],
	fromBoardId: TBoard['id'],
	toBoardId: TBoard['id']
) => {
	'use server';
	const user = await getUser();
	if (!user) return new Error('Unauthorized');

	await db
		.update(tasks)
		.set({ boardId: toBoardId })
		.where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));
};

const createTask = async (task: Omit<TTask, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
	'use server';
	const user = await getUser();
	if (!user) return new Error('Unauthorized');

	const $task = await db
		.insert(tasks)
		.values({ ...task, userId: user.id })
		.returning();
	return $task;
};

const deleteTask = async (taskId: TTask['id']) => {
	'use server';
	const user = await getUser();
	if (!user) return new Error('Unauthorized');

	await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, user.id)));
};

export { createTask, deleteTask, moveTask };
