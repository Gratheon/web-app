import styles from '../styles.module.less'
import ApiarySelector from './ApiarySelector'
import ChartToggles from './ChartToggles'
import HiveSelector from './HiveSelector'
import TimeRangeSelector from './TimeRangeSelector'
import type { EnabledCharts } from '../constants'

type TimeFiltersPanelProps = {
	timeRangeDays: number
	onTimeRangeChange: (days: number) => void
	apiaries: any[]
	selectedApiaryId: string | null
	onSelectApiary: (apiaryId: string) => void
	hives: any[]
	selectedHiveIds: string[]
	onToggleHive: (hiveId: string) => void
	enabledCharts: EnabledCharts
	showIdealCurve: boolean
	onToggleChart: (chartName: string) => void
	onToggleIdealCurve: (show: boolean) => void
	isPaywalled: boolean
}

export default function TimeFiltersPanel({
	timeRangeDays,
	onTimeRangeChange,
	apiaries,
	selectedApiaryId,
	onSelectApiary,
	hives,
	selectedHiveIds,
	onToggleHive,
	enabledCharts,
	showIdealCurve,
	onToggleChart,
	onToggleIdealCurve,
	isPaywalled,
}: TimeFiltersPanelProps) {
	return (
		<aside className={styles.filtersGrid}>
			<div className={styles.filterCard}>
				<TimeRangeSelector
					value={timeRangeDays}
					onChange={onTimeRangeChange}
				/>
			</div>

			<div className={styles.filterBlock}>
				<ApiarySelector
					apiaries={apiaries}
					selectedApiaryId={selectedApiaryId}
					onSelectApiary={onSelectApiary}
				/>
			</div>

			<div className={styles.filterBlock}>
				<HiveSelector
					hives={hives}
					selectedHiveIds={selectedHiveIds}
					onToggleHive={onToggleHive}
				/>
			</div>

			<div className={styles.filterBlock}>
				<ChartToggles
					group="population"
					enabledCharts={enabledCharts}
					showIdealCurve={showIdealCurve}
					onToggleChart={onToggleChart}
					onToggleIdealCurve={onToggleIdealCurve}
				/>
			</div>

			<div className={styles.filterBlock}>
				<ChartToggles
					group="scales"
					enabledCharts={enabledCharts}
					showIdealCurve={showIdealCurve}
					onToggleChart={onToggleChart}
					onToggleIdealCurve={onToggleIdealCurve}
				/>
			</div>

			<div className={styles.filterBlock}>
				<ChartToggles
					group="entrance"
					enabledCharts={enabledCharts}
					showIdealCurve={showIdealCurve}
					onToggleChart={onToggleChart}
					onToggleIdealCurve={onToggleIdealCurve}
				/>
			</div>

			{!isPaywalled && (
				<div className={styles.filterBlock}>
					<ChartToggles
						group="weather"
						enabledCharts={enabledCharts}
						showIdealCurve={showIdealCurve}
						onToggleChart={onToggleChart}
						onToggleIdealCurve={onToggleIdealCurve}
					/>
				</div>
			)}
		</aside>
	)
}
