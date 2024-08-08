import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { type TBoard, type TTask, tasks } from '~/db/schema';

const moveTask = async (
	taskId: TTask['id'],
	fromBoardId: TBoard['id'],
	toBoardId: TBoard['id']
) => {
	'use server';

	const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
	if (!task) return new Error('Task not found');

	await db.update(tasks).set({ boardId: toBoardId }).where(eq(tasks.id, taskId));
};

const createTask = async (task: Omit<TTask, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
	'use server';
	const $task = await db
		.insert(tasks)
		.values({ ...task, userId: 1 })
		.returning();
	return $task;
};

const deleteTask = async (taskId: TTask['id']) => {
	'use server';
	await db.delete(tasks).where(eq(tasks.id, taskId));
};

export { createTask, deleteTask, moveTask };
