import { Key } from '@solid-primitives/keyed';
import { createAsync, useSubmissions } from '@solidjs/router';
import * as v from '@valibot/valibot';
import { animate, spring } from 'motion';
import { createEffect, createRenderEffect, untrack } from 'solid-js';
import { createStore, produce, unwrap } from 'solid-js/store';
import Board from '~/components/Board';
import { setCreateBoardModalOpen } from '~/components/modals/auto-import/CreateBoardModal';
import { Button } from '~/components/ui/button';
import { DragContextProvider, DragProvider, TDragContext, dragContextSchema } from '~/context/drag';
import { TBoard, TTask } from '~/db/schema';
import { createBoard, getBoards } from '~/db/utils/boards';

export const route = {
	preload: () => getBoards()
};

export default function Home() {
	const serverBoards = createAsync(() => getBoards());
	const submissions = useSubmissions(createBoard);

	const pendingBoards = () =>
		[...submissions.values()]
			.filter((submission) => submission.pending)
			.map((submission) => ({
				id: String(submission.input[0].get('id')),
				title: String(submission.input[0].get('title')) + ' (pending)',
				tasks: [],
				createdAt: new Date(),
				updatedAt: new Date(),
				userId: 'pending',
				index: serverBoards()!.length
			}));

	const boards = () => (serverBoards() ? [...serverBoards()!, ...pendingBoards()] : []);

	return (
		<div class="flex h-full flex-col gap-4 py-4">
			<div class="flex justify-end gap-4">
				<Button class="flex items-center gap-2" onClick={() => setCreateBoardModalOpen(true)}>
					<span class="i-heroicons:plus text-lg"></span>
					<span>Create Board</span>
				</Button>
			</div>
			<div class="grid h-full grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
				<DragProvider data={boards()} orientation="horizontal">
					{(board, index) => (
						<Board
							// @ts-ignore: TODO: Fix this
							board={board()}
							index={index()}
						/>
					)}
				</DragProvider>
			</div>
		</div>
	);
}
