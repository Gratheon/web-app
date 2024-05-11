import { boxTypes } from '@/components/models/boxes'

import styles from './styles.less'

import Box from "@/components/page/hiveEdit/boxes/box"
import BoxButtons from "@/components/page/hiveEdit/boxes/box/boxButtons"
import FrameButtons from "@/components/page/hiveEdit/boxes/box/frameButtons"
import Gate from '@/components/page/hiveEdit/boxes/gate'
import Ventilation from '@/components/page/hiveEdit/boxes/ventilation'
import QueenExcluder from '@/components/page/hiveEdit/boxes/queenExcluder'
import FeederHorizontal from '@/components/page/hiveEdit/boxes/feederHorizontal'

export default function HiveBoxes(
	{
		boxes,

		apiaryId = null,
		hiveId = null,
		boxId = null,
		frameId = null,
		frameSideId = null,

		onBoxClick = (e: any) => { },
		onError = (e: any) => { },
		editable = true,
	}
): any {
	const boxesDivs = []

	for (let box of boxes) {
		const currentBoxSelected = box.id === parseInt(boxId, 10)

		boxesDivs.push(
			<div
				onClick={(event) => {
					onBoxClick({ event, boxId: box.id })
				}}
			>
				{currentBoxSelected && (
					<div style={{ height: 35, display: 'flex', flexDirection: 'row-reverse' }}>
						<BoxButtons onError={onError} box={box} />

						{(box.type == boxTypes.DEEP || box.type == boxTypes.SUPER) &&
							<FrameButtons box={box} onError={onError} />
						}

					</div>
				)}

				<div className={styles.box + ` boxOuterClick`}>
					{(box.type == boxTypes.DEEP || box.type == boxTypes.SUPER) &&
						<Box
							box={box}
							boxId={boxId}
							frameId={frameId}
							frameSideId={frameSideId}
							hiveId={hiveId}
							apiaryId={apiaryId}

							editable={editable}
						/>
					}

					{box.type == boxTypes.GATE && <Gate box={box} boxId={+boxId} />}
					{box.type === boxTypes.VENTILATION && <Ventilation selected={+boxId === box.id} />}
					{box.type === boxTypes.QUEEN_EXCLUDER && <QueenExcluder selected={+boxId === box.id} />}
					{box.type === boxTypes.HORIZONTAL_FEEDER && <FeederHorizontal selected={+boxId === box.id} />}
				</div>
			</div>
		)
	}

	return boxesDivs
}