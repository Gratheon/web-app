import styles from './TimeRangeSelector.module.less'
import T from '@/shared/translate'

interface TimeRangeSelectorProps {
	value: number
	onChange: (days: number) => void
}

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
	return (
		<div className={styles.container}>
			<label className={styles.label}>
				<T>Time Range</T>:
				<select
					value={value}
					onChange={e => onChange(Number((e.target as HTMLSelectElement).value))}
					className={styles.select}
				>
					<option value={7}><T>Last 7 days</T></option>
					<option value={30}><T>Last 30 days</T></option>
					<option value={90}><T>Last 90 days</T></option>
					<option value={180}><T>Last 6 months</T></option>
					<option value={365}><T>Last year</T></option>
				</select>
			</label>
		</div>
	)
}
