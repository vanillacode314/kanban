import { Key } from '@solid-primitives/keyed';
import { createAsync, useSubmissions } from '@solidjs/router';
import Board from '~/components/Board';
import { setCreateBoardModalOpen } from '~/components/modals/auto-import/CreateBoardModal';
import { Button } from '~/components/ui/button';
import { DragProvider } from '~/context/drag';
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
		<div class="flex h-full flex-col gap-4 overflow-hidden py-4">
			<div class="flex justify-end gap-4">
				<Button class="flex items-center gap-2" onClick={() => setCreateBoardModalOpen(true)}>
					<span class="i-heroicons:plus text-lg"></span>
					<span>Create Board</span>
				</Button>
			</div>
			<div class="flex h-full snap-x snap-mandatory gap-[var(--gap)] overflow-auto overflow-hidden [--cols:1] [--gap:theme(spacing.4)] sm:[--cols:2] md:[--cols:3]">
				<Key each={boards()} by="id">
					{(board, index) => (
						<Board
							class="shrink-0 basis-[calc((100%-(var(--cols)-1)*var(--gap))/var(--cols))] snap-start"
							board={board()}
							index={index()}
						/>
					)}
				</Key>
			</div>
		</div>
	);
}
