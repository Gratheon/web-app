import React from 'react'
import style from './index.less'

export default function QueenColor({ year, useRelative = true}) {
	if (!year) {
		return null
	}

	year = parseInt(year)

	let colorRemainder = (year - 2011) % 5
	let color = '#fefee3'
	switch (colorRemainder) {
		case 0:
			color = '#fefee3'
			break
		case 1:
			color = '#ffba08'
			break
		case 2:
			color = '#f94144'
			break
		case 3:
			color = '#38b000'
			break
		case 4:
			color = '#0466c8'
			break
	}

	// margin-left: -11px;
	// border-radius: 5px;
	// z-index: -1;
	return <div style={{ 
		background: color, 
		position: useRelative ? 'relative' : 'absolute',
		marginLeft: useRelative ? '5px' : '-5px',
		marginRight: useRelative ? '5px' : '0',
	}} className={style.queenColor}></div>
}
