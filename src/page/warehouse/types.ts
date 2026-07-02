export type WarehouseInventoryItem = {
	key: string
	kind: string
	groupKey: string
	title: string
	description: string
	count: number
	moduleType?: string | null
	frameSpec?: {
		id: string
		code: string
		frameType: string
		displayName: string
		systemId: string
	} | null
}

export type WarehouseCounts = Record<string, number>

export type BoxSystem = {
	id: string
	name: string
	isDefault: boolean
	boxProfileSourceSystemId?: string | null
}

export type BoxSystemFrameSetting = {
	systemId: string
	boxType: 'DEEP' | 'SUPER' | 'LARGE_HORIZONTAL_SECTION'
	frameSourceSystemId?: string | null
}

export type SectionMatrixRow = {
	id: string
	label: string
	itemsBySystemId: Record<string, WarehouseInventoryItem>
}

export type SectionMatrix = {
	id: string
	label: string
	description: string
	sectionItemBySystemId: Record<string, WarehouseInventoryItem>
	nucSectionItemBySystemId?: Record<string, WarehouseInventoryItem>
	standaloneSectionItem?: WarehouseInventoryItem
	iconItem?: WarehouseInventoryItem
	rows: SectionMatrixRow[]
}

export type PartMatrixRow = {
	id: string
	label: string
	description: string
	itemsBySystemId: Record<string, WarehouseInventoryItem>
	iconItem?: WarehouseInventoryItem
}

export type WarehouseGroup = {
	id: string
	title: string
	items: Array<WarehouseInventoryItem | SectionMatrix | PartMatrixRow>
}

export type CountHandlers = {
	updateCount: (itemKey: string, delta: number) => Promise<void>
	onInputChange: (itemKey: string, value: string) => void
	onInputCommit: (itemKey: string) => Promise<void>
}
