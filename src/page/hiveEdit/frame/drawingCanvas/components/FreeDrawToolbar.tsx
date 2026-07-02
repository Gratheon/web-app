import Button from '@/shared/button';
import T from '@/shared/translate';
import EraserIcon from '@/icons/eraserIcon.tsx';
import FreeDrawIcon from '@/icons/freeDrawIcon.tsx';
import UndoStrokeIcon from '@/icons/undoStrokeIcon.tsx';
import KeyboardHints from '@/shared/keyboardHints';
import styles from '../styles.module.less';

type Props = {
	onUndo: () => void;
	onClear: () => void;
};

export default function FreeDrawToolbar({ onUndo, onClear }: Props) {
	return (
		<div className={styles.toolbar}>
			<div className={styles.toolbarGroup}>
				<Button style={{ opacity: 1 }}>
					<FreeDrawIcon size={14} />
					<T>Free draw</T>
					<KeyboardHints keys="Shift+F" />
				</Button>
				<Button onClick={onUndo}>
					<UndoStrokeIcon size={14} />
					<T>Undo stroke</T>
					<KeyboardHints keys="Ctrl+Z" />
				</Button>
				<Button onClick={onClear}>
					<EraserIcon size={14} />
					<T>Clear drawing</T>
				</Button>
			</div>
		</div>
	);
}
