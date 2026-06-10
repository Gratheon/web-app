import Button from '@/shared/button';
import T from '@/shared/translate';
import KeyboardHints from '@/shared/keyboardHints';
import Slider from '@/shared/slider';
import CellBrushIcon from '@/icons/cellBrushIcon.tsx';
import EraserIcon from '@/icons/eraserIcon.tsx';
import BrushSizeIcon from '@/icons/brushSizeIcon.tsx';
import { CELL_TYPE_HINTS, CELL_TYPE_OPTIONS } from '../constants';
import { getCellStyle, getContrastingTextColor } from '../drawCells';
import styles from '../styles.module.less';
import type { BrushCellType, BrushSizePreset, NonEraseBrushCellType } from '../types';

type Props = {
	brushSizePreset: BrushSizePreset;
	onSetBrushSizePreset: (preset: BrushSizePreset) => void;
	selectedCellType: BrushCellType;
	onSetSelectedCellType: (type: BrushCellType) => void;
	cellsOpacityPercent: number;
	onSetCellsOpacityPercent: (value: number) => void;
};

export default function FrameCellsToolbar({
	brushSizePreset,
	onSetBrushSizePreset,
	selectedCellType,
	onSetSelectedCellType,
	cellsOpacityPercent,
	onSetCellsOpacityPercent,
}: Props) {
	return (
		<div className={styles.toolbar}>
			<div className={styles.toolbarRow}>
				<div className={styles.toolbarGroup}>
					<Button style={{ opacity: 1 }}>
						<CellBrushIcon size={14} />
						<T>Cell brush</T>
						<KeyboardHints keys="C" />
					</Button>
				</div>
				<div className={`${styles.toolbarGroup} ${styles.toolbarMid}`}>
					<div className={styles.toolbarGroup}>
						<Button
							iconOnly
							title="Small brush"
							onClick={() => onSetBrushSizePreset('small')}
							style={{
								opacity: brushSizePreset === 'small' ? 1 : 0.82,
								border: brushSizePreset === 'small' ? '2px solid white' : '2px solid transparent',
							}}
						>
							<BrushSizeIcon size={14} dotRadius={2} />
							<KeyboardHints keys="-" />
						</Button>
						<Button
							iconOnly
							title="Medium brush"
							onClick={() => onSetBrushSizePreset('medium')}
							style={{
								opacity: brushSizePreset === 'medium' ? 1 : 0.82,
								border: brushSizePreset === 'medium' ? '2px solid white' : '2px solid transparent',
							}}
						>
							<BrushSizeIcon size={14} dotRadius={3} />
						</Button>
						<Button
							iconOnly
							title="Large brush"
							onClick={() => onSetBrushSizePreset('large')}
							style={{
								opacity: brushSizePreset === 'large' ? 1 : 0.82,
								border: brushSizePreset === 'large' ? '2px solid white' : '2px solid transparent',
							}}
						>
							<BrushSizeIcon size={14} dotRadius={4.5} />
							<KeyboardHints keys="+" />
						</Button>
					</div>
				</div>
				<div className={`${styles.toolbarGroup} ${styles.toolbarRight}`}>
					<Button
						onClick={() => onSetSelectedCellType('erase')}
						style={{
							opacity: selectedCellType === 'erase' ? 1 : 0.82,
							background: 'rgb(90, 90, 90)',
							color: '#fff',
							border: selectedCellType === 'erase' ? '2px solid white' : '2px solid transparent',
						}}
					>
						<EraserIcon size={14} color="#fff" />
						<T>Eraser</T>
						<KeyboardHints keys="X" />
					</Button>
				</div>
			</div>
			<div className={`${styles.toolbarRow} ${styles.toolbarRowSecond}`}>
				<div className={`${styles.toolbarGroup} ${styles.toolbarCellTypes}`}>
					{CELL_TYPE_OPTIONS.filter((option) => option.value !== 'erase').map((option) => {
						const isSelected = selectedCellType === option.value;
						const buttonBg = getCellStyle(option.value as number).fill;
						const buttonText = getContrastingTextColor(buttonBg);
						return (
							<Button
								key={String(option.value)}
								size="small"
								className={styles.cellTypeButton}
								onClick={() => onSetSelectedCellType(option.value)}
								style={{
									opacity: isSelected ? 1 : 0.82,
									background: buttonBg,
									color: buttonText,
									border: isSelected ? '2px solid white' : '2px solid transparent',
								}}
							>
								{option.label}
								<KeyboardHints keys={CELL_TYPE_HINTS[option.value as NonEraseBrushCellType]} />
							</Button>
						);
					})}
				</div>
				<div className={`${styles.toolbarGroup} ${styles.toolbarRight} ${styles.toolbarSliderGroup}`}>
					<span className={styles.toolbarSliderLabel}>
						<T>Cells opacity</T>
					</span>
					<Slider
						backgroundColor="#f0b800"
						value={cellsOpacityPercent}
						width={130}
						min={0}
						max={100}
						onChange={(event: Event) => {
							const nextValue = Number((event.target as HTMLInputElement | null)?.value);
							onSetCellsOpacityPercent(nextValue);
						}}
					/>
					<span className={styles.toolbarSliderValue}>{cellsOpacityPercent}%</span>
				</div>
			</div>
		</div>
	);
}
