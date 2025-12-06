import { h } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMutation, useQuery, gql } from '@/api'
import T from '@/shared/translate'
import Modal from '@/shared/modal'
import Button from '@/shared/button'
import MessageError from '@/shared/messageError'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import { updateFamily } from '@/models/family'
import { getUser } from '@/models/user'
import { getQueenColorFromYear } from '@/page/hiveEdit/hiveTopInfo/queenColor/utils'
import RefreshIcon from '@/icons/RefreshIcon'
import styles from './AddQueenModal.module.less'
import inputStyles from '@/shared/input/styles.module.less'

//@ts-ignore
import GithubPicker from 'react-color/es/Github'

const supportedLangs = ['en', 'ru', 'et', 'tr', 'pl', 'de', 'fr']

const RANDOM_QUEEN_NAME_QUERY = gql`
	query RandomHiveName($language: String) {
		randomHiveName(language: $language)
	}
`

const colors = [
	'#fefee3',
	'#ffba08',
	'#f94144',
	'#38b000',
	'#0466c8',
	'#4D4D4D',
	'#999999',
	'#FFFFFF',
	'#F44E3B',
	'#FE9200',
	'#FCDC00',
	'#DBDF00',
	'#A4DD00',
	'#68CCCA',
	'#73D8FF',
	'#AEA1FF',
	'#FDA1FF',
	'#333333',
	'#808080',
	'#cccccc',
	'#D33115',
	'#E27300',
	'#FCC400',
	'#B0BC00',
	'#68BC00',
	'#16A5A5',
	'#009CE0',
	'#7B64FF',
	'#FA28FF',
	'#000000',
	'#666666',
	'#B3B3B3',
	'#9F0500',
	'#C45100',
	'#FB9E00',
	'#808900',
	'#194D33',
	'#0C797D',
	'#0062B1',
	'#653294',
	'#AB149E',
]

interface AddQueenModalProps {
	hiveId: number
	onClose: () => void
	onSuccess: () => void
}

export default function AddQueenModal({ hiveId, onClose, onSuccess }: AddQueenModalProps) {
	const currentYear = new Date().getFullYear().toString()
	const [name, setName] = useState('')
	const [race, setRace] = useState('')
	const [year, setYear] = useState(currentYear)
	const [customColor, setCustomColor] = useState<string | null>(null)
	const [showColorPicker, setShowColorPicker] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [lang, setLang] = useState('en')

	const user = useLiveQuery(() => getUser(), [], null)

	useEffect(() => {
		let currentLang = 'en'
		if (user && user?.lang) {
			currentLang = user.lang
		} else if (user === null) {
			const browserLang = navigator.language.substring(0, 2)
			if (supportedLangs.includes(browserLang)) {
				currentLang = browserLang
			}
		}
		setLang(currentLang)
	}, [user])

	const { data: randomNameData, loading: randomNameLoading, reexecuteQuery: reexecuteRandomNameQuery } = useQuery(
		RANDOM_QUEEN_NAME_QUERY,
		{ variables: { language: lang } }
	)

	useEffect(() => {
		if (randomNameData?.randomHiveName && !randomNameLoading) {
			setName(randomNameData.randomHiveName)
		}
	}, [randomNameData, randomNameLoading])

	const handleRefreshName = useCallback(() => {
		reexecuteRandomNameQuery({ requestPolicy: 'network-only' })
	}, [reexecuteRandomNameQuery])

	const [addQueenMutation, { error: mutationError, loading }] = useMutation(`
		mutation addQueenToHive($hiveId: ID!, $queen: FamilyInput!) {
			addQueenToHive(hiveId: $hiveId, queen: $queen) {
				id
				__typename
				name
				race
				added
				color
			}
		}
	`)

	const handleSubmit = async () => {
		setError(null)

		if (!race.trim()) {
			setError('Please provide the queen race.')
			return
		}

		if (!year || year.length !== 4) {
			setError('Please provide a valid year (4 digits).')
			return
		}

		try {
			const result = await addQueenMutation({
				hiveId: hiveId.toString(),
				queen: {
					name: name.trim() || null,
					race: race.trim(),
					added: year,
					color: customColor,
				},
			})

			console.log('AddQueenModal: mutation result:', result)

			if (result.data?.addQueenToHive) {
				const family = {
					id: +result.data.addQueenToHive.id,
					hiveId: hiveId,
					name: result.data.addQueenToHive.name,
					race: result.data.addQueenToHive.race,
					added: result.data.addQueenToHive.added,
					color: result.data.addQueenToHive.color,
				}
				console.log('AddQueenModal: saving family to local DB:', family)
				await updateFamily(family)
				console.log('AddQueenModal: family saved successfully')

				await new Promise(resolve => setTimeout(resolve, 100))
			} else {
				console.error('AddQueenModal: no family data in response:', result)
				throw new Error('Failed to create queen - no family data returned')
			}

			onSuccess()
		} catch (err) {
			console.error('AddQueenModal: error adding queen:', err)
			setError(err.message || 'Failed to add queen')
		}
	}

	return (
		<Modal title={<T>Add Queen</T>} onClose={onClose}>
			<div className={styles.modalContent}>
				<MessageError error={error || mutationError} />

				<div className={styles.nameInputWrapper}>
					<div style="flex: 1;">
						<label className={inputStyles.label}><T>Queen Name</T></label>
						<input
							className={inputStyles.input}
							type="text"
							value={name}
							onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => setName((e.target as HTMLInputElement).value)}
							autoFocus
							placeholder="Enter queen name"
						/>
					</div>
					<Button
						type="button"
						onClick={handleRefreshName}
						disabled={randomNameLoading}
						style={{
							marginTop: '24px',
							height: '40px',
							minWidth: '40px',
							padding: '0 12px',
						}}
						title="Get new name suggestion"
					>
						<RefreshIcon />
					</Button>
				</div>

				<label className={inputStyles.label}><T>Race</T></label>
				<input
					className={inputStyles.input}
					type="text"
					value={race}
					onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => setRace((e.target as HTMLInputElement).value)}
					placeholder="e.g. Carniolan, Italian, etc."
				/>

				<div className={styles.yearInputWrapper}>
					<div>
						<label className={inputStyles.label}><T>Year</T></label>
						<input
							className={inputStyles.input}
							type="text"
							value={year}
							maxLength={4}
							onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
								setYear((e.target as HTMLInputElement).value)
								setCustomColor(null)
							}}
						/>
					</div>
					<div className={styles.colorPickerWrapper}>
						<div
							className={styles.colorPreview}
							onClick={(e) => {
								e.stopPropagation()
								setShowColorPicker(!showColorPicker)
							}}
						>
							<QueenColor year={year} color={customColor} useRelative={false} />
						</div>
						{showColorPicker && (
							<>
								<div
									className={styles.colorPickerOverlay}
									onClick={() => setShowColorPicker(false)}
								/>
								<div className={styles.colorPickerPopup}>
									<GithubPicker
										width={212}
										colors={colors}
										onChangeComplete={(c: any) => {
											setCustomColor(c.hex)
											setShowColorPicker(false)
										}}
										color={customColor || getQueenColorFromYear(year)}
									/>
								</div>
							</>
						)}
					</div>
				</div>

				<div className={styles.buttonContainer}>
					<Button onClick={handleSubmit} loading={loading} color="green">
						<T>Add Queen</T>
					</Button>
				</div>
			</div>
		</Modal>
	)
}

