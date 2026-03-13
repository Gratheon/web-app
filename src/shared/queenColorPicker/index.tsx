import { useState } from 'react'

import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import { getQueenColorFromYear } from '@/page/hiveEdit/hiveTopInfo/queenColor/utils'
import styles from './index.module.less'

// @ts-ignore
import GithubPicker from 'react-color/es/Github'

const COLORS = [
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

interface QueenColorPickerProps {
	year?: string
	color?: string | null
	onColorChange: (value: string) => void
}

export default function QueenColorPicker({ year = '', color = null, onColorChange }: QueenColorPickerProps) {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<div className={styles.wrapper}>
			<div
				className={styles.preview}
				onClick={(event) => {
					event.stopPropagation()
					setIsOpen((prev) => !prev)
				}}
			>
				<QueenColor year={year} color={color} />
			</div>
			{isOpen ? (
				<>
					<div className={styles.overlay} onClick={() => setIsOpen(false)} />
					<div className={styles.popup}>
						<GithubPicker
							width={212}
							colors={COLORS}
							onChangeComplete={(value: any) => {
								onColorChange(value.hex)
								setIsOpen(false)
							}}
							color={color || getQueenColorFromYear(year)}
						/>
					</div>
				</>
			) : null}
		</div>
	)
}
