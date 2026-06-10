import Button from '@/shared/button';
import Checkbox from '@/icons/checkbox.tsx';
import Loader from '@/shared/loader';
import T from '@/shared/translate';
import styles from '../styles.module.less';
import type { CanvasControlTab } from '../types';

type Props = {
	activeControlTab: Extract<CanvasControlTab, 'bees' | 'varroa-mites'>;
	frameSideFile: any;
	detectedBees?: any[];
	detectedDrones?: any[];
	detectedVarroa?: any[];
	showBees: boolean;
	setBeeVisibility: (value: boolean) => void;
	showDrones: boolean;
	setDroneVisibility: (value: boolean) => void;
	showVarroa: boolean;
	setShowVarroaVisibility: (value: boolean) => void;
	layerToggleButtonStyle: React.CSSProperties;
};

export default function DetectionToolbar({
	activeControlTab,
	frameSideFile,
	detectedBees = [],
	detectedDrones = [],
	detectedVarroa = [],
	showBees,
	setBeeVisibility,
	showDrones,
	setDroneVisibility,
	showVarroa,
	setShowVarroaVisibility,
	layerToggleButtonStyle,
}: Props) {
	const hasBeeData =
		frameSideFile?.isBeeDetectionComplete ||
		frameSideFile?.isDroneDetectionComplete ||
		(frameSideFile?.detectedWorkerBeeCount || 0) > 0 ||
		(frameSideFile?.detectedDroneCount || 0) > 0 ||
		(detectedBees?.length || 0) > 0 ||
		(detectedDrones?.length || 0) > 0;
	const hasVarroaData =
		frameSideFile?.isVarroaDetectionComplete ||
		(frameSideFile?.varroaCount || 0) > 0 ||
		(detectedVarroa?.length || 0) > 0;

	return (
		<div className={styles.buttonPanel}>
			<div className={styles.buttonGrp}>
				{activeControlTab === 'bees' && (
					<>
						<Button size="small" style={layerToggleButtonStyle} onClick={() => setBeeVisibility(!showBees)}>
							{hasBeeData ? <Checkbox on={showBees} color="#111" /> : <Loader size={0} stroke="#111" />}
							<span><T ctx="toggle worker bees visibility">Worker bees</T>{frameSideFile?.detectedWorkerBeeCount > 0 && ` (${frameSideFile.detectedWorkerBeeCount})`}</span>
						</Button>
						<Button size="small" style={layerToggleButtonStyle} onClick={() => setDroneVisibility(!showDrones)}>
							{hasBeeData ? <Checkbox on={showDrones} color="#111" /> : <Loader size={0} stroke="#111" />}
							<span><T ctx="toggle drones visibility">Drones</T>{frameSideFile?.detectedDroneCount > 0 && ` (${frameSideFile.detectedDroneCount})`}</span>
						</Button>
					</>
				)}
				{activeControlTab === 'varroa-mites' && (
					<Button size="small" style={layerToggleButtonStyle} onClick={() => setShowVarroaVisibility(!showVarroa)}>
						{hasVarroaData ? <Checkbox on={showVarroa} color="#111" /> : <Loader size={0} stroke="#111" />}
						<span><T ctx="toggle varroa mites visibility">Varroa mites</T>{frameSideFile?.varroaCount > 0 && ` (${frameSideFile.varroaCount})`}</span>
					</Button>
				)}
			</div>
		</div>
	);
}
