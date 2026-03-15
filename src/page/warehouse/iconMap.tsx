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

export function getWarehouseModuleIcon(moduleType?: string | null, size = 16) {
	if (!moduleType) return null
	const Icon = ICON_BY_MODULE_TYPE[moduleType]
	if (!Icon) return null
	return <Icon size={size} />
}
