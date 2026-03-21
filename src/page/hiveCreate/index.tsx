import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { apiClient, gql, useMutation, useQuery } from '@/api'
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
import MessageSuccess from '@/shared/messageSuccess'

import { Box, boxTypes, GATE_HOLE_COUNT_DEFAULT } from '@/models/boxes'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import { getQueenColorFromYear } from '@/page/hiveEdit/hiveTopInfo/queenColor/utils'
import { useWarehouseAutoAdjust } from '@/hooks/useWarehouseAutoAdjust'

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
		boxSystemFrameSettings {
			systemId
			boxType
			frameSourceSystemId
		}
	}
`

const BOX_SYSTEM_COLORS = [
	{ accent: '#2f80ed' },
	{ accent: '#f2994a' },
	{ accent: '#27ae60' },
	{ accent: '#eb5757' },
]

const WAREHOUSE_INVENTORY_QUERY = gql`
	query HiveCreateWarehouseInventory {
		warehouseInventory {
			key
			kind
			count
			moduleType
			frameSpec {
				frameType
				systemId
				code
			}
		}
	}
`

const HIVE_CREATE_DEDUCTION_CONTEXT_QUERY = gql`
	query HiveCreateDeductionContext($id: ID!) {
		hive(id: $id) {
			id
			hiveType
			boxes {
				id
				type
				roofStyle
				frames {
					id
					position
					type
					leftSide {
						id
						frameId
					}
					rightSide {
						id
						frameId
					}
				}
			}
		}
	}
