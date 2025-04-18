import { boxTypes } from '@/models/boxes.ts'

import styles from './styles.module.less'

import Box from '@/page/hiveEdit/boxes/box'
import BoxButtons from '@/page/hiveEdit/boxes/box/boxButtons'
import FrameButtons from '@/page/hiveEdit/boxes/box/frameButtons'
import Gate from '@/page/hiveEdit/boxes/gate'
import Ventilation from '@/page/hiveEdit/boxes/ventilation'
import QueenExcluder from '@/page/hiveEdit/boxes/queenExcluder'
import FeederHorizontal from '@/page/hiveEdit/boxes/feederHorizontal'
import T from '@/shared/translate'
import Button from '@/shared/button'
import ListIcon from '@/icons/listIcon.tsx'
import TableIcon from '@/icons/tableIcon.tsx'

export default function HiveBoxes({
	boxes,

	inspectionId = null,
	apiaryId = null,
	hiveId = null,
	boxId = null,
	frameId = null,
	frameSideId = null,

	setDisplayMode = (s: string) => {},
	onBoxClick = (e: any) => {},
	onError = (e: any) => {},
	editable = true,
	displayMode = 'visual',
	// Add the new props
	frameSidesData = [], // Default to empty array
	onFrameImageClick = (imageUrl: string) => {}, // Default to no-op function
}): any {
	const boxesDivs = []
	let currentBoxSelected

	for (let box of boxes) {
		const isCurrentBoxSelected = box.id === parseInt(boxId, 10)
		if (isCurrentBoxSelected) {
			currentBoxSelected = box
		}

		boxesDivs.push(
			<div
				style="display: flex;"
				onClick={(event) => {
					onBoxClick({ event, boxId: box.id })
				}}
			>
				<div className={styles.box + ` boxOuterClick `}>
					{(box.type == boxTypes.DEEP || box.type == boxTypes.SUPER) && (
						<Box
							box={box}
							boxId={+boxId}
							frameId={frameId}
							frameSideId={frameSideId}
							hiveId={hiveId}
							apiaryId={apiaryId}
							editable={editable}
							selected={+boxId === box.id}
							displayMode={displayMode}
							// Pass the props down to Box
							frameSidesData={frameSidesData}
							onFrameImageClick={onFrameImageClick}
						/>
					)}

					{box.type == boxTypes.GATE && <Gate hiveId={hiveId} box={box} boxId={+boxId} />}
					{box.type === boxTypes.VENTILATION && (
						<Ventilation selected={+boxId === box.id} />
					)}
					{box.type === boxTypes.QUEEN_EXCLUDER && (
						<QueenExcluder selected={+boxId === box.id} />
					)}
					{box.type === boxTypes.HORIZONTAL_FEEDER && (
						<FeederHorizontal selected={+boxId === box.id} />
					)}
				</div>

				<div
					style={{
						display: 'flex',
						flexDirection: 'column',
						zIndex: box.position + 1,
						position: 'relative',
					}}
				>
					<div style="width:38px;"></div>

					{isCurrentBoxSelected && (
						<div style="position: absolute;">
							<BoxButtons onError={onError} box={box} />
						</div>
					)}
				</div>
			</div>
		)
	}

	if (boxesDivs.length === 0) {
		boxesDivs.push(
			<div style="padding:0 40px; box-sizing: border-box;">
				<T ctx="This is a message that will be displayed when there are no boxes in the hive. A deep is a type of a hive section, the big box">
					No sections in the hive yet, try adding a deep for the nest
				</T>
			</div>
		)
	}

	return (
		<>
			{/* Only show the header/buttons section when editable */}
			{editable && (
				<div className={styles.boxesMode}>
					<h3 style="display: flex;align-items: center;margin-right: 20px;margin-bottom: 5px;">
						<T ctx="This is a heading for a block that shows multiple physical parts (boxes,sections) of the vertical beehive">
							Hive sections
						</T>
					</h3>

					{currentBoxSelected &&
						(currentBoxSelected?.type == boxTypes.DEEP ||
							currentBoxSelected?.type == boxTypes.SUPER) && (
							<div style="display:flex; align-items:right;">
								<FrameButtons box={currentBoxSelected} onError={onError} />

								{displayMode == 'list' && (
									<Button onClick={() => setDisplayMode('visual')}>
										<ListIcon size={16} style="margin-right:0" />
									</Button>
								)}
								{displayMode == 'visual' && (
									<Button onClick={() => setDisplayMode('list')}>
										<TableIcon size={16} style="margin-right:0" />
									</Button>
								)}
							</div>
						)}
				</div>
			)}

			{boxesDivs}
		</>
	)
}
