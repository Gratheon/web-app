import type {
	BoxSystem,
	BoxSystemFrameSetting,
	PartMatrixRow,
	SectionMatrix,
	SectionMatrixRow,
	WarehouseCounts,
	WarehouseGroup,
	WarehouseInventoryItem,
} from './types'
import { stripWarehouseSuffix } from './labels'

export const GROUP_LABELS: Record<string, string> = {
	HIVE_PARTS: 'Hive parts',
	HIVE_SECTIONS: 'Hive sections',
	HORIZONTAL_HIVES: 'Horizontal hives',
}

const GROUP_ORDER = ['HIVE_SECTIONS', 'HIVE_PARTS', 'HORIZONTAL_HIVES']

export const MAX_VISUAL_SQUARES = 100
const SQUARE_PITCH = 5
const SQUARE_COLUMNS = 12
const SQUARE_AREA_HEIGHT = 52

export const SYSTEM_COLOR_PALETTE = [
	{ accent: '#2f80ed', soft: '#eaf2ff', border: '#a8c7f7' },
	{ accent: '#f2994a', soft: '#fff2e8', border: '#f5c59a' },
	{ accent: '#27ae60', soft: '#e9f8ef', border: '#9ad8b3' },
	{ accent: '#eb5757', soft: '#ffecec', border: '#f1a7a7' },
]

export function getSquareStyle(index: number) {
	const column = index % SQUARE_COLUMNS
	const row = Math.floor(index / SQUARE_COLUMNS)
	const x = column * SQUARE_PITCH
	const y = SQUARE_AREA_HEIGHT - 3 - row * SQUARE_PITCH
	const delay = Math.min(index * 0.01, 0.35)

	return {
		left: `${x}px`,
		top: `${y}px`,
		animationDelay: `${delay}s`,
	}
}

export function mapCounts(items: WarehouseInventoryItem[] = []) {
	const counts: WarehouseCounts = {}
	for (const item of items) {
		const value = Number(item.count)
		counts[item.key] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
	}
	return counts
}

export function getSystemIdFromBoxInventoryKey(itemKey?: string): string | undefined {
	if (!itemKey) return undefined
	const match = String(itemKey).match(/^BOX:[^:]+:SYSTEM:(\d+)$/)
	return match?.[1]
}

export function getSystemPaletteByIndex(index = 0) {
	return SYSTEM_COLOR_PALETTE[index % SYSTEM_COLOR_PALETTE.length]
}

export function getSystemThemeStyle(systemId?: string, fallbackIndex = 0) {
	const c = getSystemPaletteByIndex(fallbackIndex)
	return {
		['--system-accent' as any]: c.accent,
		['--system-soft' as any]: c.soft,
		['--item-color' as any]: c.accent,
		['--item-border' as any]: c.border,
	}
}

export function buildSystemColorSquares(items: Array<{ count: number; color: string }>) {
	const squares: string[] = []
	for (const item of items) {
		if (squares.length >= MAX_VISUAL_SQUARES) break
		const count = Math.max(0, Math.floor(item.count))
		for (let i = 0; i < count && squares.length < MAX_VISUAL_SQUARES; i++) {
			squares.push(item.color)
		}
	}
	return squares
}

export function buildFrameSourceByTargetAndModuleType(boxSystemFrameSettings: BoxSystemFrameSetting[] = []) {
	return (boxSystemFrameSettings || []).reduce<Record<string, string>>((acc, setting) => {
		const moduleType =
			setting.boxType === 'DEEP' ? 'DEEP'
			: setting.boxType === 'SUPER' ? 'SUPER'
			: setting.boxType === 'LARGE_HORIZONTAL_SECTION' ? 'LARGE_HORIZONTAL_SECTION'
			: ''
		if (!moduleType) return acc
		acc[`${setting.systemId}:${moduleType}`] = String(setting.frameSourceSystemId || setting.systemId)
		return acc
	}, {})
}

export function resolveEffectiveFrameSourceSystemId(
	frameSourceByTargetAndModuleType: Record<string, string>,
	targetSystemId: string,
	moduleType: string
): string {
	let current = String(targetSystemId || '')
	const visited = new Set<string>()
	while (current && !visited.has(current)) {
		visited.add(current)
		const mapped = frameSourceByTargetAndModuleType[`${current}:${moduleType}`]
		if (!mapped || mapped === current) return current
		current = mapped
	}
	return String(targetSystemId || '')
}

