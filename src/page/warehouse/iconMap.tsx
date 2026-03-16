import AddBoxIcon from '@/icons/addBox'
import AddSuperIcon from '@/icons/addSuper'
import FoundationIcon from '@/icons/foundationIcon'
import EmptyFrameIcon from '@/icons/emptyFrameIcon'
import FeederIcon from '@/icons/feederIcon'
import GateIcon from '@/icons/gate'
import PartitionIcon from '@/icons/partitionIcon'
import FramesIcon from '@/icons/framesIcon'
import WarehouseBottomIcon from '@/icons/warehouseBottomIcon'
import WarehouseFeederIcon from '@/icons/warehouseFeederIcon'
import WarehouseHorizontalHiveIcon from '@/icons/warehouseHorizontalHiveIcon'
import WarehouseQueenExcluderIcon from '@/icons/warehouseQueenExcluderIcon'
import WarehouseRoofIcon from '@/icons/warehouseRoofIcon'

const ICON_BY_MODULE_TYPE = {
	DEEP: AddBoxIcon,
	SUPER: AddSuperIcon,
	LARGE_HORIZONTAL_SECTION: WarehouseHorizontalHiveIcon,
	ROOF: WarehouseRoofIcon,
	HORIZONTAL_FEEDER: WarehouseFeederIcon,
	QUEEN_EXCLUDER: WarehouseQueenExcluderIcon,
	BOTTOM: WarehouseBottomIcon,
	FRAME_FOUNDATION: FoundationIcon,
	FRAME_EMPTY_COMB: FramesIcon,
	FRAME_PARTITION: PartitionIcon,
	FRAME_FEEDER: FeederIcon,
	GATE: GateIcon,
}

const ICON_BY_FRAME_TYPE = {
	FOUNDATION: FoundationIcon,
	EMPTY_COMB: FramesIcon,
	PARTITION: PartitionIcon,
	FEEDER: FeederIcon,
	VOID: EmptyFrameIcon,
}

export function getWarehouseItemIcon(item?: any, size = 16) {
	if (!item) return null
	if (item.moduleType) {
		const Icon = ICON_BY_MODULE_TYPE[item.moduleType]
		return Icon ? <Icon size={size} /> : null
	}
	const frameType = item?.frameSpec?.frameType
	if (frameType) {
		const Icon = ICON_BY_FRAME_TYPE[frameType]
		return Icon ? <Icon size={size} /> : null
	}
	return null
}
