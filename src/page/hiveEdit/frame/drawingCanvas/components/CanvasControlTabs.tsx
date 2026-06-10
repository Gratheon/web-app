import { Tab, TabBar } from '@/shared/tab';
import T from '@/shared/translate';
import type { CanvasControlTab } from '../types';

type Props = {
	activeControlTab: CanvasControlTab;
	onSelect: (tab: CanvasControlTab) => void;
};

export default function CanvasControlTabs({ activeControlTab, onSelect }: Props) {
	return (
		<TabBar>
			<Tab isSelected={activeControlTab === 'frame-cells'} onClick={() => onSelect('frame-cells')}>
				<T>Frame cells</T>
			</Tab>
			<Tab isSelected={activeControlTab === 'free-draw'} onClick={() => onSelect('free-draw')}>
				<T>Free draw</T>
			</Tab>
			<Tab isSelected={activeControlTab === 'queens'} onClick={() => onSelect('queens')}>
				<T>Queens</T>
			</Tab>
			<Tab isSelected={activeControlTab === 'bees'} onClick={() => onSelect('bees')}>
				<T>Bees</T>
			</Tab>
			<Tab isSelected={activeControlTab === 'varroa-mites'} onClick={() => onSelect('varroa-mites')}>
				<T>Varroa mites</T>
			</Tab>
		</TabBar>
	);
}
