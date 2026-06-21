import React from 'react'
import { gql, useQuery } from '@/api'
import { formatDateTimeByLocale } from '@/shared/dateLocale'
import T, { useTranslation as t } from '@/shared/translate'
import styles from './styles.module.less'
import Button from '@/shared/button'

type CalendarItem = {
	id: string
	kind: 'HISTORICAL_RECORD' | 'GENERATED_REMINDER'
	sourceType: string
	date: string
	label: { translationKey: string; fallback: string; args?: string }
	details?: { fallback: string }
	hive?: { id: string; hiveNumber?: number }
	apiary?: { id: string; name?: string }
	source: {
		sourceType: string
		sourceId?: string
		hiveId?: string
		apiaryId?: string
	}
}

const CALENDAR_QUERY = gql`
	query calendar($input: CalendarInput!) {
		calendar(input: $input) {
			range {
				from
				to
				capped
			}
			items {
				id
				kind
				sourceType
				date
				templateKey
				reminderStatus
				legalDisclaimerKey
				label {
					translationKey
					fallback
					args
				}
				details {
					translationKey
					fallback
					args
				}
				hive {
					id
					hiveNumber
				}
				apiary {
					id
					name
				}
				source {
					sourceType
					sourceId
					hiveId
					apiaryId
					familyId
					templateKey
				}
			}
			inspectionRecency {
				latestAt
				isInsideSelectedRange
				hive {
					id
					hiveNumber
				}
				latestInspection {
					id
					hiveId
					added
				}
			}
		}
	}
`

const HIVES_QUERY = gql`
	query HIVES {
		apiaries {
			id
			name
			hives {
				id
				hiveNumber
			}
		}
	}
`

function dayKey(value: string) {
	return new Date(value).toISOString().slice(0, 10)
}

function sourceHref(item: CalendarItem) {
	if (!item.source?.apiaryId || !item.source?.hiveId) return null
	if (item.sourceType === 'INSPECTION' && item.source.sourceId) {
		return `/apiaries/${item.source.apiaryId}/hives/${item.source.hiveId}/inspections/${item.source.sourceId}`
	}
	return `/apiaries/${item.source.apiaryId}/hives/${item.source.hiveId}`
}