export function buildWarehouseGroups(items: WarehouseInventoryItem[], boxSystems: BoxSystem[]): WarehouseGroup[] {
	const grouped = items.reduce<Record<string, any[]>>((acc, item) => {
		const key = item.groupKey || 'OTHER'
		if (!acc[key]) acc[key] = []
		acc[key].push(item)
		return acc
	}, {})

	const sectionItems = (grouped.HIVE_SECTIONS || []).filter((item) => item.kind === 'BOX_MODULE')
	const partItems = (grouped.HIVE_PARTS || []).filter((item) => item.kind === 'BOX_MODULE')
	const frameItems = items.filter((item) => item.kind === 'FRAME_SPEC')

	const sectionGroupsByType = new Map<string, {
		id: string
		label: string
		description: string
		sectionItemBySystemId: Record<string, WarehouseInventoryItem>
		standaloneSectionItem?: WarehouseInventoryItem
		iconItem?: WarehouseInventoryItem
	}>()
	for (const section of sectionItems) {
		const moduleType = String(section.moduleType || '')
		if (!moduleType) continue
		if (!sectionGroupsByType.has(moduleType)) {
			sectionGroupsByType.set(moduleType, {
				id: moduleType,
				label: section.title,
				description: section.description,
				sectionItemBySystemId: {},
				iconItem: section,
			})
		}
		const group = sectionGroupsByType.get(moduleType)!
		const systemId = getSystemIdFromBoxInventoryKey(section.key)
		if (systemId) {
			group.sectionItemBySystemId[systemId] = section
		} else {
			group.standaloneSectionItem = section
		}
	}

	const childrenBySectionKey: Record<string, WarehouseInventoryItem[]> = {}
	for (const frame of frameItems) {
		const code = String(frame?.frameSpec?.code || '')
		let parentModuleType: string | null = null
		if (code.endsWith('_DEEP')) parentModuleType = 'DEEP'
		if (code.endsWith('_SUPER')) parentModuleType = 'SUPER'
		if (code.endsWith('_HORIZONTAL')) parentModuleType = 'LARGE_HORIZONTAL_SECTION'
		if (!parentModuleType) continue
		if (!childrenBySectionKey[parentModuleType]) childrenBySectionKey[parentModuleType] = []
		childrenBySectionKey[parentModuleType].push(frame)
	}

	const matrixByModuleType = new Map<string, SectionMatrix>()
	for (const [moduleType, group] of sectionGroupsByType.entries()) {
		matrixByModuleType.set(moduleType, {
			id: group.id,
			label: stripWarehouseSuffix(group.label),
			description: group.description,
			sectionItemBySystemId: group.sectionItemBySystemId,
			standaloneSectionItem: group.standaloneSectionItem,
			iconItem: group.iconItem,
			rows: [],
		})
	}

	for (const [moduleType] of sectionGroupsByType.entries()) {
		const framesForSection = childrenBySectionKey[moduleType] || []
		const rowById = new Map<string, SectionMatrixRow>()
		for (const frame of framesForSection) {
			const rawLabel = String(frame.frameSpec?.displayName || frame.title || frame.frameSpec?.frameType || '').trim()
			const label = stripWarehouseSuffix(rawLabel) || 'Unknown frame type'
			const rowId = `${moduleType}::${label.toLowerCase()}`
			if (!rowById.has(rowId)) {
				rowById.set(rowId, {
					id: rowId,
					label,
					itemsBySystemId: {},
				})
			}
			const sourceSystemId = String(frame.frameSpec?.systemId || '')
			if (sourceSystemId && boxSystems.some((system) => system.id === sourceSystemId)) {
				rowById.get(rowId)!.itemsBySystemId[sourceSystemId] = frame
			}
		}
		const matrix = matrixByModuleType.get(moduleType)
		if (matrix) {
			matrix.rows = Array.from(rowById.values()).sort((a, b) => a.label.localeCompare(b.label))
		}
	}

	const horizontalMatrix = matrixByModuleType.get('LARGE_HORIZONTAL_SECTION')
	if (horizontalMatrix) {
		grouped.HORIZONTAL_HIVES = [horizontalMatrix] as any
		matrixByModuleType.delete('LARGE_HORIZONTAL_SECTION')
	}

	const deepMatrix = matrixByModuleType.get('DEEP')
	const nucMatrix = matrixByModuleType.get('NUCS')
	if (deepMatrix && nucMatrix) {
		deepMatrix.nucSectionItemBySystemId = nucMatrix.sectionItemBySystemId
		matrixByModuleType.delete('NUCS')
	}

	grouped.HIVE_SECTIONS = Array.from(matrixByModuleType.values())

	const partSingles: WarehouseInventoryItem[] = []
	const partRowsByType = new Map<string, PartMatrixRow>()
	for (const part of partItems) {
		const systemId = getSystemIdFromBoxInventoryKey(part.key)
		if (!systemId) {
			partSingles.push(part)
			continue
		}
		const moduleType = String(part.moduleType || 'UNKNOWN')
		if (!partRowsByType.has(moduleType)) {
			partRowsByType.set(moduleType, {
				id: moduleType,
				label: stripWarehouseSuffix(part.title),
				description: part.description,
				itemsBySystemId: {},
				iconItem: part,
			})
		}
		partRowsByType.get(moduleType)!.itemsBySystemId[systemId] = part
	}
	const partMatrixRows = Array.from(partRowsByType.values()).sort((a, b) => a.label.localeCompare(b.label))
	grouped.HIVE_PARTS = [...partMatrixRows, ...partSingles] as any

	delete grouped.FRAMES

	const ordered = [...GROUP_ORDER, ...Object.keys(grouped).filter((key) => !GROUP_ORDER.includes(key))]
	return ordered
		.filter((groupKey) => (grouped[groupKey] || []).length > 0)
		.map((groupKey) => ({
			id: groupKey,
			title: GROUP_LABELS[groupKey] || groupKey,
			items: grouped[groupKey] as Array<WarehouseInventoryItem | SectionMatrix | PartMatrixRow>,
		}))
}
