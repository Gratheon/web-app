import React, { useState } from 'react'
import styles from './index.module.less'

//@ts-ignore
import GithubPicker from 'react-color/es/Github'

const colors = [
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

type HiveIconProps = {
	boxes?: any
	size?: number
	beeCount?: number
	editable?: boolean
	onColorChange?: any
	hiveType?: string
}

export default function HiveIcon({
	boxes = [],
	size = 60,
	editable = false,
	onColorChange = () => null,
	hiveType,
}: HiveIconProps) {
	const [colorPickerVisibleAt, showColorPicker] = useState(null)
	const [, updateState] = useState()
	//@ts-ignore
	const forceUpdate = React.useCallback(() => updateState({}), [])

	const isSectionBox = (boxType: string) =>
		boxType === 'DEEP' || boxType === 'SUPER' || boxType === 'LARGE_HORIZONTAL_SECTION'

	const hasLargeHorizontalSection = boxes.some(
		(box: any) => box?.type === 'LARGE_HORIZONTAL_SECTION'
	)
	const hasRoof = boxes.some((box: any) => box?.type === 'ROOF')
	const hasBottom = boxes.some((box: any) => box?.type === 'BOTTOM')
	const sectionBoxes = boxes.filter((box: any) => isSectionBox(box?.type))
	const normalizedHiveType = String(hiveType || '').toUpperCase()
	const isNucleusByType = normalizedHiveType === 'NUCLEUS'
	const isNucleusByShape =
		!hasLargeHorizontalSection &&
		!hasRoof &&
		!hasBottom &&
		sectionBoxes.length === 1 &&
		sectionBoxes[0]?.type === 'DEEP'
	const isNucleusHive = isNucleusByType || isNucleusByShape
	const showDetailedNotches = size > 50

	const hiveWidth = hasLargeHorizontalSection
		? Math.round(size * 1.9)
		: isNucleusHive
			? Math.round(size * 0.8)
			: size
	const roofOverhang = Math.max(2, Math.round(hiveWidth * 0.04))

	let hiveStyle = {
		width: `${hiveWidth}px`,
	}

	const legsStyle = {
		height: `${size / 10}px`,
		borderLeft: `${size / 10}px solid black`,
		borderRight: `${size / 10}px solid black`,
	}

	const roofHeight = (hiveWidth / 10);
	const roofStyle = {
		height: `${roofHeight}px`,
		width: `${hiveWidth + roofOverhang * 2}px`,
		marginLeft: `-${roofOverhang}px`,
	}

	let visualBoxes: any = []
	if (boxes && boxes.length > 0) {
		boxes.forEach((box: any, i: number) => {
			if (!box) return

			if (box.type === 'ROOF') {
				return
			}

			const boxStyle = {
				backgroundColor: box.color || '#cda36a',
				paddingTop: `${size / 2}px`,
			}

			if (box.type === 'LARGE_HORIZONTAL_SECTION') {
				boxStyle.paddingTop = `${size / 1.3}px`
			} else if (box.type === 'GATE') {
				boxStyle.paddingTop = `${size / 10}px`
			} else if (
				box.type === 'VENTILATION' ||
				box.type === 'QUEEN_EXCLUDER' ||
				box.type === 'BOTTOM'
			) {
				boxStyle.paddingTop = `${size / 20}px`
			} else if (box.type === 'HORIZONTAL_FEEDER') {
				boxStyle.paddingTop = `${size / 4.5}px`
			} else if (box.type === 'SUPER') {
				boxStyle.paddingTop = `${size / 4}px`
			} else {
				boxStyle.paddingTop = `${size / 2}px`
			}

			const isPaintableSection = isSectionBox(box.type)

			visualBoxes.push(
				<div key={box.id || i} className={styles.boxRow}>
					{editable && isPaintableSection && (
						<button
							type="button"
							className={styles.colorDot}
							style={{ backgroundColor: box.color || '#ffc848' }}
							onClick={(event) => {
								event.stopPropagation()
								//@ts-ignore
								showColorPicker(colorPickerVisibleAt === i ? null : i)
							}}
							aria-label={`Set color for section ${box.position + 1}`}
						/>
					)}

					<div
						style={{
							...boxStyle,
						}}
						className={`${styles.box} ${box.type === 'LARGE_HORIZONTAL_SECTION'
							? styles.largeHorizontalSection
							: (isNucleusHive && box.type === 'DEEP')
								? styles.nucleusSection
							: ''
							}`}
					>
						{isNucleusHive && box.type === 'DEEP' && <div className={styles.nucleusCap}></div>}
						{isNucleusHive && box.type === 'DEEP' && <div className={styles.nucleusEntrance}></div>}
						{showDetailedNotches &&
							(box.type === 'DEEP' || box.type === 'SUPER') && (
								<div className={styles.gripNotch}></div>
							)}

						{box.type === 'GATE' && <div className={styles.gate}></div>}
						{box.type === 'VENTILATION' && (
							<div className={styles.ventilation}></div>
						)}
							{box.type === 'LARGE_HORIZONTAL_SECTION' && (
								<div className={styles.horizontalFrames}>
									<span className={styles.horizontalFrameLine}></span>
									<span className={styles.horizontalFrameLine}></span>
									<span className={styles.horizontalFrameLine}></span>
									<span className={styles.horizontalFrameLine}></span>
									<span className={styles.horizontalEntrance}></span>
								</div>
							)}
						</div>

					{editable && colorPickerVisibleAt === i && isPaintableSection && (
						<div className={styles.colorPickerPopup}>
							<GithubPicker
								width={300}
								colors={colors}
								onChangeComplete={(c: any) => {
									box.color = c.hex
									onColorChange(box)
									showColorPicker(null)
									forceUpdate()
								}}
								color={box.color}
							/>
						</div>
					)}
				</div>
			)
		})
	}
	return (
		<div className={styles.hive} style={hiveStyle}>
			{hasRoof && <div className={styles.roof} style={roofStyle}></div>}
			<div className={styles.boxes}>{visualBoxes}</div>
			{!isNucleusHive && <div className={styles.legs} style={legsStyle}></div>}
		</div>
	)
}
