import { JSXElement, createSignal } from 'solid-js';
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogTitle,
	AlertDialogTrigger
} from '~/components/ui/alert-dialog';

type Props =
	| {
			title: string;
			children: (close: () => void) => JSXElement;
			trigger: JSXElement;
	  }
	| {
			title: string;
			children: (close: () => void) => JSXElement;
			trigger?: JSXElement;
			open: boolean;
			setOpen: (open: boolean) => void;
	  };

export function Modal(props: Props) {
	const [internalOpen, setInternalOpen] = createSignal(false);

	const open = () => ('open' in props ? props.open : internalOpen());
	const setOpen = (value: boolean) =>
		'open' in props ? props.setOpen(value) : setInternalOpen(value);

	return (
		<AlertDialog open={open()} onOpenChange={setOpen}>
			<AlertDialogTrigger>{props.trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogTitle>{props.title}</AlertDialogTitle>
				{props.children(() => setOpen(false))}
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default Modal;
