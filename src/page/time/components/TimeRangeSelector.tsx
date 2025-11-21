import styles from './TimeRangeSelector.module.less'

interface TimeRangeSelectorProps {
	value: number
	onChange: (days: number) => void
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
	return (
		<div className={styles.container}>
			<label className={styles.label}>
				Time Range:
				<select
					value={value}
					onChange={e => onChange(Number((e.target as HTMLSelectElement).value))}
					className={styles.select}
				>
					<option value={7}>Last 7 days</option>
					<option value={30}>Last 30 days</option>
					<option value={90}>Last 90 days</option>
					<option value={180}>Last 6 months</option>
					<option value={365}>Last year</option>
				</select>
			</label>
		</div>
	)
}
