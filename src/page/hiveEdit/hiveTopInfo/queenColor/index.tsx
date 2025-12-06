import style from './index.module.less'
import { getQueenColorFromYear } from './utils'

interface QueenColorProps {
	year?: string | number
	color?: string
	useRelative?: boolean
}

export default function QueenColor({ year, color, useRelative = true}: QueenColorProps) {
	const displayColor = color || getQueenColorFromYear(year)

	return <div style={{
		background: displayColor,
		position: useRelative ? 'relative' : 'absolute',
		marginLeft: useRelative ? '0' : '-5px',
		marginRight: useRelative ? '8px' : '0',
	}} className={style.queenColor}></div>
}