`

const SET_WAREHOUSE_INVENTORY_COUNT_MUTATION = gql`
mutation setWarehouseInventoryCount($itemKey: String!, $count: Int!) {
	setWarehouseInventoryCount(itemKey: $itemKey, count: $count) {
		key
		count
	}
}
`

const WAREHOUSE_BY_BOX_TYPE = {
	[boxTypes.DEEP]: 'DEEP',
	[boxTypes.SUPER]: 'SUPER',
	[boxTypes.LARGE_HORIZONTAL_SECTION]: 'LARGE_HORIZONTAL_SECTION',
	[boxTypes.ROOF]: 'ROOF',
	[boxTypes.BOTTOM]: 'BOTTOM',
	[boxTypes.QUEEN_EXCLUDER]: 'QUEEN_EXCLUDER',
	[boxTypes.HORIZONTAL_FEEDER]: 'HORIZONTAL_FEEDER',
}

function resolveWarehouseModuleTypeForBox(boxType: string, hiveType?: string | null) {
	if (boxType === boxTypes.DEEP && String(hiveType || '').toUpperCase() === 'NUCLEUS') {
		return 'NUCS'
	}
	return WAREHOUSE_BY_BOX_TYPE[boxType]
}

function getSystemIdFromBoxInventoryKey(itemKey?: string): string | undefined {
	if (!itemKey) return undefined
	const match = String(itemKey).match(/^BOX:[^:]+:SYSTEM:(\d+)$/)
	return match?.[1]
}

function getFrameModuleTypeByCode(frameCode?: string | null): string | null {
	const code = String(frameCode || '')
	if (code.endsWith('_DEEP')) return 'DEEP'
	if (code.endsWith('_SUPER')) return 'SUPER'
	if (code.endsWith('_HORIZONTAL')) return 'LARGE_HORIZONTAL_SECTION'
	return null
}

function getModuleInventoryKeys(moduleType: string, warehouseInventory: any[], preferredSystemId?: string) {
	const candidates = (warehouseInventory || []).filter((item: any) => {
		return item?.kind === 'BOX_MODULE' && String(item?.moduleType || '') === moduleType
	})
	if (!preferredSystemId) {
		return candidates.map((item: any) => String(item.key))
	}
	const preferred = candidates.filter((item: any) => getSystemIdFromBoxInventoryKey(item?.key) === preferredSystemId)
	const fallback = candidates.filter((item: any) => getSystemIdFromBoxInventoryKey(item?.key) !== preferredSystemId)
	return [...preferred, ...fallback].map((item: any) => String(item.key))
}

function createDefaultBoxes(hiveType: string, boxCount: number) {
	const primaryBoxType = hiveType === 'horizontal'
		? boxTypes.LARGE_HORIZONTAL_SECTION
		: boxTypes.DEEP

	const initialBoxes = []
	for (let i = 0; i < boxCount; i++) {
		initialBoxes.push({
			color: hiveType === 'nucleus' ? '#cda36a' : `${defaultBoxColor}`,
			type: primaryBoxType,
		})
	}
	if (hiveType === 'nucleus') {
		return initialBoxes
	}
	initialBoxes.push({
		type: boxTypes.GATE,
		holeCount: GATE_HOLE_COUNT_DEFAULT,
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
    const { data: warehouseInventoryData } = useQuery(WAREHOUSE_INVENTORY_QUERY)
    const [boxSystemId, setBoxSystemId] = useState<string | undefined>(undefined)
    const [isBoxSystemOpen, setIsBoxSystemOpen] = useState(false)
    const { decreaseWarehouseForType, decreaseWarehouseForFrameBy } = useWarehouseAutoAdjust()
    const [setWarehouseInventoryCount] = useMutation(SET_WAREHOUSE_INVENTORY_COUNT_MUTATION)
    const boxSystemPickerRef = useRef<HTMLDivElement | null>(null)
	const boxSystems = boxSystemsData?.boxSystems || []
	const boxSystemFrameSettings = boxSystemsData?.boxSystemFrameSettings || []
	const warehouseInventory = warehouseInventoryData?.warehouseInventory || []
	const selectedBoxSystem = boxSystems.find((system: any) => system.id === boxSystemId)
	        || boxSystems.find((system: any) => system.isDefault)
	        || boxSystems[0]
    const selectedSystemId = hiveType === 'horizontal' ? '' : String(selectedBoxSystem?.id || '')
	const frameSourceByTargetAndModuleType = useMemo(() => {
		return (boxSystemFrameSettings || []).reduce((acc: Record<string, string>, setting: any) => {
			const moduleType =
				setting.boxType === 'DEEP' ? 'DEEP'
					: setting.boxType === 'SUPER' ? 'SUPER'
						: setting.boxType === 'LARGE_HORIZONTAL_SECTION' ? 'LARGE_HORIZONTAL_SECTION'
							: ''
			if (!moduleType) return acc
			acc[`${setting.systemId}:${moduleType}`] = String(setting.frameSourceSystemId || setting.systemId)
			return acc
		}, {})
	}, [boxSystemFrameSettings])

	const resolveEffectiveFrameSourceSystemId = useCallback((targetSystemId: string, moduleType: string): string => {
		let current = String(targetSystemId || '')
		const visited = new Set<string>()
		while (current && !visited.has(current)) {
			visited.add(current)
			const mapped = frameSourceByTargetAndModuleType[`${current}:${moduleType}`]
			if (!mapped || mapped === current) return current
			current = mapped
		}
		return String(targetSystemId || '')
	}, [frameSourceByTargetAndModuleType])

    useEffect(() => {
        if (hiveType === 'horizontal') return
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
	const requiredSectionModuleType = hiveType === 'horizontal'
        ? 'LARGE_HORIZONTAL_SECTION'
        : hiveType === 'nucleus'
            ? 'NUCS'
            : 'DEEP'
    const requiredFrameModuleType = hiveType === 'horizontal' ? 'LARGE_HORIZONTAL_SECTION' : 'DEEP'
    const requiredSectionCount = Math.max(0, Math.floor(Number(boxCount) || 0))
    const requiredFrameCount = Math.max(0, Math.floor(Number(boxCount) || 0)) * Math.max(0, Math.floor(Number(frameCount) || 0))

    const warehouseWarning = useMemo(() => {
        if (!warehouseInventory?.length || requiredSectionCount <= 0) return null

        const preferredSectionSystemId = requiredSectionModuleType === 'NUCS' && selectedSystemId
            ? resolveEffectiveFrameSourceSystemId(selectedSystemId, 'DEEP')
            : selectedSystemId

        const sectionItems = warehouseInventory.filter((item: any) => {
            return item?.kind === 'BOX_MODULE' && String(item?.moduleType || '') === requiredSectionModuleType
        })
        const directSectionItem = sectionItems.find((item: any) => getSystemIdFromBoxInventoryKey(item?.key) === preferredSectionSystemId)
        const directSectionCount = Math.max(0, Number(directSectionItem?.count) || 0)
        const totalSectionCount = sectionItems.reduce((sum: number, item: any) => sum + Math.max(0, Number(item?.count) || 0), 0)

		const frameItems = warehouseInventory.filter((item: any) => {
			if (item?.kind !== 'FRAME_SPEC') return false
			return getFrameModuleTypeByCode(item?.frameSpec?.code) === requiredFrameModuleType
		})
		const effectiveFrameSourceSystemId = selectedSystemId
			? resolveEffectiveFrameSourceSystemId(selectedSystemId, requiredFrameModuleType)
			: ''
		const directFrameItems = frameItems.filter((item: any) => String(item?.frameSpec?.systemId || '') === effectiveFrameSourceSystemId)
		const directFrameCount = directFrameItems.reduce((sum: number, item: any) => sum + Math.max(0, Number(item?.count) || 0), 0)
		const totalFrameCount = frameItems.reduce((sum: number, item: any) => sum + Math.max(0, Number(item?.count) || 0), 0)

        const sectionShortageCertain = preferredSectionSystemId
            ? directSectionCount < requiredSectionCount
            : totalSectionCount < requiredSectionCount
        const sectionMissing = preferredSectionSystemId
            ? Math.max(0, requiredSectionCount - directSectionCount)
            : Math.max(0, requiredSectionCount - totalSectionCount)
        const sectionRisk = !!preferredSectionSystemId && !directSectionItem && totalSectionCount >= requiredSectionCount

        const frameShortageCertain = requiredFrameCount > 0 && (selectedSystemId
            ? directFrameCount < requiredFrameCount
            : totalFrameCount < requiredFrameCount)
        const frameMissing = requiredFrameCount > 0
            ? (selectedSystemId
                ? Math.max(0, requiredFrameCount - directFrameCount)
                : Math.max(0, requiredFrameCount - totalFrameCount))
            : 0
		const frameRisk = requiredFrameCount > 0 && !!selectedSystemId && directFrameItems.length === 0 && totalFrameCount >= requiredFrameCount

        if (!sectionShortageCertain && !sectionRisk && !frameShortageCertain && !frameRisk) return null

        const parts: string[] = []
        if (sectionShortageCertain && sectionMissing > 0) {
            parts.push(`certain shortage: sections missing ${sectionMissing}`)
        } else if (sectionRisk) {
            parts.push('risk: section stock for this box system is uncertain')
        }
        if (frameShortageCertain && frameMissing > 0) {
            parts.push(`certain shortage: frames missing ${frameMissing}`)
        } else if (frameRisk) {
            parts.push('risk: frame stock for this box system is uncertain')
        }

        return parts.length ? parts.join(' • ') : null
	}, [warehouseInventory, requiredSectionModuleType, requiredFrameModuleType, selectedSystemId, requiredSectionCount, requiredFrameCount, resolveEffectiveFrameSourceSystemId])

    let [addHive] = useMutation(
        gql`
			mutation addHive(
				$queenName: String
				$queenYear: String
				$queenColor: String
				$hiveNumber: Int
				$hiveType: HiveType
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
						hiveType: $hiveType
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

    async function applyWarehouseDeductionsForCreatedHive(hiveId: string) {
        if (!hiveId) return

        try {
            const result = await apiClient
                .query(HIVE_CREATE_DEDUCTION_CONTEXT_QUERY, { id: String(hiveId) }, { requestPolicy: 'network-only' })
                .toPromise()

            const createdHiveType = String(result?.data?.hive?.hiveType || '')
            const createdHiveSystemId = String(selectedSystemId || '')
            const createdBoxes = result?.data?.hive?.boxes || []
            const inventoryCountsByKey = (warehouseInventory || []).reduce((acc: Record<string, number>, item: any) => {
                const key = String(item?.key || '')
                if (!key) return acc
                acc[key] = Math.max(0, Number(item?.count) || 0)
                return acc
            }, {})

            async function decreaseWarehouseModuleBy(moduleType: string, amount = 1, preferredModuleSystemId?: string) {
                let remaining = Math.max(0, Math.floor(amount))
                if (!moduleType || remaining <= 0) return

                const candidateKeys = getModuleInventoryKeys(moduleType, warehouseInventory, preferredModuleSystemId)
                if (!candidateKeys.length) {
                    await decreaseWarehouseForType(moduleType)
                    return
                }
                for (const key of candidateKeys) {
                    if (remaining <= 0) break
                    const available = Math.max(0, Number(inventoryCountsByKey[key]) || 0)
                    if (available <= 0) continue
                    const take = Math.min(available, remaining)
                    const nextValue = Math.max(0, available - take)

                    const updateResult = await setWarehouseInventoryCount({
                        itemKey: key,
                        count: nextValue,
                    })
                    const confirmed = Math.max(
                        0,
                        Number(updateResult?.data?.setWarehouseInventoryCount?.count ?? nextValue) || 0
                    )
                    inventoryCountsByKey[key] = confirmed
                    remaining -= take
                }
            }

            for (const createdBox of createdBoxes) {
                const moduleType = resolveWarehouseModuleTypeForBox(createdBox?.type, createdHiveType)
                if (moduleType) {
                    const preferredModuleSystemId = moduleType === 'NUCS' && createdHiveSystemId
                        ? resolveEffectiveFrameSourceSystemId(createdHiveSystemId, 'DEEP')
                        : createdHiveSystemId
                    await decreaseWarehouseModuleBy(moduleType, 1, preferredModuleSystemId)
                }

                const frameTypeCounts = (createdBox?.frames || []).reduce((acc: Record<string, number>, frame: any) => {
                    const frameType = String(frame?.type || '')
                    if (!frameType) return acc
                    acc[frameType] = (acc[frameType] || 0) + 1
                    return acc
                }, {})

                for (const [frameType, count] of Object.entries(frameTypeCounts)) {
                    await decreaseWarehouseForFrameBy(createdBox.id, frameType, Number(count) || 0)
                }
            }
        } catch (e) {
            console.error('Failed to auto-deduct warehouse items after hive creation', e)
        }
    }

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
        } else if (newHiveType === 'nucleus') {
            setBoxCount(1);
            setFrameCount(5);
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
                hiveType: hiveType === 'horizontal' ? 'HORIZONTAL' : hiveType === 'nucleus' ? 'NUCLEUS' : 'VERTICAL',
                boxCount,
                frameCount,
                initialBoxType: hiveType === 'horizontal' ? boxTypes.LARGE_HORIZONTAL_SECTION : boxTypes.DEEP,
                boxSystemId: hiveType === 'horizontal' ? undefined : (boxSystemId || undefined),
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

        await applyWarehouseDeductionsForCreatedHive(String(result.data.addHive.id))

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
            {warehouseWarning ? (
                <div style={{ marginBottom: 12 }}>
                    <MessageSuccess
                        isWarning
                        title={<T>Warehouse warning</T>}
                        message={
                            <>
                                {warehouseWarning}.{' '}
                                <T>Hive creation will continue. Missing parts are assumed to come from outside your warehouse.</T>
                            </>
                        }
                    />
                </div>
            ) : null}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <HiveIcon boxes={boxes} editable={true} hiveType={hiveType === 'nucleus' ? 'NUCLEUS' : hiveType === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL'} />
            </div>

            <VisualForm
                onSubmit={onSubmit.bind(this)}
                submit={
                    <Button type="submit" color="green" disabled={isHiveLimitReached || isSubmitting}>
                        <T>Install</T>
                    </Button>
                }>
                {hiveType !== 'horizontal' ? (
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
                                <label style={{ marginLeft: '10px' }}>
                                    <input
                                        type="radio"
                                        value="nucleus"
                                        checked={hiveType === 'nucleus'}
                                        onChange={handleHiveTypeChange}
                                    />
                                    <T>Nucleus (Nuc)</T>
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
                                    if (hiveType === 'nucleus') return
                                    const newBoxCount = parseInt(e.target.value, 10);
                                    if (newBoxCount < 1 || newBoxCount > 6) return;
                                    updateHiveDimensions(newBoxCount, frameCount);
                                }}
                                min="1"
                                max="6"
                                step="1"
                                disabled={hiveType === 'nucleus'}
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
                                    if (hiveType === 'nucleus') return
                                    setFrameCount(parseInt(e.target.value, 10))
                                }}
                                min="0"
                                max="25"
                                step="1"
                                disabled={hiveType === 'nucleus'}
                            />
                        </div>
            </VisualForm>
        </PagePaddedCentered>
    )
}
