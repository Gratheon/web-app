import React, { useState } from 'react'
import styles from './index.less'

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
	editable?: boolean
	onColorChange?: any
}

export default function HiveIcon({
	boxes = [],
	size = 60,
	editable = false,
	onColorChange=()=>null,
}: HiveIconProps) {
	const [colorPickerVisibleAt, showColorPicker] = useState(null)
	const [, updateState] = useState()
	//@ts-ignore
	const forceUpdate = React.useCallback(() => updateState({}), [])

	let hiveStyle = {
		width: `${size}px`,
	}

	const legsStyle = {
		height: `${size / 10}px`,
		borderLeft: `${size / 10}px solid black`,
		borderRight: `${size / 10}px solid black`,
	}
	const roofStyle = {
		height: `${size / 10}px`,
	}

	let visualBoxes: any = []
	if (boxes && boxes.length > 0) {
		boxes.forEach((box: any, i: number) => {
			const boxStyle = {
				backgroundColor: box.color,
				paddingTop: `${size / 2}px`,
			}

			if (box.type === 'GATE') {
				boxStyle.paddingTop = `${size / 10}px`
			}
			else if (box.type === 'SUPER') {
				boxStyle.paddingTop = `${size / 4}px`
			} else {
				boxStyle.paddingTop = `${size / 2}px`
			}

			visualBoxes.push(
				<div
					onClick={() => {
						//@ts-ignore
						showColorPicker(colorPickerVisibleAt === null ? i : null)
					}}
					style={{
						...boxStyle,
					}}
					className={styles.box}
				>
					{editable && colorPickerVisibleAt === i && (
						<GithubPicker
							width={300}
							colors={colors}
							onChangeComplete={(c:any)=>{
								box.color = c.hex
								onColorChange(box);
								showColorPicker(null)
								forceUpdate()
							}}
							color={box.color}
						/>
					)}

					{box.type === 'GATE' &&
						<div className={styles.flightEntrance}></div>
					}
				</div>
			)
		})
	}
	return (
		<div className={styles.hive} style={hiveStyle}>
			<div className={styles.roof} style={roofStyle}></div>
			<div className={styles.boxes}>{visualBoxes}</div>
			<div className={styles.legs} style={legsStyle}></div>
		</div>
	)
}
