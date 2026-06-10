import Button from '@/shared/button';
import Checkbox from '@/icons/checkbox.tsx';
import Loader from '@/shared/loader';
import T from '@/shared/translate';
import styles from '../styles.module.less';

type Props = {
	frameSideFile: any;
	detectedBees?: any[];
	detectedDrones?: any[];
	detectedVarroa?: any[];
	showFrameCells: boolean;
	setShowFrameCells: (value: boolean) => void;
	showBees: boolean;
	setBeeVisibility: (value: boolean) => void;
	showDrones: boolean;
	setDroneVisibility: (value: boolean) => void;
	showQueenAnnotations: boolean;
	setShowQueenAnnotations: (value: boolean) => void;
	readOnlyQueenMarkersCount: number;
	showVarroa: boolean;
	setShowVarroaVisibility: (value: boolean) => void;
	layerToggleButtonStyle: React.CSSProperties;
};

export default function ReadOnlyLayerPanel({
	frameSideFile,
	detectedBees = [],
	detectedDrones = [],
	detectedVarroa = [],
	showFrameCells,
	setShowFrameCells,
	showBees,
	setBeeVisibility,
	showDrones,
	setDroneVisibility,
	showQueenAnnotations,
	setShowQueenAnnotations,
	readOnlyQueenMarkersCount,
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
				<Button size="small" style={layerToggleButtonStyle} onClick={() => setShowFrameCells(!showFrameCells)}>
					{frameSideFile?.isCellsDetectionComplete
						? <Checkbox on={showFrameCells} color="#111" />
						: <Loader size={0} stroke="#111" />}
					<span><T ctx="toggle frame cells visibility">Frame cells</T></span>
				</Button>
				<Button size="small" style={layerToggleButtonStyle} onClick={() => setBeeVisibility(!showBees)}>
					{hasBeeData ? <Checkbox on={showBees} color="#111" /> : <Loader size={0} stroke="#111" />}
					<span><T ctx="toggle worker bees visibility">Worker bees</T>{frameSideFile?.detectedWorkerBeeCount > 0 && ` (${frameSideFile.detectedWorkerBeeCount})`}</span>
				</Button>
				<Button size="small" style={layerToggleButtonStyle} onClick={() => setDroneVisibility(!showDrones)}>
					{hasBeeData ? <Checkbox on={showDrones} color="#111" /> : <Loader size={0} stroke="#111" />}
					<span><T ctx="toggle drones visibility">Drones</T>{frameSideFile?.detectedDroneCount > 0 && ` (${frameSideFile.detectedDroneCount})`}</span>
				</Button>
				<Button size="small" style={layerToggleButtonStyle} onClick={() => setShowQueenAnnotations(!showQueenAnnotations)}>
					<Checkbox on={showQueenAnnotations} color="#111" />
					<span><T ctx="toggle queens visibility">Queens</T>{readOnlyQueenMarkersCount > 0 && ` (${readOnlyQueenMarkersCount})`}</span>
				</Button>
				<Button size="small" style={layerToggleButtonStyle} onClick={() => setShowVarroaVisibility(!showVarroa)}>
					{hasVarroaData ? <Checkbox on={showVarroa} color="#111" /> : <Loader size={0} stroke="#111" />}
					<span><T ctx="toggle varroa mites visibility">Varroa mites</T>{frameSideFile?.varroaCount > 0 && ` (${frameSideFile.varroaCount})`}</span>
				</Button>
			</div>
		</div>
	);
}
