import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery } from '@/api'
import { SUPPORTED_LANGUAGES } from '@/config/languages'
import RefreshIcon from '@/icons/RefreshIcon'
import { getUser } from '@/models/user'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import T from '@/shared/translate'
import VisualForm from '@/shared/visualForm'
import QueenColorPicker from '@/shared/queenColorPicker'
import inputStyles from '@/shared/input/styles.module.less'
import styles from './style.module.less'

const RANDOM_QUEEN_NAME_QUERY = gql`
query RandomHiveName($language: String) {
	randomHiveName(language: $language)
}
`

const ADD_WAREHOUSE_QUEEN_MUTATION = gql`
mutation addWarehouseQueen($queen: FamilyInput!) {
	addWarehouseQueen(queen: $queen) {
		id
	}
}
`

export default function WarehouseQueensCreatePage() {
	const user = useLiveQuery(() => getUser(), [], null)
	const navigate = useNavigate()

	const [lang, setLang] = useState('en')
	const [name, setName] = useState('')
	const [race, setRace] = useState('')
	const [year, setYear] = useState(new Date().getFullYear().toString())
	const [color, setColor] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)

	const {
		data: randomNameData,
		loading: randomNameLoading,
		reexecuteQuery: reexecuteRandomNameQuery,
	} = useQuery(RANDOM_QUEEN_NAME_QUERY, { variables: { language: lang } })
	const [addWarehouseQueen, { error: createError }] = useMutation(ADD_WAREHOUSE_QUEEN_MUTATION)

	useEffect(() => {
		let currentLang = 'en'
		if (user?.lang) {
			currentLang = user.lang
		} else if (user === null) {
			const browserLang = navigator.language.substring(0, 2) as any
			if (SUPPORTED_LANGUAGES.includes(browserLang)) {
				currentLang = browserLang
			}
		}
		setLang(currentLang)
	}, [user])

	useEffect(() => {
		if (!name && randomNameData?.randomHiveName && !randomNameLoading) {
			setName(randomNameData.randomHiveName)
		}
	}, [name, randomNameData, randomNameLoading])

	function onRefreshName() {
		reexecuteRandomNameQuery({ requestPolicy: 'network-only' })
	}

	async function onSubmit(event: any) {
		event.preventDefault()
		setFormError(null)

		const added = year.trim()
		if (!/^\d{4}$/.test(added)) {
			setFormError('Please provide a valid year (4 digits).')
			return
		}

		setSubmitting(true)
		try {
			const result = await addWarehouseQueen({
				queen: {
					name: name.trim() || null,
					race: race.trim() || null,
					added,
					color: color || null,
				},
			})

			if (result?.data?.addWarehouseQueen?.id) {
				navigate('/warehouse/queens', { replace: true })
				return
			}

			setFormError('Failed to add queen to warehouse.')
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<PagePaddedCentered>
			<h1><T>Add Queen</T></h1>
			<ErrorMsg error={formError || createError} />
			<div className={styles.formContainer}>
				<VisualForm
					onSubmit={onSubmit}
					submit={
						<div className={styles.actions}>
							<Button type="button" onClick={() => navigate('/warehouse/queens', { replace: true })}>
								<T>Cancel</T>
							</Button>
							<Button type="submit" color="green" loading={submitting}>
								<T>Add to Warehouse</T>
							</Button>
						</div>
					}
				>
					<div className={styles.formField}>
						<label className={styles.formLabel}><T>Queen Name</T></label>
						<div className={styles.fieldControl}>
							<div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
								<input
									className={`${inputStyles.input} ${styles.flexInput}`}
									type="text"
									value={name}
									onChange={(event: any) => setName(event.target.value)}
									placeholder="Enter queen name"
									autoFocus
								/>
								<Button
									type="button"
									onClick={onRefreshName}
									disabled={randomNameLoading}
									style={{
										height: '40px',
										minWidth: '40px',
										padding: '0 12px',
										margin: 0,
									}}
									title="Get new name suggestion"
								>
									<RefreshIcon />
								</Button>
							</div>
						</div>
					</div>

					<div className={styles.formField}>
						<label className={styles.formLabel}><T>Race</T></label>
						<div className={styles.fieldControl}>
							<input
								className={`${inputStyles.input} ${styles.flexInput}`}
								type="text"
								value={race}
								onChange={(event: any) => setRace(event.target.value)}
								placeholder="e.g. Carniolan, Italian, etc."
							/>
						</div>
					</div>

					<div className={styles.formField}>
						<label className={styles.formLabel}><T>Year</T></label>
						<div className={styles.fieldControl}>
							<input
								className={`${inputStyles.input} ${styles.flexInput}`}
								type="text"
								maxLength={4}
								value={year}
								onChange={(event: any) => setYear(event.target.value)}
								placeholder="YYYY"
							/>
						</div>
					</div>

					<div className={styles.formField}>
						<label className={styles.formLabel}><T>Color (optional)</T></label>
						<div className={styles.fieldControl}>
							<QueenColorPicker
								year={year}
								color={color || null}
								onColorChange={(value: string) => setColor(value)}
							/>
						</div>
					</div>
				</VisualForm>
			</div>
		</PagePaddedCentered>
	)
}
