import { useNavigate } from 'react-router-dom';

// Use absolute paths
// Removed duplicate import: import { useNavigate } from 'react-router-dom';

// Use absolute paths
import colors from '@/colors.ts';
import DateFormat from '@/shared/dateFormat';
import { InspectionSnapshot } from '@/models/inspections.ts';
import BeeCounter from '@/shared/beeCounter';
import T from '@/shared/translate'; // Import T for translations

import styles from './styles.module.less';

type InspectionBarProps = {
	selected: boolean
	apiaryId: string | number
	data: any
	hiveId: string | number
	added: string
	id: number
	hideDate?: boolean
	fullWidth?: boolean
	showPercentages?: boolean
	showLegend?: boolean // Add showLegend prop
}

export default function InspectionBar({
	selected = false,
	apiaryId,
	data,
	hiveId,
	added,
	id,
	hideDate = false,
	fullWidth = false,
	showPercentages = false,
	showLegend = false, // Destructure showLegend prop
}: InspectionBarProps) {
	const navigate = useNavigate();
	const tmpdata: InspectionSnapshot = JSON.parse(data);
	const stats = tmpdata.cellStats || {};

	stats.broodPercent = Math.round(stats?.broodPercent ?? 0);
	stats.honeyPercent = Math.round(stats?.honeyPercent ?? 0);
	stats.pollenPercent = Math.round(stats?.pollenPercent ?? 0);
	stats.eggsPercent = Math.round(stats?.eggsPercent ?? 0);
	stats.cappedBroodPercent = Math.round(stats?.cappedBroodPercent ?? 0);

	const barStyle = {
		...(fullWidth && { width: '100%' }),
	};

	// Define base style for stats container
	const journalItemStatsStyle: React.CSSProperties = {
		...(fullWidth && { width: '100%' }), // Apply 100% width if prop is true
		...(showPercentages && { minHeight: '20px' }), // Increase min-height when showing percentages
	};

	const statTextStyle: React.CSSProperties = {
		color: 'white',
		fontSize: '10px', // Keep font size small
		fontWeight: 'bold',
		textShadow: '1px 1px 1px rgba(0,0,0,0.7)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: '100%',
		width: '100%',
		textAlign: 'center',
		lineHeight: '1',
		overflow: 'hidden', // Hide overflow if text is too long for segment
		whiteSpace: 'nowrap', // Prevent wrapping
	};

	return (
		<div
			className={`${styles.inspectionBar} ${selected ? styles.selected : ''}`}
			style={barStyle}
		>
			<div className={styles.bottle}
				onClick={!hideDate ? () => {
					navigate(`/apiaries/${apiaryId}/hives/${hiveId}/inspections/${id}`, { replace: true })
				} : undefined}>

				<div style={{ display: 'flex', alignItems: 'center', minHeight: '16px' }}>
					{!hideDate && <DateFormat datetime={added} />}
					<BeeCounter count={tmpdata?.hive?.beeCount} />
				</div>

				{/* Apply dynamic style to stats container */}
				<div className={styles.journalItemStats} style={journalItemStatsStyle}>
					{stats.broodPercent > 0 && <div
						title={`Brood: ${stats.broodPercent}%`}
						style={{
							backgroundColor: colors.broodColor,
							width: `${stats.broodPercent}%`,
						}}
					>
						{showPercentages && <span style={statTextStyle}>{stats.broodPercent}%</span>}
					</div>}
					{stats.honeyPercent > 0 && <div
						title={`Honey: ${stats.honeyPercent}%`}
						style={{
							backgroundColor: colors.honeyColor,
							width: `${stats.honeyPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					>
						{showPercentages && <span style={statTextStyle}>{stats.honeyPercent}%</span>}
					</div>}
					{stats.pollenPercent > 0 && <div
						title={`Pollen: ${stats.pollenPercent}%`}
						style={{
							backgroundColor: colors.pollenColor,
							width: `${stats.pollenPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					>
						{showPercentages && <span style={statTextStyle}>{stats.pollenPercent}%</span>}
					</div>}
					{stats.eggsPercent > 0 && <div
						title={`Eggs: ${stats.eggsPercent}%`}
						style={{
							backgroundColor: colors.eggsColor,
							width: `${stats.eggsPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					>
						{showPercentages && <span style={statTextStyle}>{stats.eggsPercent}%</span>}
					</div>}
					{stats.cappedBroodPercent > 0 && <div
						title={`Capped brood: ${stats.cappedBroodPercent}%`}
						style={{
							backgroundColor: colors.cappedBroodColor,
							width: `${stats.cappedBroodPercent}%`,
							borderTop: '1px solid #ffAA00;',
						}}
					>
						{showPercentages && <span style={statTextStyle}>{stats.cappedBroodPercent}%</span>}
					</div>}
				</div>

				{/* Conditionally render the legend */}
				{showLegend && (
					<div className={styles.legendContainer}>
						<div className={styles.legendItem}>
							<div className={styles.legendColorBox} style={{ backgroundColor: colors.broodColor }}></div>
							<T>Brood</T>
						</div>
						<div className={styles.legendItem}>
							<div className={styles.legendColorBox} style={{ backgroundColor: colors.honeyColor }}></div>
							<T>Honey</T>
						</div>
						<div className={styles.legendItem}>
							<div className={styles.legendColorBox} style={{ backgroundColor: colors.pollenColor }}></div>
							<T>Pollen</T>
						</div>
						<div className={styles.legendItem}>
							<div className={styles.legendColorBox} style={{ backgroundColor: colors.eggsColor }}></div>
							<T>Eggs</T>
						</div>
						<div className={styles.legendItem}>
							<div className={styles.legendColorBox} style={{ backgroundColor: colors.cappedBroodColor }}></div>
							<T>Capped Brood</T>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
