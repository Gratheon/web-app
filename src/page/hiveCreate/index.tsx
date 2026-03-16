import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery } from '@/api'
import { getUser } from '@/models/user'
import { SUPPORTED_LANGUAGES } from '@/config/languages'

import VisualForm from '@/shared/visualForm'
import HiveIcon from '@/shared/hive'
import ErrorMsg from '@/shared/messageError'
import Button from '@/shared/button'
import T from '@/shared/translate'
import RefreshIcon from '@/icons/RefreshIcon' // Import the new icon component
import BillingUpgradeNotice from '@/shared/billingUpgradeNotice'
import { getHiveLimitForBillingTier } from '@/shared/billingTier'

import { Box, boxTypes } from '@/models/boxes'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import { getQueenColorFromYear } from '@/page/hiveEdit/hiveTopInfo/queenColor/utils'

import styles from './styles.module.less'

//@ts-ignore
import GithubPicker from 'react-color/es/Github'


const defaultBoxColor = '#ffc848'

const queenColors = [
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

const RANDOM_HIVE_NAME_QUERY = gql`
    query RandomHiveName($language: String) { # Add language variable
        randomHiveName(language: $language)
    }
`

const HIVE_CREATION_LIMIT_QUERY = gql`
	query HiveCreationLimitContext {
		apiaries {
			id
			hives {
				id
			}
		}
	}
`

const BOX_SYSTEMS_QUERY = gql`
	query BoxSystemsForHiveCreate {
		boxSystems {
			id
			name
			isDefault
		}
	}
`

const BOX_SYSTEM_COLORS = [
	{ accent: '#2f80ed' },
	{ accent: '#f2994a' },
	{ accent: '#27ae60' },
	{ accent: '#eb5757' },
]

function createDefaultBoxes(hiveType: string, boxCount: number) {
	const primaryBoxType = hiveType === 'horizontal'
		? boxTypes.LARGE_HORIZONTAL_SECTION
		: boxTypes.DEEP

	const initialBoxes = []
	for (let i = 0; i < boxCount; i++) {
		initialBoxes.push({
			color: `${defaultBoxColor}`,
			type: primaryBoxType,
		})
	}
	initialBoxes.push({
		type: boxTypes.GATE
	})
	initialBoxes.push({
		type: boxTypes.ROOF
	})
	initialBoxes.push({
		type: boxTypes.BOTTOM
	})
	return initialBoxes
}

export default function HiveCreateForm() {
    let { id } = useParams()
    let [hiveType, setHiveType] = useState('vertical')
    let [boxCount, setBoxCount] = useState(1)
    const [boxes, setBoxes] = useState(createDefaultBoxes('vertical', boxCount))

    let navigate = useNavigate()
    let [frameCount, setFrameCount] = useState(10)
    let [name, setName] = useState('')
    let [queenYear, setQueenYear] = useState(new Date().getFullYear().toString())
    let [queenColor, setQueenColor] = useState<string | null>(null)
    let [hiveNumber, setHiveNumber] = useState<number | undefined>(undefined)
    const [lang, setLang] = useState('en')
    const [showColorPicker, setShowColorPicker] = useState(false)
    const [submitError, setSubmitError] = useState<any>(null)
    const [hasHiveLimitBackendError, setHasHiveLimitBackendError] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    let user = useLiveQuery(() => getUser(), [], null)
    const { data: hiveLimitData } = useQuery(HIVE_CREATION_LIMIT_QUERY, { requestPolicy: 'network-only' })
    const { data: boxSystemsData } = useQuery(BOX_SYSTEMS_QUERY)
    const [boxSystemId, setBoxSystemId] = useState<string | undefined>(undefined)
    const [isBoxSystemOpen, setIsBoxSystemOpen] = useState(false)
    const boxSystemPickerRef = useRef<HTMLDivElement | null>(null)
    const boxSystems = boxSystemsData?.boxSystems || []
    const selectedBoxSystem = boxSystems.find((system: any) => system.id === boxSystemId)
        || boxSystems.find((system: any) => system.isDefault)
        || boxSystems[0]

    useEffect(() => {
        if (hiveType !== 'vertical') return
        if (boxSystemId) return
        const systems = boxSystems
        if (!systems.length) return
        const defaultSystem = systems.find((s: any) => s.isDefault) || systems[0]
        setBoxSystemId(defaultSystem.id)
    }, [boxSystems, boxSystemId, hiveType])

    useEffect(() => {
        if (!isBoxSystemOpen) return
        const onDocumentClick = (event: MouseEvent) => {
            if (!boxSystemPickerRef.current) return
            if (boxSystemPickerRef.current.contains(event.target as Node)) return
            setIsBoxSystemOpen(false)
        }
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsBoxSystemOpen(false)
        }
        document.addEventListener('mousedown', onDocumentClick)
        document.addEventListener('keydown', onEscape)
        return () => {
            document.removeEventListener('mousedown', onDocumentClick)
            document.removeEventListener('keydown', onEscape)
        }
    }, [isBoxSystemOpen])

    const updateHiveDimensions = (newBoxCount, newFrameCount) => {
        setBoxCount(newBoxCount);
        setFrameCount(newFrameCount);
        setBoxes(createDefaultBoxes(hiveType, newBoxCount));
    };

    // Determine language code
    useEffect(() => {
        let currentLang = 'en';
        if (user && user?.lang) {
            currentLang = user.lang;
        } else if (user === null) {
            const browserLang = navigator.language.substring(0, 2) as any;
            if (SUPPORTED_LANGUAGES.includes(browserLang)) {
                currentLang = browserLang;
            }
        }
        setLang(currentLang);
    }, [user]);

    // Fetch random hive name with language
    const { data: randomNameData, loading: randomNameLoading, reexecuteQuery: reexecuteRandomNameQuery } = useQuery( // Get reexecuteQuery function
        RANDOM_HIVE_NAME_QUERY,
        { variables: { language: lang } } // Pass language variable
    )

    // Set name when query returns (initial load or refetch)
    useEffect(() => {
        // Ensure loading is false before setting name
        if (randomNameData?.randomHiveName && !randomNameLoading) {
            setName(randomNameData.randomHiveName)
        }
        // Depend on randomNameData and randomNameLoading to re-run when data arrives
    }, [randomNameData, randomNameLoading]) // Removed name dependency

    const handleRefreshName = useCallback(() => {
        // Re-execute the query, ensuring it hits the network
        reexecuteRandomNameQuery({ requestPolicy: 'network-only' });
    }, [reexecuteRandomNameQuery]);

    const currentBillingPlan = user?.billingPlan || 'free'
    const hiveLimit = getHiveLimitForBillingTier(currentBillingPlan)
    const activeHiveCount = (hiveLimitData?.apiaries || []).reduce((count, apiary) => {
        return count + (apiary?.hives?.length || 0)
    }, 0)
    const isHiveLimitReachedByCount = activeHiveCount >= hiveLimit
    const isHiveLimitReached = isHiveLimitReachedByCount || hasHiveLimitBackendError
    const displayedHiveCount = hasHiveLimitBackendError ? hiveLimit : activeHiveCount

    let [addHive] = useMutation(
        gql`
			mutation addHive(
				$queenName: String
				$queenYear: String
				$queenColor: String
				$hiveNumber: Int
				$boxCount: Int!
				$frameCount: Int!
				$apiaryId: ID!
				$colors: [String]
				$initialBoxType: BoxType
				$boxSystemId: ID
			) {
				addHive(
					hive: {
						queenName: $queenName
						queenYear: $queenYear
						queenColor: $queenColor
						hiveNumber: $hiveNumber
						boxCount: $boxCount
						frameCount: $frameCount
						initialBoxType: $initialBoxType
						boxSystemId: $boxSystemId
						apiaryId: $apiaryId
						colors: $colors
					}
				) {
					id
					hiveNumber
					boxCount
				}
			}
		`,
        { errorPolicy: 'all' }
    )

    const handleHiveTypeChange = (event) => {
        const newHiveType = event.target.value;
        setHiveType(newHiveType);
        if (newHiveType === 'vertical') {
            setBoxCount(1);
            setFrameCount(10);
            setBoxes(createDefaultBoxes(newHiveType, 1));
        } else if (newHiveType === 'horizontal') {
            setBoxCount(1);
            setFrameCount(20);
            setBoxes(createDefaultBoxes(newHiveType, 1));
        }
    };

    async function onSubmit(e) {
        e.preventDefault()
        if (isSubmitting) {
            return
        }
        setSubmitError(null)
        setHasHiveLimitBackendError(false)
        if (isHiveLimitReached) {
            setSubmitError('Hive limit reached for your billing plan.')
            return
        }

        setIsSubmitting(true)
        let result
        try {
            result = await addHive({
                apiaryId: id,
                queenName: name || undefined,
                queenYear: queenYear || undefined,
                queenColor: queenColor || undefined,
                hiveNumber: hiveNumber || undefined,
                boxCount,
                frameCount,
                initialBoxType: hiveType === 'horizontal' ? boxTypes.LARGE_HORIZONTAL_SECTION : boxTypes.DEEP,
                boxSystemId: hiveType === 'vertical' ? (boxSystemId || undefined) : undefined,
                colors: boxes.map((b: Box) => {
                    return b.color
                }),
            })
        } finally {
            setIsSubmitting(false)
        }

        if (result?.error || !result?.data?.addHive?.id) {
            const errorText = String(result?.error || '')
            if (errorText.toLowerCase().includes('hive limit reached')) {
                setHasHiveLimitBackendError(true)
                setSubmitError('Hive limit reached for your billing plan.')
                return
            }
            setSubmitError(result?.error || new Error('Failed to create hive'))
            return
        }

        navigate(`/apiaries/${id}/hives/${result.data.addHive.id}`, {
            replace: true, state: {
                title: "Hive added successfully",
                message: "Try adding frame photos"
            }
        })
    }

    return (
        <PagePaddedCentered>
            <h1><T>New Hive</T></h1>
            {isHiveLimitReached && (
                <div style={{ marginBottom: 20 }}>
                    <BillingUpgradeNotice
                        title={
                            <>
                                <T>
                                    You reached your hive limit for this billing tier. Please upgrade to create more hives.
                                </T>{' '}
                                ({displayedHiveCount}/{hiveLimit})
                            </>
                        }
                    />
                </div>
            )}
            {submitError && <ErrorMsg error={submitError} />}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <HiveIcon boxes={boxes} editable={true} />
            </div>

            <VisualForm
                onSubmit={onSubmit.bind(this)}
                submit={
                    <Button type="submit" color="green" disabled={isHiveLimitReached || isSubmitting}>
                        <T>Install</T>
                    </Button>
                }>
                {hiveType === 'vertical' ? (
                    <div className={styles.formField}>
                        <label className={styles.formLabel}><T>Box System</T></label>
                        <div className={styles.boxSystemPicker} ref={boxSystemPickerRef}>
                            <div
                                className={`${styles.boxSystemSelectTrigger} ${!boxSystems.length ? styles.boxSystemSelectTriggerDisabled : ''}`}
                                aria-haspopup="listbox"
                                aria-expanded={isBoxSystemOpen}
                                aria-disabled={!boxSystems.length}
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                    if (!boxSystems.length) return
                                    setIsBoxSystemOpen((open) => !open)
                                }}
                                onKeyDown={(event) => {
                                    if (!boxSystems.length) return
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        setIsBoxSystemOpen((open) => !open)
                                    }
                                    if (event.key === 'Escape') setIsBoxSystemOpen(false)
                                }}
                            >
                                {selectedBoxSystem ? (
                                    <span className={styles.boxSystemTriggerValue}>
                                        <span
                                            className={styles.boxSystemOptionDot}
                                            style={{
                                                backgroundColor:
                                                    BOX_SYSTEM_COLORS[boxSystems.findIndex((s: any) => s.id === selectedBoxSystem.id) % BOX_SYSTEM_COLORS.length].accent
                                            }}
                                        ></span>
                                        <span>{selectedBoxSystem.name}{selectedBoxSystem.isDefault ? ' (Default)' : ''}</span>
                                    </span>
                                ) : (
                                    <span><T>No hive systems</T></span>
                                )}
                                <span className={styles.boxSystemChevron}>▾</span>
                            </div>
                            {isBoxSystemOpen && boxSystems.length ? (
                                <div className={styles.boxSystemDropdown} role="listbox">
                                    {boxSystems.map((system: any, index: number) => {
                                        const isActive = system.id === boxSystemId
                                        return (
                                            <div
                                                key={system.id}
                                                role="option"
                                                aria-selected={isActive}
                                                tabIndex={0}
                                                className={`${styles.boxSystemOption} ${isActive ? styles.boxSystemOptionActive : ''}`}
                                                onClick={() => {
                                                    setBoxSystemId(system.id)
                                                    setIsBoxSystemOpen(false)
                                                }}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                        event.preventDefault()
                                                        setBoxSystemId(system.id)
                                                        setIsBoxSystemOpen(false)
                                                    }
                                                    if (event.key === 'Escape') setIsBoxSystemOpen(false)
                                                }}
                                            >
                                                <span
                                                    className={styles.boxSystemOptionDot}
                                                    style={{ backgroundColor: BOX_SYSTEM_COLORS[index % BOX_SYSTEM_COLORS.length].accent }}
                                                ></span>
                                                <span>{system.name}{system.isDefault ? ' (Default)' : ''}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}
                <div className={styles.formField}>
                            <label className={styles.formLabel}><T>Hive Type</T></label>
                            <div>
                                <label>
                                    <input
                                        type="radio"
                                        value="vertical"
                                        checked={hiveType === 'vertical'}
                                        onChange={handleHiveTypeChange}
                                    />
                                    <T>Vertical</T>
                                </label>
                                <label style={{ marginLeft: '10px' }}>
                                    <input
                                        type="radio"
                                        value="horizontal"
                                        checked={hiveType === 'horizontal'}
                                        onChange={handleHiveTypeChange}
                                    />
                                    <T>Horizontal</T>
                                </label>
                            </div>
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="hiveNumber" className={styles.formLabel}><T>Hive Number</T></label>
                            <input
                                className={styles.smallInput}
                                type="number"
                                id="hiveNumber"
                                name="hiveNumber"
                                value={hiveNumber || ''}
                                onInput={(e: any) => {
                                    const val = e.target.value;
                                    setHiveNumber(val ? parseInt(val, 10) : undefined);
                                }}
                                min="1"
                                step="1"
                            />
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="name" className={styles.formLabel}><T>Queen Name</T></label>
                            <div className={styles.flexRow}>
                                <input
                                    name="name"
                                    id="name"
                                    className={styles.flexInput}
                                    autoFocus
                                    value={name}
                                    onInput={(e: any) => setName(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    iconOnly={true}
                                    onClick={handleRefreshName}
                                    disabled={randomNameLoading}
                                    style={{
                                        height: '32px',
                                        borderRadius: '5px',
                                        padding: '0 8px',
                                    }}
                                    title="Get new name suggestion"
                                >
                                    <RefreshIcon />
                                </Button>
                            </div>
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.formLabel}><T>Queen Year</T></label>
                            <div className={styles.yearColorRow}>
                                <input
                                    className={styles.smallInput}
                                    type="text"
                                    id="queenYear"
                                    name="queenYear"
                                    value={queenYear}
                                    onInput={(e: any) => {
                                        setQueenYear(e.target.value);
                                        setQueenColor(null);
                                    }}
                                    placeholder="YYYY"
                                    maxLength={4}
                                />
                                <div className={styles.colorPickerWrapper}>
                                    <div
                                        className={styles.colorDisplay}
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                    >
                                        <QueenColor year={queenYear} color={queenColor} />
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
                                                    colors={queenColors}
                                                    onChangeComplete={(c: any) => {
                                                        setQueenColor(c.hex);
                                                        setShowColorPicker(false);
                                                    }}
                                                    color={queenColor || getQueenColorFromYear(queenYear)}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="boxCount" className={styles.formLabel}><T>Section count</T></label>
                            <input
                                className={styles.smallInput}
                                type="number"
                                id="boxCount"
                                name="boxCount"
                                value={boxCount}
                                onInput={(e: any) => {
                                    const newBoxCount = parseInt(e.target.value, 10);
                                    if (newBoxCount < 1 || newBoxCount > 6) return;
                                    updateHiveDimensions(newBoxCount, frameCount);
                                }}
                                min="1"
                                max="6"
                                step="1"
                            />
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="frameCount" className={styles.formLabel}><T>Frame count</T></label>
                            <input
                                className={styles.smallInput}
                                type="number"
                                id="frameCount"
                                name="frameCount"
                                value={frameCount}
                                onInput={(e: any) => {
                                    setFrameCount(parseInt(e.target.value, 10))
                                }}
                                min="0"
                                max="25"
                                step="1"
                            />
                        </div>
            </VisualForm>
        </PagePaddedCentered>
    )
}
