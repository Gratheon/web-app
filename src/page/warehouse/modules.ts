export type WarehouseModuleItem = {
	id: string
	label: string
	description: string
}

export const GROUPS: Array<{ id: string; title: string; items: WarehouseModuleItem[] }> = [
	{
		id: 'FRAMES',
		title: 'Frame types',
		items: [
			{
				id: 'FRAME_FOUNDATION',
				label: 'Foundation frames',
				description: 'Frames with wax or plastic foundation sheets.',
			},
			{
				id: 'FRAME_EMPTY_COMB',
				label: 'Empty comb frames',
				description: 'Drawn comb frames ready for brood or honey use.',
			},
			{
				id: 'FRAME_PARTITION',
				label: 'Partition frames',
				description: 'Divider frames used to reduce colony space.',
			},
			{
				id: 'FRAME_FEEDER',
				label: 'Feeder frames',
				description: 'In-frame feeders used for syrup feeding.',
			},
		],
	},
	{
		id: 'HIVE_PARTS',
		title: 'Hive parts',
		items: [
			{
				id: 'ROOF',
				label: 'Roofs',
				description: 'Top covers that protect the hive from rain and wind.',
			},
			{
				id: 'HORIZONTAL_FEEDER',
				label: 'Feeders',
				description: 'Feeders used to provide syrup or supplements to colonies.',
			},
			{
				id: 'QUEEN_EXCLUDER',
				label: 'Queen excluders',
				description: 'Grids that keep the queen out of selected sections.',
			},
			{
				id: 'BOTTOM',
				label: 'Hive bottoms',
				description: 'Bottom boards used as the base of the hive.',
			},
		],
	},
	{
		id: 'HIVE_SECTIONS',
		title: 'Hive sections',
		items: [
			{
				id: 'DEEP',
				label: 'Nest sections',
				description: 'Big hive sections used for brood and core colony space.',
			},
			{
				id: 'NUCS',
				label: 'Nucs',
				description: 'Monolithic 5-frame nucleus hive bodies.',
			},
			{
				id: 'SUPER',
				label: 'Super sections',
				description: 'Smaller sections usually used for honey storage.',
			},
			{
				id: 'LARGE_HORIZONTAL_SECTION',
				label: 'Horizontal hives',
				description: 'Long horizontal hive bodies with high frame capacity.',
			},
		],
	},
]

export const MODULES = GROUPS.flatMap((group) => group.items)

export const SUPPORTED_WAREHOUSE_MODULE_TYPES = new Set([
	'DEEP',
	'NUCS',
	'SUPER',
	'ROOF',
	'HORIZONTAL_FEEDER',
	'QUEEN_EXCLUDER',
	'BOTTOM',
	'FRAME_FOUNDATION',
	'FRAME_EMPTY_COMB',
	'FRAME_PARTITION',
	'FRAME_FEEDER',
])

export function isSupportedWarehouseModuleType(moduleType?: string | null) {
	return !!moduleType && SUPPORTED_WAREHOUSE_MODULE_TYPES.has(moduleType)
}

export function getWarehouseModuleById(moduleType?: string | null) {
	if (!moduleType) return undefined
	return MODULES.find((module) => module.id === moduleType)
}
