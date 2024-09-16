import { useNavigate } from 'react-router-dom'

import { Frame } from '@/models/frames.ts'

import BoxFrameSide from './boxFrameSide'
import styles from './index.module.less'

export default function BoxFrameEmptyComb({
	editable,
	frame,
	frameURL,
}: {
	editable: Boolean
	frame: Frame
	frameURL: string
}) {
	let navigate = useNavigate()

	return (
		<div className={styles.emptyComb}>
			<BoxFrameSide
				onFrameSideClick={() => {
					if (editable) {
						navigate(`${frameURL}/${frame.leftId}`, { replace: true })
					}
				}}
				className={styles.left}
				frameSide={frame.leftSide}
			/>

			<div className={styles.foundation} />

			<BoxFrameSide
				className={styles.right}
				onFrameSideClick={() => {
					if (editable) {
						navigate(`${frameURL}/${frame.rightId}`, { replace: true })
					}
				}}
				frameSide={frame.rightSide}
			/>
		</div>
	)
}