export default function CalendarPage() {
	const [baseDate, setBaseDate] = React.useState(() => new Date())
	const [apiaryId, setApiaryId] = React.useState<string | null>(null)
	const [hiveId, setHiveId] = React.useState<string | null>(null)
	const [sourceTypes, setSourceTypes] = React.useState<string[]>([])
	const [activeTab, setActiveTab] = React.useState<'calendar' | 'chronology'>(
		'calendar'
	)

	const { data: hivesData } = useQuery(HIVES_QUERY)
	const apiaries = hivesData?.apiaries || []

	const input = React.useMemo(() => {
		const fromDate = new Date(baseDate)
		fromDate.setDate(fromDate.getDate() - 28)
		const toDate = new Date(baseDate)
		toDate.setDate(toDate.getDate() + 28)

		const inp: any = {
			from: fromDate.toISOString(),
			to: toDate.toISOString(),
		}

		if (apiaryId) inp.apiaryId = apiaryId
		if (hiveId) inp.hiveId = hiveId
		if (sourceTypes.length > 0) inp.sourceTypes = sourceTypes

		return inp
	}, [baseDate, apiaryId, hiveId, sourceTypes])

	const { data, loading, error } = useQuery(CALENDAR_QUERY, {
		variables: { input },
	})
	const payload = data?.calendar
	const items: CalendarItem[] = payload?.items || []

	const grouped = React.useMemo(() => {
		const map = new Map<string, CalendarItem[]>()
		items.forEach((item) => {
			const key = dayKey(item.date)
			map.set(key, [...(map.get(key) || []), item])
		})
		return map
	}, [items])

	const days = React.useMemo(() => {
		const fromDate = new Date(baseDate)
		fromDate.setDate(fromDate.getDate() - 28)
		return Array.from({ length: 56 }, (_, index) => {
			const d = new Date(fromDate)
			d.setDate(d.getDate() + index)
			return dayKey(d.toISOString())
		})
	}, [baseDate])

	const monthLabel = React.useCallback((day: string) => {
		return formatDateTimeByLocale(new Date(day), { month: 'short' })
	}, [])

	const availableHives = React.useMemo(() => {
		if (!apiaryId) return []
		const apiary = apiaries.find((a: any) => a.id === apiaryId)
		return apiary?.hives || []
	}, [apiaries, apiaryId])

	const toggleSourceType = (type: string) => {
		setSourceTypes((prev) =>
			prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
		)
	}

	return (
		<main className={styles.calendarPage}>
			<header className={styles.header}>
				<h1>
					<T>Calendar</T>
				</h1>
				<p>
					<T>
						Historical hive activity and approved beekeeping reminders in one
						bounded view.
					</T>
				</p>
				{payload?.range?.capped && (
					<p className={styles.warning}>
						<T>
							The selected date range was capped to the supported Calendar
							window.
						</T>
					</p>
				)}

				<div className={styles.filters}>
					<select
						value={apiaryId || ''}
						onChange={(e) => {
							setApiaryId((e.target as HTMLSelectElement).value || null)
							setHiveId(null)
						}}
						className={styles.select}
					>
						<option value="">
							<T>All Apiaries</T>
						</option>
						{apiaries.map((a: any) => (
							<option key={a.id} value={a.id}>
								{a.name || `Apiary ${a.id}`}
							</option>
						))}
					</select>

					<select
						value={hiveId || ''}
						onChange={(e) =>
							setHiveId((e.target as HTMLSelectElement).value || null)
						}
						disabled={!apiaryId}
						className={styles.select}
					>
						<option value="">
							<T>All Hives</T>
						</option>
						{availableHives.map((h: any) => (
							<option key={h.id} value={h.id}>
								<T>Hive</T> {h.hiveNumber || h.id}
							</option>
						))}
					</select>

					<div className={styles.checkboxGroup}>
						<label>
							<input
								type="checkbox"
								checked={sourceTypes.includes('INSPECTION')}
								onChange={() => toggleSourceType('INSPECTION')}
							/>{' '}
							<T>Inspections</T>
						</label>
						<label>
							<input
								type="checkbox"
								checked={sourceTypes.includes('HIVE_LOG')}
								onChange={() => toggleSourceType('HIVE_LOG')}
							/>{' '}
							<T>Logs</T>
						</label>
						<label>
							<input
								type="checkbox"
								checked={sourceTypes.includes('TREATMENT_REMINDER')}
								onChange={() => toggleSourceType('TREATMENT_REMINDER')}
							/>{' '}
							<T>Treatments</T>
						</label>
						<label>
							<input
								type="checkbox"
								checked={sourceTypes.includes('QUEEN_MILESTONE')}
								onChange={() => toggleSourceType('QUEEN_MILESTONE')}
							/>{' '}
							<T>Queens</T>
						</label>
					</div>
				</div>

				<div className={styles.controls}>
					<Button
						type="button"
						onClick={() => {
							const d = new Date(baseDate)
							d.setMonth(d.getMonth() - 1)
							setBaseDate(d)
						}}
					>
						<T>Previous Month</T>
					</Button>

					<Button type="button" onClick={() => setBaseDate(new Date())}>
						<T>Today</T>
					</Button>

					<Button
						type="button"
						onClick={() => {
							const d = new Date(baseDate)
							d.setMonth(d.getMonth() + 1)
							setBaseDate(d)
						}}
					>
						<T>Next Month</T>
					</Button>
				</div>
			</header>
			{loading && (
				<p className={styles.loading}>
					<T>Loading calendar…</T>
				</p>
			)}
			{error && (
				<p className={styles.error}>
					<T>Calendar could not be loaded.</T> {error.message}
				</p>
			)}
			<div className={styles.tabs} role="tablist" aria-label="Calendar views">
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'calendar'}
					aria-controls="calendar-tab-panel"
					id="calendar-tab"
					className={activeTab === 'calendar' ? styles.activeTab : ''}
					onClick={() => setActiveTab('calendar')}
				>
					<T>Calendar</T>
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === 'chronology'}
					aria-controls="chronology-tab-panel"
					id="chronology-tab"
					className={activeTab === 'chronology' ? styles.activeTab : ''}
					onClick={() => setActiveTab('chronology')}
				>
					<T>Chronology</T>
				</button>
			</div>
			{activeTab === 'calendar' && (
				<div
					id="calendar-tab-panel"
					role="tabpanel"
					aria-labelledby="calendar-tab"
					className={styles.tabPanel}
				>
					<section className={styles.grid} aria-label="Calendar month grid">
						{days.map((day) => {
							const date = new Date(day)
							const isToday = dayKey(new Date().toISOString()) === day
							const dayOfMonth = date.getDate()
							return (
								<div
									key={day}
									className={`${styles.day} ${isToday ? styles.today : ''}`}
								>
									<strong>
										{dayOfMonth}
										{dayOfMonth === 1 && (
											<span className={styles.monthLabel}>
												{' '}
												{monthLabel(day)}
											</span>
										)}
									</strong>
									{(grouped.get(day) || []).slice(0, 3).map((item) => (
										<span
											key={item.id}
											className={
												item.kind === 'GENERATED_REMINDER'
													? styles.reminderDot
													: styles.recordDot
											}
										>
											{item.label.fallback}
										</span>
									))}
								</div>
							)
						})}
					</section>
					<section className={styles.recency}>
						<h2>
							<T>Inspection recency</T>
						</h2>
						{(payload?.inspectionRecency || []).map((entry) => (
							<p key={entry.hive.id}>
								<T>Hive</T> {entry.hive.hiveNumber || entry.hive.id}:{' '}
								{entry.latestAt ? (
									new Date(entry.latestAt).toLocaleDateString()
								) : (
									<T>No inspections yet</T>
								)}{' '}
								{!entry.isInsideSelectedRange && entry.latestAt ? (
									<span>
										{' '}
										(<T>outside selected range</T>)
									</span>
								) : null}
							</p>
						))}
					</section>
				</div>
			)}
			{activeTab === 'chronology' && (
				<section
					id="chronology-tab-panel"
					role="tabpanel"
					aria-labelledby="chronology-tab"
					className={`${styles.timeline} ${styles.tabPanel}`}
				>
					<h2>
						<T>Chronology</T>
					</h2>
					{items.map((item) => {
						const href = sourceHref(item)
						return (
							<article
								key={item.id}
								className={
									item.kind === 'GENERATED_REMINDER'
										? styles.reminderItem
										: styles.recordItem
								}
							>
								<time>{new Date(item.date).toLocaleString()}</time>
								<h3>{item.label.fallback}</h3>
								<p>
									{item.details?.fallback ||
										(item.kind === 'GENERATED_REMINDER'
											? t('Generated reminder')
											: t('Historical record'))}
								</p>
								{href && (
									<a href={href}>
										<T>Open source context</T>
									</a>
								)}
							</article>
						)
					})}
				</section>
			)}
		</main>
	)
}
